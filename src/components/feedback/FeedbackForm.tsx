import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquarePlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FeedbackFormProps {
    onSuccess: () => void;
    userId: string;
}

export function FeedbackForm({ onSuccess, userId }: FeedbackFormProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async () => {
        if (rating === 0 || !comment.trim()) return;

        setLoading(true);
        try {
            await supabase
                .from('feedbacks')
                .insert({
                    user_id: userId,
                    rating,
                    comment
                });

            setOpen(false);
            setRating(0);
            setComment("");
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-lg shadow-violet-900/20 font-bold">
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    Avaliar Plataforma
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        Deixe seu Feedback
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Sua opinião é pública e ajuda a comunidade a crescer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sua Nota</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-slate-700"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-yellow-400 h-5">
                            {rating === 1 && "Precisa Melhorar"}
                            {rating === 2 && "Razoável"}
                            {rating === 3 && "Bom"}
                            {rating === 4 && "Muito Bom"}
                            {rating === 5 && "Excelente!"}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seu Comentário</label>
                        <Textarea
                            placeholder="Conte o que você está achando, sugestões ou elogios..."
                            className="bg-slate-950 border-slate-800 focus:border-violet-500 min-h-[120px]"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400">Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || rating === 0 || !comment.trim()}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar Avaliação"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
