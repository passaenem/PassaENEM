"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Loader2, Plus, Copy, Check, Trash2, Edit2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Create Form State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newCredits, setNewCredits] = useState("15");
    const [newLimit, setNewLimit] = useState("");
    const [creating, setCreating] = useState(false);

    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [editCode, setEditCode] = useState("");
    const [editCredits, setEditCredits] = useState("");
    const [editLimit, setEditLimit] = useState("");

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao excluir");
            fetchCoupons();
        } catch (err) {
            alert("Erro ao excluir cupom");
        }
    };

    const openEdit = (coupon: any) => {
        setEditingCoupon(coupon);
        setEditCode(coupon.code);
        setEditCredits(coupon.credits.toString());
        setEditLimit(coupon.usage_limit?.toString() || "");
        setIsEditOpen(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingCoupon.id,
                    code: editCode,
                    credits: parseInt(editCredits),
                    usage_limit: editLimit ? parseInt(editLimit) : ""
                })
            });

            if (!res.ok) throw new Error("Erro ao editar");

            setIsEditOpen(false);
            fetchCoupons();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/coupons");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setCoupons(data);
        } catch (err) {
            setError("Erro ao carregar cupons");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: newCode,
                    credits: parseInt(newCredits),
                    usage_limit: newLimit ? parseInt(newLimit) : null
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao criar");
            }

            setIsCreateOpen(false);
            setNewCode("");
            setNewCredits("15");
            setNewLimit("");
            fetchCoupons();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(code);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6 text-white min-h-screen p-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Ticket className="h-8 w-8 text-violet-500" />
                        Gestão de Cupons
                    </h1>
                    <p className="text-slate-400">Crie e gerencie cupons de crédito para os usuários.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                            <Plus className="h-4 w-4" /> Novo Cupom
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Cupom</DialogTitle>
                            <DialogDescription>
                                Defina o código e a quantidade de créditos.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Código do Cupom</Label>
                                <Input
                                    id="code"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                    placeholder="Ex: WELCOME15"
                                    className="bg-slate-950 border-slate-700 uppercase"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="credits">Créditos</Label>
                                    <Input
                                        id="credits"
                                        type="number"
                                        value={newCredits}
                                        onChange={(e) => setNewCredits(e.target.value)}
                                        className="bg-slate-950 border-slate-700"
                                        required
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="limit">Limite de Uso (Global)</Label>
                                    <Input
                                        id="limit"
                                        type="number"
                                        value={newLimit}
                                        onChange={(e) => setNewLimit(e.target.value)}
                                        placeholder="Opcional"
                                        className="bg-slate-950 border-slate-700"
                                        min="1"
                                    />
                                    <p className="text-[10px] text-slate-500">Deixe vazio para ilimitado</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating} className="bg-violet-600 hover:bg-violet-700">
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Cupom"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-400">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Cupons Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                        </div>
                    ) : coupons.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">Nenhum cupom criado ainda.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Código</TableHead>
                                    <TableHead className="text-slate-400">Créditos</TableHead>
                                    <TableHead className="text-slate-400">Uso / Limite</TableHead>
                                    <TableHead className="text-slate-400">Status</TableHead>
                                    <TableHead className="text-slate-400 text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => (
                                    <TableRow key={coupon.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell className="font-mono font-bold text-white flex items-center gap-2">
                                            {coupon.code}
                                            <button
                                                onClick={() => copyCode(coupon.code)}
                                                className="text-slate-500 hover:text-white transition-colors"
                                            >
                                                {copiedId === coupon.code ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-green-400 font-bold">+{coupon.credits}</TableCell>
                                        <TableCell className="text-slate-300">
                                            {coupon.used_count} / {coupon.usage_limit || "∞"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={coupon.active ? "default" : "destructive"} className={coupon.active ? "bg-green-600 text-white" : "bg-red-900 text-red-200"}>
                                                {coupon.active ? "Ativo" : "Inativo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-blue-400"
                                                    onClick={() => openEdit(coupon)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-400"
                                                    onClick={() => handleDelete(coupon.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* EDIT DIALOG */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Editar Cupom</DialogTitle>
                    </DialogHeader>
                    {editingCoupon && (
                        <form onSubmit={handleEdit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-code">Código</Label>
                                <Input
                                    id="edit-code"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                    className="bg-slate-950 border-slate-700 uppercase"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-credits">Créditos</Label>
                                    <Input
                                        id="edit-credits"
                                        type="number"
                                        value={editCredits}
                                        onChange={(e) => setEditCredits(e.target.value)}
                                        className="bg-slate-950 border-slate-700"
                                        required
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-limit">Limite (Vazio = Infinito)</Label>
                                    <Input
                                        id="edit-limit"
                                        type="number"
                                        value={editLimit}
                                        onChange={(e) => setEditLimit(e.target.value)}
                                        placeholder="Opcional"
                                        className="bg-slate-950 border-slate-700"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700">
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

