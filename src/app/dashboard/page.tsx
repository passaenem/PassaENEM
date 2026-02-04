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
    const fetchStats = async () => {
      let examData: any[] = [];

      // Dynamic import to avoid build issues if strictly server
      if (typeof window !== 'undefined') {
        try {
          const { supabase } = await import("@/lib/supabase");
          if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();

            // ADMIN REDIRECT
            const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";
            if (user && user.id === ADMIN_ID) {
              window.location.href = '/admin'; // Force redirect to new strategic dashboard
              return;
            }

            if (user) {
              const { data, error } = await supabase
                .from('exam_results')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

              if (data) examData = data;
            }
          }
        } catch (e) {
          console.error("Error fetching dashboard stats:", e);
        }
      }

      // Parse Data
      // Map DB structure to internal logic
      // DB: questions_json, score_percentage, exam_title

      const totalQuestions = examData.reduce((acc, curr) => {
        // questions_json can be string or object
        let qCount = 0;
        if (Array.isArray(curr.questions_json)) qCount = curr.questions_json.length;
        // Handle if stored as string? Supabase handles JSONB as object usually.
        return acc + qCount;
      }, 0);

      const completedExamsList = examData.filter(h => h.score_percentage !== undefined && h.score_percentage !== null);
      const completedExams = completedExamsList.length;

      const totalScore = completedExamsList.reduce((acc, curr) => acc + (curr.score_percentage || 0), 0);
      const averageScore = completedExams > 0 ? Math.round(totalScore / completedExams) : 0;

      // Calculate Favorite Area
      const areas: Record<string, number> = {};
      examData.forEach(h => {
        // Title format: "ENEM - Historia" or just "Concurso"
        // Try to be smart
        const title = h.exam_title || "";
        const parts = title.split('-');
        let area = parts[0]?.trim();
        if (parts.length > 1) area = parts[1]?.trim(); // If "ENEM - Math", take Math

        if (area) areas[area] = (areas[area] || 0) + 1;
      });

      let favoriteArea = "Nenhuma";
      let maxCount = 0;
      Object.entries(areas).forEach(([area, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteArea = area;
        }
      });

      // Map for Recent Exams UI
      const recent = examData.slice(0, 10).map(h => ({
        id: h.id,
        date: h.created_at,
        title: h.exam_title,
        type: (h.exam_title && h.exam_title.includes("ENEM")) ? "ENEM" : "CONCURSO" as "ENEM" | "CONCURSO",
        score: h.score_percentage,
        questions: h.questions_json || []
      }));

      setStats({
        totalQuestions,
        averageScore,
        completedExams,
        favoriteArea: favoriteArea,
        recentExams: recent
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  const rawScore = exam.score;
                  const score = typeof rawScore === 'number' ? rawScore : parseFloat(String(rawScore)) || 0;
                  const heightPercentage = Math.max(score, 5); // Ensure min height

                  return (
                    <div key={i} className="flex flex-col items-center gap-2 group w-full h-full justify-end">
                      <div
                        className="w-8 md:w-12 bg-violet-600 rounded-t-md transition-all hover:bg-violet-500 relative"
                        style={{ height: `${heightPercentage * 0.8}%` }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {Math.round(score)}%
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                        {new Date(exam.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                      </span>
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
