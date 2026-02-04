"use client";

import { useState, useEffect } from "react";
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

    // Official Exams State
    const [examType, setExamType] = useState<'ia' | 'official'>('ia');
    const [officialExams, setOfficialExams] = useState<any[]>([]);
    const [loadingOfficial, setLoadingOfficial] = useState(false);
    const [selectedOfficialId, setSelectedOfficialId] = useState<string | null>(null);

    // Fetch Official Exams when tab changes


    useEffect(() => {
        if (examType === 'official' && officialExams.length === 0) {
            fetchOfficialExams();
        }
    }, [examType]);

    const fetchOfficialExams = async () => {
        setLoadingOfficial(true);
        if (supabase) {
            const { data } = await supabase.from('official_exams').select('*').order('year', { ascending: false }).order('title', { ascending: true });
            setOfficialExams(data || []);
        }
        setLoadingOfficial(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (examType === 'official') {
            if (!selectedOfficialId) return;

            // Fetch Structured Questions
            if (supabase) {
                const { data: questions } = await supabase
                    .from('official_questions')
                    .select('*')
                    .eq('exam_id', selectedOfficialId)
                    .order('question_number', { ascending: true });

                const selectedExamMeta = officialExams.find(e => e.id === selectedOfficialId);

                if (questions && questions.length > 0) {
                    // Adapt to Exam Runner Format
                    const adaptedQuestions = questions.map(q => ({
                        id: q.id,
                        type: 'ENEM',
                        question: q.statement,
                        options: q.alternatives,
                        correctAnswer: q.correct_answer.charCodeAt(0) - 65, // Convert 'A'->0, 'B'->1
                        explanation: "Gabarito Oficial",
                        difficulty: 'Médio',
                        topic: q.area || 'Geral',
                        context: q.image_url ? `![Imagem da Questão](${q.image_url})` : undefined // Inject image as markdown if exists
                    }));

                    // Save to Session and Redirect
                    const newId = Math.random().toString(36).substr(2, 9);
                    const examTitle = selectedExamMeta ? `ENEM ${selectedExamMeta.year} ${selectedExamMeta.title}` : (selectedExamMeta?.title || "Prova Oficial");

                    saveExamToHistory({
                        id: newId,
                        date: new Date().toISOString(),
                        type: 'ENEM',
                        title: examTitle,
                        questions: adaptedQuestions,
                        pdfUrl: selectedExamMeta?.pdf_url
                    });

                    sessionStorage.setItem('currentExam', JSON.stringify(adaptedQuestions));
                    sessionStorage.setItem('currentExamId', newId);
                    sessionStorage.setItem('currentExamDuration', "300"); // 5 hours for full exam
                    sessionStorage.setItem('currentExamTitle', examTitle);

                    // Pass PDF URL for Virtual Answer Sheet mode
                    if (selectedExamMeta?.pdf_url) {
                        sessionStorage.setItem('currentExamPdf', selectedExamMeta.pdf_url);
                    } else {
                        sessionStorage.removeItem('currentExamPdf');
                    }

                    sessionStorage.removeItem('isRanked');
                    window.location.href = '/exam';
                    return;
                } else {
                    // Fallback to PDF if no questions found (legacy support)
                    if (selectedExamMeta?.pdf_url && selectedExamMeta.pdf_url.startsWith('http')) {
                        window.open(selectedExamMeta.pdf_url, '_blank');
                    } else {
                        setError("Esta prova ainda não possui questões cadastradas.");
                    }
                }
            }
            setLoading(false);
            return;
        }

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
                    type: 'ENEM',
                    userId, // Pass User ID for server-side validation
                    ...formData
                }),
            });
            const result = await response.json();

            // Handle API Errors (e.g. Credit Limit Server-Side)
            if (!result.success) {
                if (result.error.includes("crédito")) { // If error is about credits
                    setCreditWarningOpen(true);
                    setLoading(false);
                    return;
                }
                throw new Error(result.error);
            }

            // Deduct credits locally (Optimistic Update)
            // if (result.success && userId) {
            //     await deductCredits(userId, Number(formData.quantidade));
            // }

            // Save to history


            // Save to session and redirect
            sessionStorage.setItem('currentExam', JSON.stringify(result.data));
            const examId = Math.random().toString(36).substr(2, 9); // wait, we generated ID inside saveExamToHistory call above but didn't capture it.
            // We need to use the SAME ID.
            const newId = Math.random().toString(36).substr(2, 9);
            const generatedTitle = `${formData.area} - ${formData.tema || 'Geral'}`;

            saveExamToHistory({
                id: newId,
                date: new Date().toISOString(),
                type: 'ENEM',
                title: generatedTitle,
                questions: result.data
            });

            sessionStorage.setItem('currentExamId', newId);
            sessionStorage.setItem('currentExamDuration', formData.tempo.toString());
            sessionStorage.setItem('currentExamTitle', generatedTitle);
            sessionStorage.setItem('currentExamTitle', generatedTitle);
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

                        {/* Exam Type Toggle */}
                        <div className="flex flex-col sm:flex-row p-1 bg-slate-900 rounded-lg mb-6 border border-slate-800 gap-2 sm:gap-0">
                            <button
                                type="button"
                                onClick={() => setExamType('ia')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${examType === 'ia' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Gerar com IA
                            </button>
                            <button
                                type="button"
                                onClick={() => setExamType('official')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${examType === 'official' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Prova Oficial (PDF)
                            </button>
                        </div>

                        {examType === 'ia' ? (
                            <>
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
                            </>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                {loadingOfficial ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
                                ) : officialExams.length === 0 ? (
                                    <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg text-slate-400">
                                        Nenhuma prova oficial disponível no momento.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>Selecione a Prova</Label>
                                        <div className="grid gap-2">
                                            {officialExams.map(exam => (
                                                <div
                                                    key={exam.id}
                                                    onClick={() => setSelectedOfficialId(exam.id)}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedOfficialId === exam.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-900'}`}
                                                >
                                                    <span className="font-medium">{exam.title} ({exam.year})</span>
                                                    {selectedOfficialId === exam.id && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button type="submit" className={`w-full ${examType === 'official' ? 'bg-blue-600 hover:bg-blue-700' : ''}`} size="lg" disabled={loading || (examType === 'official' && !selectedOfficialId)}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {examType === 'ia' ? "Gerando com IA..." : "Carregando Prova..."}
                                </>
                            ) : (
                                examType === 'ia' ? "Gerar Questões" : "Abrir Prova Oficial"
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
