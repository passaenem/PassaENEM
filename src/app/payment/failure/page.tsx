'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentFailure() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Pagamento Não Aprovado</h1>
                <p className="text-slate-400 mb-6">
                    Houve um problema ao processar seu pagamento. Por favor, tente novamente.
                </p>
                <Link
                    href="/#pricing"
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                    Tentar Novamente
                </Link>
            </div>
        </div>
    );
}
