"use client";

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Briefcase, Zap, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getExamHistory, SavedExam } from "@/lib/storage";

export default function Home() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    averageScore: 0,
    completedExams: 0,
    favoriteArea: "Nenhuma",
    recentExams: [] as SavedExam[]
  });

  useEffect(() => {
    const history = getExamHistory();

    // Calculate Total Questions
    const totalQuestions = history.reduce((acc, curr) => acc + curr.questions.length, 0);

    // Calculate Completed Exams (those with a score)
    const completedExamsList = history.filter(h => h.score !== undefined);
    const completedExams = completedExamsList.length;

    // Calculate Average Score
    const totalScore = completedExamsList.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const averageScore = completedExams > 0 ? Math.round(totalScore / completedExams) : 0;

    // Calculate Favorite Area
    const areas: Record<string, number> = {};
    history.forEach(h => {
      // Try to extract area from title "Area - Topic"
      const parts = h.title.split('-');
      const area = parts[0]?.trim() || h.type;
      areas[area] = (areas[area] || 0) + 1;
    });

    let favoriteArea = "N/A";
    let maxCount = 0;
    Object.entries(areas).forEach(([area, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteArea = area;
      }
    });

    setStats({
      totalQuestions,
      averageScore,
      completedExams,
      favoriteArea: history.length > 0 ? favoriteArea : "Nenhuma",
      recentExams: history.slice(0, 5) // Last 5
    });

  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Seu progresso em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/generator/enem">
            <Button className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Novo Simulado ENEM
            </Button>
          </Link>
          <Link href="/generator/concurso">
            <Button variant="secondary" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Novo Simulado Concurso
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões Geradas</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">Questões criadas pela IA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acertos Médios</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Média de notas salvas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simulados Completos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedExams}</div>
            <p className="text-xs text-muted-foreground">Provas finalizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Favorita</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={stats.favoriteArea}>{stats.favoriteArea}</div>
            <p className="text-xs text-muted-foreground">Tema mais estudado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Desempenho Recente</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Placeholder for Chart - difficult to implement real chart without install library like Recharts. 
                 Using CSS bars for now for simple visualization of last 5 scores. */}
            <div className="h-[200px] flex items-end justify-around p-4 border-b border-dashed border-slate-700">
              {stats.recentExams.length > 0 ? (
                stats.recentExams.slice(0, 7).reverse().map((exam, i) => {
                  const score = exam.score || 0;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 group w-full">
                      <div
                        className="w-8 md:w-12 bg-violet-600 rounded-t-md transition-all hover:bg-violet-500 relative"
                        style={{ height: `${Math.max(score, 5)}%` }} // Min 5% height to show something
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {score}%
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{new Date(exam.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  )
                })
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Sem dados suficientes para gráfico.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Últimos Simulados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentExams.length > 0 ? (
                stats.recentExams.map((exam, i) => (
                  <div key={i} className="flex items-center">
                    <div className="ml-4 space-y-1 overflow-hidden">
                      <p className="text-sm font-medium leading-none truncate">{exam.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {exam.type} • {exam.questions.length} questões
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {exam.score !== undefined ? (
                        <span className={exam.score >= 70 ? 'text-green-500' : 'text-orange-500'}>
                          {exam.score}%
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum simulado realizado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
