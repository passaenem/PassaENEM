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
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Check if admin
                if (user.id === "426d48bb-fc97-4461-acc9-a8a59445b72d") {
                    setIsPro(true);
                    setCheckingAuth(false);
                    return;
                }

                // Check profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan_type')
                    .eq('id', user.id)
                    .single();

                if (profile && (profile.plan_type === 'pro' || profile.plan_type === 'admin')) {
                    setIsPro(true);
                } else {
                    setIsPro(false);
                }
            } else {
                setIsPro(false);
            }
            setCheckingAuth(false);
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
            const { data: { user } } = await supabase!.auth.getUser();
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

    if (checkingAuth) {
        return (
            <div className="flex h-screen bg-slate-950 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const [loadingTheme, setLoadingTheme] = useState(false);

    const handleGenerateTheme = async () => {
        setLoadingTheme(true);
        try {
            const response = await fetch("/api/essay/theme", { method: "POST" });
            const data = await response.json();
            if (data.theme) {
                setTheme(data.theme);
            }
        } catch (error) {
            console.error("Error fetching theme:", error);
        } finally {
            setLoadingTheme(false);
        }
    };

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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Resultado da Correção</h2>
                            <p className="text-slate-400 text-sm">Tema: {result.theme}</p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-950 px-6 py-4 rounded-xl border border-slate-800">
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Nota Final</span>
                                <span className={`text-4xl font-extrabold ${result.score_final >= 900 ? 'text-green-400' : result.score_final >= 700 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {result.score_final}
                                </span>
                            </div>
                            <div className="h-10 w-px bg-slate-800" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500">de 1000</span>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className={`w-3 h-3 ${i <= Math.round(result.score_final / 200) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-700'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <ScoreCard title="Compreensão do Tema" score={result.score_breakdown.comprehension} icon={BookOpen} description="Entendimento da proposta e não fuga do tema." />
                        <ScoreCard title="Estrutura Textual" score={result.score_breakdown.structure} icon={AlertTriangle} description="Organização dos parágrafos e tipo dissertativo." />
                        <ScoreCard title="Argumentação" score={result.score_breakdown.argumentation} icon={CheckCircle} description="Defesa de ponto de vista e repertório." />
                        <ScoreCard title="Coesão e Coerência" score={result.score_breakdown.cohesion} icon={ArrowRight} description="Conectivos e lógica textual." />
                        <ScoreCard title="Norma Padrão" score={result.score_breakdown.grammar} icon={Star} description="Gramática e ortografia." />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-violet-400" />
                            Análise Pedagógica
                        </h3>
                        <div
                            className="prose prose-invert prose-sm max-w-none text-slate-300 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>li]:mb-1 [&>strong]:text-violet-300"
                            dangerouslySetInnerHTML={{ __html: result.feedback }}
                        />
                    </div>

                    <Button onClick={() => setResult(null)} variant="outline" className="w-full h-12 border-slate-700 text-white hover:bg-slate-800">
                        Corrigir Outra Redação
                    </Button>
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
                                placeholder="Ex: Os desafios da educação no Brasil..."
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white h-12 flex-1"
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

function ScoreCard({ title, score, icon: Icon, description }: any) {
    // Determine color based on score (0-200)
    const color = score >= 160 ? "text-green-400" : score >= 120 ? "text-yellow-400" : "text-red-400";
    const bg = score >= 160 ? "bg-green-500/10" : score >= 120 ? "bg-yellow-500/10" : "bg-red-500/10";
    const border = score >= 160 ? "border-green-500/20" : score >= 120 ? "border-yellow-500/20" : "border-red-500/20";

    return (
        <div className={`p-4 rounded-xl border ${border} ${bg} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-950/50 ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-200 text-sm">{title}</h4>
                    <p className="text-xs text-slate-500 max-w-[150px] truncate">{description}</p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className={`text-xl font-bold ${color}`}>{score}</span>
                <span className="text-[10px] text-slate-500">/200</span>
            </div>
        </div>
    )
}
