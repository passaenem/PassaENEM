"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, MessageSquare } from "lucide-react";

export default function AdminRewardsPage() {
    const [rewards, setRewards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRewards = async () => {
        setLoading(true);
        if (supabase) {
            const { data, error } = await supabase
                .from('rewards')
                .select(`
                    *,
                    challenges (title),
                    profiles (plan_type)
                `)
                .order('created_at', { ascending: false });

            if (data) setRewards(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRewards();
    }, []);

    const handleMarkAsPaid = async (id: string) => {
        if (!confirm("Confirmar pagamento via Pix realizado?")) return;

        if (supabase) {
            const { error } = await supabase
                .from('rewards')
                .update({ status: 'paid' })
                .eq('id', id);

            if (!error) {
                alert("Status atualizado!");
                fetchRewards();
            } else {
                alert("Erro ao atualizar status");
            }
        }
    };

    const handleWhatsApp = (number: string, name: string) => {
        const cleanNum = number.replace(/\D/g, '');
        const message = `Olá ${name}, somos do PassaENEM! Entramos em contato para realizar o pagamento da sua premiação. Parabéns!`;
        window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`, '_blank');
    };

    // Group rewards by Challenge Title
    const groupedRewards = rewards.reduce((acc, reward) => {
        const title = reward.challenges?.title || "Desafio Desconhecido";
        if (!acc[title]) {
            acc[title] = [];
        }
        acc[title].push(reward);
        return acc;
    }, {} as Record<string, any[]>);

    if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Carregando premiações...</div>;

    return (
        <div className="container mx-auto p-4 space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <span className="text-green-400">$</span> Gerenciamento de Premiações
            </h1>

            <div className="space-y-8">
                {Object.keys(groupedRewards).length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800"><CardContent className="p-12 text-center text-muted-foreground">Nenhuma premiação pendente ou realizada encontrada.<br /><span className="text-sm mt-2 block">As premiações aparecem aqui automaticamente quando você finaliza um desafio.</span></CardContent></Card>
                ) : (
                    Object.entries(groupedRewards).map(([challengeTitle, challengeRewards]) => (
                        <div key={challengeTitle} className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-200 border-l-4 border-violet-500 pl-3">{challengeTitle}</h2>
                            <div className="grid gap-4">
                                {challengeRewards.map((reward) => (
                                    <Card key={reward.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                                        <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg text-white">{reward.user_name || "Usuário não identificado"}</h3>
                                                    <Badge variant={reward.profiles?.plan_type === 'pro' ? 'default' : 'secondary'}>
                                                        {reward.profiles?.plan_type === 'pro' ? 'PRO' : 'FREE'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-400 flex items-center gap-2">
                                                    <span className="text-yellow-400 font-bold flex items-center gap-1"><Trophy className="w-3 h-3" /> {reward.position}º Lugar</span>
                                                    <span className="text-slate-600">•</span>
                                                    <span className="text-xs text-slate-500">
                                                        Gerado em: {new Date(reward.created_at).toLocaleDateString()}
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                                                <div className="text-center md:text-right min-w-[100px]">
                                                    <p className="text-sm text-slate-400">Prêmio</p>
                                                    <p className="text-xl font-bold text-green-400">{reward.prize_amount}</p>
                                                </div>

                                                <div className="flex-1 md:flex-none flex justify-end w-full md:w-auto">
                                                    {reward.status === 'paid' ? (
                                                        <Badge className="bg-green-900/50 text-green-300 border-green-800 px-4 py-2 flex gap-2">
                                                            <CheckCircle className="w-4 h-4" /> PAGO
                                                        </Badge>
                                                    ) : (
                                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                                            {reward.status === 'unclaimed' ? (
                                                                <Badge variant="outline" className="text-yellow-500 border-yellow-500 bg-yellow-950/20 whitespace-nowrap">
                                                                    <AlertTriangle className="w-3 h-3 mr-1" /> Aguardando Contato
                                                                </Badge>
                                                            ) : (
                                                                <div className="flex flex-col md:flex-row gap-2 w-full">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="border-green-600 text-green-500 hover:bg-green-950"
                                                                        onClick={() => handleWhatsApp(reward.user_whatsapp, reward.user_name)}
                                                                    >
                                                                        <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleMarkAsPaid(reward.id)}
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                        Marcar Pago
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
