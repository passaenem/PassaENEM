"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminStatsGrid } from "@/components/admin/AdminStatsGrid";
import { AIUsageSection } from "@/components/admin/AIUsageSection";
import { ChallengesSection } from "@/components/admin/ChallengesSection";
import { FinancialSection } from "@/components/admin/FinancialSection";
import { AlertsSection } from "@/components/admin/AlertsSection";

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.id !== ADMIN_ID) {
                router.push("/dashboard");
                return;
            }
            await fetchData();
        };
        init();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        if (supabase) {
            try {
                // 1. Fetch Core Data
                const { data: profiles } = await supabase.from('profiles').select('*');
                const { data: payments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
                const { data: exams } = await supabase.from('exam_results').select('*');
                const { data: challenges } = await supabase.from('challenges').select('*'); // If exists
                const { data: motivations } = await supabase.from('daily_motivations').select('id');

                // 2. Calculate Stats

                // Users
                const totalUsers = profiles?.length || 0;
                const activeUsers = profiles?.filter(p => new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0; // Proxy for active: created recently or Updated recently
                const subscribers = profiles?.filter(p => p.plan_type === 'pro').length || 0;
                const freeUsers = totalUsers - subscribers;

                // Finance
                const revenue = payments?.filter(p => p.status === 'approved' && p.created_at > new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
                const totalRevenue = payments?.filter(p => p.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

                // AI Usage
                // Assuming exams have 'questions' array. Use correct column 'questions_json'
                const totalQuestions = exams?.reduce((acc, curr) => acc + (curr.questions_json?.length || 0), 0) || 0;
                const totalMotivations = motivations?.length || 0;

                // Total requests = Questions generated + Daily Motivations
                // Note: Each question is 1 generation, each motivation is 1 generation.
                const totalAIRequests = totalQuestions + totalMotivations;

                // Calculate Today Generated (Exams)
                const todayV = new Date();
                todayV.setHours(0, 0, 0, 0);
                const todayGenerated = exams?.filter(e => new Date(e.created_at) >= todayV).length || 0;

                const creditsConsumed = totalAIRequests;
                const aiCost = totalAIRequests * 0.0005; // Estimate $0.0005 per request

                // 3. Process Charts Data

                // Monthly Revenue for Chart
                const revenueMap = new Map();
                payments?.filter(p => p.status === 'approved').forEach(p => {
                    const month = new Date(p.created_at).toLocaleString('default', { month: 'short' });
                    revenueMap.set(month, (revenueMap.get(month) || 0) + p.amount);
                });
                const monthlyRevenueData = Array.from(revenueMap.entries()).map(([name, value]) => ({ name, value })).reverse().slice(0, 6).reverse();

                // AI Usage Type (Mocked mostly if no type field, but we can try)
                const usageByType = [
                    { name: 'ENEM', value: exams?.length ? Math.floor(exams.length * 0.7) : 0 },
                    { name: 'Concursos', value: exams?.length ? Math.floor(exams.length * 0.3) : 0 },
                ];

                // Top Users
                // We need to count by user_id
                const userUsageMap = new Map();
                exams?.forEach(e => {
                    userUsageMap.set(e.user_id, (userUsageMap.get(e.user_id) || 0) + (e.questions_json?.length || 0));
                });
                const topUsers = Array.from(userUsageMap.entries())
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([id, count]) => {
                        const user = profiles?.find(p => p.id === id);
                        return { ...user, credits_consumed: count };
                    });

                // Challenges Ranking (Mocking scoring for global ranking)
                // Let's take exams with highest scores
                const rank = exams?.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10).map(e => ({
                    name: profiles?.find(p => p.id === e.user_id)?.full_name || 'Aluno',
                    score: e.score || 0
                })) || [];

                setDashboardData({
                    stats: {
                        totalUsers, activeUsers, subscribers, freeUsers, revenue, totalRevenue, creditsConsumed, aiCost
                    },
                    financial: {
                        recentTransactions: payments?.slice(0, 5) || [],
                        monthlyRevenueData,
                        metrics: { activeSubs: subscribers, newSubsMonth: 5, churnRate: 2.1 } // Mocked derived metrics
                    },
                    ai: {
                        usageByType,
                        topUsers,
                        metrics: { totalGenerated: totalAIRequests, todayGenerated: todayGenerated, avgPerUser: Math.round(totalAIRequests / (totalUsers || 1)) }
                    },
                    challenges: {
                        activeChallenges: challenges?.length || 0,
                        finishedToday: 12, // Mock
                        pendingRewards: 2, // Mock
                        rank
                    },
                    alerts: {
                        usersZeroCredits: profiles?.filter(p => (p.credits || 0) <= 0).length || 0,
                        recentErrors: 0,
                        failedPayments: payments?.filter(p => p.status === 'rejected' && new Date(p.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length || 0
                    }
                });

            } catch (error) {
                console.error("Dashboard Load Error", error);
            }
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mr-2" />
            Carregando Inteligência...
        </div>
    );

    if (!dashboardData) return null;

    return (
        <div className="min-h-screen bg-slate-950 p-6 space-y-8 animate-fade-in pb-20">
            <AdminHeader />

            <AdminStatsGrid stats={dashboardData.stats} />

            <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-300 pl-1">Inteligência & Consumo</h2>
                <AIUsageSection data={dashboardData.ai} />
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-300 pl-1">Financeiro & Assinaturas</h2>
                <FinancialSection data={dashboardData.financial} />
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-300 pl-1">Desafios & Ranking</h2>
                <ChallengesSection data={dashboardData.challenges} />
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-300 pl-1">Alertas do Sistema</h2>
                <AlertsSection data={dashboardData.alerts} />
            </div>
        </div>
    );
}
