"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { EssayResult } from "@/lib/essays";
import { EssayFeedbackDisplay } from "@/components/essay/EssayFeedbackDisplay";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EssayDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [essay, setEssay] = useState<EssayResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEssay = async () => {
            if (!supabase || !params.id) return;

            const { data, error } = await supabase
                .from('essays')
                .select('*')
                .eq('id', params.id)
                .single();

            if (data && !error) {
                setEssay(data as EssayResult);
            }
            setLoading(false);
        };

        fetchEssay();
    }, [params.id]);

    const handleRedo = () => {
        if (!essay) return;
        // Redirect to main writing page with query params
        const query = new URLSearchParams({
            theme: essay.theme,
            support_text: essay.support_text || '' // Only works if saved
        }).toString();
        router.push(`/redacao?${query}`);
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!essay) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-400 mb-4">Redação não encontrada.</p>
                <Link href="/redacao/history">
                    <Button variant="outline">Voltar ao Histórico</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <Link href="/redacao/history">
                    <Button variant="ghost" className="pl-0 text-slate-400 hover:text-white mb-4">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Voltar ao Histórico
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-white mb-2">
                    Detalhes da Correção
                </h1>
                <p className="text-slate-400 text-sm">
                    Realizada em {new Date(essay.created_at || "").toLocaleDateString()}
                </p>
            </header>

            <EssayFeedbackDisplay
                result={essay}
                readOnly={true}
                onRedo={handleRedo}
            />
        </div>
    );
}
