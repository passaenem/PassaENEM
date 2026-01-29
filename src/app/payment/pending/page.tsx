'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentPending() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to dashboard after 5 seconds
        const timer = setTimeout(() => {
            router.push('/dashboard');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Pagamento Pendente ⏳</h1>
                <p className="text-slate-400 mb-4">
                    Seu pagamento está sendo processado. Você receberá uma confirmação em breve.
                </p>
                <p className="text-sm text-slate-500">
                    Redirecionando para o dashboard em 5 segundos...
                </p>
            </div>
        </div>
    );
}
