"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowRight, Lock, Crown, Star, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EssayResult } from "@/lib/essays";
import { checkCredits, deductCredits } from "@/lib/credits";
import Link from "next/link";
import { EssayFeedbackDisplay } from "@/components/essay/EssayFeedbackDisplay";

function RedacaoPageContent() {
    const searchParams = useSearchParams();

    // Initialize theme/text from URL if present
    const [theme, setTheme] = useState("");
    const [supportingText, setSupportingText] = useState("");

    // Effect to handle URL params for "Redo" functionality
    useEffect(() => {
        if (searchParams) {
            const urlTheme = searchParams.get('theme');
            const urlSupportToken = searchParams.get('support_text');

            if (urlTheme) setTheme(urlTheme);
            if (urlSupportToken) setSupportingText(urlSupportToken);
        }
    }, [searchParams]);

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EssayResult | null>(null);
    const [error, setError] = useState("");

    const [isPro, setIsPro] = useState<boolean | null>(null); // null = loading
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                if (!supabase) {
                    setIsPro(false);
                    setCheckingAuth(false);
                    return;
                }

                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    setIsPro(false);
                    setCheckingAuth(false);
                    return;
                }

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
            // Basic naive check (optional warning)
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            if (!supabase) throw new Error("Sistema indisponível.");

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("Você precisa estar logado.");
                setLoading(false);
                return;
            }

            const { allowed, currentCredits } = await checkCredits(user.id, 1);
            if (!allowed) {
                setError(`Você não tem créditos suficientes. Seus créditos: ${currentCredits}`);
                setLoading(false);
                return;
            }

            const response = await fetch("/api/essay/correct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme, content, userId: user.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro na correção.");
            }

            await deductCredits(user.id, 1);

            // Save to Supabase with support_text
            const { data: savedEssay, error: saveError } = await supabase
                .from("essays")
                .insert({
                    user_id: user.id,
                    theme,
                    content,
                    score_final: data.score_final,
                    score_breakdown: data.score_breakdown,
                    feedback: data.feedback_html,
                    support_text: supportingText
                })
                .select()
                .single();

            if (saveError) {
                console.error("Erro ao salvar:", saveError);
            }

            setResult({
                ...data,
                id: savedEssay?.id || "temp-id",
                theme,
                content,
                support_text: supportingText
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const [loadingTheme, setLoadingTheme] = useState(false);

    const handleGenerateTheme = async () => {
        setLoadingTheme(true);
        setSupportingText("");
        setError("");

        try {
            const response = await fetch("/api/essay/theme", { method: "POST" });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro ao gerar tema.");
            }

            if (data.theme) setTheme(data.theme);
            if (data.support_text) setSupportingText(data.support_text);

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
                <EssayFeedbackDisplay
                    result={result}
                    onRedo={() => setResult(null)}
                    onNew={() => {
                        setTheme("");
                        setContent("");
                        setSupportingText("");
                        setResult(null);
                    }}
                />
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

export default function RedacaoPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>}>
            <RedacaoPageContent />
        </Suspense>
    );
}
