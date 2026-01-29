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

export default function EnemGeneratorPage() {
    const [formData, setFormData] = useState({
        area: "Linguagens",
        tema: "",
        nivel: "Intermediário",
        quantidade: 5,
        tempo: 15,
        frequencia: "Média",
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
        const cost = Number(formData.quantidade);

        // Check credits
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
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: JSON.stringify({ type: 'ENEM', ...formData }),
            });
            const result = await response.json();

            if (result.success) {
                if (supabase) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await deductCredits(user.id, Number(formData.quantidade));
                    }
                }

                // Save to history
                saveExamToHistory({
                    id: Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString(),
                    type: 'ENEM',
                    title: `${formData.area} - ${formData.tema || 'Geral'}`,
                    questions: result.data
                });

                // Save to session and redirect
                sessionStorage.setItem('currentExam', JSON.stringify(result.data));
                const examId = Math.random().toString(36).substr(2, 9); // wait, we generated ID inside saveExamToHistory call above but didn't capture it.
                // We need to use the SAME ID.
                const newId = Math.random().toString(36).substr(2, 9);

                saveExamToHistory({
                    id: newId,
                    date: new Date().toISOString(),
                    type: 'ENEM',
                    title: `${formData.area} - ${formData.tema || 'Geral'}`,
                    questions: result.data
                });

                sessionStorage.setItem('currentExamId', newId);
                sessionStorage.removeItem('isRanked'); // Disable Lockdown for generated exams
                window.location.href = '/exam';
            } else {
                throw new Error(result.error || "Erro ao gerar questões.");
            }
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
                <h1 className="text-3xl font-bold">Gerador ENEM</h1>
                <p className="text-muted-foreground">
                    Configure os parâmetros abaixo para criar um simulado personalizado estilo ENEM.
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="area">Área do Conhecimento</Label>
                                <select
                                    id="area"
                                    name="area"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.area}
                                    onChange={handleChange}
                                >
                                    <option value="Linguagens">Linguagens e Códigos</option>
                                    <option value="Humanas">Ciências Humanas</option>
                                    <option value="Natureza">Ciências da Natureza</option>
                                    <option value="Matemática">Matemática</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nivel">Nível de Dificuldade</Label>
                                <select
                                    id="nivel"
                                    name="nivel"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.nivel}
                                    onChange={handleChange}
                                >
                                    <option value="Iniciante">Iniciante</option>
                                    <option value="Intermediário">Intermediário</option>
                                    <option value="Avançado">Avançado</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tema">Tema Específico</Label>
                            <Input
                                id="tema"
                                name="tema"
                                placeholder="Ex: Funções, Ecologia, Modernismo..."
                                value={formData.tema}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="frequencia">Frequência no ENEM</Label>
                                <select
                                    id="frequencia"
                                    name="frequencia"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.frequencia}
                                    onChange={handleChange}
                                >
                                    <option value="Baixa">Baixa</option>
                                    <option value="Média">Média</option>
                                    <option value="Alta">Alta</option>
                                </select>
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
