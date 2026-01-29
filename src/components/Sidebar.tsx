"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Briefcase, History, Settings, Trophy, Banknote, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gerador ENEM", href: "/generator/enem", icon: GraduationCap },
    { name: "Gerador Concursos", href: "/generator/concurso", icon: Briefcase },
    { name: "Minhas Provas", href: "/history", icon: History },
    { name: "Desafios", href: "/challenges", icon: Trophy },
];

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogIn, LogOut, User, Crown, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { FREE_PLAN_LIMIT, PRO_PLAN_LIMIT, checkAndResetCredits } from "@/lib/credits";

export function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    const [userCredits, setUserCredits] = useState<{ credits: number, plan: string }>({ credits: 0, plan: 'free' });

    useEffect(() => {
        const checkUser = async () => {
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    await checkAndResetCredits(user.id);
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('credits, plan_type')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        setUserCredits({
                            credits: profile.credits,
                            plan: profile.plan_type || 'free'
                        });
                    }
                }
            }
        };
        checkUser();

        let channel: any = null;

        if (supabase) {
            // Subscribe to changes in profiles
            channel = supabase
                .channel('db-changes')
                // @ts-ignore
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles' },
                    (payload: any) => {
                        if (user && payload.new.id === user.id) {
                            setUserCredits({
                                credits: payload.new.credits,
                                plan: payload.new.plan_type || 'free'
                            });
                        }
                    }
                )
                .subscribe();
        }

        return () => {
            if (supabase && channel) {
                supabase.removeChannel(channel);
            }
        }
    }, [user?.id]);

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
            setUser(null);
            window.location.href = "/";
        }
    };

    return (
        <div className="hidden md:flex h-screen w-64 flex-col justify-between border-r bg-card p-4">
            <div>
                <div className="mb-8 flex items-center px-2">
                    <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-green-500 text-primary-foreground">
                        <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-green-400">
                        Passa Enem
                    </span>
                </div>
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                {item.name}
                            </Link>
                        );
                    })}
                    {user && user.id === ADMIN_ID && (
                        <Link
                            href="/admin/create-challenge"
                            className={cn(
                                "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                pathname === "/admin/create-challenge"
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Settings className={cn("mr-3 h-5 w-5", pathname === "/admin/create-challenge" ? "text-primary" : "text-muted-foreground")} />
                            Criar Desafio (Admin)
                        </Link>
                    )}
                    {user && user.id === ADMIN_ID && (
                        <Link
                            href="/admin/rewards"
                            className={cn(
                                "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                pathname === "/admin/rewards"
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Banknote className={cn("mr-3 h-5 w-5", pathname === "/admin/rewards" ? "text-primary" : "text-muted-foreground")} />
                            Premiações (Admin)
                        </Link>
                    )}
                    {user && user.id === ADMIN_ID && (
                        <Link
                            href="/admin/subscriptions"
                            className={cn(
                                "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                pathname === "/admin/subscriptions"
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <CreditCard className={cn("mr-3 h-5 w-5", pathname === "/admin/subscriptions" ? "text-primary" : "text-muted-foreground")} />
                            Assinaturas (Admin)
                        </Link>
                    )}
                </nav>
            </div>
            <div className="px-2 pb-4 space-y-4">
                {user ? (
                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-medium truncate">{user.email}</p>
                            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center mt-1">
                                <LogOut className="w-3 h-3 mr-1" /> Sair
                            </button>
                        </div>
                    </div>
                ) : (
                    <Link href="/login">
                        <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                            <LogIn className="w-4 h-4 mr-2" />
                            Entrar
                        </Button>
                    </Link>
                )}

                <div className="rounded-lg bg-muted/50 p-4 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            {userCredits.plan === 'pro' ? (
                                <Crown className="w-4 h-4 text-yellow-500" />
                            ) : (
                                <User className="w-4 h-4 text-slate-400" />
                            )}
                            {userCredits.plan === 'pro' ? 'Plano PRO' : 'Plano Grátis'}
                        </h4>
                        {userCredits.plan === 'free' && (
                            <button onClick={() => window.location.href = '/planos'} className="text-[10px] text-green-400 hover:text-green-300 font-bold uppercase tracking-wider bg-transparent border-0 p-0 cursor-pointer">
                                Upgrade
                            </button>
                        )}
                    </div>

                    <div className="mt-2 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                userCredits.credits === 0 ? "bg-red-500" :
                                    userCredits.plan === 'pro' ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : "bg-gradient-to-r from-violet-500 to-violet-700"
                            )}
                            style={{ width: `${Math.min(100, (userCredits.credits / (userCredits.plan === 'pro' ? PRO_PLAN_LIMIT : FREE_PLAN_LIMIT)) * 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            CRÉDITOS
                        </p>
                        <p className="text-xs font-mono font-bold text-white">
                            {userCredits.credits}/{userCredits.plan === 'pro' ? PRO_PLAN_LIMIT : FREE_PLAN_LIMIT}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
