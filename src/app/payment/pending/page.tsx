'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

function PaymentPendingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Aguardando confirmação do banco...');
    const [loading, setLoading] = useState(false);

    // Auto-check on mount
    useEffect(() => {
        handleCheckStatus();
    }, []);

    const handleCheckStatus = async () => {
        const paymentId = searchParams.get('payment_id');
        const userId = searchParams.get('external_reference');

        if (!paymentId || !userId) return;

        setLoading(true);
        setStatus('Verificando status...');

        try {
            // Attempt to sync/activate
            const res = await fetch('/api/checkout/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, userId })
            });

            const data = await res.json();

            if (data.success) {
                setStatus('Pagamento confirmado! 🚀');
                setTimeout(() => router.push('/dashboard'), 1500);
            } else {
                setStatus('Pagamento ainda em processamento pelo banco.');
            }
        } catch (error) {
            console.error(error);
            setStatus('Erro ao verificar. Tente novamente.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Processando Pagamento</h1>
                <p className="text-slate-400 mb-6">
                    {status}
                </p>

                <p className="text-xs text-slate-500 mb-6">
                    Pagamentos via PIX podem levar alguns instantes. <br />
                    Se já realizou o pagamento, clique abaixo.
                </p>

                <div className="space-y-3">
                    <Button
                        onClick={handleCheckStatus}
                        disabled={loading}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Verificar Novamente
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="w-full text-slate-500 hover:text-white"
                    >
                        Ir para o Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPending() {
    return (
        <Suspense fallback={<div className="text-white text-center p-10">Carregando...</div>}>
            <PaymentPendingContent />
        </Suspense>
    );
}
