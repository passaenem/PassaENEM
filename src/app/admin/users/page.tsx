"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Ensure Dialog exists or use inline
import { Loader2, Search, PlusCircle, User, Zap, ShieldAlert, ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

export default function AdminUsersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Add Credits Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [creditAmount, setCreditAmount] = useState("");
    const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.id !== ADMIN_ID) {
                router.push("/dashboard");
                return;
            }
            await fetchUsers();
        };
        init();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        if (supabase) {
            // Fetch profiles
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setUsers(data);
        }
        setLoading(false);
    };

    const handleAddCredits = async () => {
        if (!selectedUser || !creditAmount || isNaN(Number(creditAmount))) return;

        try {
            const amount = parseInt(creditAmount);

            // SECURITY: Call API instead of direct DB update
            const response = await fetch('/api/admin/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserId: selectedUser.id,
                    amount: amount,
                    adminUserId: ADMIN_ID
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error);

            alert(`Sucesso! Créditos atualizados.`);

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id ? { ...u, credits: result.newCredits } : u
            ));

            setIsAddCreditsOpen(false);
            setCreditAmount("");
            setSelectedUser(null);

        } catch (error: any) {
            alert("Erro ao alterar créditos: " + error.message);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (user.phone?.includes(searchQuery))
    );

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mr-2" />
            Carregando Usuários...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-2 text-slate-400 hover:text-white pl-0">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <UsersIcon className="w-8 h-8 text-blue-500" /> Gestão de Usuários
                    </h1>
                    <p className="text-slate-400">Total de {users.length} usuários cadastrados</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Buscar por nome, email ou telefone..."
                        className="pl-9 bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-900/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900">
                        <TableRow>
                            <TableHead className="text-slate-400">Usuário</TableHead>
                            <TableHead className="text-slate-400">Plano</TableHead>
                            <TableHead className="text-slate-400">Créditos</TableHead>
                            <TableHead className="text-slate-400">WhatsApp</TableHead>
                            <TableHead className="text-slate-400">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white">{user.full_name || 'Sem nome'}</span>
                                        <span className="text-xs text-slate-500">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.plan_type === 'pro' ? 'default' : 'secondary'} className={user.plan_type === 'pro' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}>
                                        {user.plan_type === 'pro' ? 'PRO' : 'Free'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-slate-300">
                                        <Zap className="w-3 h-3 text-violet-400" />
                                        {user.credits}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {user.phone ? (
                                        <span className="text-sm text-green-400 font-mono">{user.phone}</span>
                                    ) : (
                                        <span className="text-xs text-slate-600 italic">Não informado</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 h-8 font-bold"
                                        onClick={() => { setSelectedUser(user); setIsAddCreditsOpen(true); }}
                                    >
                                        <PlusCircle className="w-3 h-3 mr-1" /> Add Créditos
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* ADD CREDITS DIALOG */}
            {isAddCreditsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-6 animate-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-white mb-2">Gerenciar Créditos</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Usuário: <span className="text-white font-bold">{selectedUser?.full_name || selectedUser?.email}</span>
                            <br />
                            Saldo Atual: <span className="text-violet-400 font-bold">{selectedUser?.credits}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Quantidade (+ ou -)</label>
                                <p className="text-[10px] text-slate-500 mb-1">Use números negativos para remover (ex: -10).</p>
                                <Input
                                    type="number"
                                    placeholder="Ex: 50 ou -10"
                                    className="bg-black/50 border-slate-700 text-white mt-1"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" onClick={() => setIsAddCreditsOpen(false)} className="text-slate-400">Cancelar</Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleAddCredits}>
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
