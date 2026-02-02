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
    support_text?: string;
    feedback: string;
    created_at?: string;
    competency_feedback?: {
        comprehension: string;
        structure: string;
        argumentation: string;
        cohesion: string;
        grammar: string;
    };
    overall_impression?: string;
    inline_comments?: Array<{
        quote: string;
        comment: string;
        type: 'error' | 'suggestion' | 'praise';
    }>;
}

export interface EssaySubmission {
    theme: string;
    content: string;
}
