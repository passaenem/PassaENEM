'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Verificando pagamento...');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const syncPayment = async () => {
            const paymentId = searchParams.get('payment_id');
            const userId = searchParams.get('external_reference');
            const statusParam = searchParams.get('status');

            if (statusParam !== 'approved') {
                setStatus('Pagamento não aprovado.');
                setTimeout(() => router.push('/planos'), 3000);
                return;
            }

            if (paymentId && userId) {
                try {
                    setStatus('Sincronizando sua assinatura...');

                    const res = await fetch('/api/checkout/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentId, userId })
                    });

                    const data = await res.json();

                    if (data.success) {
                        setStatus('Pagamento confirmado! Ativando plano...');
                        setIsSuccess(true);
                        setTimeout(() => router.push('/dashboard'), 2000);
                    } else {
                        console.error("Sync failed:", data.error);
                        // If sync fails (e.g. already synced), we still assume success if params are there,
                        // but maybe it was already processed by webhook.
                        setStatus('Pagamento recebido! Redirecionando...');
                        setIsSuccess(true);
                        setTimeout(() => router.push('/dashboard'), 2000);
                    }
                } catch (err) {
                    console.error("Sync error:", err);
                    setStatus('Erro na sincronização. Verifique no dashboard.');
                    setTimeout(() => router.push('/dashboard'), 3000);
                }
            } else {
                // Fallback for missing params
                setStatus('Redirecionando...');
                setTimeout(() => router.push('/dashboard'), 3000);
            }
        };

        syncPayment();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md w-full text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                    {isSuccess ? (
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    {isSuccess ? 'Tudo Pronto! 🎉' : 'Processando...'}
                </h1>
                <p className="text-slate-400 mb-4">
                    {status}
                </p>
            </div>
        </div>
    );
}

export default function PaymentSuccess() {
    return (
        <Suspense fallback={<div className="text-white text-center p-10">Carregando...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
