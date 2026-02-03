'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, BookOpen, ChevronRight, ChevronLeft, CheckCircle2, Save, Lightbulb, Target, Brain, CheckSquare, Zap, ArrowRight, LayoutList } from 'lucide-react';

interface ScheduleBlock {
    subject: string;
    topic: string;
    objective?: string;
    metaphor?: string;
    method?: string;
    details?: string; // Fallback
    duration: string;
    completed?: boolean;
}

interface DaySchedule {
    day: string;
    blocks: ScheduleBlock[];
}

interface ScheduleResponse {
    summary: string;
    schedule: DaySchedule[];
}

const STEPS = [
    { id: 1, title: "Objetivo" },
    { id: 2, title: "Disponibilidade" },
    { id: 3, title: "Perfil" },
    { id: 4, title: "Nível" },
];

export default function SchedulePage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [credits, setCredits] = useState(0);
    const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleResponse | null>(null);
    const [selectedWeek, setSelectedWeek] = useState(1);

    const [formData, setFormData] = useState({
        objective: '',
        examDate: '',
        daysPerWeek: '',
        hoursPerDay: '',
        occupation: '',
        difficulties: [] as string[],
        strengths: [] as string[],
        level: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUser(user);
                    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
                    if (profile) setCredits(profile.credits);

                    // Check for existing schedule
                    const { data: existingSchedule } = await supabase
                        .from('user_schedules')
                        .select('week_number, schedule_data')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (existingSchedule) {
                        setGeneratedSchedule(existingSchedule.schedule_data);
                        setSelectedWeek(existingSchedule.week_number);
                    }
                }
            }
        };
        fetchUser();
    }, []);

    const handleNext = () => setStep(prev => Math.min(prev + 1, STEPS.length + 1));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const toggleSelection = (field: 'difficulties' | 'strengths', value: string) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const generateSchedule = async (week: number = 1) => {
        if (!user) return alert("Você precisa estar logado.");
        setLoading(true);
        setSelectedWeek(week);

        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, userId: user.id, week })
            });
            const data = await res.json();

            if (data.success) {
                setGeneratedSchedule(data.data);
                // Refresh credits
                const { data: profile } = await supabase!.from('profiles').select('credits').eq('id', user.id).single();
                if (profile) setCredits(profile.credits);
            } else {
                alert("Erro ao gerar cronograma: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const toggleBlockCompletion = (dayIndex: number, blockIndex: number) => {
        if (!generatedSchedule) return;
        const newSchedule = { ...generatedSchedule };
        const block = newSchedule.schedule[dayIndex].blocks[blockIndex];
        block.completed = !block.completed;
        setGeneratedSchedule(newSchedule);
    };

    const subjects = ["Matemática", "Linguagens", "Ciências Humanas", "Ciências da Natureza", "Redação"];

    if (generatedSchedule) {
        return (
            <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                                Plano de Estudos
                            </h1>
                            <Badge variant="outline" className="border-blue-500 text-blue-400 w-fit">
                                Semana {selectedWeek}
                            </Badge>
                        </div>
                        <p className="text-slate-400 mt-2 text-sm md:text-base">Personalizado por IA para o seu objetivo.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <Button onClick={() => setGeneratedSchedule(null)} variant="outline" className="w-full sm:w-auto">
                            <LayoutList className="w-4 h-4 mr-2" />
                            Novo Perfil
                        </Button>
                        <Button
                            disabled={loading || credits < 3}
                            onClick={() => generateSchedule(selectedWeek + 1)}
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    Gerar Semana {selectedWeek + 1}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-400">
                            <Brain className="w-5 h-5" />
                            Dicas do Mentor
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-300 leading-relaxed italic border-l-4 border-yellow-500/50 pl-4">
                            "{generatedSchedule.summary}"
                        </p>
                    </CardContent>
                </Card>

                <div className="grid gap-6">
                    {generatedSchedule.schedule.map((day, dIdx) => (
                        <Card key={dIdx} className="bg-slate-950/50 border-slate-800 overflow-hidden">
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3 px-6 border-b border-slate-800 flex justify-between items-center">
                                <div className="font-bold text-blue-400 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {day.day}
                                </div>
                                <span className="text-xs text-slate-500">{day.blocks.length} Tarefas</span>
                            </div>

                            <div className="divide-y divide-slate-800/50">
                                {day.blocks.length > 0 ? (
                                    day.blocks.map((block, bIdx) => (
                                        <div key={bIdx} className={`p-4 transition-all ${block.completed ? 'opacity-50 grayscale bg-slate-900/30' : 'hover:bg-slate-900/20'}`}>
                                            <div className="flex gap-4">
                                                {/* Checkbox Column */}
                                                <div className="pt-1">
                                                    <button
                                                        onClick={() => toggleBlockCompletion(dIdx, bIdx)}
                                                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${block.completed ? 'bg-green-500 border-green-500 text-slate-900' : 'border-slate-600 hover:border-blue-500'}`}
                                                    >
                                                        {block.completed && <CheckSquare className="w-4 h-4" />}
                                                    </button>
                                                </div>

                                                {/* Content Column */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="border-slate-700 text-slate-300">
                                                                {block.subject}
                                                            </Badge>
                                                            <h4 className={`font-semibold text-white ${block.completed ? 'line-through decoration-slate-500' : ''}`}>
                                                                {block.topic}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">
                                                            <Clock className="w-3 h-3" />
                                                            {block.duration}
                                                        </div>
                                                    </div>

                                                    {/* Rich Pedagogical Content */}
                                                    <div className="grid gap-2 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                                                        {block.objective && (
                                                            <div className="flex gap-2">
                                                                <Target className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                                                <span className="text-slate-300"><strong className="text-red-400">Objetivo:</strong> {block.objective}</span>
                                                            </div>
                                                        )}
                                                        {block.method && (
                                                            <div className="flex gap-2">
                                                                <BookOpen className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                                <span className="text-slate-300"><strong className="text-blue-400">Como estudar:</strong> {block.method}</span>
                                                            </div>
                                                        )}
                                                        {block.metaphor && (
                                                            <div className="flex gap-2">
                                                                <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                                                <span className="text-slate-300"><strong className="text-yellow-400">Pense assim:</strong> {block.metaphor}</span>
                                                            </div>
                                                        )}
                                                        {!block.objective && block.details && ( // Fallback
                                                            <p className="text-slate-400">{block.details}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-600 italic flex flex-col items-center">
                                        <Zap className="w-8 h-8 mb-2 opacity-50" />
                                        Dia livre para descanso ou reposição.
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">Gerador de Cronograma</h2>
                        <span className="text-sm text-slate-400">Passo {step} de 4</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </CardHeader>

                <CardContent className="py-6 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in fade-in">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <p className="text-slate-300 text-lg font-medium">Consultando o Especialista...</p>
                            <p className="text-slate-500 text-sm">Criando sua estratégia personalizada.</p>
                        </div>
                    ) : (
                        <>
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="space-y-2">
                                        <Label>1. Qual é seu objetivo principal?</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, objective: v })} value={formData.objective}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ENEM">ENEM</SelectItem>
                                                <SelectItem value="Vestibular">Vestibular (FUVEST, Unicamp, etc)</SelectItem>
                                                <SelectItem value="Concurso Público">Concurso Público</SelectItem>
                                                <SelectItem value="Ambos">Ambos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>2. Quando você pretende fazer a prova?</Label>
                                        <Input
                                            placeholder="Ex: Novembro de 2026 / Ainda não sei"
                                            value={formData.examDate}
                                            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="space-y-2">
                                        <Label>3. Quantos dias por semana você pode estudar?</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, daysPerWeek: v })} value={formData.daysPerWeek}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                {[2, 3, 4, 5, 6, 7].map(num => (
                                                    <SelectItem key={num} value={String(num)}>{num} dias</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>4. Quantas horas por dia você consegue estudar?</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, hoursPerDay: v })} value={formData.hoursPerDay}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30min">30 minutos</SelectItem>
                                                <SelectItem value="1h">1 hora</SelectItem>
                                                <SelectItem value="2h">2 horas</SelectItem>
                                                <SelectItem value="3h">3 horas</SelectItem>
                                                <SelectItem value="4h+">4 horas ou mais</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="space-y-2">
                                        <Label>5. Qual sua ocupação atual?</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, occupation: v })} value={formData.occupation}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Estudo em tempo integral">Apenas estudo</SelectItem>
                                                <SelectItem value="Trabalho meio período">Trabalho meio período</SelectItem>
                                                <SelectItem value="Trabalho integral">Trabalho integral</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>6. Nível atual (Autoavaliação)</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, level: v })} value={formData.level}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Iniciante">Iniciante (Começando do zero)</SelectItem>
                                                <SelectItem value="Intermediário">Intermediário (Já tenho base)</SelectItem>
                                                <SelectItem value="Avançado">Avançado (Foco em revisão/aprofundamento)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="space-y-4">
                                        <Label className="text-red-400">7. Áreas de MAIOR DIFICULDADE (Prioridade)</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {subjects.map(sub => (
                                                <Badge
                                                    key={sub}
                                                    variant={formData.difficulties.includes(sub) ? "destructive" : "outline"}
                                                    className="cursor-pointer hover:bg-red-900/30"
                                                    onClick={() => toggleSelection('difficulties', sub)}
                                                >
                                                    {sub}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t border-slate-800 pt-4">
                                        <Label className="text-green-400">8. Áreas de MAIOR CONFIANÇA (Pontos Fortes)</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {subjects.map(sub => (
                                                <Badge
                                                    key={sub}
                                                    className={`cursor-pointer border-green-800 text-green-300 hover:bg-green-900/30 ${formData.strengths.includes(sub) ? "bg-green-900/50" : "bg-transparent"}`}
                                                    variant="outline"
                                                    onClick={() => toggleSelection('strengths', sub)}
                                                >
                                                    {sub}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-4 border-t border-slate-800 pt-6">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1 || loading}
                        className="w-full sm:w-auto"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>

                    {step < 4 ? (
                        <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            Próximo
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                            <Button
                                onClick={() => generateSchedule(1)}
                                disabled={loading || credits < 3}
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-40"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        Gerar Plano
                                        <CheckCircle2 className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                            <span className="text-xs text-slate-400 flex items-center gap-1 self-center sm:self-end">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                Custo: 3 Créditos (Saldo: {credits})
                            </span>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
