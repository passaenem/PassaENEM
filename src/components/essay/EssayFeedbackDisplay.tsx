import { Button } from "@/components/ui/button";
import { EssayResult } from "@/lib/essays";
import { CheckCircle, AlertTriangle, Star, BookOpen, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface EssayFeedbackDisplayProps {
    result: EssayResult;
    onRedo?: () => void;
    onNew?: () => void;
    readOnly?: boolean; // If true, hide action buttons
}

export function EssayFeedbackDisplay({ result, onRedo, onNew, readOnly }: EssayFeedbackDisplayProps) {
    const router = useRouter();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* 1. Score & Context Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Resultado da Correção</h2>
                        <p className="text-slate-400 text-sm max-w-md">Tema: {result.theme}</p>

                        {/* Overall Impression Badge */}
                        {result.overall_impression && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mt-2
                                ${result.overall_impression === 'Excelente' ? 'bg-green-500/20 text-green-400' :
                                    result.overall_impression === 'Bom' ? 'bg-blue-500/20 text-blue-400' :
                                        result.overall_impression === 'Regular' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'}`}>
                                {result.overall_impression === 'Excelente' ? <CheckCircle className="w-4 h-4" /> :
                                    result.overall_impression === 'Crítico' ? <AlertTriangle className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                                Nível: {result.overall_impression}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6 bg-slate-950 px-8 py-6 rounded-2xl border border-slate-800 shadow-inner">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Nota Final</span>
                            <span className={`text-5xl font-extrabold ${result.score_final >= 900 ? 'text-green-400' : result.score_final >= 700 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {result.score_final}
                            </span>
                        </div>
                        <div className="h-12 w-px bg-slate-800" />
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500">de 1000 pontos</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(result.score_final / 200) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-800'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Humanized Competencies */}
            <div className="grid md:grid-cols-2 gap-4">
                <ScoreCard
                    title="Compreensão do Tema"
                    score={result.score_breakdown.comprehension}
                    icon={BookOpen}
                    description="Entendimento da proposta e não fuga do tema."
                    feedback={result.competency_feedback?.comprehension}
                />
                <ScoreCard
                    title="Estrutura Textual"
                    score={result.score_breakdown.structure}
                    icon={AlertTriangle}
                    description="Organização dos parágrafos e tipo dissertativo."
                    feedback={result.competency_feedback?.structure}
                />
                <ScoreCard
                    title="Argumentação"
                    score={result.score_breakdown.argumentation}
                    icon={CheckCircle}
                    description="Defesa de ponto de vista e repertório."
                    feedback={result.competency_feedback?.argumentation}
                />
                <ScoreCard
                    title="Coesão e Coerência"
                    score={result.score_breakdown.cohesion}
                    icon={ArrowRight}
                    description="Conectivos e lógica textual."
                    feedback={result.competency_feedback?.cohesion}
                />
                <ScoreCard
                    title="Norma Padrão"
                    score={result.score_breakdown.grammar}
                    icon={Star}
                    description="Gramática e ortografia."
                    feedback={result.competency_feedback?.grammar}
                />
            </div>

            {/* 3. Text with Highlights (The Core Feature) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-400" />
                        Correção Detalhada no Texto
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                        Passe o mouse (ou clique) sobre os trechos marcados para ver as observações.
                    </p>
                </div>
                <div className="p-8 leading-loose text-lg text-slate-300 font-serif whitespace-pre-wrap">
                    <EssayTextWithHighlights content={result.content} comments={result.inline_comments || []} />
                </div>
            </div>

            {/* 4. Pedagogical Analysis (Refined/Collapsable) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Plano de Melhoria & Feedback Geral
                </h3>
                {/* We use the same html content but style it better */}
                <div
                    className="prose prose-invert prose-p:text-slate-300 prose-ul:text-slate-300 prose-strong:text-violet-300 max-w-none"
                    dangerouslySetInnerHTML={{ __html: result.feedback }}
                />
            </div>

            {/* 5. CTAs (Action Buttons) */}
            {!readOnly && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <Button variant="outline" className="h-14 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={onRedo}>
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Refazer Esta Redação
                    </Button>
                    <Button className="h-14 bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-900/20" onClick={onNew}>
                        Corrigir Novo Tema
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            )}

            {readOnly && (
                <div className="flex justify-end pt-4">
                    {/* Logic for "Redo" will be handled by the parent component passing onRedo */}
                    <Button variant="default" className="bg-violet-600 hover:bg-violet-700 h-12" onClick={onRedo}>
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Refazer Este Tema
                    </Button>
                </div>
            )}
        </div>
    );
}

function ScoreCard({ title, score, icon: Icon, description, feedback }: any) {
    // Determine color based on score (0-200)
    const color = score >= 160 ? "text-green-400" : score >= 120 ? "text-yellow-400" : "text-red-400";
    const bg = score >= 160 ? "bg-green-500/10" : score >= 120 ? "bg-yellow-500/10" : "bg-red-500/10";
    const border = score >= 160 ? "border-green-500/20" : score >= 120 ? "border-yellow-500/20" : "border-red-500/20";

    return (
        <div className={`p-5 rounded-xl border ${border} ${bg} flex flex-col gap-3 transition-all hover:scale-[1.01]`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-950/50 ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-100">{title}</h4>
                        <p className="text-xs text-slate-400">{description}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-2xl font-bold ${color}`}>{score}</span>
                    <span className="text-[10px] text-slate-500">/200</span>
                </div>
            </div>

            {/* Feedback Summary */}
            <div className="mt-1 pt-3 border-t border-slate-800/50">
                {feedback ? (
                    <div className="flex gap-2">
                        <div className={`w-1 h-auto rounded-full ${score >= 160 ? 'bg-green-500' : score >= 120 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <p className="text-sm text-slate-300 italic">"{feedback}"</p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">Sem observações específicas.</p>
                )}
            </div>
        </div>
    )
}

function EssayTextWithHighlights({ content, comments }: { content: string, comments: any[] }) {
    if (!comments || comments.length === 0) return <div className="whitespace-pre-wrap">{content}</div>;

    let parts: { text: string, comment?: any }[] = [{ text: content }];

    comments.forEach(cmt => {
        const quote = cmt.quote.trim();
        if (!quote) return;

        const newParts: typeof parts = [];
        let found = false;

        parts.forEach(part => {
            if (part.comment) {
                newParts.push(part); // Already processed
            } else {
                const idx = part.text.indexOf(quote);
                if (idx !== -1 && !found) {
                    // Split!
                    const before = part.text.substring(0, idx);
                    const match = part.text.substring(idx, idx + quote.length);
                    const after = part.text.substring(idx + quote.length);

                    if (before) newParts.push({ text: before });
                    newParts.push({ text: match, comment: cmt });
                    if (after) newParts.push({ text: after });
                    found = true;
                } else {
                    newParts.push(part);
                }
            }
        });
        parts = newParts;
    });

    return (
        <div className="whitespace-pre-wrap">
            {parts.map((part, i) => (
                part.comment ? (
                    <span key={i} className="relative group cursor-help decoration-red-500/50 underline decoration-wavy decoration-2 underline-offset-4 bg-red-500/10 rounded px-0.5 mx-0.5">
                        {part.text}
                        <span className="absolute hidden group-hover:block z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl text-xs sm:text-sm text-slate-200 pointer-events-none">
                            <strong>{part.comment.type === 'error' ? '🔴 Correção:' : '💡 Sugestão:'}</strong><br />
                            {part.comment.comment}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700" />
                        </span>
                    </span>
                ) : (
                    <span key={i}>{part.text}</span>
                )
            ))}
        </div>
    );
}
