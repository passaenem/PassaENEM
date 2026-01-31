"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Users, Star, ArrowRight, Wallet, AlertCircle, Trash2, CheckCircle, Lock, Zap } from "lucide-react";
import { activeChallenges, finishedChallenges, userPerformance, Challenge } from "@/lib/challenges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

export default function ChallengesPage() {
    const [activeTab, setActiveTab] = useState("active");
    const [dbChallenges, setDbChallenges] = useState<Challenge[]>([]);
    const [myResults, setMyResults] = useState<any[]>([]); // Store user's exam results
    const [user, setUser] = useState<any>(null);

    const [userPlan, setUserPlan] = useState('free');
    const [unclaimedReward, setUnclaimedReward] = useState<any>(null);
    const [whatsappInput, setWhatsappInput] = useState("");

    // Phone Modal State
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [pendingChallenge, setPendingChallenge] = useState<Challenge | null>(null);
    const [userPhone, setUserPhone] = useState("");

    // Initial Data Load
    useEffect(() => {
        const loadData = async () => {
            if (!supabase) return;

            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // 2. Fetch User Plan & Profile
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan_type')
                    .eq('id', user.id)
                    .single();

                if (profile) setUserPlan(profile.plan_type || 'free');

                // Fetch My Results (Performance History)
                const { data: resultsData } = await supabase
                    .from('exam_results')
                    .select('*')
                    .eq('user_id', user.id)
                    .ilike('exam_title', 'Desafio:%') // Only fetch Challenge results
                    .order('created_at', { ascending: false });

                if (resultsData) {
                    setMyResults(resultsData);
                }

                // Check for Unclaimed Rewards
                const { data: rewardData } = await supabase
                    .from('rewards')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'unclaimed')
                    .limit(1)
                    .single();

                if (rewardData) {
                    setUnclaimedReward(rewardData);
                }
            }

            // 3. Fetch ALL Challenges (Active & Finished)
            const { data: challengesData } = await supabase
                .from('challenges')
                .select('*')
                // .eq('status', 'active') // Fetching ALL now
                .order('created_at', { ascending: false });

            if (challengesData) {
                // Fetch Rankings for each challenge
                const challengesWithRanking = await Promise.all(challengesData.map(async (d: any) => {
                    // Fetch Top 3 Results for this challenge
                    if (!supabase) return { ...d, top3: [] }; // Handle null case safely

                    const { data: topResults } = await supabase
                        .from('exam_results')
                        .select('user_id, score_percentage, correct_answers, created_at')
                        .eq('exam_title', `Desafio: ${d.title}`)
                        .order('score_percentage', { ascending: false })
                        .order('created_at', { ascending: true }) // First to finish wins tie
                        .limit(3);

                    let top3: { name: string; score: any; time: string }[] = [];
                    if (topResults && topResults.length > 0) {
                        // Fetch names manually (assuming no strict FK setup or to be safe)
                        const userIds = topResults.map(r => r.user_id);
                        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);

                        top3 = topResults.map(r => {
                            const profile = profiles?.find(p => p.id === r.user_id);
                            return {
                                name: profile?.full_name || "Usuário",
                                score: r.correct_answers, // "pontuação cada pergunta vale um ponto" -> correct_answers
                                time: "0" // Placeholder for now, or calculate if we had start/end time. 
                                // User asked "traga nome e pontuação". Time is bonus.
                            };
                        });
                    }

                    return {
                        id: d.id,
                        title: d.title,
                        description: d.description,
                        area: d.area,
                        difficulty: d.difficulty,
                        questionsCount: d.questions_count,
                        participants: d.participants || 0,
                        timeLeft: d.end_date ? calculateTimeLeft(d.end_date) : (d.time_left || "Indefinido"), // Use dynamic calc
                        end_date: d.end_date,
                        status: "active",
                        prize: d.prize,
                        top3: top3,
                        questions_json: d.questions_json || [],
                        duration_minutes: d.duration_minutes
                    };
                }));

                // Auto-Finish Expired Challenges
                // This is a client-side check for display. Ideally backend cron does this.
                // But we can filter `active` list to exlude expired ones or mark them.
                setDbChallenges(challengesWithRanking.map(c => {
                    const isExpired = c.end_date && new Date(c.end_date) < new Date();
                    if (isExpired && c.status === 'active') {
                        // We could visually mark it or strictly change status locally
                        // For now, let's just let the UI handle the "Expired" state
                    }
                    return c;
                }));
            }
        };

        loadData();
    }, []);

    // Helper to calc time left string
    const calculateTimeLeft = (endDateStr: string) => {
        const end = new Date(endDateStr);
        const now = new Date();
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return "Encerrado";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days} dias restantes`;
        return `${hours} horas restantes`;
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este desafio?")) return;
        if (supabase) {
            const { error } = await supabase.from('challenges').delete().eq('id', id);
            if (!error) {
                setDbChallenges(prev => prev.filter(c => c.id !== id));
            } else {
                alert("Erro ao excluir. Verifique se você é administrador.");
            }
        }
    };

    const handleFinishChallenge = async (id: string, challengeTitle: string) => {
        if (!confirm("Tem certeza que deseja FINALIZAR este desafio agora? Ele sairá da lista de ativos e os prêmios serão gerados.")) return;

        if (supabase) {
            // 1. Calculate Winners (Top 3)
            const { data: topResults } = await supabase
                .from('exam_results')
                .select('user_id, correct_answers, created_at')
                .eq('exam_title', `Desafio: ${challengeTitle}`)
                .order('correct_answers', { ascending: false }) // Score
                .order('created_at', { ascending: true }) // Time tie-breaker
                .limit(3);

            // 2. Insert Rewards
            if (topResults && topResults.length > 0) {
                const rewardsToInsert = topResults.map((r, index) => ({
                    user_id: r.user_id,
                    challenge_id: id,
                    position: index + 1,
                    prize_amount: index === 0 ? "R$ 50,00" : index === 1 ? "R$ 30,00" : "R$ 20,00", // Example prizes, ideally from challenge config
                    status: 'unclaimed',
                    // user_name will be fetched by admin view via join or we can fetch here. 
                    // Let's rely on admin view join for latest profile name.
                }));

                const { error: rewardError } = await supabase.from('rewards').insert(rewardsToInsert);
                if (rewardError) console.error("Error creating rewards:", rewardError);
            }

            // 3. Update Challenge Status
            const { error } = await supabase.from('challenges').update({ status: 'finished' }).eq('id', id);

            if (!error) {
                alert("Desafio finalizado e prêmios gerados!");
                setDbChallenges(prev => prev.filter(c => c.id !== id));
            } else {
                alert("Erro: " + error.message);
            }
        }
    };
    const handleStartChallenge = async (challenge: Challenge) => {
        // EXPIRATION CHECK
        if (challenge.end_date) {
            const end = new Date(challenge.end_date);
            if (new Date() > end) {
                alert("⛔ Este desafio já foi encerrado! Aguarde o resultado final.");
                return;
            }
        }

        // LIMIT CHECK
        // ... (rest same)
        if (userPlan === 'free') {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthlyChallenges = myResults.filter(r => {
                const d = new Date(r.created_at);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });

            if (monthlyChallenges.length >= 1) {
                alert("🔒 Limite do Plano Gratuito\n\nVocê já participou de um desafio este mês. Faça upgrade para o Plano PRO e participe de competições ilimitadas!");
                return;
            }
        }

        // PHONE CHECK: Check if user has phone saved in profile
        if (user && supabase) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('phone')
                .eq('id', user.id)
                .single();

            if (!profile?.phone) {
                setPendingChallenge(challenge);
                setShowPhoneModal(true);
                return;
            }
        }

        proceedToExam(challenge);
    };

    const handleSavePhoneAndStart = async () => {
        if (!userPhone || userPhone.length < 10) {
            alert("Por favor, insira um WhatsApp válido com DDD.");
            return;
        }

        if (supabase && user) {
            const { error } = await supabase
                .from('profiles')
                .update({ phone: userPhone })
                .eq('id', user.id);

            if (error) {
                alert("Erro ao salvar telefone: " + error.message);
                return;
            }

            setShowPhoneModal(false);
            if (pendingChallenge) proceedToExam(pendingChallenge);
        }
    }

    const proceedToExam = (challenge: Challenge) => {
        // 1. Utilize questions stored in the challenge object (fetched from DB)
        let examData = challenge.questions_json;

        // Fallback for old challenges or if generation failed
        if (!examData || examData.length === 0) {
            console.warn("No questions found for this challenge. Using mock.");
            // Fallback Mock
            examData = [{
                id: `q-${challenge.id}-1`,
                type: "ENEM",
                question: `(Questão Desafio) Sobre ${challenge.area}: Qual a principal característica deste tema?`,
                options: ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "Alternativa E"],
                correctAnswer: 2,
                explanation: "Explicação detalhada sobre o tema do desafio.",
                difficulty: challenge.difficulty,
                topic: challenge.area
            }];
        }

        // 2. Setup Session
        sessionStorage.setItem('currentExam', JSON.stringify(examData));
        sessionStorage.setItem('currentExamTitle', `Desafio: ${challenge.title}`);
        sessionStorage.setItem('currentExamDuration', (challenge.duration_minutes || 60).toString());
        sessionStorage.setItem('isRanked', 'true');

        // 3. Redirect
        window.location.href = '/exam';
    };

    const handleEdit = (challenge: Challenge) => {
        // Encode the challenge object to pass to the admin page or just pass ID if we implement fetching there.
        // Since we already built the "populate form" logic in Admin page via state/props? 
        // Admin page currently DOES NOT accept query params for editing. It handles it via internal state which is lost on refresh/redirect.
        // We need to modify Admin page to accept a query param OR just use localStorage for now to pass "challengeToEdit".
        // Let's use localStorage for simplicity as we did with exams.

        sessionStorage.setItem('challengeToEdit', JSON.stringify({
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            area: challenge.area,
            difficulty: challenge.difficulty,
            questions_count: challenge.questionsCount,
            prize: challenge.prize,
            time_left: challenge.timeLeft,
            participants: challenge.participants
        }));
        window.location.href = '/admin/create-challenge?mode=edit';
    };

    const handleViewResult = (result: any) => {
        if (!result.questions_json) {
            alert("Erro: Dados da prova não encontrados.");
            return;
        }
        sessionStorage.setItem('currentExam', JSON.stringify(result.questions_json));
        sessionStorage.setItem('examMode', 'view');
        sessionStorage.setItem('currentExamTitle', result.exam_title);
        window.location.href = '/exam';
    };

    const handleClaimReward = async () => {
        if (!whatsappInput.trim() || whatsappInput.length < 10) {
            alert("Por favor, insira um WhatsApp válido.");
            return;
        }

        if (supabase && unclaimedReward) {
            const { error } = await supabase
                .from('rewards')
                .update({
                    status: 'pending',
                    user_whatsapp: whatsappInput,
                    user_name: user?.user_metadata?.full_name || user?.email || "Usuário"
                })
                .eq('id', unclaimedReward.id);

            if (!error) {
                alert("Parabéns! Entraremos em contato em breve.");
                setUnclaimedReward(null);
            } else {
                alert("Erro ao salvar: " + error.message);
            }
        }
    };

    // Filter for Tabs
    const activeList = dbChallenges.filter(c => c.status === 'active');
    const finishedList = dbChallenges.filter(c => c.status === 'finished');

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* PHONE COLLECTION MODAL */}
            {showPhoneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-slate-900 border-violet-500 shadow-2xl animate-in zoom-in duration-300">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-violet-600 rounded-full p-3 w-fit mb-2 shadow-lg">
                                <Zap className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl text-white">Quase lá!</CardTitle>
                            <CardDescription className="text-slate-300">
                                Para participar dos Desafios Valendo Prêmios, precisamos do seu <strong>WhatsApp (Pix)</strong> para contato.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-violet-300 uppercase tracking-wider">Seu WhatsApp com DDD</label>
                                <input
                                    type="text"
                                    placeholder="(11) 99999-9999"
                                    className="w-full p-3 rounded bg-black/40 border border-violet-500/30 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    value={userPhone}
                                    onChange={(e) => setUserPhone(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-500">* Seus dados estão seguros e serão usados apenas para pagamento de prêmios.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold h-12 text-lg shadow-lg" onClick={handleSavePhoneAndStart}>
                                Salvar e Começar 🚀
                            </Button>
                            <Button variant="ghost" className="w-full text-slate-500 text-xs" onClick={() => setShowPhoneModal(false)}>
                                Cancelar
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* CLAIM REWARD MODAL / BANNER */}
            {unclaimedReward && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-gradient-to-br from-yellow-900/90 to-amber-900/90 border-yellow-500 shadow-2xl animate-in zoom-in duration-300">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-yellow-500 rounded-full p-3 w-fit mb-2 shadow-[0_0_15px_rgba(234,179,8,0.6)]">
                                <Trophy className="w-8 h-8 text-black" />
                            </div>
                            <CardTitle className="text-2xl text-yellow-100">Parabéns! Você Ganhou! 🎉</CardTitle>
                            <CardDescription className="text-yellow-200/90">
                                Você ficou em <span className="font-bold text-white">#{unclaimedReward.position}º Lugar</span> e ganhou <span className="font-bold text-white text-lg">{unclaimedReward.prize_amount}</span>!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-center text-yellow-100/80">
                                Para receber sua premiação via Pix, informe seu WhatsApp abaixo. Entraremos em contato para realizar o pagamento.
                            </p>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-yellow-200 uppercase tracking-wider">Seu WhatsApp</label>
                                <input
                                    type="text"
                                    placeholder="(11) 99999-9999"
                                    className="w-full p-3 rounded bg-black/40 border border-yellow-500/30 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    value={whatsappInput}
                                    onChange={(e) => setWhatsappInput(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-12 text-lg shadow-lg" onClick={handleClaimReward}>
                                🤑 RESGATAR PRÊMIO
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Desafios & Competições</h1>
                    <p className="text-muted-foreground">Participe de provas valendo prêmios e destaque no ranking.</p>
                </div>
            </div>

            <Tabs defaultValue="active" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="active">🔥 Desafios Ativos</TabsTrigger>
                    <TabsTrigger value="performance">📊 Meu Desempenho</TabsTrigger>
                    <TabsTrigger value="finished">🏁 Finalizados</TabsTrigger>
                </TabsList>

                {/* DESAFIOS ATIVOS */}
                <TabsContent value="active" className="space-y-4">
                    {activeList.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Sem desafios no momento</AlertTitle>
                            <AlertDescription>Fique ligado! Novos desafios são lançados toda semana.</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="md:grid md:gap-6 md:grid-cols-2 lg:grid-cols-3 flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 -mx-4 px-4">
                            {activeList.map((challenge) => (
                                <Card key={challenge.id} className="min-w-[85vw] md:min-w-0 snap-center flex flex-col border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors relative group">
                                    {/* Admin Actions - Absolute Top Right */}
                                    {user && user.id === ADMIN_ID && challenge.id.length > 10 && (
                                        <div className="absolute top-2 right-2 flex gap-1 z-20">
                                            <Button variant="secondary" size="icon" className="h-8 w-8 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800" onClick={(e) => { e.stopPropagation(); handleFinishChallenge(challenge.id, challenge.title); }} title="Finalizar Agora">
                                                <div className="h-4 w-4">🏁</div>
                                            </Button>
                                            <Button variant="secondary" size="icon" className="h-8 w-8 bg-slate-800 hover:bg-slate-700 text-slate-200" onClick={(e) => { e.stopPropagation(); handleEdit(challenge); }} title="Editar">
                                                <div className="h-4 w-4">✎</div> {/* Using simple icon for now or we can import Edit */}
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(challenge.id); }} title="Excluir">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    <CardHeader className={user && user.id === ADMIN_ID ? "pt-12" : ""}>
                                        <div className="absolute top-4 left-4 p-2 bg-slate-800 rounded-full border border-slate-700">
                                            <Trophy className="w-5 h-5 text-amber-500" />
                                        </div>
                                        {/* Badges - Adjusted to not overlap with Admin Buttons */}
                                        <div className="flex flex-wrap gap-2 mb-2 ml-12">
                                            <Badge variant={challenge.difficulty === 'Insano' ? 'destructive' : challenge.difficulty === 'Difícil' ? 'default' : 'secondary'}>
                                                {challenge.difficulty}
                                            </Badge>
                                            {challenge.prize && (
                                                <Badge variant="outline" className="border-green-500 text-green-400 gap-1">
                                                    <Wallet className="w-3 h-3" />
                                                    {challenge.prize.startsWith("R$") ? challenge.prize : `R$ ${challenge.prize}`}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-xl">{challenge.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center text-sm text-slate-400 gap-4">
                                                <div className="flex items-center gap-1" title="Participantes"><Users className="w-4 h-4" /> {challenge.participants}</div>
                                                <div className="flex items-center gap-1" title="Tempo Restante"><Clock className="w-4 h-4" /> {challenge.timeLeft}</div>
                                            </div>

                                            {/* RANKING DISPLAY - TOP 3 */}
                                            {challenge.top3 && challenge.top3.length > 0 && (
                                                <div className="mt-3 bg-slate-950/50 rounded-md p-2 border border-slate-800">
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
                                                        <Trophy className="w-3 h-3 text-yellow-500" /> Top 3 Ranking
                                                    </p>
                                                    <div className="space-y-1">
                                                        {challenge.top3.map((rank, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-300">
                                                                    <span className={`font-bold mr-1 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : 'text-amber-600'}`}>#{idx + 1}</span>
                                                                    {rank.name.split(' ')[0]} {/* First Name only for space */}
                                                                </span>
                                                                <span className="font-mono text-violet-400 font-bold">{rank.score} pts</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center text-xs text-slate-500 gap-3 border-t border-slate-800 pt-2 mt-2">
                                                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{challenge.area}</span>
                                                <span>{challenge.questionsCount} Questões</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        {myResults.some(r => r.exam_title === `Desafio: ${challenge.title}`) ? (
                                            <Button className="w-full bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700" disabled>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Já Participou
                                            </Button>
                                        ) : (
                                            <Button className="w-full bg-violet-600 hover:bg-violet-700 gap-2" onClick={() => handleStartChallenge(challenge)}>
                                                Participar Agora <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* MEU DESEMPENHO (REAL DATA) */}
                <TabsContent value="performance" className="space-y-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle>Histórico de Participação</CardTitle>
                            <CardDescription>Seus resultados nos desafios que você participou.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {myResults.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Você ainda não participou de nenhum desafio.
                                    </div>
                                ) : (
                                    myResults.map((result, i) => (
                                        <div key={result.id || i} className="flex items-center justify-between p-4 border rounded-lg bg-slate-950 border-slate-800">
                                            <div>
                                                <h4 className="font-bold text-white">{result.exam_title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(result.created_at).toLocaleDateString()} • {result.correct_answers}/{result.total_questions} Acertos
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-violet-400">{result.score_percentage}%</div>
                                                </div>
                                                {/* Logic to hide/disable answer key if challenge is still active */}
                                                {activeList.some(c => `Desafio: ${c.title}` === result.exam_title) ? (
                                                    <Button variant="outline" size="sm" disabled title="Gabarito disponível após o fim do desafio">
                                                        <Lock className="w-3 h-3 mr-2" /> Gabarito Bloqueado
                                                    </Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => handleViewResult(result)}>
                                                        Ver Gabarito
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FINALIZADOS */}
                <TabsContent value="finished">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {finishedList.map((challenge) => {
                            // Check if current user participated in this challenge
                            // We match loosely by title "Desafio: [Challenge Title]"
                            const userResult = myResults.find(r => r.exam_title === `Desafio: ${challenge.title}`);

                            return (
                                <Card key={challenge.id} className="flex flex-col border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 transition-all">
                                    <CardHeader>
                                        <div className="flex justify-between items-center mb-2">
                                            <Badge variant="outline">Finalizado</Badge>
                                            <span className="text-xs text-slate-500">{challenge.participants} part.</span>
                                        </div>
                                        <CardTitle className="text-xl text-slate-300">{challenge.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col gap-2">
                                            {/* RANKING DISPLAY - TOP 3 */}
                                            {challenge.top3 && challenge.top3.length > 0 && (
                                                <div className="bg-slate-950/50 rounded-md p-2 border border-slate-800">
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mb-2">
                                                        <Trophy className="w-3 h-3 text-yellow-500" /> Resultados Finais
                                                    </p>
                                                    <div className="space-y-1">
                                                        {challenge.top3.map((rank, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-300">
                                                                    <span className={`font-bold mr-1 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : 'text-amber-600'}`}>#{idx + 1}</span>
                                                                    {rank.name.split(' ')[0]}
                                                                </span>
                                                                <span className="font-mono text-violet-400 font-bold">{rank.score} pts</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        {userResult ? (
                                            <Button variant="secondary" className="w-full gap-2" onClick={() => handleViewResult(userResult)}>
                                                <CheckCircle className="w-4 h-4 text-green-500" /> Ver Meu Resultado ({userResult.score_percentage}%)
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="w-full border-slate-700 text-slate-500 cursor-not-allowed">
                                                Não Participou
                                            </Button>
                                            /* Optionally enable "Ver Gabarito" (generic) here later */
                                        )}
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
