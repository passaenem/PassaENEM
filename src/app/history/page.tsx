"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getExamHistory, SavedExam } from "@/lib/storage";
import { PlayCircle, Clock, BookOpen, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HistoryPage() {
    const [history, setHistory] = useState<SavedExam[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Pagination
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);

            // 1. Try to load from Supabase first
            if (supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('exam_results')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false });

                    if (data && !error) {
                        const supHistory: SavedExam[] = data.map(item => {
                            // Merge answers into questions
                            const questionsWithAnswers = item.questions_json.map((q: any) => ({
                                ...q,
                                userAnswer: item.answers_json ? item.answers_json[q.id] : undefined
                            }));

                            return {
                                id: item.id,
                                date: item.created_at,
                                type: (item.exam_title.includes("ENEM") ? "ENEM" : "CONCURSO"),
                                title: item.exam_title,
                                score: item.score_percentage,
                                questions: questionsWithAnswers
                            };
                        });
                        setHistory(supHistory);
                        setLoading(false);
                        return;
                    }
                }
            }

            // 2. Fallback to LocalStorage
            setHistory(getExamHistory());
            setLoading(false);
        };

        loadHistory();
    }, []);

    const handleRetake = (exam: SavedExam) => {
        sessionStorage.setItem('currentExam', JSON.stringify(exam.questions));
        window.location.href = '/exam';
    };

    // Filter Logic
    const filteredHistory = history.filter(exam => {
        if (!startDate && !endDate) return true;
        const examDate = new Date(exam.date);
        const start = startDate ? new Date(startDate) : new Date('2000-01-01');
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999); // End of day

        return examDate >= start && examDate <= end;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const paginatedHistory = filteredHistory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Minhas Provas</h1>
                    <p className="text-slate-400">Histórico de simulados gerados e re-utilizáveis.</p>
                </div>

                {/* Date Filter */}
                <div className="flex items-end gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div>
                        <Label className="text-xs text-slate-500 mb-1 block">De</Label>
                        <Input
                            type="date"
                            className="bg-slate-950 border-slate-700 h-8 text-xs w-32"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Até</Label>
                        <Input
                            type="date"
                            className="bg-slate-950 border-slate-700 h-8 text-xs w-32"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    {/* Clear Filter Button */}
                    {(startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white"
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
                </div>
            ) : filteredHistory.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800 text-center py-16">
                    <CardContent>
                        <div className="flex justify-center mb-4">
                            <BookOpen className="w-12 h-12 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-300 mb-2">Nenhuma prova encontrada</h3>
                        <p className="text-slate-500 mb-6">
                            {(startDate || endDate)
                                ? "Tente ajustar os filtros de data."
                                : "Gere sua primeira prova com IA para vê-la aqui."}
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button onClick={() => window.location.href = '/generator/enem'}>Criar ENEM</Button>
                            <Button onClick={() => window.location.href = '/generator/concurso'} variant="outline">Criar Concurso</Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedHistory.map((exam) => (
                            <Card key={exam.id} className="bg-slate-900 border-slate-800 hover:border-violet-500/50 transition-colors group">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${exam.type === 'ENEM' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {exam.type}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(exam.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <CardTitle className="text-white truncate" title={exam.title}>
                                        {exam.title}
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        {exam.questions.length} Questões
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4 space-y-2">
                                        {/* Exam Details */}
                                        {exam.title.includes("Prova Oficial") || exam.title.match(/^\d{4}/) ? (
                                            <div className="text-sm text-slate-400">
                                                <p className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Prova Oficial</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                                    <span className="block text-slate-500 mb-1">Área</span>
                                                    <span className="text-slate-300 font-medium truncate">{exam.questions[0]?.topic || "Geral"}</span>
                                                </div>
                                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                                    <span className="block text-slate-500 mb-1">Dificuldade</span>
                                                    <span className="text-slate-300 font-medium">{exam.questions[0]?.difficulty || "Médio"}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Score Display if available */}
                                        {exam.score !== undefined && (
                                            <div className="mt-2 flex items-center justify-between bg-slate-950/50 p-2 rounded border border-slate-800/50">
                                                <span className="text-xs text-slate-500">Desempenho</span>
                                                <span className={`text-sm font-bold ${exam.score >= 70 ? 'text-green-400' : exam.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {exam.score}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
                                            onClick={() => {
                                                sessionStorage.setItem('currentExam', JSON.stringify(exam.questions));
                                                sessionStorage.setItem('examMode', 'view');
                                                window.location.href = '/exam';
                                            }}
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Ver
                                        </Button>
                                        <Button
                                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                                            onClick={() => handleRetake(exam)}
                                        >
                                            <PlayCircle className="w-4 h-4 mr-2" />
                                            Refazer
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-slate-800">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="border-slate-700 text-slate-400 hover:text-white"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                            </Button>

                            <span className="text-sm text-slate-400">
                                Página <span className="text-white font-bold">{currentPage}</span> de {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="border-slate-700 text-slate-400 hover:text-white"
                            >
                                Próxima <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
