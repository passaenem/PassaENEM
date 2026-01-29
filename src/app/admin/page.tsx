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
                // Assuming exams have 'questions' array. 
                const totalQuestions = exams?.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0) || 0;
                const creditsConsumed = totalQuestions; // 1 credit per question approx
                const aiCost = totalQuestions * 0.0005; // Estimate $0.0005 per request

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
                    userUsageMap.set(e.user_id, (userUsageMap.get(e.user_id) || 0) + (e.questions?.length || 0));
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
                        metrics: { totalGenerated: totalQuestions, todayGenerated: 124, avgPerUser: Math.round(totalQuestions / (totalUsers || 1)) }
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


const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    plan_type: string;
    credits: number;
    created_at: string;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, totalPro: 0, activeSubs: 0, revenue: 0, totalExams: 0 });
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    // Modal State
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [creditAmount, setCreditAmount] = useState<string>("50");
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();

            if (!user || user.id !== ADMIN_ID) {
                router.push("/dashboard");
                return;
            }
            setIsAdmin(true);
            fetchData();
        };
        checkAdmin();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        if (supabase) {
            // Fetch Profiles
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*');

            // Fetch Revenue (Payments)
            const { data: payments } = await supabase
                .from('payments')
                .select('amount, status');

            // Fetch Global Usage (Exams)
            // Use count to be efficient
            const { count: examsCount } = await supabase
                .from('exam_results')
                .select('*', { count: 'exact', head: true });

            if (profiles) {
                setUsers(profiles);
                setFilteredUsers(profiles);

                // Calculate User Stats
                const total = profiles.length;
                const pro = profiles.filter(p => p.plan_type === 'pro').length;

                // Calculate Revenue
                let revenue = 0;
                if (payments) {
                    revenue = payments
                        .filter(p => p.status === 'approved')
                        .reduce((acc, curr) => acc + (curr.amount || 0), 0);
                }

                setStats({
                    totalUsers: total,
                    totalPro: pro,
                    activeSubs: pro,
                    revenue: revenue,
                    totalExams: examsCount || 0
                });
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        const lower = searchQuery.toLowerCase();
        const filtered = users.filter(u =>
            (u.full_name?.toLowerCase().includes(lower)) ||
            (u.email?.toLowerCase().includes(lower))
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const handleAddCredits = async () => {
        if (!selectedUser || !creditAmount || isNaN(Number(creditAmount))) return;

        try {
            const amount = parseInt(creditAmount);
            const newTotal = (selectedUser.credits || 0) + amount;

            if (!supabase) {
                alert("Erro: Conexão com Supabase não inicializada.");
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({ credits: newTotal })
                .eq('id', selectedUser.id);

            if (error) throw error;

            // Update Local State
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, credits: newTotal } : u));
            setIsCreditModalOpen(false);
            setCreditAmount("50");
            setSelectedUser(null);
            alert(`Sucesso! ${amount} créditos adicionados para ${selectedUser.full_name}.`);

        } catch (error: any) {
            console.error("Error adding credits:", error);
            alert("Erro ao adicionar créditos: " + error.message);
        }
    };

    // ... (handleAddCredits remains same)

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mr-2" />
            Carregando Admin...
        </div>
    );

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-950 p-8 space-y-8 animate-fade-in text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-red-500" /> Painel Administrativo
                    </h1>
                    <p className="text-slate-400">Visão geral financeira e de usuários.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/admin/subscriptions')}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Ver Pagamentos
                    </Button>
                    <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                        Voltar ao App
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Usuários</CardTitle>
                        <Users className="h-4 w-4 text-violet-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Assinantes PRO</CardTitle>
                        <Crown className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.totalPro}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Faturamento</CardTitle>
                        <CreditCard className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Simulados Feitos</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">{stats.totalExams || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* User List */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Gerenciar Usuários</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Buscar nome ou email..."
                                className="pl-8 bg-slate-950 border-slate-700 text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-950">
                                <TableRow className="border-slate-800">
                                    <TableHead className="text-slate-400">Usuário</TableHead>
                                    <TableHead className="text-slate-400">Email</TableHead>
                                    <TableHead className="text-slate-400">Plano</TableHead>
                                    <TableHead className="text-slate-400">Créditos</TableHead>
                                    <TableHead className="text-right text-slate-400">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell className="font-medium text-white">
                                            {user.full_name || "Sem Nome"}
                                        </TableCell>
                                        <TableCell className="text-slate-300">{user.email}</TableCell>
                                        <TableCell>
                                            {user.plan_type === 'pro' ? (
                                                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/50">PRO</Badge>
                                            ) : user.id === ADMIN_ID || user.plan_type === 'admin' ? (
                                                <Badge className="bg-red-500/10 text-red-400 border-red-500/50">ADMIN</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-800 text-slate-400">Free</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.id === ADMIN_ID ? (
                                                    <span className="font-bold text-violet-400">Infinito (∞)</span>
                                                ) : (
                                                    <span className={`font-bold ${user.credits < 20 ? 'text-red-400' : 'text-green-400'}`}>
                                                        {user.credits}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="hover:bg-violet-900/20 hover:text-violet-400"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsCreditModalOpen(true);
                                                }}
                                            >
                                                <PlusCircle className="w-4 h-4 mr-2" />
                                                Add Créditos
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Credits Modal using Dialog */}
            <Dialog open={isCreditModalOpen} onOpenChange={setIsCreditModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Adicionar Créditos</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Enviar créditos extras para <b>{selectedUser?.full_name}</b>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm text-slate-400 mb-2 block">Quantidade</label>
                        <Input
                            type="number"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreditModalOpen(false)} className="border-slate-700">Cancelar</Button>
                        <Button onClick={handleAddCredits} className="bg-violet-600 hover:bg-violet-700">
                            Confirmar Envio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
