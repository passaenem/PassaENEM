"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, TrendingUp, Brain, ArrowRight, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUser(user);
                    // router.push("/dashboard"); // Don't redirect automatically, allow viewing pricing
                }
            }
        };
        checkUser();
    }, []);

    const handleSubscribe = async (planType: 'monthly' | 'recurring' | 'test') => {
        if (!user) {
            router.push("/login?callbackUrl=/"); // Redirect to login then back here ideally
            return;
        }

        try {
            console.log("User data:", { email: user.email, id: user.id, planType });

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planType,
                    userEmail: user.email,
                    userId: user.id
                })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Erro ao iniciar pagamento: " + (data.error || "Desconhecido"));
            }
        } catch (err) {
            alert("Erro de conexão.");
        }
    };

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
                    <div className="flex -space-x-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="relative w-10 h-10 rounded-full border-2 border-slate-950 overflow-hidden">
                                <Image
                                    src={`/avatars/avatar-${i}.png`}
                                    alt={`Student ${i}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
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
                            <h3 className="text-xl font-bold mb-2">desafios Valendo Pix</h3>
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

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-slate-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16">Planos que cabem no seu bolso</h2>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

                        {/* Free Plan */}
                        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-2">Plano Gratuito</h3>
                            <p className="text-slate-400 mb-6 font-medium text-sm">Para você começar a estudar</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-bold text-white">R$ 0</span>
                                <span className="text-slate-500 text-sm">/mês</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1 text-sm">
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    20 Créditos mensais
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    Acesso a provas do ENEM
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    Participe do Ranking Global
                                </li>
                                <li className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    1 Desafio Premiado por mês
                                </li>
                            </ul>

                            <Link href={user ? "/dashboard" : "/login"}>
                                <Button variant="outline" className="w-full text-sm border-slate-700 text-white hover:bg-slate-800">
                                    Começar Grátis
                                </Button>
                            </Link>
                        </div>

                        {/* Pro Monthly Plan */}
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col relative overflow-hidden group hover:border-violet-500/50 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-2">Pro Mensal</h3>
                            <p className="text-slate-400 mb-6 font-medium text-sm">Flexibilidade total</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-bold text-white">R$ 49,90</span>
                                <span className="text-slate-500 text-sm">/mês</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1 text-sm">
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                    <strong>350 Questões mensais*</strong>
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                    ENEM + Concursos
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                    Sem fidelidade
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                    Ranking com Premiação
                                </li>
                            </ul>

                            <div className="mt-auto w-full">
                                <Button
                                    className="w-full text-sm bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                                    onClick={() => handleSubscribe('monthly')}
                                >
                                    Assinar Mensal
                                </Button>
                            </div>
                        </div>



                        {/* TEST PLAN CARD (Temporary) */}
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col hover:border-slate-700 transition-all opacity-80 hover:opacity-100">
                            <h3 className="text-xl font-bold text-white mb-2">Plano Teste</h3>
                            <p className="text-slate-400 mb-6 font-medium text-sm">Validar Pagamento</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-bold text-white">R$ 1,00</span>
                                <span className="text-slate-500 text-sm">/único</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1 text-sm">
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <strong>Libera Questões</strong>
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    Ativa Status PRO
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    Acesso ao Dashboard
                                </li>
                            </ul>

                            <div className="mt-auto w-full">
                                <Button
                                    className="w-full text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    onClick={() => handleSubscribe('test')}
                                >
                                    Testar (R$ 1,00)
                                </Button>
                            </div>
                        </div>

                        {/* Pro 6-Months Plan (Best Value) */}
                        <div className="p-6 rounded-2xl bg-gradient-to-b from-violet-900/40 to-slate-900 border border-violet-500 flex flex-col relative overflow-hidden group shadow-2xl shadow-violet-900/20 scale-105 z-10">
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                MELHOR CUSTO-BENEFÍCIO
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                Pro Semestral
                                <Brain className="w-4 h-4 text-violet-400" />
                            </h3>
                            <p className="text-violet-200 mb-6 font-medium text-sm">A escolha inteligente (6 meses)</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">R$ 35,00</span>
                                <span className="text-slate-400 text-sm">/mês</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1 text-sm">
                                <li className="flex items-center gap-2 text-white">
                                    <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-3 h-3 text-violet-400" />
                                    </div>
                                    <strong>350 Questões mensais*</strong>
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-3 h-3 text-violet-400" />
                                    </div>
                                    Acesso Total (ENEM + Concursos)
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-3 h-3 text-violet-400" />
                                    </div>
                                    <span className="text-green-400 font-bold">Ganhe prêmios em dinheiro</span>
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-3 h-3 text-violet-400" />
                                    </div>
                                    Histórico Avançado
                                </li>
                            </ul>

                            <div className="mt-auto w-full">
                                <Button
                                    className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-violet-600/25"
                                    onClick={() => handleSubscribe('recurring')}
                                >
                                    Assinar Agora (Recorrente)
                                </Button>
                            </div>
                        </div>

                    </div>

                    <div className="mt-12 text-center text-slate-500 text-sm max-w-2xl mx-auto">
                        <p>* O limite de questões é renovado mensalmente na data do pagamento e não é cumulativo.
                            Caso não sejam utilizadas dentro do período de 30 dias, elas expiram automaticamente.</p>
                        <p className="mt-2">O cancelamento pode ser feito a qualquer momento sem multa.</p>
                    </div>
                </div>
            </section >

            <section className="py-20 bg-slate-950 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[100px] rounded-full -z-10" />

                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-16 animate-in fade-in slide-in-from-bottom-5">
                        O que nossos alunos dizem
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Testimonial 1 */}
                        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm relative group hover:border-violet-500/30 transition-all duration-300 hover:transform hover:-translate-y-1">
                            <Quote className="h-8 w-8 text-violet-500/20 absolute top-6 right-6" />
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-700">
                                    <Image src="/avatars/avatar-1.png" alt="Mariana Silva" fill className="object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Mariana Silva</h4>
                                    <p className="text-xs text-green-400 font-medium">Aprovada em Medicina</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                "Eu sempre tive dificuldade em focar, mas os desafios semanais me deram a motivação que eu precisava. Ganhar meu primeiro Pix estudando foi surreal!"
                            </p>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm relative group hover:border-green-500/30 transition-all duration-300 hover:transform hover:-translate-y-1">
                            <Quote className="h-8 w-8 text-green-500/20 absolute top-6 right-6" />
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-700">
                                    <Image src="/avatars/avatar-4.png" alt="Ricardo Oliveira" fill className="object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Ricardo Oliveira</h4>
                                    <p className="text-xs text-green-400 font-medium">1º Lugar no Simulado</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                "A correção com IA mudou meu jeito de estudar. Antes eu errava e não sabia o porquê, agora tenho a explicação detalhada na hora. Vale muito a pena."
                            </p>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm relative group hover:border-blue-500/30 transition-all duration-300 hover:transform hover:-translate-y-1">
                            <Quote className="h-8 w-8 text-blue-500/20 absolute top-6 right-6" />
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-700">
                                    <Image src="/avatars/avatar-3.png" alt="Beatriz Costa" fill className="object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Beatriz Costa</h4>
                                    <p className="text-xs text-green-400 font-medium">Aprovada no ENEM</p>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                "Plataforma incrível! O design é lindo e super rápido. Os desafios semanais criam uma competição saudável que te faz querer estudar mais todo dia."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-slate-800 text-center text-slate-500 text-sm">
                <p>&copy; 2024 Passa Enem. Todos os direitos reservados.</p>
            </footer>
        </div >
    );
}
