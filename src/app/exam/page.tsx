"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, ShieldAlert, Lock, Save, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interface for Question
interface Question {
    id: string;
    type: "ENEM" | "CONCURSO";
    context?: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: string;
    topic: string;
    pontuacao?: number;
}

export default function ExamPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [finished, setFinished] = useState(false);
    const [mode, setMode] = useState<'take' | 'view' | 'review'>('take');
    const [started, setStarted] = useState(false);
    const [strikes, setStrikes] = useState(0);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("currentExam");
        const storedMode = sessionStorage.getItem("examMode");
        const storedPdf = sessionStorage.getItem("currentExamPdf"); // Load PDF URL
        const rankedSession = sessionStorage.getItem("isRanked") === "true"; // Check flag

        if (stored) {
            const parsedQuestions: Question[] = JSON.parse(stored);
            setQuestions(parsedQuestions);

            if (storedPdf) setPdfUrl(storedPdf);

            if (storedMode === 'view') {
                setFinished(true);
                setMode('view');
                setStarted(true); // Auto-start if viewing (no anti-cheat needed)

                // Hydrate answers from stored questions (if they have userAnswer)
                const storedAnswers: Record<string, number> = {};
                parsedQuestions.forEach(q => {
                    if ((q as any).userAnswer !== undefined) {
                        storedAnswers[q.id] = (q as any).userAnswer;
                    }
                });
                setAnswers(storedAnswers);

            } else {
                setMode('take');
                setIsRanked(rankedSession);

                if (rankedSession) {
                    setStarted(false); // Must explicitly start for RANKED exams (Lockdown)
                } else {
                    setStarted(true); // Auto-start for NORMAL exams
                }
            }
            sessionStorage.removeItem('examMode');
        } else {
            // Redirect logic could go here
        }
    }, []);

    // ... (rest of effects) ...

    // Main Layout Logic
    const content = (
        <div className={cn(isRanked ? "max-w-3xl mx-auto space-y-6" : "")}>

            {/* STRIKE WARNING BANNER */}
            {strikes > 0 && !finished && (
                <Alert variant="destructive" className="animate-pulse border-red-600 bg-red-950/50">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>ALERTA DE SEGURANÇA ({strikes}/3)</AlertTitle>
                    <AlertDescription>
                        Você saiu da tela ou do modo tela cheia. Não faça isso novamente ou sua prova será anulada.
                    </AlertDescription>
                </Alert>
            )}

            {strikes >= 3 && (
                <Alert variant="destructive" className="border-red-600 bg-red-900 text-white">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>PROVA ANULADA</AlertTitle>
                    <AlertDescription>
                        Você violou as regras de segurança múltiplas vezes. Sua nota foi zerada.
                    </AlertDescription>
                </Alert>
            )}

            {/* Header / StatusBar */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    {finished ? (
                        <span className="flex items-center gap-2">
                            {strikes >= 3 ? <span className="text-red-500">Desclassificado</span> :
                                <span className="text-green-400 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {mode === 'view' ? 'Visualização' : 'Correção'}</span>}
                        </span>
                    ) : (
                        `Questão ${currentIndex + 1} de ${questions.length}`
                    )}
                </h1>

                {finished && mode !== 'view' && (
                    <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex gap-4">
                        <div>
                            <span className="text-slate-400 text-sm mr-2">Nota:</span>
                            <span className="font-bold text-white">{calculateScore().percentage}%</span>
                        </div>
                        <div>
                            <span className="text-slate-400 text-sm mr-2">Pontos:</span>
                            <span className="font-bold text-violet-400">{calculateScore().points}</span>
                        </div>
                    </div>
                )}

                {/* TIMER DISPLAY */}
                {!finished && timeLeft !== null && (
                    <div className={cn(
                        "px-3 py-1 rounded-full border font-mono font-bold flex items-center gap-2",
                        timeLeft < 60 ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" : "bg-slate-800 border-slate-700 text-slate-300"
                    )}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Question Card */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-sm text-slate-400 uppercase tracking-wide flex justify-between">
                        <div className="flex gap-4">
                            <span>{currentQuestion.topic} • {currentQuestion.difficulty}</span>
                            <span className="text-violet-400 font-bold">{currentQuestion.pontuacao || 100} PTS</span>
                        </div>
                        {finished && !isRanked && (answers[currentQuestion.id] === currentQuestion.correctAnswer ?
                            <span className="text-green-500 font-bold">Correta</span> :
                            (finished && answers[currentQuestion.id] !== undefined) ? <span className="text-red-500 font-bold">Incorreta</span> : null
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {currentQuestion.context && (
                        <div className="bg-slate-950 p-4 rounded-md italic text-slate-400 border-l-4 border-violet-500">
                            {/* Handle Image Markdown manually because we are raw */}
                            {currentQuestion.context.startsWith('![') ? (
                                <img src={currentQuestion.context.match(/\((.*?)\)/)?.[1] || ""} alt="Questão" className="max-w-full rounded" />
                            ) : currentQuestion.context}
                        </div>
                    )}

                    <div className="text-lg font-medium text-slate-100">
                        {currentQuestion.question}
                    </div>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = answers[currentQuestion.id] === idx;
                            const isCorrect = currentQuestion.correctAnswer === idx;

                            let optionClass = "border-slate-700 hover:bg-slate-800 text-slate-300";

                            if (finished) {
                                if (isRanked) {
                                    // Ranked Mode: Only show what user selected, no feedback
                                    if (isSelected) {
                                        optionClass = "border-violet-500 bg-violet-500/10 text-violet-300";
                                    } else {
                                        optionClass = "border-slate-800 opacity-50";
                                    }
                                } else {
                                    // Normal Mode: Show correct/incorrect
                                    if (isCorrect) {
                                        optionClass = "border-green-500 bg-green-500/10 text-green-400";
                                    } else if (isSelected && !isCorrect) {
                                        optionClass = "border-red-500 bg-red-500/10 text-red-400";
                                    } else {
                                        optionClass = "border-slate-800 opacity-50";
                                    }
                                }
                            } else if (isSelected) {
                                optionClass = "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500 text-violet-300";
                            }

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    className={cn(
                                        "flex items-center p-4 rounded-lg border cursor-pointer transition-all",
                                        optionClass
                                    )}
                                >
                                    <div className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border mr-4 text-sm font-semibold transition-colors",
                                        finished && !isRanked && isCorrect ? "bg-green-500 text-white border-green-500" :
                                            finished && !isRanked && isSelected && !isCorrect ? "bg-red-500 text-white border-red-500" :
                                                isSelected ? "bg-violet-500 text-white border-violet-500" : "bg-slate-800 border-slate-600 text-slate-400"
                                    )}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-sm md:text-base">{option}</span>
                                </div>
                            );
                        })}
                    </div>

                    {finished && !isRanked && (
                        <div className="mt-6 p-4 bg-blue-900/20 text-blue-300 rounded-md border border-blue-900/50 animate-in fade-in slide-in-from-top-2">
                            <span className="font-semibold block mb-1 flex items-center gap-2">
                                💡 Explicação
                            </span>
                            {currentQuestion.explanation}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sticky Bottom Navigation Bar */}
            <div className={cn(
                "sticky bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-center z-50",
                isRanked ? "absolute" : "" // Handle positioning in overlay
            )}>
                <div className="w-full max-w-3xl flex justify-between items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={isFirst}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Anterior
                    </Button>

                    {finished ? (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => window.location.href = isRanked ? '/challenges' : '/history'} className="hidden sm:flex">
                                Voltar
                            </Button>
                            <Button
                                onClick={isLast ? () => window.location.href = isRanked ? '/challenges' : '/history' : handleNext}
                                disabled={(isLast && mode === 'view')}
                                className={cn(isLast ? "bg-violet-600" : "bg-slate-800")}
                            >
                                {isLast ? 'Finalizar' : 'Próxima'}
                                {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
                                {isLast && mode !== 'view' && !isRanked && <RotateCcw className="w-4 h-4 ml-2" />}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => isLast ? setShowFinishConfirmation(true) : handleNext()}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-8"
                        >
                            {isLast ? "Finalizar Prova" : "Próxima"}
                            {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
                            {isLast && <CheckCircle className="w-4 h-4 ml-2" />}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Custom Finish Confirmation Modal */}
            {showFinishConfirmation && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
                        <h2 className="text-xl font-bold text-white mb-2">Finalizar Prova?</h2>
                        <p className="text-slate-400 mb-6">
                            Tem certeza que deseja encerrar? Você não poderá alterar suas respostas depois.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowFinishConfirmation(false)} className="border-slate-700 hover:bg-slate-800">
                                Cancelar
                            </Button>
                            <Button onClick={confirmFinish} className="bg-violet-600 hover:bg-violet-700">
                                Sim, Finalizar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {pdfUrl ? (
                // SPLIT SCREEN LAYOUT
                <div className="lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-background">
                    {/* LEFT: PDF VIEWER */}
                    <div className="lg:w-[60%] h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900">
                        <iframe
                            src={`${pdfUrl}#toolbar=0`}
                            className="w-full h-full"
                            title="Exam PDF"
                        />
                    </div>

                    {/* RIGHT: ANSWER SHEET QUESTIONS */}
                    <div className="lg:w-[40%] h-full overflow-y-auto p-4 md:p-6 bg-background">
                        {content}
                    </div>
                </div>
            ) : (
                // NORMAL LAYOUT
                <div className={cn(
                    "animate-fade-in-up pb-20 select-none transition-all duration-300",
                    isRanked ? "fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm overflow-y-auto p-4 md:p-8" : "max-w-3xl mx-auto space-y-6"
                )}>
                    {content}
                </div>
            )}
        </>
    );
}
