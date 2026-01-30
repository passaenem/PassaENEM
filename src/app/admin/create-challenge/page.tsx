"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Trophy, Users, AlertTriangle, Zap, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";



export default function CreateChallengePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [userCount, setUserCount] = useState<number | null>(null);
    const [aiRequestCount, setAiRequestCount] = useState<number | null>(null);
    const [dailyGenerators, setDailyGenerators] = useState<number | null>(null);
    const [activeChallenges, setActiveChallenges] = useState<any[]>([]); // New list for management
    const [editingId, setEditingId] = useState<string | null>(null); // Track editing state

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        area: "ENEM",
        difficulty: "Médio",
        questionsCount: 10,
        prize: "", // Optional
        endDate: "", // Replaces durationDays
        durationMinutes: "60"
    });

    useEffect(() => {
        // Check if we are in "Edit Mode" via sessionStorage
        const storedEdit = sessionStorage.getItem('challengeToEdit');
        if (storedEdit) {
            try {
                const challenge = JSON.parse(storedEdit);
                // Convert DB timestamp to input datetime-local format (YYYY-MM-DDTHH:mm)
                let formattedDate = "";
                if (challenge.end_date) {
                    const d = new Date(challenge.end_date);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    formattedDate = d.toISOString().slice(0, 16);
                }

                setFormData({
                    title: challenge.title,
                    description: challenge.description,
                    area: challenge.area,
                    difficulty: challenge.difficulty,
                    questionsCount: challenge.questions_count,
                    prize: challenge.prize || "",
                    endDate: formattedDate,
                    durationMinutes: challenge.duration_minutes || "60"
                });
                setEditingId(challenge.id);
                // Clear it so it doesn't persist on reload/navigation
                sessionStorage.removeItem('challengeToEdit');
            } catch (e) {
                console.error("Failed to parse edit data", e);
            }
        }
    }, []);

    // ... (loadData remains same)

    // ... (handleChange etc remain same)

    const handleEditChallenge = (challenge: any) => {
        // Convert DB timestamp to input datetime-local format (YYYY-MM-DDTHH:mm)
        let formattedDate = "";
        if (challenge.end_date) {
            const d = new Date(challenge.end_date);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            formattedDate = d.toISOString().slice(0, 16);
        }

        setFormData({
            title: challenge.title,
            description: challenge.description,
            area: challenge.area,
            difficulty: challenge.difficulty,
            questionsCount: challenge.questions_count,
            prize: challenge.prize || "",
            endDate: formattedDate,
            durationMinutes: challenge.duration_minutes || "60"
        });
        setEditingId(challenge.id);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            title: "",
            description: "",
            area: "ENEM",
            difficulty: "Médio",
            questionsCount: 10,
            prize: "",
            endDate: "",
            durationMinutes: "60"
        });
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!supabase) {
            setError("Erro de conexão com Supabase.");
            setIsLoading(false);
            return;
        }

        try {
            let generatedQuestions = [];

            // 1. Generate Questions via AI (Only if creating new or if specifically requested - for now always on create)
            if (!editingId) {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'ENEM', // Defaulting to ENEM style for challenges or we could add a selector
                        area: formData.area,
                        tema: formData.title, // Use title as specific theme
                        dificuldade: formData.difficulty,
                        quantidade: parseInt(formData.questionsCount.toString()) || 10,
                    })
                });

                if (!response.ok) {
                    throw new Error("Falha ao gerar questões com IA. Tente novamente.");
                }

                const data = await response.json();
                if (data.success && data.data) {
                    generatedQuestions = data.data;
                } else {
                    throw new Error("A IA não retornou questões válidas.");
                }
            }


            const payload: any = {
                title: formData.title,
                description: formData.description,
                area: formData.area,
                difficulty: formData.difficulty,
                questions_count: parseInt(formData.questionsCount.toString()),
                end_date: new Date(formData.endDate).toISOString(), // Save as ISO
                // time_left: `${formData.durationDays} dias`, // Removed legacy
                status: "active",
                prize: formData.prize || null,
                participants: 0,
                duration_minutes: parseInt(formData.durationMinutes) || 60
            };

            // Only add questions if we generated them (Create mode)
            if (generatedQuestions.length > 0) {
                payload.questions_json = generatedQuestions;
            }

            let error;

            if (editingId) {
                // UPDATE (Keep existing questions for now or logic to regen?)
                // Does NOT update questions_json to avoid overwriting existing exam data if editing details
                const { error: updateError } = await supabase
                    .from('challenges')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        area: formData.area,
                        difficulty: formData.difficulty,
                        questions_count: parseInt(formData.questionsCount.toString()),
                        end_date: new Date(formData.endDate).toISOString(),
                        prize: formData.prize || null,
                        duration_minutes: parseInt(formData.durationMinutes) || 60
                    })
                    .eq('id', editingId);
                error = updateError;
            } else {
                // CREATE
                const { error: insertError } = await supabase
                    .from('challenges')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            setSuccess(true);
            handleCancelEdit(); // Reset form
            setTimeout(() => setSuccess(false), 3000);
            loadData();

        } catch (err: any) {
            console.error("Erro ao salvar desafio:", err);
            setError(err.message || "Erro ao salvar desafio.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-20">
            {/* Header Section - Stacked for better layout */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
                    <p className="text-muted-foreground">Gerenciar desafios e visualizar estatísticas.</p>
                </div>

                {userCount !== null && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-violet-600/20 p-3 rounded-lg">
                                    <Users className="h-8 w-8 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase font-bold">Total Usuários</p>
                                    <p className="text-3xl font-bold">{userCount ?? '-'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-amber-600/20 p-3 rounded-lg">
                                    <Zap className="h-8 w-8 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase font-bold">Gerações IA</p>
                                    <p className="text-3xl font-bold">{aiRequestCount ?? '-'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-emerald-600/20 p-3 rounded-lg">
                                    <Activity className="h-8 w-8 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase font-bold">Ativos Hoje</p>
                                    <p className="text-3xl font-bold">{dailyGenerators ?? '-'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Success/Error Alerts */}
            {success && (
                <Alert className="border-green-500 bg-green-900/20 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Sucesso!</AlertTitle>
                    <AlertDescription>Operação realizada com sucesso.</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <Card className="lg:col-span-2 h-fit">
                    <CardHeader>
                        <CardTitle>{editingId ? "Editar Desafio" : "Criar Novo Desafio"}</CardTitle>
                        <CardDescription>
                            {editingId ? "Atualize as informações do desafio abaixo." : "Defina as regras, dificuldade e premiação."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título do Desafio <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Ex: Maratona de Matemática - Semana 1"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição <span className="text-red-500">*</span></Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Descreva o que será cobrado..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="area">Área / Tema <span className="text-red-500">*</span></Label>
                                    <Select name="area" onValueChange={(val) => handleSelectChange('area', val)} value={formData.area} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ENEM Geral">ENEM Geral</SelectItem>
                                            <SelectItem value="Matemática">Matemática</SelectItem>
                                            <SelectItem value="Linguagens">Linguagens</SelectItem>
                                            <SelectItem value="Direito Constitucional">Direito Constitucional</SelectItem>
                                            <SelectItem value="Raciocínio Lógico">Raciocínio Lógico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="difficulty">Dificuldade <span className="text-red-500">*</span></Label>
                                    <Select name="difficulty" onValueChange={(val) => handleSelectChange('difficulty', val)} value={formData.difficulty} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Fácil">Fácil</SelectItem>
                                            <SelectItem value="Médio">Médio</SelectItem>
                                            <SelectItem value="Difícil">Difícil</SelectItem>
                                            <SelectItem value="Insano">Insano</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="questionsCount">Qtd. Questões <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="questionsCount"
                                        name="questionsCount"
                                        type="number"
                                        min="1"
                                        value={formData.questionsCount}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="durationMinutes">Tempo de Prova (Minutos) <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="durationMinutes"
                                        name="durationMinutes"
                                        type="number"
                                        min="5"
                                        placeholder="Ex: 60"
                                        value={formData.durationMinutes}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">Data de Encerramento <span className="text-red-500">*</span></Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                />
                                <p className="text-xs text-slate-500">O desafio será encerrado automaticamente nesta data.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <div className="space-y-2">
                                    <Label htmlFor="prize">🏆 Premiação (Opcional)</Label>
                                    <Input
                                        id="prize"
                                        name="prize"
                                        placeholder="Ex: R$ 50,00 ou Mentoria Grátis"
                                        value={formData.prize}
                                        onChange={(e) => {
                                            const { name, value: val } = e.target;
                                            // Auto-format currency logic (simplified)
                                            setFormData(prev => ({ ...prev, [name]: val }));
                                        }}
                                        onBlur={(e) => {
                                            const { name, value: val } = e.target;
                                            // Only add prefix if it looks like a number and not empty
                                            if (val && !val.startsWith("R$") && /^\d/.test(val)) {
                                                setFormData(prev => ({ ...prev, [name]: `R$ ${val}` }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1">
                                        Cancelar
                                    </Button>
                                )}
                                <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 animate-pulse" /> Gerando Prova com IA...
                                        </span>
                                    ) : (editingId ? "Atualizar Desafio" : "Publicar Desafio")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Management Section - Now on the side or stacked */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Desafios Ativos</h2>
                    {activeChallenges.length === 0 ? (
                        <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-slate-800 border-dashed text-slate-500">
                            Nenhum desafio ativo.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {activeChallenges.map((challenge) => (
                                <div key={challenge.id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg group hover:border-violet-500/50 transition-colors">
                                    <h4 className="font-bold text-white line-clamp-1">{challenge.title}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded">
                                            {challenge.difficulty}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" className="h-7 text-xs bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900" onClick={() => handleFinishChallenge(challenge.id)} title="Finalizar Desafio">
                                                🏁
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleEditChallenge(challenge)}>
                                                Editar
                                            </Button>
                                            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleDeleteChallenge(challenge.id)}>
                                                Excluir
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div >
    );
}
