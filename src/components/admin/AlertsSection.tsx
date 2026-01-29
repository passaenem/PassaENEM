import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, BatteryWarning, XCircle } from "lucide-react";

interface AlertsProps {
    usersZeroCredits: number;
    recentErrors: number;
    failedPayments: number;
}

export function AlertsSection({ data }: { data: AlertsProps }) {
    if (data.usersZeroCredits === 0 && data.recentErrors === 0 && data.failedPayments === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.usersZeroCredits > 0 && (
                <Alert variant="default" className="bg-yellow-950/30 border-yellow-900/50 text-yellow-500">
                    <BatteryWarning className="h-4 w-4" />
                    <AlertTitle>Usuários sem Créditos</AlertTitle>
                    <AlertDescription>
                        {data.usersZeroCredits} alunos estão zerados e podem precisar de upgrade.
                    </AlertDescription>
                </Alert>
            )}

            {data.failedPayments > 0 && (
                <Alert variant="destructive" className="bg-red-950/30 border-red-900/50">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Falhas de Pagamento</AlertTitle>
                    <AlertDescription>
                        {data.failedPayments} transações falharam recentemente. Verifique o gateway.
                    </AlertDescription>
                </Alert>
            )}

            {data.recentErrors > 0 && (
                <Alert variant="default" className="bg-orange-950/30 border-orange-900/50 text-orange-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erros de IA</AlertTitle>
                    <AlertDescription>
                        {data.recentErrors} erros de geração reportados nas últimas 24h.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
