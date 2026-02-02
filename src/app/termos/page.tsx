import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermosPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 p-6 md:p-12 font-sans">
            <div className="max-w-3xl mx-auto space-y-6">
                <Link href="/" className="inline-flex items-center text-violet-400 hover:text-violet-300 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para o início
                </Link>
                <h1 className="text-3xl font-bold text-white mb-8">Termos de Uso</h1>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">1. Aceitação dos Termos</h2>
                    <p>
                        Ao acessar e usar o Passa Enem, você aceita e concorda em estar vinculado aos termos e disposições deste contrato.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">2. Descrição do Serviço</h2>
                    <p>
                        O Passa Enem é uma plataforma educacional que utiliza Inteligência Artificial para gerar simulados, corrigir redações e auxiliar no estudo para o ENEM e concursos públicos.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">3. Planos e Pagamentos</h2>
                    <p>
                        Oferecemos planos gratuitos e pagos. Os pagamentos são processados via Mercado Pago. O cancelamento da assinatura recorrente pode ser solicitado a qualquer momento pelo usuário, evitando a renovação para o ciclo seguinte.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">4. Uso Aceitável</h2>
                    <p>
                        Você concorda em não usar o serviço para qualquer finalidade ilegal ou proibida por estes termos. O compartilhamento de contas é estritamente proibido.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">5. Propriedade Intelectual</h2>
                    <p>
                        Todo o conteúdo gerado pela plataforma e sua interface são protegidos por direitos autorais.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">6. Isenção de Responsabilidade</h2>
                    <p>
                        Apesar de utilizarmos IA avançada, não garantimos 100% de precisão em todas as correções ou gabaritos. O uso da ferramenta serve como apoio aos estudos.
                    </p>
                </section>

                <div className="pt-8 border-t border-slate-800">
                    <p className="text-sm text-slate-500">Última atualização: Fevereiro de 2026</p>
                </div>
            </div>
        </div>
    );
}
