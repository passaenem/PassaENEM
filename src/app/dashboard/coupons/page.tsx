"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function CouponsPage() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const router = useRouter();

    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            // Need a new route for history or reuse existing?
            // Let's assume we can fetch usages. 
            // Better to create a server action or API. 
            // For now, let's just fetch from a new endpoint or the user's usages.
            // Wait, we don't have an endpoint for user Coupon History yet.
            // I'll create one.

            // Actually, we can just use the supabase client here if it's a client component, 
            // BUT we need `createClientComponentClient` for that.
            // Let's stick to an API route for consistency or use the server action pattern if established.
            // The project uses API routes. I'll add GET to `/api/coupons/redeem` (or similar) to fetch history.

            const res = await fetch("/api/coupons/history");
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Failed to fetch history");
        }
    };

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/coupons/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro ao resgatar cupom");
            }

            setResult({ type: 'success', message: data.message });
            setCode("");

            // Update history
            fetchHistory();

            // Force credit update in Sidebar (broadcast event?)
            // Router refresh re-runs server components, but Sidebar is Client Component using Supabase subscription.
            // The subscription should catch it. If not, maybe the trigger isn't firing on the right table/column?
            router.refresh();

            // Dispatch custom event to force sidebar update if subscription is slow
            window.dispatchEvent(new Event('credits-updated'));

        } catch (error: any) {
            setResult({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Ticket className="h-8 w-8 text-violet-500" />
                Meus Cupons
            </h1>
            <p className="text-slate-400">Resgate cupons promocionais para ganhar créditos extras.</p>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Resgatar Novo Cupom</CardTitle>
                        <CardDescription>Insira o código do seu cupom abaixo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRedeem} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ex: PROMO15"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-white uppercase"
                                />
                                <Button
                                    type="submit"
                                    disabled={loading || !code.trim()}
                                    className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px]"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resgatar"}
                                </Button>
                            </div>

                            {result && (
                                <Alert variant={result.type === 'error' ? "destructive" : "default"} className={`border ${result.type === 'success' ? 'border-green-900 bg-green-950/20 text-green-400' : 'border-red-900 bg-red-950/20 text-red-400'}`}>
                                    {result.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    <AlertTitle>{result.type === 'success' ? "Sucesso!" : "Erro"}</AlertTitle>
                                    <AlertDescription>
                                        {result.message}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Histórico de Cupons</CardTitle>
                        <CardDescription>Veja seus cupons resgatados.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 min-h-[150px]">
                        {history.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-slate-500 text-sm">Nenhum cupom utilizado recentemente.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {history.map((usage: any) => (
                                    <li key={usage.id} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-bold text-white text-sm">{usage.coupon.code}</p>
                                            <p className="text-xs text-slate-500">{new Date(usage.redeemed_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-green-400 font-bold text-sm">
                                            +{usage.coupon.credits} créditos
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
