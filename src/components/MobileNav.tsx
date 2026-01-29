"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Briefcase, History, Settings, Trophy, Menu, X, LogIn, LogOut, ShieldAlert, Users, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gerador ENEM", href: "/generator/enem", icon: GraduationCap },
    { name: "Gerador Concursos", href: "/generator/concurso", icon: Briefcase },
    { name: "Minhas Provas", href: "/history", icon: History },
    { name: "Desafios", href: "/challenges", icon: Trophy },
];

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            }
        };
        checkUser();
    }, []);

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
                <div className="fixed inset-0 top-[65px] z-50 bg-background/95 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-5">
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
                                Criar Desafio (Admin)
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
                        <div className="pt-4 border-t border-slate-800 mt-4">
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
