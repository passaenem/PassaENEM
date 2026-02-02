"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Feedback } from "@/lib/feedback";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Loader2, MessageSquareHeart } from "lucide-react";

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

export default function FeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchFeedbacks = async () => {
        setLoading(true);
        if (!supabase) {
            setLoading(false);
            return;
        }

        // 1. Fetch Feedbacks
        const { data: feedbackData, error } = await supabase
            .from('feedbacks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching feedbacks:", error);
            setLoading(false);
            return;
        }

        // 2. Extract User IDs to fetch Profiles
        const userIds = Array.from(new Set(feedbackData.map(f => f.user_id)));

        // 3. Fetch Profiles
        let profilesMap: Record<string, { full_name?: string, email?: string }> = {};
        if (userIds.length > 0) {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, email') // Assuming these columns exist based on task.md analysis
                .in('id', userIds);

            if (profilesData) {
                profilesData.forEach(p => {
                    profilesMap[p.id] = { full_name: p.full_name, email: p.email };
                });
            }
        }

        // 4. Merge Data
        const mergedFeedbacks: Feedback[] = feedbackData.map(f => ({
            ...f,
            user: profilesMap[f.user_id]
        }));

        setFeedbacks(mergedFeedbacks);
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            fetchFeedbacks();
        };
        init();
    }, []);

    const handleReply = async (id: string, response: string) => {
        if (!supabase || !currentUser || currentUser.id !== ADMIN_ID) return;

        const { error } = await supabase
            .from('feedbacks')
            .update({
                admin_response: response,
                response_at: new Date().toISOString()
            })
            .eq('id', id);

        if (!error) {
            fetchFeedbacks();
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-5">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <MessageSquareHeart className="w-8 h-8 text-pink-500" />
                        Mural de Feedbacks
                    </h1>
                    <p className="text-slate-400 mt-2 max-w-xl">
                        Veja o que nossos alunos estão dizendo sobre a plataforma.
                        Sua opinião é fundamental para evoluirmos juntos!
                    </p>
                </div>
                {currentUser && (
                    <FeedbackForm userId={currentUser.id} onSuccess={fetchFeedbacks} />
                )}
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {feedbacks.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                            <p className="text-slate-500">Nenhum feedback ainda. Seja o primeiro a avaliar!</p>
                        </div>
                    ) : (
                        feedbacks.map(feedback => (
                            <FeedbackCard
                                key={feedback.id}
                                feedback={feedback}
                                isAdmin={currentUser?.id === ADMIN_ID}
                                onReply={handleReply}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
