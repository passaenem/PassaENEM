"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdminSubscriptionsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPayments = async () => {
        setLoading(true);
        if (supabase) {
            // First try to fetch payments with user profile data
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    profiles (email, full_name, plan_type)
                `)
                .order('created_at', { ascending: false });

            if (data) setPayments(data);
            if (error) console.error("Error fetching payments:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Aprovado</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejeitado</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Carregando pagamentos...</div>;

    return (
        <div className="container mx-auto p-4 space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
                <span className="text-violet-400">💎</span> Assinaturas & Pagamentos
            </h1>

            <div className="grid gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle>Histórico de Transações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">Nenhum pagamento registrado ainda.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800 hover:bg-slate-900/50">
                                        <TableHead className="text-slate-400">Data</TableHead>
                                        <TableHead className="text-slate-400">Usuário</TableHead>
                                        <TableHead className="text-slate-400">Email</TableHead>
                                        <TableHead className="text-slate-400">Tipo</TableHead>
                                        <TableHead className="text-slate-400">Valor</TableHead>
                                        <TableHead className="text-slate-400">Status</TableHead>
                                        <TableHead className="text-slate-400">ID Externo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id} className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell className="font-medium">
                                                {new Date(payment.created_at).toLocaleDateString()} <br />
                                                <span className="text-xs text-slate-500">{new Date(payment.created_at).toLocaleTimeString()}</span>
                                            </TableCell>
                                            <TableCell>{payment.profiles?.full_name || "N/A"}</TableCell>
                                            <TableCell>{payment.profiles?.email || "N/A"}</TableCell>
                                            <TableCell>
                                                {payment.type === 'subscription' ? (
                                                    <Badge variant="outline" className="border-violet-500 text-violet-400">Assinatura</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-blue-500 text-blue-400">Mensal</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-bold text-green-400">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                            <TableCell className="text-xs text-slate-500 font-mono">{payment.external_id}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
