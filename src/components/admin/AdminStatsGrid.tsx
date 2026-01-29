import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown, CreditCard, Zap, DollarSign, Activity } from "lucide-react";

interface AdminStatsProps {
    totalUsers: number;
    activeUsers: number; // Users active this month
    subscribers: number;
    freeUsers: number;
    revenue: number; // Monthly estimated
    totalRevenue: number; // All time
    creditsConsumed: number;
    aiCost: number; // $0.000... estimate
}

export function AdminStatsGrid({ stats }: { stats: AdminStatsProps }) {
    const cards = [
        {
            title: "Total Usuários",
            value: stats.totalUsers,
            icon: Users,
            color: "text-blue-400",
            desc: `${stats.freeUsers} Free / ${stats.activeUsers} Ativos`
        },
        {
            title: "Assinantes Pagos",
            value: stats.subscribers,
            icon: Crown,
            color: "text-yellow-400",
            desc: "Plano PRO Ativo"
        },
        {
            title: "Receita Mensal (Est.)",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue),
            icon: CreditCard,
            color: "text-green-400",
            desc: "Baseado em assinaturas ativas"
        },
        {
            title: "Receita Acumulada",
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue),
            icon: DollarSign,
            color: "text-green-500",
            desc: "Total histórico"
        },
        {
            title: "Créditos IA Consumidos",
            value: stats.creditsConsumed.toLocaleString(),
            icon: Zap,
            color: "text-purple-400",
            desc: "Total de tokens/créditos"
        },
        {
            title: "Custo Estimado IA",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(stats.aiCost),
            icon: Activity,
            color: "text-red-400",
            desc: "Gemini API (Est.)"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {cards.map((card, index) => (
                <Card key={index} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-xl font-bold text-white`}>{card.value}</div>
                        <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
