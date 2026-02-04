"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, Trophy, ArrowLeft, Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

export default function ChallengeManagementPage() {
    const [loading, setLoading] = useState(true);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadChallenges();
    }, []);

    const loadChallenges = async () => {
        setLoading(true);
        if (supabase) {
            const { data } = await supabase
                .from('challenges')
                .select('*')
                .order('created_at', { ascending: false });
            setChallenges(data || []);
        }
        setLoading(false);
    };

    const loadParticipants = async (challenge: any) => {
        setSelectedChallenge(challenge);
        setLoadingParticipants(true);
        if (supabase) {
            // Fetch results for this challenge
            // We match by title string "Desafio: [Challenge Title]"
            const challengeTitle = `Desafio: ${challenge.title}`;

            const { data: results } = await supabase
                .from('exam_results')
                .select('*')
                .eq('exam_title', challengeTitle)
                .order('score_percentage', { ascending: false }) // Score
                .order('created_at', { ascending: true }); // Time tie-breaker

            if (results && results.length > 0) {
                // Fetch User Profiles for names
                const userIds = results.map(r => r.user_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', userIds);

                const participantsData = results.map(r => {
                    const profile = profiles?.find(p => p.id === r.user_id);

                    // Format duration
                    const timeSeconds = r.time_taken_seconds || 0;
                    const minutes = Math.floor(timeSeconds / 60);
                    const seconds = timeSeconds % 60;
                    const duration = timeSeconds > 0 ? `${minutes}m ${seconds}s` : "N/A";

                    return {
                        result_id: r.id,
                        user_id: r.user_id,
                        name: profile?.full_name || "Usuário desconhecido",
                        email: profile?.email || "Email não encontrado",
                        score: r.correct_answers,
                        total: r.total_questions,
                        percentage: r.score_percentage,
                        completed_at: new Date(r.created_at).toLocaleString('pt-BR'),
                        time_taken: duration
                    };
                });
                setParticipants(participantsData);
            } else {
                setParticipants([]);
            }
        }
        setLoadingParticipants(false);
    };

    const filteredChallenges = (status: 'active' | 'finished') => {
        return challenges.filter(c => c.status === status);
    };

    const filteredParticipants = participants.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;
    }

    if (selectedChallenge) {
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setSelectedChallenge(null)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{selectedChallenge.title}</h1>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            <Badge variant={selectedChallenge.status === 'active' ? 'default' : 'secondary'}>
                                {selectedChallenge.status === 'active' ? 'Em Andamento' : 'Finalizado'}
                            </Badge>
                            • {participants.length} Participantes
                        </p>
                    </div>
                </div>

                <Card className="bg-slate-950 border-slate-800">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Ranking Geral</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Buscar participante..."
                                    className="pl-8 bg-slate-900 border-slate-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingParticipants ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
                        ) : participants.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                Nenhum participante encontrado para este desafio.
                            </div>
                        ) : (
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-400">
                                    <thead className="text-xs text-slate-200 uppercase bg-slate-900/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 rounded-l-lg">Posição</th>
                                            <th scope="col" className="px-6 py-3">Participante</th>
                                            <th scope="col" className="px-6 py-3">Pontuação</th>
                                            <th scope="col" className="px-6 py-3">Acertos</th>
                                            <th scope="col" className="px-6 py-3">Tempo</th>
                                            <th scope="col" className="px-6 py-3 rounded-r-lg">Data de Conclusão</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredParticipants.map((participant, index) => (
                                            <tr key={participant.result_id} className="bg-slate-900/20 border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 font-bold text-white">
                                                    #{index + 1}
                                                    {index === 0 && <Trophy className="inline ml-2 w-4 h-4 text-yellow-500" />}
                                                    {index === 1 && <Trophy className="inline ml-2 w-4 h-4 text-slate-400" />}
                                                    {index === 2 && <Trophy className="inline ml-2 w-4 h-4 text-amber-700" />}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">{participant.name}</div>
                                                    <div className="text-xs text-slate-500">{participant.email}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-violet-400">
                                                    {participant.percentage}%
                                                </td>
                                                <td className="px-6 py-4">
                                                    {participant.score}/{participant.total}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-300">
                                                    {participant.time_taken}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {participant.completed_at}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-bold">Gestão de Desafios</h1>
                <p className="text-slate-400">Acompanhe o desempenho e rankings de todos os desafios.</p>
            </div>

            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">Em Andamento ({filteredChallenges('active').length})</TabsTrigger>
                    <TabsTrigger value="finished">Finalizados ({filteredChallenges('finished').length})</TabsTrigger>
                </TabsList>

                {['active', 'finished'].map((status) => (
                    <TabsContent key={status} value={status} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredChallenges(status as 'active' | 'finished').map((challenge) => (
                                <Card
                                    key={challenge.id}
                                    className="cursor-pointer hover:border-violet-500 transition-all hover:bg-slate-900/50"
                                    onClick={() => loadParticipants(challenge)}
                                >
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant={status === 'active' ? 'default' : 'secondary'} className="mb-2">
                                                {status === 'active' ? 'Ativo' : 'Finalizado'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {challenge.difficulty}
                                            </Badge>
                                        </div>
                                        <CardTitle className="line-clamp-1">{challenge.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 text-xs mt-1">
                                            {challenge.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {challenge.participants} Participantes
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {challenge.duration_minutes} min
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredChallenges(status as 'active' | 'finished').length === 0 && (
                                <div className="col-span-full text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                                    Nenhum desafio {status === 'active' ? 'ativo' : 'finalizado'} encontrado.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
