"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Assuming these exist
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles, Target } from "lucide-react";

export function DailyMotivation() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkMotivation = async () => {
            // dynamic import to avoid potential SSR issues with auth
            const { supabase } = await import("@/lib/supabase");
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Use local date for consistency with user's perspective
            const today = new Date().toLocaleDateString('pt-BR');
            const storageKey = `motivation_seen_${user.id}`;
            const lastSeenDate = localStorage.getItem(storageKey);

            // If already seen today, do nothing
            if (lastSeenDate === today) {
                return;
            }

            // Fetch message
            setLoading(true);
            try {
                const res = await fetch('/api/motivation');
                if (res.ok) {
                    const data = await res.json();
                    if (data.message) {
                        setMessage(data.message);
                        setOpen(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch motivation", error);
            } finally {
                setLoading(false);
            }
        };

        // Small delay to ensure client side hydration and not block main thread
        const timer = setTimeout(() => {
            checkMotivation();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = async () => {
        const { supabase } = await import("@/lib/supabase");
        const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };

        // Save using Local Date and User ID
        if (user) {
            const today = new Date().toLocaleDateString('pt-BR');
            const storageKey = `motivation_seen_${user.id}`;
            localStorage.setItem(storageKey, today);
        }

        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white p-0 overflow-hidden gap-0">
                {/* Visual Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 flex justify-center">
                    <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm animate-pulse">
                        <Target className="w-10 h-10 text-white" />
                    </div>
                </div>

                <div className="p-8 text-center space-y-6">
                    <div>
                        <h2 className="text-xl font-bold mb-2 uppercase tracking-wide text-violet-400">
                            Motivação do Dia • {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </h2>
                        <p className="text-slate-300 text-lg font-medium leading-relaxed italic">
                            "{message}"
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-950/50 flex justify-center">
                    <Button
                        onClick={handleClose}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-12 text-md transition-all hover:scale-[1.02]"
                    >
                        Bora estudar 🚀
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
