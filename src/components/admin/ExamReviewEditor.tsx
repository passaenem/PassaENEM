"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Check, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Question {
    question_number: number;
    statement: string;
    alternatives: string[];
    correct_answer: string;
    area: string;
    image_url?: string;
}

interface ExamReviewEditorProps {
    questions: Question[];
    onSave: (questions: Question[]) => void;
    onCancel: () => void;
}

export function ExamReviewEditor({ questions: initialQuestions, onSave, onCancel }: ExamReviewEditorProps) {
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [currentStep, setCurrentStep] = useState(0); // Index of question being edited
    const [uploadingImage, setUploadingImage] = useState(false);

    const activeQuestion = questions[currentStep];

    const updateQuestion = (field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        newQuestions[currentStep] = { ...newQuestions[currentStep], [field]: value };
        setQuestions(newQuestions);
    };

    const updateAlternative = (index: number, value: string) => {
        const newQuestions = [...questions];
        const newAlternatives = [...newQuestions[currentStep].alternatives];
        newAlternatives[index] = value;
        newQuestions[currentStep].alternatives = newAlternatives;
        setQuestions(newQuestions);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setUploadingImage(true);

        try {
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `question-images/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

            // Upload to same bucket 'official-exams' but different folder
            if (supabase) {
                const { error: uploadError } = await supabase.storage
                    .from('official-exams')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('official-exams')
                    .getPublicUrl(filePath);

                updateQuestion('image_url', publicUrl);
            }
        } catch (error) {
            console.error("Image upload failed", error);
            alert("Erro ao enviar imagem.");
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Revisão de Questões ({currentStep + 1} de {questions.length})</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={() => onSave(questions)} className="bg-green-600 hover:bg-green-700">Salvar Tudo</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {questions.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentStep(idx)}
                            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border transition-colors ${idx === currentStep ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {q.question_number}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Editor */}
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-24">
                                <Label>Número</Label>
                                <Input
                                    type="number"
                                    value={activeQuestion.question_number}
                                    onChange={e => updateQuestion('question_number', parseInt(e.target.value))}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="flex-1">
                                <Label>Área</Label>
                                <Input
                                    value={activeQuestion.area || ""}
                                    onChange={e => updateQuestion('area', e.target.value)}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Enunciado</Label>
                            <Textarea
                                value={activeQuestion.statement}
                                onChange={e => updateQuestion('statement', e.target.value)}
                                className="bg-slate-950 border-slate-800 min-h-[150px]"
                            />
                        </div>

                        <div>
                            <Label className="flex items-center gap-2 mb-2">
                                <ImageIcon className="w-4 h-4 text-blue-400" />
                                Imagem da Questão (Opcional)
                            </Label>
                            <div className="flex items-center gap-4">
                                {activeQuestion.image_url ? (
                                    <div className="relative group">
                                        <img src={activeQuestion.image_url} alt="Questão" className="h-24 w-auto rounded border border-slate-700" />
                                        <button
                                            onClick={() => updateQuestion('image_url', null)}
                                            className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Alternatives & Meta */}
                    <div className="space-y-6">
                        <div>
                            <Label>Alternativas</Label>
                            <div className="space-y-3 mt-2">
                                {activeQuestion.alternatives?.map((alt, idx) => {
                                    const letter = String.fromCharCode(65 + idx); // A, B, C...
                                    const isCorrect = activeQuestion.correct_answer === letter;
                                    return (
                                        <div key={idx} className="flex gap-2">
                                            <div
                                                className={`w-8 h-8 flex items-center justify-center rounded font-bold cursor-pointer ${isCorrect ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                                onClick={() => updateQuestion('correct_answer', letter)}
                                                title="Marcar como correta"
                                            >
                                                {letter}
                                            </div>
                                            <Input
                                                value={alt}
                                                onChange={e => updateAlternative(idx, e.target.value)}
                                                className={`bg-slate-950 border-slate-800 flex-1 ${isCorrect ? 'border-green-800 ring-1 ring-green-800' : ''}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
