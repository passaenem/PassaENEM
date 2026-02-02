"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, CreditCard, Shield, ExternalLink } from "lucide-react";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    setProfile(data);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!user) {
        return <div className="p-8 text-center">Você precisa estar logado.</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Configurações</h1>
                <p className="text-slate-400">Gerencie sua conta e assinatura.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Card */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-violet-400" />
                            Perfil
                        </CardTitle>
                        <CardDescription>Suas informações de acesso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                            <p className="text-slate-200 font-mono bg-slate-950 p-3 rounded-md border border-slate-800 mt-1">
                                {user.email}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">ID do Usuário</label>
                            <p className="text-slate-200 font-mono text-xs bg-slate-950 p-3 rounded-md border border-slate-800 mt-1 truncate">
                                {user.id}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription Card */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-green-400" />
                            Assinatura
                        </CardTitle>
                        <CardDescription>Status do seu plano atual</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <div>
                                <p className="text-sm text-slate-400">Plano Atual</p>
                                <p className="text-xl font-bold text-white capitalize">
                                    {profile?.plan_type === 'pro' ? 'Pro 👑' : 'Gratuito'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-400">Créditos</p>
                                <p className="text-xl font-bold text-violet-400">
                                    {profile?.credits || 0}
                                </p>
                            </div>
                        </div>

                        {profile?.plan_type === 'pro' ? (
                            <div className="space-y-4">
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-200">
                                    Sua assinatura está ativa. Para cancelar ou alterar dados de pagamento, entre em contato com o suporte ou gerencie pelo Mercado Pago.
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                                    onClick={() => window.open('mailto:passaenem12@gmail.com?subject=Gerenciar Assinatura')}
                                >
                                    Falar com Suporte
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400">Faça o upgrade para ter acesso ilimitado.</p>
                                <Button
                                    className="w-full bg-violet-600 hover:bg-violet-700 font-bold"
                                    onClick={() => window.location.href = '/planos'}
                                >
                                    Virar PRO Agora
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="pt-8 text-center text-xs text-slate-600">
                <p>Passa Enem © 2026 - v1.0.0</p>
            </div>
        </div>
    );
}
