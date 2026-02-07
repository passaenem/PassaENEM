// Force Rebuild


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, TrendingUp, Brain, Calendar, FileText, PenTool, Trophy, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

interface PricingSectionProps {
    user: any;
}

export function PricingSection({ user }: PricingSectionProps) {
    const router = useRouter();

    const handleSubscribe = async (planType: 'monthly' | 'recurring' | 'test') => {
        if (!user) {
            router.push("/login?callbackUrl=/planos");
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
                console.error("No checkout URL returned:", data);
                alert("Erro ao iniciar checkout: " + (data.error || "Erro desconhecido"));
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
            alert("Erro de conexão. Tente novamente.");
        }
    };

    return (
        <section id="pricing" className="py-20 bg-slate-900">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Planos Que Cabem no Seu Bolso
                </h2>

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
                                <strong>350 Créditos Mensais</strong>
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <Calendar className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                Cronograma de Estudos Personalizado
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                Simulados Oficiais (ENEM) + IA
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <PenTool className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                Redação com Correção Detalhada
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <Trophy className="w-4 h-4 text-green-400 flex-shrink-0" />
                                Desafios com Premiação em Dinheiro
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <LayoutDashboard className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                Dashboard de Desempenho Completo
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
                                <strong>350 Créditos Mensais</strong>
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-3 h-3 text-violet-400" />
                                </div>
                                Cronograma de Estudos Personalizado
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-3 h-3 text-violet-400" />
                                </div>
                                Simulados Oficiais (ENEM) + IA
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                    <PenTool className="w-3 h-3 text-violet-400" />
                                </div>
                                Redação com Correção Detalhada
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                    <Trophy className="w-3 h-3 text-green-400" />
                                </div>
                                <span className="text-green-400 font-bold">Desafios com Premiação em Dinheiro</span>
                            </li>
                            <li className="flex items-center gap-2 text-white">
                                <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center flex-shrink-0">
                                    <LayoutDashboard className="w-3 h-3 text-violet-400" />
                                </div>
                                Dashboard de Desempenho Completo
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
    );
}
