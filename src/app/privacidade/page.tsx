import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacidadePage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto space-y-6">
                <Link href="/" className="inline-flex items-center text-violet-400 hover:text-violet-300 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para o início
                </Link>
                <h1 className="text-3xl font-bold text-white mb-8">Política de Privacidade</h1>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">1. Coleta de Dados</h2>
                    <p>
                        Coletamos informações como nome, e-mail e dados de uso da plataforma (histórico de simulados e redações) para personalizar sua experiência e melhorar nosso serviço.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">2. Uso das Informações</h2>
                    <p>
                        Seus dados são utilizados para: permitir o acesso à sua conta, processar pagamentos, gerar estatísticas de desempenho e comunicar novidades sobre a plataforma.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">3. Compartilhamento de Dados</h2>
                    <p>
                        Não vendemos seus dados pessoais. Compartilhamos informações apenas com parceiros essenciais para a operação (ex: processadores de pagamento como Mercado Pago) ou quando exigido por lei.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">4. Segurança</h2>
                    <p>
                        Adotamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">5. Seus Direitos</h2>
                    <p>
                        Você tem o direito de solicitar o acesso, correção ou exclusão de seus dados pessoais a qualquer momento, entrando em contato com nosso suporte.
                    </p>
                </section>

                <div className="pt-8 border-t border-slate-800">
                    <p className="text-sm text-slate-500">Última atualização: Fevereiro de 2026</p>
                </div>
            </div>
        </div>
    );
}
