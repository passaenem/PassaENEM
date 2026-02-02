"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, BookOpen, Star, ArrowRight, Lock, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EssayResult } from "@/lib/essays";
import { checkCredits, deductCredits } from "@/lib/credits";
import Link from "next/link";

export default function RedacaoPage() {
    const [theme, setTheme] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EssayResult | null>(null);
    const [error, setError] = useState("");

    const [isPro, setIsPro] = useState<boolean | null>(null); // null = loading
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            console.log("Checking access...");
            try {
                if (!supabase) {
                    console.error("Supabase client is null");
                    setIsPro(false); // Fail safe
                    setCheckingAuth(false);
                    return;
                }

                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    console.error("Auth error:", authError);
                    setIsPro(false);
                    setCheckingAuth(false);
                    return;
                }

                if (user) {
                    // Check if admin
                    if (user.id === "426d48bb-fc97-4461-acc9-a8a59445b72d") {
                        setIsPro(true);
                        setCheckingAuth(false);
                        return;
                    }

                    // Check profile
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('plan_type')
                        .eq('id', user.id)
                        .single();

                    if (profileError) {
                        console.error("Profile error:", profileError);
                        // If no profile, assume free? or error?
                        // If error is PGRST116 (0 rows), it implies free/new user.
                    }

                    if (profile && (profile.plan_type === 'pro' || profile.plan_type === 'admin')) {
                        setIsPro(true);
                    } else {
                        setIsPro(false);
                    }
                } else {
                    setIsPro(false);
                }
            } catch (err) {
                console.error("Unexpected error in checkAccess:", err);
                setIsPro(false);
            } finally {
                setCheckingAuth(false);
            }
        };
        checkAccess();
    }, []);

    const handleCorrection = async () => {
        if (!theme.trim() || !content.trim()) {
            setError("Por favor, preencha o tema e a redação.");
            return;
        }

        if (content.split(/\n\s*\n/).length < 4) {
            // Basic naive check
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            // 1. Get User
            if (!supabase) {
                throw new Error("Sistema indisponível. Tente recarregar.");
            }
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("Você precisa estar logado.");
                setLoading(false);
                return;
            }

            // 2. Check Credits (Cost = 1)
            const { allowed, currentCredits } = await checkCredits(user.id, 1);
            if (!allowed) {
                setError(`Você não tem créditos suficientes. Seus créditos: ${currentCredits}`);
                setLoading(false);
                return;
            }

            // 3. Call AI API
            const response = await fetch("/api/essay/correct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme, content, userId: user.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro na correção.");
            }

            // 4. Deduct Credit
            await deductCredits(user.id, 1);

            // 5. Save to Supabase
            const { data: savedEssay, error: saveError } = await supabase!
                .from("essays")
                .insert({
                    user_id: user.id,
                    theme,
                    content,
                    score_final: data.score_final,
                    score_breakdown: data.score_breakdown,
                    feedback: data.feedback_html
                })
                .select()
                .single();

            if (saveError) {
                console.error("Erro ao salvar:", saveError);
            }

            setResult({
                ...data, // API returns score_final, etc.
                id: savedEssay?.id || "temp-id",
                theme,
                content
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [loadingTheme, setLoadingTheme] = useState(false);
    const [supportingText, setSupportingText] = useState("");

    const handleGenerateTheme = async () => {
        setLoadingTheme(true);
        setSupportingText(""); // Reset previous text
        setError(""); // Reset previous error

        try {
            const response = await fetch("/api/essay/theme", { method: "POST" });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro ao gerar tema.");
            }

            if (data.theme) {
                setTheme(data.theme);
            }
            if (data.support_text) {
                setSupportingText(data.support_text);
            }
        } catch (error: any) {
            console.error("Error fetching theme:", error);
            setError(error.message);
        } finally {
            setLoadingTheme(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="flex h-screen bg-slate-950 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }



    if (isPro === false) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="max-w-lg text-center bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-slate-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Recurso Exclusivo Pro</h1>
                    <p className="text-slate-400 mb-8 text-lg">
                        A correção de redação com IA é exclusiva para assinantes do plano Pro.
                        Tenha correções ilimitadas e detalhadas para garantir seu 1000 no ENEM.
                    </p>
                    <Link href="/planos">
                        <Button className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-green-600 hover:from-violet-700 hover:to-green-700 text-white font-bold shadow-lg shadow-violet-900/20">
                            <Crown className="w-5 h-5 mr-2" />
                            Quero ser Pro
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-green-400 mb-2">
                    Corretor de Redação IA
                </h1>
                <p className="text-slate-400">
                    Receba correções instantâneas detalhadas no modelo ENEM baseadas nas 5 competências. (Custo: 1 Crédito)
                </p>
            </header>

            {result ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">

                    {/* 1. Score & Context Section */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                        <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-white">Resultado da Correção</h2>
                                <p className="text-slate-400 text-sm max-w-md">Tema: {result.theme}</p>

                                {/* Overall Impression Badge */}
                                {result.overall_impression && (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mt-2
                                        ${result.overall_impression === 'Excelente' ? 'bg-green-500/20 text-green-400' :
                                            result.overall_impression === 'Bom' ? 'bg-blue-500/20 text-blue-400' :
                                                result.overall_impression === 'Regular' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'}`}>
                                        {result.overall_impression === 'Excelente' ? <CheckCircle className="w-4 h-4" /> :
                                            result.overall_impression === 'Crítico' ? <AlertTriangle className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                                        Nível: {result.overall_impression}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-6 bg-slate-950 px-8 py-6 rounded-2xl border border-slate-800 shadow-inner">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Nota Final</span>
                                    <span className={`text-5xl font-extrabold ${result.score_final >= 900 ? 'text-green-400' : result.score_final >= 700 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {result.score_final}
                                    </span>
                                </div>
                                <div className="h-12 w-px bg-slate-800" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-500">de 1000 pontos</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} className={`w-4 h-4 ${i <= Math.round(result.score_final / 200) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-800'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Humanized Competencies */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <ScoreCard
                            title="Compreensão do Tema"
                            score={result.score_breakdown.comprehension}
                            icon={BookOpen}
                            description="Entendimento da proposta e não fuga do tema."
                            feedback={result.competency_feedback?.comprehension}
                        />
                        <ScoreCard
                            title="Estrutura Textual"
                            score={result.score_breakdown.structure}
                            icon={AlertTriangle}
                            description="Organização dos parágrafos e tipo dissertativo."
                            feedback={result.competency_feedback?.structure}
                        />
                        <ScoreCard
                            title="Argumentação"
                            score={result.score_breakdown.argumentation}
                            icon={CheckCircle}
                            description="Defesa de ponto de vista e repertório."
                            feedback={result.competency_feedback?.argumentation}
                        />
                        <ScoreCard
                            title="Coesão e Coerência"
                            score={result.score_breakdown.cohesion}
                            icon={ArrowRight}
                            description="Conectivos e lógica textual."
                            feedback={result.competency_feedback?.cohesion}
                        />
                        <ScoreCard
                            title="Norma Padrão"
                            score={result.score_breakdown.grammar}
                            icon={Star}
                            description="Gramática e ortografia."
                            feedback={result.competency_feedback?.grammar}
                        />
                    </div>

                    {/* 3. Text with Highlights (The Core Feature) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-violet-400" />
                                Correção Detalhada no Texto
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Passe o mouse (ou clique) sobre os trechos marcados para ver as observações.
                            </p>
                        </div>
                        <div className="p-8 leading-loose text-lg text-slate-300 font-serif whitespace-pre-wrap">
                            <EssayTextWithHighlights content={result.content} comments={result.inline_comments || []} />
                        </div>
                    </div>

                    {/* 4. Pedagogical Analysis (Refined/Collapsable) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400" />
                            Plano de Melhoria & Feedback Geral
                        </h3>
                        {/* We use the same html content but style it better */}
                        <div
                            className="prose prose-invert prose-p:text-slate-300 prose-ul:text-slate-300 prose-strong:text-violet-300 max-w-none"
                            dangerouslySetInnerHTML={{ __html: result.feedback }}
                        />
                    </div>

                    {/* 5. CTAs (Action Buttons) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <Button variant="outline" className="h-14 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setResult(null)}>
                            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                            Reescrever Mesma Redação
                        </Button>
                        <Button className="h-14 bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-900/20" onClick={() => { setTheme(""); setContent(""); setResult(null); }}>
                            Corrigir Novo Tema
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    {error && (
                        <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Tema da Redação</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Clique em 'Gerar com IA' para definir o tema..."
                                value={theme}
                                readOnly
                                className="bg-slate-950 border-slate-800 text-white h-12 flex-1 cursor-not-allowed opacity-80"
                            />
                            <Button
                                onClick={handleGenerateTheme}
                                disabled={loadingTheme}
                                variant="outline"
                                className="h-12 border-slate-700 text-violet-400 hover:text-violet-300 hover:bg-slate-800 shrink-0"
                            >
                                {loadingTheme ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
                                {loadingTheme ? "Gerando..." : "Gerar com IA"}
                            </Button>
                        </div>
                    </div>



                    {supportingText && (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-sm font-bold text-violet-400 mb-2 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Texto de Apoio
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-slate-700 pl-4">
                                "{supportingText}"
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Sua Redação</label>
                        <Textarea
                            placeholder="Digite ou cole sua redação aqui. Lembre-se: mínimo de 4 parágrafos."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white min-h-[400px] p-4 text-base leading-relaxed resize-y"
                        />
                        <p className="text-xs text-slate-600 mt-2 text-right">
                            {content.length} caracteres | {content.split(/\s+/).filter(w => w.length > 0).length} palavras
                        </p>
                    </div>

                    <Button
                        onClick={handleCorrection}
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-violet-600 to-green-600 hover:from-violet-700 hover:to-green-700 text-white font-bold text-lg shadow-lg shadow-violet-900/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Corrigindo com IA...
                            </>
                        ) : (
                            <>
                                Enviar para Correção (1 Crédito)
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

function ScoreCard({ title, score, icon: Icon, description, feedback }: any) {
    // Determine color based on score (0-200)
    const color = score >= 160 ? "text-green-400" : score >= 120 ? "text-yellow-400" : "text-red-400";
    const bg = score >= 160 ? "bg-green-500/10" : score >= 120 ? "bg-yellow-500/10" : "bg-red-500/10";
    const border = score >= 160 ? "border-green-500/20" : score >= 120 ? "border-yellow-500/20" : "border-red-500/20";

    return (
        <div className={`p-5 rounded-xl border ${border} ${bg} flex flex-col gap-3 transition-all hover:scale-[1.01]`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-950/50 ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-100">{title}</h4>
                        <p className="text-xs text-slate-400">{description}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-2xl font-bold ${color}`}>{score}</span>
                    <span className="text-[10px] text-slate-500">/200</span>
                </div>
            </div>

            {/* Feedback Summary */}
            <div className="mt-1 pt-3 border-t border-slate-800/50">
                {feedback ? (
                    <div className="flex gap-2">
                        <div className={`w-1 h-auto rounded-full ${score >= 160 ? 'bg-green-500' : score >= 120 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <p className="text-sm text-slate-300 italic">"{feedback}"</p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">Sem observações específicas.</p>
                )}
            </div>
        </div>
    )
}

function EssayTextWithHighlights({ content, comments }: { content: string, comments: any[] }) {
    if (!comments || comments.length === 0) return <div className="whitespace-pre-wrap">{content}</div>;

    // Naive implementation: 
    // We split by parts. But since quotes might repeat, ideally we find indices.
    // Simplifying: we will just replace the *first occurrence* found of each quote that hasn't been processed?
    // Actually, a safer way for React rendering is to map the string into segments.
    //
    // Let's take the content and try to mark it.
    // Since this is complex to do perfectly with overlapping or repeat strings, we will use a library-free approach:
    // Split content by segments? No, we will search for quote positions.

    // Sort comments by position/occurrence? We don't have position.
    // We will assume unique enough quotes or just match the first one found.

    let parts: { text: string, comment?: any }[] = [{ text: content }];

    comments.forEach(cmt => {
        const quote = cmt.quote.trim();
        if (!quote) return;

        const newParts: typeof parts = [];
        let found = false;

        parts.forEach(part => {
            if (part.comment) {
                newParts.push(part); // Already processed
            } else {
                const idx = part.text.indexOf(quote);
                if (idx !== -1 && !found) {
                    // Split!
                    const before = part.text.substring(0, idx);
                    const match = part.text.substring(idx, idx + quote.length);
                    const after = part.text.substring(idx + quote.length);

                    if (before) newParts.push({ text: before });
                    newParts.push({ text: match, comment: cmt });
                    if (after) newParts.push({ text: after });
                    found = true;
                } else {
                    newParts.push(part);
                }
            }
        });
        parts = newParts;
    });

    return (
        <div className="whitespace-pre-wrap">
            {parts.map((part, i) => (
                part.comment ? (
                    <span key={i} className="relative group cursor-help decoration-red-500/50 underline decoration-wavy decoration-2 underline-offset-4 bg-red-500/10 rounded px-0.5 mx-0.5">
                        {part.text}
                        <span className="absolute hidden group-hover:block z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl text-xs sm:text-sm text-slate-200 pointer-events-none">
                            <strong>{part.comment.type === 'error' ? '🔴 Correção:' : '💡 Sugestão:'}</strong><br />
                            {part.comment.comment}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700" />
                        </span>
                    </span>
                ) : (
                    <span key={i}>{part.text}</span>
                )
            ))}
        </div>
    );
}

