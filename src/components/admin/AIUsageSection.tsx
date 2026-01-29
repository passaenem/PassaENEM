import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface AIUsageProps {
    usageByType: { name: string, value: number }[]; // ENEM vs Concursos
    topUsers: any[];
    metrics: {
        totalGenerated: number;
        todayGenerated: number;
        avgPerUser: number;
    }
}

export function AIUsageSection({ data }: { data: AIUsageProps }) {
    const COLORS = ['#8b5cf6', '#3b82f6'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Consumo de IA por Tipo</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.usageByType} layout="vertical">
                            <XAxis type="number" stroke="#64748b" hide />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                            <Tooltip
                                cursor={{ fill: '#1e293b' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                {data.usageByType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-around mt-4 text-sm text-slate-400">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-white">{data.metrics.todayGenerated}</span>
                            Geradas Hoje
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-white">{data.metrics.avgPerUser}</span>
                            Média/Usuário
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Top 5 Consumidores (Power Users)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead className="text-slate-400">Usuário</TableHead>
                                <TableHead className="text-right text-slate-400">Imersão</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.topUsers.map((user, i) => (
                                <TableRow key={user.id} className="border-slate-800">
                                    <TableCell className="font-medium text-slate-200">
                                        {i + 1}. {user.full_name?.split(' ')[0] || 'User'}
                                        <span className="block text-xs text-slate-500">{user.email}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-bold text-violet-400">{user.credits_consumed || 'High'}</span>
                                        <span className="block text-xs text-slate-500">créditos</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
