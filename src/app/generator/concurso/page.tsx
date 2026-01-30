"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { saveExamToHistory } from "@/lib/storage";
import { checkCredits, deductCredits } from "@/lib/credits";
import { supabase } from "@/lib/supabase";
import { CreditWarning } from "@/components/CreditWarning";

export default function ConcursoGeneratorPage() {
    const [formData, setFormData] = useState({
        area: "Administrativa",
        cargo: "",
        disciplina: "",
        banca: "",
        nivel: "Médio",
        quantidade: 5,
        tempo: 15,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creditWarningOpen, setCreditWarningOpen] = useState(false);
    const [creditInfo, setCreditInfo] = useState({ current: 0, required: 0, plan: 'free' as 'free' | 'pro' | 'admin' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const cost = Number(formData.quantidade);

        // 1. Validate Max Questions (100)
        if (cost > 100) {
            setError("O limite máximo é de 100 questões por prova.");
            return;
        }

        // 2. Check credits
        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const check = await checkCredits(user.id, cost);
                if (!check.allowed) {
                    setCreditInfo({
                        current: check.currentCredits,
                        required: cost,
                        plan: check.plan
                    });
                    setCreditWarningOpen(true);
                    setLoading(false);
                    return;
                }
            }
        }

        try {
            setError(null);

            // Get User ID for Backend (Validation)
            let userId = null;
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'CONCURSO',
                    userId,
                    ...formData
                }),
            });
            const result = await response.json();

            // Handle API Errors
            if (!result.success) {
                if (result.error?.includes("crédito")) {
                    setCreditWarningOpen(true);
                    setLoading(false);
                    return;
                }
                throw new Error(result.error || "Erro ao gerar questões.");
            }

            // Deduct credits locally (Optimistic)
            if (result.success && userId) {
                await deductCredits(userId, Number(formData.quantidade));
            }

            // Save to history
            const newId = Math.random().toString(36).substr(2, 9);
            saveExamToHistory({
                id: newId,
                date: new Date().toISOString(),
                type: 'CONCURSO',
                title: `${formData.area} - ${formData.disciplina || 'Geral'}`,
                questions: result.data
            });

            sessionStorage.setItem('currentExam', JSON.stringify(result.data));
            sessionStorage.setItem('currentExamId', newId);
            sessionStorage.setItem('currentExamDuration', formData.tempo.toString());
            sessionStorage.removeItem('isRanked'); // Disable Lockdown for generated exams
            sessionStorage.removeItem('currentExamPdf'); // Ensure no PDF is shown for AI exams
            window.location.href = '/exam';

        } catch (error: any) {
            console.error(error);
            setError(error.message || "Ocorreu um erro inesperado. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <div className="space-y-2 text-center sm:text-left">
                <h1 className="text-3xl font-bold">Gerador Concursos</h1>
                <p className="text-muted-foreground">
                    Crie baterias de questões focadas em bancas e disciplinas específicas.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuração da Prova</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="cargo">Cargo / Subárea (Opcional)</Label>
                            <Input
                                id="cargo"
                                name="cargo"
                                placeholder="Ex: Analista Judiciário, Soldado, Auditor..."
                                value={formData.cargo}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="area">Área do Concurso</Label>
                                <select
                                    id="area"
                                    name="area"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.area}
                                    onChange={handleChange}
                                >
                                    <option value="Administrativa">Administrativa</option>
                                    <option value="Policial">Policial</option>
                                    <option value="Fiscal">Fiscal</option>
                                    <option value="Educação">Educação</option>
                                    <option value="Saúde">Saúde</option>
                                    <option value="Jurídica">Jurídica</option>
                                    <option value="Tecnologia">Tecnologia</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="banca">Banca Organizadora</Label>
                                <Input
                                    id="banca"
                                    name="banca"
                                    list="banca-suggestions"
                                    placeholder="Digite ou selecione a banca..."
                                    value={formData.banca}
                                    onChange={handleChange}
                                />
                                <datalist id="banca-suggestions">
                                    <option value="Cebraspe (CESPE)" />
                                    <option value="FGV" />
                                    <option value="FCC" />
                                    <option value="VUNESP" />
                                    <option value="Cesgranrio" />
                                    <option value="IBFC" />
                                    <option value="AOCP" />
                                    <option value="IDECAN" />
                                </datalist>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="disciplina">Disciplina</Label>
                            <Input
                                id="disciplina"
                                name="disciplina"
                                placeholder="Ex: Direito Constitucional, Raciocínio Lógico..."
                                value={formData.disciplina}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nivel">Nível</Label>
                                <select
                                    id="nivel"
                                    name="nivel"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.nivel}
                                    onChange={handleChange}
                                >
                                    <option value="Médio">Médio</option>
                                    <option value="Superior">Superior</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantidade">Qtd. Questões</Label>
                                <Input
                                    id="quantidade"
                                    name="quantidade"
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={formData.quantidade}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tempo">Tempo (min)</Label>
                                <Input
                                    id="tempo"
                                    name="tempo"
                                    type="number"
                                    min="5"
                                    value={formData.tempo}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gerando com IA (Aguarde)...
                                </>
                            ) : (
                                "Gerar Questões"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <CreditWarning
                open={creditWarningOpen}
                onClose={() => setCreditWarningOpen(false)}
                currentCredits={creditInfo.current}
                requiredCredits={creditInfo.required}
                plan={creditInfo.plan}
            />
        </div>
    );
}
