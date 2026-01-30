"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function DebugPaymentPage() {
    const [paymentId, setPaymentId] = useState("");
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSync = async () => {
        if (!userId || !paymentId) {
            alert("Preencha Payment ID e User ID");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/checkout/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, userId })
            });

            const data = await res.json();
            setResult(data);

        } catch (error) {
            console.error("Sync Error:", error);
            setResult({ success: false, error: "Erro na requisição" });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 space-y-8 animate-fade-in pb-20">
            <AdminHeader />

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                        <AlertTriangle className="text-yellow-500" />
                        Reparo de Pagamentos
                    </h1>
                    <p className="text-slate-400">
                        Ferramenta de emergência para ativar planos manualmente quando o Webhook falha.
                    </p>
                </div>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle>Forçar Ativação (Sync)</CardTitle>
                        <CardDescription>
                            Insira o ID do pagamento do Mercado Pago e o ID do Usuário para ativar o plano.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Payment ID (Mercado Pago)</Label>
                            <Input
                                placeholder="Ex: 123456789 (Disponível no app do banco ou MP)"
                                value={paymentId}
                                onChange={(e) => setPaymentId(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">User ID (Supabase)</Label>
                            <Input
                                placeholder="UUID do usuário"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                            <p className="text-xs text-slate-500">
                                Dica: Copie o ID na tabela de usuários do Dashboard
                            </p>
                        </div>

                        <Button
                            onClick={handleSync}
                            disabled={loading}
                            className="w-full bg-violet-600 hover:bg-violet-700 font-bold"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Ativar Plano Agora"}
                        </Button>

                        {result && (
                            <div className={`p-4 rounded-lg mt-4 border ${result.success ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-red-500/10 border-red-500/50 text-red-400"}`}>
                                <div className="flex items-center gap-2 font-bold mb-1">
                                    {result.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    {result.success ? "Plan upgraded successfully!" : "Sync Failed"}
                                </div>
                                <pre className="text-xs opacity-80 whitespace-pre-wrap">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle>Diagnóstico do Sistema</CardTitle>
                        <CardDescription>Verifique se as configurações do servidor estão corretas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HealthCheck />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function HealthCheck() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/health');
            const data = await res.json();
            setHealth(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <Button onClick={checkHealth} disabled={loading} variant="outline" className="w-full border-slate-700 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verificar Configurações (Health Check)"}
            </Button>

            {health && (
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-slate-400">Supabase URL</span>
                        <span className={health.env.NEXT_PUBLIC_SUPABASE_URL ? "text-green-400 font-bold" : "text-red-500 font-bold"}>
                            {health.env.NEXT_PUBLIC_SUPABASE_URL ? "OK" : "MISSING"}
                        </span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-slate-400">Service Role Key (CRÍTICO)</span>
                        <span className={health.env.SUPABASE_SERVICE_ROLE_KEY ? "text-green-400 font-bold" : "text-red-500 font-bold"}>
                            {health.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING"}
                        </span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-slate-400">Mercado Pago Token</span>
                        <span className={health.env.MP_ACCESS_TOKEN ? "text-green-400 font-bold" : "text-red-500 font-bold"}>
                            {health.env.MP_ACCESS_TOKEN ? "OK" : "MISSING"}
                        </span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-slate-400">DB Connection</span>
                        <span className={health.db.connected ? "text-green-400 font-bold" : "text-red-500 font-bold"}>
                            {health.db.connected ? "OK" : "ERROR"}
                        </span>
                    </div>
                    {health.db.error && <p className="text-xs text-red-400 mt-1">{health.db.error}</p>}
                </div>
            )}
        </div>
    );
}
