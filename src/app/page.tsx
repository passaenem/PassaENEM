"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, TrendingUp, Brain, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LandingPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUser(user);
                }
            }
        };
        checkUser();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Logo Placeholder */}
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-green-500 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-green-400">
                            Passa Enem
                        </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Funcionalidades</Link>
                        <Link href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Planos</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link href="/dashboard">
                                <Button className="bg-white text-slate-950 hover:bg-slate-200 font-bold">
                                    Ir para o App
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white hidden sm:block">
                                    Entrar
                                </Link>
                                <Link href="/login">
                                    <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20">
                                        Começar Agora
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full -z-10" />

                <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-300 mb-8 animate-in fade-in slide-in-from-bottom-5">
                    <span className="flex h-2 w-2 rounded-full bg-violet-400 mr-2 animate-pulse"></span>
                    Nova IA: Geração de questões 2x mais precisa
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-700">
                    Estude, Evolua e <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                        Ganhe Dinheiro Estudando
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                    Participe de <strong>Desafios Semanais</strong>, suba no Ranking e ganhe prêmios em dinheiro real. A única plataforma onde seu conhecimento rende pix na conta.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                    <Link href={user ? "/dashboard" : "/login"}>
                        <Button size="lg" className="h-14 px-8 text-lg bg-green-500 hover:bg-green-600 text-slate-950 font-bold shadow-xl shadow-green-500/20">
                            {user ? "Acessar Dashboard" : "Criar Conta Grátis"}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 hover:bg-slate-800 text-slate-300">
                            Ver como funciona
                        </Button>
                    </Link>
                </div>

                <div className="mt-12 flex items-center gap-4 text-sm text-slate-500 animate-in fade-in zoom-in duration-1000 delay-500">
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950" />
                        ))}
                    </div>
                    <p>+1.000 estudantes já estão usando</p>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-slate-950">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16">Por que escolher o Passa Enem?</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 transition-colors group">
                            <div className="h-12 w-12 rounded-xl bg-violet-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Brain className="h-6 w-6 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">IA Gemini 2.0</h3>
                            <p className="text-slate-400">
                                Questões inéditas geradas na hora, baseadas nas competências reais do ENEM e Concursos.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-green-500/50 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                                PREMIADO
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-green-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Desafios Valendo Pix</h3>
                            <p className="text-slate-400">
                                Provas semanais criadas pela administração. Os melhores colocados no Ranking Global recebem prêmios em dinheiro.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-colors group">
                            <div className="h-12 w-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <CheckCircle className="h-6 w-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Correção com IA</h3>
                            <p className="text-slate-400">
                                Entenda onde errou com explicações detalhadas. Aprenda enquanto compete e aumente suas chances de ganhar.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-slate-800 text-center text-slate-500 text-sm">
                <p>&copy; 2024 Passa Enem. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
