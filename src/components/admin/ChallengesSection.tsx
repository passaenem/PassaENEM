import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, AlertCircle } from "lucide-react";

interface ChallengesProps {
    activeChallenges: number;
    finishedToday: number;
    pendingRewards: number; // Count of rewards unpaid
    rank: any[];
}

export function ChallengesSection({ data }: { data: ChallengesProps }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <Trophy className="text-yellow-500 h-5 w-5" /> KPIs de Desafios
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                        <span className="text-slate-400">Ativos Agora</span>
                        <span className="text-2xl font-bold text-white">{data.activeChallenges}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                        <span className="text-slate-400">Finalizados Hoje</span>
                        <span className="text-2xl font-bold text-blue-400">{data.finishedToday}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-950/10 rounded-lg border border-red-900/30">
                        <span className="text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Pagamentos Pendentes
                        </span>
                        <span className="text-2xl font-bold text-red-500">{data.pendingRewards}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <Medal className="text-violet-500 h-5 w-5" /> Ranking Global (Top 10)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead className="w-[50px] text-slate-400">Pos</TableHead>
                                <TableHead className="text-slate-400">Aluno</TableHead>
                                <TableHead className="text-right text-slate-400">Pontuação</TableHead>
                                <TableHead className="text-right text-slate-400">Medalha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.rank.map((user, i) => (
                                <TableRow key={i} className="border-slate-800">
                                    <TableCell className="font-bold text-slate-500">#{i + 1}</TableCell>
                                    <TableCell className="font-medium text-white">{user.name}</TableCell>
                                    <TableCell className="text-right font-mono text-violet-300">{user.score} pts</TableCell>
                                    <TableCell className="text-right">
                                        {i === 0 && <span className="text-yellow-400">🥇 Ouro</span>}
                                        {i === 1 && <span className="text-slate-400">🥈 Prata</span>}
                                        {i === 2 && <span className="text-amber-700">🥉 Bronze</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.rank.length === 0 && (
                                <div className="text-center p-4 text-slate-500">Ranking vazio</div>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
