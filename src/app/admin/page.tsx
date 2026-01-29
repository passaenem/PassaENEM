"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, PlusCircle, Users, Crown, CreditCard, ShieldAlert, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


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
    const [stats, setStats] = useState({ totalUsers: 0, totalPro: 0, activeSubs: 0 });
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
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profiles) {
                setUsers(profiles);
                setFilteredUsers(profiles);

                // Calculate Stats
                const total = profiles.length;
                const pro = profiles.filter(p => p.plan_type === 'pro').length;
                setStats({ totalUsers: total, totalPro: pro, activeSubs: pro }); // Approx
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
                    <p className="text-slate-400">Visão geral e gestão de usuários.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {/* Placeholder for Revenue or other stat */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Sistema</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">Online</div>
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
                                            ) : user.plan_type === 'admin' ? (
                                                <Badge className="bg-red-500/10 text-red-400 border-red-500/50">ADMIN</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-800 text-slate-400">Free</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${user.credits < 20 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {user.credits}
                                                </span>
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
