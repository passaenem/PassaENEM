"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Briefcase, History, Settings, Trophy, Menu, X, LogIn, LogOut, ShieldAlert, Users, CreditCard, MessageSquareHeart, Calendar, PenTool } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FREE_PLAN_LIMIT, PRO_PLAN_LIMIT, checkAndResetCredits } from "@/lib/credits";
import { User, Crown, Zap } from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gerador ENEM", href: "/generator/enem", icon: GraduationCap },
    { name: "Gerador Concursos", href: "/generator/concurso", icon: Briefcase },
    { name: "Cronograma", href: "/cronograma", icon: Calendar },
    { name: "Minhas Provas", href: "/history", icon: History },
    { name: "Desafios", href: "/challenges", icon: Trophy },
    { name: "Redação", href: "/redacao", icon: PenTool },
    { name: "Minhas Redações", href: "/redacao/history", icon: History },
    { name: "Mural de Feedbacks", href: "/feedbacks", icon: MessageSquareHeart },
    { name: "Configurações", href: "/configuracoes", icon: Settings },
];

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

export function MobileNav() {
    const [open, setOpen] = useState(false);
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
            channel = supabase
                .channel('db-changes-mobile')
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
            window.location.reload();
        }
    };

    return (
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-green-500 text-primary-foreground">
                    <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
                </div>
                <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-green-400">Passa Enem</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Mobile Drawer */}
            {open && (
                <div className="fixed inset-0 top-[65px] z-50 bg-background/95 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-5 overflow-y-auto max-h-[calc(100vh-65px)]">
                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors",
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
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                    pathname === "/admin/create-challenge"
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Settings className={cn("mr-3 h-5 w-5", pathname === "/admin/create-challenge" ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn(pathname === "/admin/create-challenge" ? "text-primary" : "text-muted-foreground")}>Criar Desafio (Admin)</span>
                            </Link>
                        )}
                        {user && user.id === ADMIN_ID && (
                            <Link
                                href="/admin/challenges-management"
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                    pathname === "/admin/challenges-management"
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Trophy className={cn("mr-3 h-5 w-5", pathname === "/admin/challenges-management" ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn(pathname === "/admin/challenges-management" ? "text-primary" : "text-muted-foreground")}>Gestão Desafio</span>
                            </Link>
                        )}
                        {user && user.id === ADMIN_ID && (
                            <>
                                <Link
                                    href="/admin"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                        pathname === "/admin"
                                            ? "bg-red-500/10 text-red-500"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <ShieldAlert className={cn("mr-3 h-5 w-5", pathname === "/admin" ? "text-red-500" : "text-muted-foreground")} />
                                    Admin Console
                                </Link>
                                <Link
                                    href="/admin/users"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                        pathname === "/admin/users"
                                            ? "bg-blue-500/10 text-blue-500"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Users className={cn("mr-3 h-5 w-5", pathname === "/admin/users" ? "text-blue-500" : "text-muted-foreground")} />
                                    Gestão de Usuários
                                </Link>
                                <Link
                                    href="/admin/subscriptions"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                        pathname === "/admin/subscriptions"
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <CreditCard className={cn("mr-3 h-5 w-5", pathname === "/admin/subscriptions" ? "text-primary" : "text-muted-foreground")} />
                                    Assinaturas
                                </Link>
                            </>
                        )}
                        <div className="pt-4 border-t border-slate-800 mt-4 space-y-4">
                            {user && (
                                <div className="rounded-lg bg-muted/50 p-4 border border-slate-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold flex items-center gap-2">
                                            {user?.id === ADMIN_ID ? (
                                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                            ) : userCredits.plan === 'pro' ? (
                                                <Crown className="w-4 h-4 text-yellow-500" />
                                            ) : (
                                                <User className="w-4 h-4 text-slate-400" />
                                            )}
                                            {user?.id === ADMIN_ID ? 'Admin Master' : userCredits.plan === 'pro' ? 'Plano PRO' : 'Plano Grátis'}
                                        </h4>
                                        {userCredits.plan === 'free' && user?.id !== ADMIN_ID && (
                                            <button onClick={() => { setOpen(false); window.location.href = '/planos'; }} className="text-[10px] text-green-400 hover:text-green-300 font-bold uppercase tracking-wider bg-transparent border-0 p-0 cursor-pointer">
                                                Upgrade
                                            </button>
                                        )}
                                    </div>

                                    {user?.id === ADMIN_ID ? (
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-yellow-500" />
                                                CRÉDITOS
                                            </p>
                                            <p className="text-xs font-mono font-bold text-white tracking-widest">
                                                ∞ ILIMITADO
                                            </p>
                                        </div>
                                    ) : (
                                        <>
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
                                                    {/* Display only current credits */}
                                                    {userCredits.credits}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            {user ? (
                                <div className="flex items-center justify-between px-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-bold">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-slate-400 truncate max-w-[150px]">{user.email}</span>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 text-red-400" onClick={handleLogout}>
                                        <LogOut className="w-4 h-4 mr-2" /> Sair
                                    </Button>
                                </div>
                            ) : (
                                <Link href="/login" onClick={() => setOpen(false)}>
                                    <Button className="w-full bg-violet-600 hover:bg-violet-700">
                                        <LogIn className="w-4 h-4 mr-2" /> Entrar
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            )
            }
        </div >
    );
}
