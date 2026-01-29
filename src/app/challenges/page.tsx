"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Users, Star, ArrowRight, Wallet, AlertCircle } from "lucide-react";
import { activeChallenges, finishedChallenges, userPerformance, Challenge } from "@/lib/challenges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ChallengesPage() {
    const [activeTab, setActiveTab] = useState("active");

    // Load custom challenges from LocalStorage (Mock integration)
    const [customChallenges, setCustomChallenges] = useState<Challenge[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("custom_challenges");
        if (stored) {
            setCustomChallenges(JSON.parse(stored));
        }
    }, []);

    const allActive = [...activeChallenges, ...customChallenges];

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Desafios & Competições</h1>
                    <p className="text-muted-foreground">Participe de provas valendo prêmios e destaque no ranking.</p>
                </div>
            </div>

            <Tabs defaultValue="active" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="active">🔥 Desafios Ativos</TabsTrigger>
                    <TabsTrigger value="performance">📊 Meu Desempenho</TabsTrigger>
                    <TabsTrigger value="finished">🏁 Finalizados</TabsTrigger>
                </TabsList>

                {/* DESAFIOS ATIVOS */}
                <TabsContent value="active" className="space-y-4">
                    {allActive.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Sem desafios no momento</AlertTitle>
                            <AlertDescription>Fique ligado! Novos desafios são lançados toda semana.</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {allActive.map((challenge) => (
                                <Card key={challenge.id} className="flex flex-col border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant={challenge.difficulty === 'Insano' ? 'destructive' : challenge.difficulty === 'Difícil' ? 'default' : 'secondary'}>
                                                {challenge.difficulty}
                                            </Badge>
                                            {challenge.prize && (
                                                <Badge variant="outline" className="border-green-500 text-green-400 gap-1">
                                                    <Wallet className="w-3 h-3" />
                                                    {challenge.prize}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-xl">{challenge.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <div className="flex items-center text-sm text-slate-400 gap-4">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {challenge.participants}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {challenge.timeLeft}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500" />
                                                Top 1: {challenge.top3[0]?.score || 0}
                                            </div>
                                        </div>

                                        {/* Leaderboard Preview */}
                                        <div className="bg-slate-950 rounded-lg p-3 text-sm space-y-2 border border-slate-800">
                                            <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Ranking Atual (Top 3)</p>
                                            {challenge.top3.map((p, i) => (
                                                <div key={i} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className={i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-300" : "text-amber-700"}>
                                                            <Trophy className="w-3 h-3" />
                                                        </span>
                                                        <span className="truncate max-w-[100px]">{p.name}</span>
                                                    </div>
                                                    <span className="font-mono text-slate-400">{p.score}pts</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
                                            onClick={() => {
                                                // 1. Create a simplified exam object from the challenge
                                                // In a real app, this would fetch specific questions from an API
                                                const mockQuestions = Array.from({ length: challenge.questionsCount }).map((_, i) => ({
                                                    id: `q-${challenge.id}-${i}`,
                                                    type: "ENEM",
                                                    question: `Questão ${i + 1} do desafio ${challenge.title}. (Simulação)`,
                                                    options: ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "Alternativa E"],
                                                    correctAnswer: 0,
                                                    explanation: "Explicação gerada automaticamente para o desafio.",
                                                    difficulty: challenge.difficulty,
                                                    topic: challenge.area
                                                }));

                                                sessionStorage.setItem('currentExam', JSON.stringify(mockQuestions));
                                                sessionStorage.setItem('currentExamId', `challenge-${challenge.id}`);
                                                sessionStorage.setItem('isRanked', 'true'); // FLAG IMPORTANTE
                                                window.location.href = '/exam';
                                            }}
                                        >
                                            Participar Agora <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* MEU DESEMPENHO */}
                <TabsContent value="performance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Participação</CardTitle>
                            <CardDescription>Veja seus resultados nos desafios passados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {userPerformance.map((perf, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-slate-900 border-slate-800">
                                        <div>
                                            <h4 className="font-bold">{perf.title}</h4>
                                            <p className="text-sm text-muted-foreground">{perf.date} • {perf.time}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-violet-400">{perf.score}%</div>
                                            <p className="text-xs text-muted-foreground">Posição: #{perf.position} de {perf.totalParticipants}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FINALIZADOS */}
                <TabsContent value="finished">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {finishedChallenges.map((challenge) => (
                            <Card key={challenge.id} className="flex flex-col border-slate-800 bg-slate-900/20 grayscale hover:grayscale-0 transition-all cursor-pointer">
                                <CardHeader>
                                    <div className="flex justify-between items-center mb-2">
                                        <Badge variant="outline">Finalizado</Badge>
                                        <span className="text-xs text-slate-500">{challenge.participants} participantes</span>
                                    </div>
                                    <CardTitle className="text-xl">{challenge.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-950 rounded-lg p-3 text-sm space-y-2 border border-slate-800">
                                        <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Vencedores</p>
                                        {challenge.top3.map((p, i) => (
                                            <div key={i} className="flex justify-between items-center text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="w-3 h-3" />
                                                    <span>{p.name}</span>
                                                </div>
                                                <span>{p.score}pts</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="secondary" className="w-full">
                                        Ver Resultados & Gabarito
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
