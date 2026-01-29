"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Briefcase, History, Settings, Trophy } from "lucide-react";
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
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";

export function Sidebar() {
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

                <div className="rounded-lg bg-muted/50 p-4">
                    <h4 className="text-sm font-semibold">Créditos IA</h4>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div className="h-2 w-3/4 rounded-full bg-primary" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">75/100 utilizados</p>
                </div>
            </div>
        </div>
    );
}
