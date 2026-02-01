export interface EssayScore {
    comprehension: number;
    structure: number;
    argumentation: number;
    cohesion: number;
    grammar: number;
}

export interface EssayResult {
    id: string;
    theme: string;
    content: string;
    score_final: number;
    score_breakdown: EssayScore;
    feedback: string;
    created_at: string;
}

export interface EssaySubmission {
    theme: string;
    content: string;
}
