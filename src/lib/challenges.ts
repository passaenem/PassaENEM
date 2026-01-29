export interface Challenge {
    id: string;
    title: string;
    description: string;
    area: string;
    difficulty: "Fácil" | "Médio" | "Difícil" | "Insano";
    questionsCount: number;
    participants: number;
    timeLeft: string; // e.g. "2d 10h"
    status: "active" | "finished";
    prize: string; // e.g. "R$ 100,00"
    top3: { name: string; score: number; time: string }[]; // Mock leaderboard
    questions_json?: any[]; // Generated Questions
    duration_minutes?: number; // Exam time limit
}


export const activeChallenges: Challenge[] = [];

export const finishedChallenges: Challenge[] = [];

export const userPerformance = [];
