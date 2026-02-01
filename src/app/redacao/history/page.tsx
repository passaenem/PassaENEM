"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { EssayResult } from "@/lib/essays";
import { Loader2, Calendar, ChevronRight, PenTool } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
    const [essays, setEssays] = useState<EssayResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEssays = async () => {
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('essays')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setEssays(data as EssayResult[]);
            }
            setLoading(false);
        };

        fetchEssays();
    }, []);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Histórico de Redações
                            </h1>
                            <p className="text-slate-400">
                                Acompanhe sua evolução nota a nota.
                            </p>
                        </div>
                        <Link href="/redacao">
                            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                                <PenTool className="mr-2 h-4 w-4" />
                                Nova Redação
                            </Button>
                        </Link>
                    </header>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                    ) : essays.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                            <p className="text-slate-400 mb-4">Você ainda não enviou nenhuma redação.</p>
                            <Link href="/redacao">
                                <Button variant="outline">Começar agora</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {essays.map((essay) => (
                                <div key={essay.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-violet-500/50 transition-colors flex items-center justify-between group">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h3 className="font-semibold text-white truncate mb-1">{essay.theme}</h3>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(essay.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="truncate">
                                                {essay.content.substring(0, 50)}...
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className={`text-2xl font-bold ${essay.score_final >= 900 ? 'text-green-400' : essay.score_final >= 700 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {essay.score_final}
                                            </span>
                                            <span className="text-xs text-slate-500 block">pontos</span>
                                        </div>
                                        {/* Ideally link to detailed view: href={`/redacao/${essay.id}`} */}
                                        <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-white">
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
