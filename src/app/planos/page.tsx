"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PricingSection } from "@/components/PricingSection";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PlanosPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUser(user);
                }
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <header className="p-4 border-b border-slate-800 flex items-center justify-between">
                <Link href="/dashboard">
                    <Button variant="ghost" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Dashboard
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Passa Enem</span>
                </div>
            </header>
            <main>
                <PricingSection user={user} />
            </main>
        </div>
    );
}
