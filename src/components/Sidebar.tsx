"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Briefcase, History, Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Gerador ENEM", href: "/generator/enem", icon: GraduationCap },
    { name: "Gerador Concursos", href: "/generator/concurso", icon: Briefcase },
    { name: "Minhas Provas", href: "/history", icon: History },
    { name: "Desafios", href: "/challenges", icon: Trophy },
    { name: "Criar Desafio (Admin)", href: "/admin/create-challenge", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex h-screen w-64 flex-col justify-between border-r bg-card p-4">
            <div>
                <div className="mb-8 flex items-center px-2">
                    <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <span className="font-bold">AI</span>
                    </div>
                    <span className="text-lg font-bold">Questões PRO</span>
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
                </nav>
            </div>
            <div className="px-2 pb-4">
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
