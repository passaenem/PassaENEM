import { Feedback } from "@/lib/feedback";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackCardProps {
    feedback: Feedback;
    isAdmin: boolean;
    onReply: (id: string, response: string) => Promise<void>;
}

export function FeedbackCard({ feedback, isAdmin, onReply }: FeedbackCardProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmitReply = async () => {
        if (!response.trim()) return;
        setLoading(true);
        await onReply(feedback.id, response);
        setLoading(false);
        setIsReplying(false);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-700 transition-colors">
            {/* Header: User Info & Rating */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {feedback.user?.full_name?.charAt(0).toUpperCase() || feedback.user?.email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">
                            {feedback.user?.full_name || "Usuário"}
                        </h4>
                        <p className="text-xs text-slate-500">
                            {new Date(feedback.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`w-4 h-4 ${star <= feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-700"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {feedback.comment}
            </p>

            {/* Admin Response Section */}
            {feedback.admin_response && (
                <div className="bg-slate-950/50 border-l-2 border-violet-500 rounded-r-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Resposta do Administrador</span>
                    </div>
                    <p className="text-sm text-slate-400 italic">
                        "{feedback.admin_response}"
                    </p>
                </div>
            )}

            {/* Admin Reply Action */}
            {isAdmin && !feedback.admin_response && (
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                    {!isReplying ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 p-0 h-auto font-medium"
                            onClick={() => setIsReplying(true)}
                        >
                            Responder feedback
                        </Button>
                    ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Textarea
                                placeholder="Escreva sua resposta..."
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                className="bg-slate-950 border-slate-700 min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsReplying(false)}
                                    className="text-slate-400"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-violet-600 hover:bg-violet-700 text-white"
                                    onClick={handleSubmitReply}
                                    disabled={loading}
                                >
                                    {loading ? "Enviando..." : "Enviar Resposta"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
