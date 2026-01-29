
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Zap } from "lucide-react";

interface CreditWarningProps {
    open: boolean;
    onClose: () => void;
    currentCredits: number;
    requiredCredits: number;
    plan: 'free' | 'pro' | 'admin';
}

export function CreditWarning({ open, onClose, currentCredits, requiredCredits, plan }: CreditWarningProps) {
    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                        <Zap className="h-5 w-5 fill-red-400" />
                        Créditos Insuficientes
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                        Você precisa de <strong>{requiredCredits} créditos</strong> para gerar esta prova, mas você tem apenas <strong>{currentCredits} créditos</strong>.
                        <br /><br />
                        {plan === 'free' ? (
                            <span>
                                Usuários do plano <strong>FREE</strong> têm um limite de 20 créditos mensais.
                                Para continuar gerando provas ilimitadas e ter acesso a recursos exclusivos, faça o upgrade para o plano <strong>PRO</strong>.
                            </span>
                        ) : (
                            <span>
                                Você atingiu seu limite mensal de 120 créditos do plano <strong>PRO</strong>.
                                Seus créditos serão renovados automaticamente no próximo ciclo de faturamento.
                            </span>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white">
                        Entendi
                    </AlertDialogCancel>
                    {plan === 'free' && (
                        <AlertDialogAction
                            onClick={() => window.location.href = '/#pricing'}
                            className="bg-gradient-to-r from-violet-600 to-green-500 text-white hover:from-violet-700 hover:to-green-600 border-0"
                        >
                            Ver Planos Premium
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
