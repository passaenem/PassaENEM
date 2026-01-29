import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinancialProps {
    recentTransactions: any[];
    monthlyRevenueData: { name: string, value: number }[]; // For chart
    metrics: {
        activeSubs: number;
        churnRate: number;
        newSubsMonth: number;
    }
}

export function FinancialSection({ data }: { data: FinancialProps }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Column (2/3 width) */}
            <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex justify-between">
                        <span>Fluxo de Receita (Últimos 6 Meses)</span>
                        <div className="flex gap-4 text-sm font-normal text-slate-400">
                            <span>Ativos: <b className="text-green-400">{data.metrics.activeSubs}</b></span>
                            <span>Novos: <b className="text-blue-400">+{data.metrics.newSubsMonth}</b></span>
                            <span>Churn: <b className="text-red-400">{data.metrics.churnRate}%</b></span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.monthlyRevenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                itemStyle={{ color: '#a78bfa' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recent Transactions List (1/3 width) */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Últimas Transações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            {data.recentTransactions.map((tx) => (
                                <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-800/50">
                                    <TableCell className="p-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-white">{tx.profiles?.full_name || 'Usuário'}</span>
                                            <span className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right p-2">
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-green-400">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 border-slate-700 text-slate-400">
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.recentTransactions.length === 0 && (
                                <div className="text-center text-slate-500 py-4">Nenhuma transação recente.</div>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
