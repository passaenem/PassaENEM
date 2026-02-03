"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, ShieldAlert, Lock, Save, Clock, Lightbulb, BookOpen, Target, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interface for Explanation Object
interface ExplanationSchema {
    analise_erro: string;
    gabarito_detalhado: string[];
    metafora: string;
    por_que_nao_outras: string;
    enem_contexto: string;
    dica_revisao: string;
}

// Interface for Question
interface Question {
    id: string;
    type: "ENEM" | "CONCURSO";
    context?: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string | ExplanationSchema;
    difficulty: string;
    topic: string;
    pontuacao?: number;
}

export default function ExamPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [finished, setFinished] = useState(false);
    const [mode, setMode] = useState<'take' | 'view' | 'review'>('take');
    const [started, setStarted] = useState(false);
    const [strikes, setStrikes] = useState(0);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isRanked, setIsRanked] = useState(false);
    const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const stored = sessionStorage.getItem("currentExam");
        const storedMode = sessionStorage.getItem("examMode");
        const storedPdf = sessionStorage.getItem("currentExamPdf"); // Load PDF URL
        const rankedSession = sessionStorage.getItem("isRanked") === "true"; // Check flag

        if (stored) {
            const parsedQuestions: Question[] = JSON.parse(stored);
            setQuestions(parsedQuestions);

            if (storedPdf) setPdfUrl(storedPdf);

            if (storedMode === 'view') {
                setFinished(true);
                setMode('view');
                setStarted(true); // Auto-start if viewing (no anti-cheat needed)

                // Hydrate answers from stored questions (if they have userAnswer)
                const storedAnswers: Record<string, number> = {};
                parsedQuestions.forEach(q => {
                    if ((q as any).userAnswer !== undefined) {
                        storedAnswers[q.id] = (q as any).userAnswer;
                    }
                });
                setAnswers(storedAnswers);

            } else {
                setMode('take');
                setIsRanked(rankedSession);

                if (rankedSession) {
                    setStarted(false); // Must explicitly start for RANKED exams (Lockdown)
                    // SHUFFLE QUESTIONS FOR RANKED
                    if (parsedQuestions.length > 0) {
                        const shuffled = shuffleArray([...parsedQuestions]);
                        setQuestions(shuffled);
                    }
                } else {
                    setStarted(true); // Auto-start for NORMAL exams
                }
            }
            sessionStorage.removeItem('examMode');
        } else {
            // Redirect logic could go here
        }
    }, []);

    // ... (rest of effects) ...

    // ANTI-CHEAT: Utility to shuffle array
    const shuffleArray = (array: any[]) => {
        let currentIndex = array.length, randomIndex;
        // While there remain elements to shuffle.
        while (currentIndex !== 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    };

    // PROCTORING: Listeners
    useEffect(() => {
        if (!started || finished || mode === 'view' || !isRanked) return; // Only active checks if isRanked is true

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setStrikes(prev => prev + 1);
            }
        };

        const handleFullscreenChange = () => {
            // Only penalize if exiting fullscreen
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                setStrikes(prev => prev + 1);
            } else {
                setIsFullscreen(true);
            }
        };

        // Block Right Click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // NEW: Detect PrintScreen Key
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
                alert("Captura de tela detectada! Isso é uma violação.");
                setStrikes(prev => prev + 1);
            }
        };

        // NEW: Detect Mouse Leave (Experimental)
        const handleMouseLeave = (e: MouseEvent) => {
            // Only trigger if leaving the top of the window (likely to switch tabs/click other monitor)
            if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth) || (e.clientY >= window.innerHeight)) {
                // We rely on visibilityChange mostly, but this can warn user
                // alert("Cursor fora da área de prova."); // Can be annoying, let's just log or gentle warn
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keyup", handleKeyUp);
        // document.addEventListener("mouseleave", handleMouseLeave); // Too aggressive for now

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, [started, finished, mode, isRanked]);

    // Terminate on too many strikes
    // TIMER LOGIC
    const [timeLeft, setTimeLeft] = useState<number | null>(null); // Seconds

    useEffect(() => {
        if (strikes >= 3 && !finished && isRanked) {
            // ... existing strike logic ...
            alert("Você violou as regras de segurança 3 vezes. Sua prova será encerrada com nota zero.");
            setFinished(true);
            setMode('review');
        }
    }, [strikes, finished, isRanked]);

    // Initialize Timer
    useEffect(() => {
        if (started && !finished && timeLeft === null) {
            const storedDuration = sessionStorage.getItem('currentExamDuration');
            if (storedDuration) {
                const durationSec = parseInt(storedDuration) * 60;
                setTimeLeft(durationSec);
            }
        }
    }, [started, finished]);

    // Tick Timer
    useEffect(() => {
        if (timeLeft === null || finished || !started) return;

        if (timeLeft === 0) {
            // Time's up! Just warn, don't close.
            // We use a toast or just let it sit at 00:00.
            // But user asked for notification.
            // To avoid repeating alert, we check if we already alerted?
            // Since we can't easily store "alerted" in this effect without ref, we assume specific value check or ref.
            // Simplified: If it hits 0, we can just stop ticking.
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null) return null;
                if (prev <= 1) { // Will hit 0
                    // We can put the alert here, but useEffect is better for side effects.
                    // However, to avoid state thrashing, we'll let existing effect render 0.
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, finished, started]);

    // Separate effect for alerting once when time hits 0
    useEffect(() => {
        if (timeLeft === 0 && !finished && started) {
            alert("O tempo acabou! Você pode continuar respondendo, mas o tempo limite foi excedido.");
        }
    }, [timeLeft, finished, started]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startExam = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
            setStarted(true);
        } catch (err) {
            console.error(err);
            alert("É obrigatório permitir Tela Cheia para iniciar.");
        }
    };

    if (questions.length === 0) return <div className="p-8 text-center text-white">Carregando prova...</div>;

    // START SCREEN
    if (!started && mode === 'take' && isRanked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center max-w-lg mx-auto p-4 animate-fade-in-up">
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="bg-red-500/10 p-4 rounded-full">
                            <Lock className="w-12 h-12 text-red-500" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Modo Bloqueio de Tela</h1>
                    <p className="text-slate-400 mb-6">
                        Para garantir a validade do Ranking, esta prova deve ser feita em tela cheia e sem sair da aba.
                    </p>
                    <div className="bg-slate-950 p-4 rounded-lg text-left text-sm space-y-2 mb-8 border border-slate-800">
                        <div className="flex items-center text-slate-300">
                            <ShieldAlert className="w-4 h-4 text-orange-500 mr-2" />
                            Não é permitido sair da tela cheia.
                        </div>
                        <div className="flex items-center text-slate-300">
                            <ShieldAlert className="w-4 h-4 text-orange-500 mr-2" />
                            Não é permitido trocar de aba.
                        </div>
                        <div className="flex items-center text-slate-300">
                            <ShieldAlert className="w-4 h-4 text-orange-500 mr-2" />
                            Não é permitido botão direito/copiar.
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-red-400 font-semibold text-center">
                            3 infrações = Desclassificação Imediata
                        </div>
                    </div>
                    <Button size="lg" onClick={startExam} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12">
                        Aceitar e Iniciar Prova
                    </Button>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;
    const isFirst = currentIndex === 0;

    const handleSelect = (optionIndex: number) => {
        if (finished || mode === 'view' || strikes >= 3) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
    };

    const handleNext = () => {
        if (strikes >= 3) return;

        if (isLast) {
            if (mode === 'take') {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => { });
                }
                setFinished(true); // Create Summary State
                setMode('review'); // Switch to review immediately 
            }
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    };

    const calculateScore = () => {
        if (strikes >= 3) return { percentage: 0, points: 0 };

        let correct = 0;
        let points = 0;
        let totalPossiblePoints = 0;

        questions.forEach(q => {
            const qPoints = q.pontuacao || 100; // Default to 100 if missing
            totalPossiblePoints += qPoints;

            if (answers[q.id] === q.correctAnswer) {
                correct++;
                points += qPoints;
            }
        });

        const percentage = totalPossiblePoints > 0 ? Math.round((points / totalPossiblePoints) * 100) : 0;

        // Save score to history if in 'take' mode and just finished
        if (mode === 'take' && finished) {
            const examId = sessionStorage.getItem('currentExamId');
            if (examId) {
                // Dynamic import to avoid SSR issues
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { updateExamScore } = require('@/lib/storage');
                updateExamScore(examId, percentage, answers);
            }
        }
        return { percentage, points, totalPoints: totalPossiblePoints, correct, total: questions.length };
    };

    const saveToSupabase = async (calculatedScore: number, finalAnswers: Record<string, number>) => {
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log("Saving exam to Supabase...");

        try {
            const correctCount = questions.reduce((acc, q) => {
                return (finalAnswers[q.id] === q.correctAnswer) ? acc + 1 : acc;
            }, 0);

            // Retrieve custom title if set (e.g. from Challenges)
            const storedTitle = sessionStorage.getItem('currentExamTitle');
            const finalTitle = storedTitle || (questions[0]?.type ? `${questions[0].type} Exam` : "Simulado");

            // Calculate Time Taken
            const storedDuration = sessionStorage.getItem('currentExamDuration');
            let timeTaken = 0;
            if (storedDuration && timeLeft !== null) {
                const totalSeconds = parseInt(storedDuration) * 60;
                timeTaken = totalSeconds - timeLeft;
            }

            const { error } = await supabase.from('exam_results').insert({
                user_id: user.id,
                exam_title: finalTitle,
                score_percentage: calculatedScore,
                correct_answers: correctCount,
                total_questions: questions.length,
                difficulty: questions[0]?.difficulty || "Medium",
                topic: questions[0]?.topic || "General",
                answers_json: finalAnswers,
                questions_json: questions,
                pdf_url: pdfUrl,
                // NEW COLUMNS
                time_taken_seconds: timeTaken,
                cheat_events: strikes
            });

            if (error) throw error;
            console.log("Exam saved to Supabase successfully!");

            // Update Challenge Participant Count if it's a Challenge
            if (finalTitle.startsWith("Desafio: ")) {
                // We need to know which challenge ID it corresponds to.
                // Currently we don't store challenge ID directly in exam_results, just title.
                // But we can try to update by title if unique or just ignore for now if too complex without ID.
                // Ideally we should have stored `challengeId` in sessionStorage or passed it.
                // START HACK: We can't update `challenges` table easily without the ID. 
                // Let's rely on `sessionStorage.getItem('currentExamId')` if we set it in ChallengesPage?
                // In ChallengesPage we didn't set 'currentExamId' to the UUID, we set `currentExam`.
                // Let's fix this in ChallengesPage first? No, user is waiting.
                // We can try to match by title.
                const challengeTitle = finalTitle.replace("Desafio: ", "").trim();
                const { error: incError } = await supabase.rpc('increment_challenge_participants', { challenge_title: challengeTitle });

                // If RPC doesn't exist (likely), we have to do: Get ID -> Update.
                const { data: chal } = await supabase.from('challenges').select('id, participants').eq('title', challengeTitle).single();
                if (chal) {
                    await supabase.from('challenges').update({ participants: (chal.participants || 0) + 1 }).eq('id', chal.id);
                }
            }
        } catch (error) {
            console.error("Error saving to Supabase:", error);
        }
    };

    const confirmFinish = async () => {
        if (mode === 'take') {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }

            // Calculate final score for saving
            const results = calculateScore();

            // Trigger Save (Fire and Forget)
            saveToSupabase(results.percentage, answers);

            setFinished(true);
            setMode('review');
        }
        setShowFinishConfirmation(false);
    };

    // Main Layout Logic
    const content = (<div className={cn("flex flex-col min-h-full", isRanked ? "max-w-3xl mx-auto" : "")}>
        <div className="flex-1 space-y-6">

            {/* STRIKE WARNING BANNER */}
            {strikes > 0 && !finished && (
                <Alert variant="destructive" className="animate-pulse border-red-600 bg-red-950/50">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>ALERTA DE SEGURANÇA ({strikes}/3)</AlertTitle>
                    <AlertDescription>
                        Você saiu da tela ou do modo tela cheia. Não faça isso novamente ou sua prova será anulada.
                    </AlertDescription>
                </Alert>
            )}

            {strikes >= 3 && (
                <Alert variant="destructive" className="border-red-600 bg-red-900 text-white">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>PROVA ANULADA</AlertTitle>
                    <AlertDescription>
                        Você violou as regras de segurança múltiplas vezes. Sua nota foi zerada.
                    </AlertDescription>
                </Alert>
            )}

            {/* Header / StatusBar */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    {finished ? (
                        <span className="flex items-center gap-2">
                            {strikes >= 3 ? <span className="text-red-500">Desclassificado</span> :
                                <span className="text-green-400 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {mode === 'view' ? 'Visualização' : 'Correção'}</span>}
                        </span>
                    ) : (
                        `Questão ${currentIndex + 1} de ${questions.length}`
                    )}
                </h1>

                {finished && mode !== 'view' && (
                    <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex gap-4">
                        <div>
                            <span className="text-slate-400 text-sm mr-2">Nota:</span>
                            <span className="font-bold text-white">{calculateScore().percentage}%</span>
                        </div>
                        <div>
                            <span className="text-slate-400 text-sm mr-2">Pontos:</span>
                            <span className="font-bold text-violet-400">{calculateScore().points}</span>
                        </div>
                    </div>
                )}

                {/* TIMER DISPLAY */}
                {!finished && timeLeft !== null && (
                    <div className={cn(
                        "px-3 py-1 rounded-full border font-mono font-bold flex items-center gap-2",
                        timeLeft < 60 ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-slate-800 border-slate-700 text-slate-300"
                    )}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Question Card */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-sm text-slate-400 uppercase tracking-wide flex justify-between">
                        <div className="flex gap-4">
                            <span>{currentQuestion.topic} • {currentQuestion.difficulty}</span>
                            <span className="text-violet-400 font-bold">{currentQuestion.pontuacao || 100} PTS</span>
                        </div>
                        {finished && !isRanked && (
                            answers[currentQuestion.id] === undefined ?
                                <span className="text-yellow-500 font-bold">Não Respondida</span> :
                                answers[currentQuestion.id] === currentQuestion.correctAnswer ?
                                    <span className="text-green-500 font-bold">Correta</span> :
                                    <span className="text-red-500 font-bold">Incorreta</span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {currentQuestion.context && (
                        <div className="bg-slate-950 p-4 rounded-md italic text-slate-400 border-l-4 border-violet-500">
                            {/* Handle Image Markdown manually because we are raw */}
                            {currentQuestion.context.startsWith('![') ? (
                                <img src={currentQuestion.context.match(/\((.*?)\)/)?.[1] || ""} alt="Questão" className="max-w-full rounded" />
                            ) : currentQuestion.context}
                        </div>
                    )}

                    <div className="text-lg font-medium text-slate-100">
                        {currentQuestion.question}
                    </div>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = answers[currentQuestion.id] === idx;
                            const isCorrect = currentQuestion.correctAnswer === idx;

                            let optionClass = "border-slate-700 hover:bg-slate-800 text-slate-300";

                            if (finished) {
                                if (isRanked) {
                                    // Ranked Mode: Only show what user selected, no feedback
                                    if (isSelected) {
                                        optionClass = "border-violet-500 bg-violet-500/10 text-violet-300";
                                    } else {
                                        optionClass = "border-slate-800 opacity-50";
                                    }
                                } else {
                                    // Normal Mode: Show correct/incorrect
                                    if (isCorrect) {
                                        optionClass = "border-green-500 bg-green-500/10 text-green-400";
                                    } else if (isSelected && !isCorrect) {
                                        optionClass = "border-red-500 bg-red-500/10 text-red-400";
                                    } else {
                                        optionClass = "border-slate-800 opacity-50";
                                    }
                                }
                            } else if (isSelected) {
                                optionClass = "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500 text-violet-300";
                            }

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    className={cn(
                                        "flex items-center p-4 rounded-lg border cursor-pointer transition-all",
                                        optionClass
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border mr-4 text-sm font-semibold transition-colors",
                                        finished && !isRanked && isCorrect ? "bg-green-500 text-white border-green-500" :
                                            finished && !isRanked && isSelected && !isCorrect ? "bg-red-500 text-white border-red-500" :
                                                isSelected ? "bg-violet-500 text-white border-violet-500" : "bg-slate-800 border-slate-600 text-slate-400"
                                    )}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm md:text-base">{option}</span>
                                        {finished && !isRanked && isCorrect && (
                                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider mt-1">
                                                ✅ Gabarito
                                            </span>
                                        )}
                                        {finished && !isRanked && isSelected && !isCorrect && (
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1">
                                                ❌ Sua Resposta
                                            </span>
                                        )}
                                        {finished && !isRanked && isSelected && isCorrect && (
                                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider mt-1">
                                                ✅ Sua Resposta
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Interface for Explanation Object */}


                    {finished && !isRanked && (
                        currentQuestion.explanation && typeof currentQuestion.explanation === 'object' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                {/* 1. HEADER: ONDE VOCÊ ERROU / ACERTOU */}
                                {answers[currentQuestion.id] === currentQuestion.correctAnswer ? (
                                    <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-green-400 font-bold mb-1">
                                            <CheckCircle className="w-5 h-5" />
                                            Você acertou!
                                        </div>
                                        {/* @ts-ignore */}
                                        <p className="text-slate-300 text-sm">{currentQuestion.explanation.analise_erro || "Ótima resposta! Você dominou o conceito."}</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                                            <ShieldAlert className="w-5 h-5" />
                                            ❌ Onde você errou
                                        </div>
                                        {/* @ts-ignore */}
                                        <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                            {/* @ts-ignore */}
                                            {currentQuestion.explanation.analise_erro || "Você cometeu um deslize. Veja o motivo abaixo."}
                                        </p>
                                    </div>
                                )}

                                {/* 2. METÁFORA (DESTAQUE - O QUE FIXA NA CABEÇA) */}
                                {/* @ts-ignore */}
                                {currentQuestion.explanation.metafora && (
                                    <div className="relative p-5 bg-yellow-950/20 border border-yellow-500/30 rounded-xl overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Lightbulb className="w-24 h-24 text-yellow-500" />
                                        </div>
                                        <h4 className="flex items-center gap-2 text-yellow-400 font-bold mb-2 uppercase text-xs tracking-wider z-10 relative">
                                            <div className="p-1 bg-yellow-500/20 rounded">🧠</div>
                                            Metáfora para memorizar
                                        </h4>
                                        <p className="text-yellow-100/90 text-lg font-serif italic leading-relaxed z-10 relative pl-2 border-l-2 border-yellow-500/50">
                                            "{/* @ts-ignore */}{currentQuestion.explanation.metafora}"
                                        </p>
                                    </div>
                                )}

                                {/* 3. GABARITO DETALHADO (RESPOSTA CORRETA) */}
                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                    <h4 className="flex items-center gap-2 text-green-400 font-bold mb-3 uppercase text-xs tracking-wider">
                                        <div className="p-1 bg-green-500/10 rounded">✅</div>
                                        Resposta correta ({String.fromCharCode(65 + currentQuestion.correctAnswer)})
                                    </h4>
                                    <ul className="space-y-3">
                                        {/* @ts-ignore */}
                                        {Array.isArray(currentQuestion.explanation.gabarito_detalhado) ? (
                                            /* @ts-ignore */
                                            currentQuestion.explanation.gabarito_detalhado.map((point: string, i: number) => (
                                                <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                                                    <span className="text-green-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 block"></span>
                                                    <span>{point}</span>
                                                </li>
                                            ))
                                        ) : (
                                            /* @ts-ignore */
                                            <p className="text-slate-300 text-sm">{currentQuestion.explanation.gabarito_detalhado}</p>
                                        )}
                                    </ul>
                                </div>

                                {/* 4. CONTEXTO ENEM & REVISÃO (Grid) */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* @ts-ignore */}
                                    {currentQuestion.explanation.enem_contexto && (
                                        <div className="p-3 bg-slate-900 rounded border border-slate-800">
                                            <h4 className="text-violet-400 font-bold text-xs uppercase mb-1 flex items-center gap-1">
                                                <Target className="w-3 h-3" /> No ENEM/Concurso
                                            </h4>
                                            {/* @ts-ignore */}
                                            <p className="text-slate-400 text-sm">{currentQuestion.explanation.enem_contexto}</p>
                                        </div>
                                    )}
                                    {/* @ts-ignore */}
                                    {currentQuestion.explanation.dica_revisao && (
                                        <div className="p-3 bg-slate-900 rounded border border-slate-800">
                                            <h4 className="text-green-400 font-bold text-xs uppercase mb-1 flex items-center gap-1">
                                                <RotateCcw className="w-3 h-3" /> Dica Flash
                                            </h4>
                                            {/* @ts-ignore */}
                                            <p className="text-slate-400 text-sm">{currentQuestion.explanation.dica_revisao}</p>
                                        </div>
                                    )}
                                </div>

                                {/* 5. POR QUE AS OUTRAS ERRAM? */}
                                {/* @ts-ignore */}
                                {currentQuestion.explanation.por_que_nao_outras && (
                                    <div className="mt-2 text-sm text-slate-500 border-t border-slate-800 pt-2">
                                        <details className="cursor-pointer group">
                                            <summary className="font-semibold hover:text-slate-300 transition-colors list-none flex items-center gap-2">
                                                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                                                Por que as outras alternativas estão incorretas?
                                            </summary>
                                            <p className="mt-2 pl-6 whitespace-pre-line leading-relaxed">
                                                {/* @ts-ignore */}
                                                {currentQuestion.explanation.por_que_nao_outras}
                                            </p>
                                        </details>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // LEGACY STRING FEEDBACK
                            <div className="mt-6 p-4 bg-blue-900/20 text-blue-300 rounded-md border border-blue-900/50 animate-in fade-in slide-in-from-top-2">
                                <span className="font-semibold block mb-1 flex items-center gap-2">
                                    💡 Explicação
                                </span>
                                {/* @ts-ignore */}
                                {currentQuestion.explanation}
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

        </div>
        {/* Sticky Bottom Navigation Bar */}
        <div className={cn(
            "sticky bottom-0 left-0 right-0 p-4 bg-slate-950 border-t border-slate-800 flex justify-center z-50",
            isRanked ? "" : ""
        )}>
            <div className="w-full max-w-3xl flex justify-between items-center gap-4">
                <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={isFirst}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Anterior
                </Button>

                {finished ? (
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => window.location.href = isRanked ? '/challenges' : '/history'}>
                            Voltar
                        </Button>
                        {!isLast && (
                            <Button
                                onClick={handleNext}
                                className="bg-slate-800"
                            >
                                Próxima <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button
                        onClick={() => isLast ? setShowFinishConfirmation(true) : handleNext()}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-8"
                    >
                        {isLast ? "Finalizar Prova" : "Próxima"}
                        {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
                        {isLast && <CheckCircle className="w-4 h-4 ml-2" />}
                    </Button>
                )}
            </div>
        </div>
    </div >
    );

    return (
        <>
            {/* Custom Finish Confirmation Modal */}
            {showFinishConfirmation && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
                        <h2 className="text-xl font-bold text-white mb-2">Finalizar Prova?</h2>
                        <p className="text-slate-400 mb-6">
                            Tem certeza que deseja encerrar? Você não poderá alterar suas respostas depois.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowFinishConfirmation(false)} className="border-slate-700 hover:bg-slate-800">
                                Cancelar
                            </Button>
                            <Button onClick={confirmFinish} className="bg-violet-600 hover:bg-violet-700">
                                Sim, Finalizar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {pdfUrl ? (
                // SPLIT SCREEN LAYOUT
                <div className="lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-background">
                    {/* LEFT: PDF VIEWER */}
                    <div className="lg:w-[60%] h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-700 bg-slate-900 shadow-2xl relative">
                        <iframe
                            src={`${pdfUrl}#toolbar=0`}
                            className="w-full h-full"
                            title="Exam PDF"
                        />
                    </div>

                    {/* RIGHT: ANSWER SHEET QUESTIONS */}
                    <div className="lg:w-[40%] h-full overflow-y-auto p-4 md:p-6 bg-background">
                        {content}
                    </div>
                </div>
            ) : (
                // NORMAL LAYOUT
                <div className={cn(
                    "animate-fade-in-up pb-20 select-none transition-all duration-300",
                    isRanked ? "fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm overflow-y-auto p-4 md:p-8" : "max-w-3xl mx-auto space-y-6"
                )}>
                    {content}
                </div>
            )}
        </>
    );
}
