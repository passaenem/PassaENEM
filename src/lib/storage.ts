export interface ExamQuestion {
    id: string;
    type: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: string;
    topic: string;
    context?: string;
    pontuacao?: number; // Score value for this question
    userAnswer?: number; // Optional, to store history of answers if needed later
}

export interface SavedExam {
    id: string;
    date: string; // ISO string
    type: 'ENEM' | 'CONCURSO';
    title: string;
    score?: number; // Null if not taken yet
    questions: ExamQuestion[];
}

const STORAGE_KEY = 'ai_exam_history';

export const saveExamToHistory = (exam: SavedExam) => {
    if (typeof window === 'undefined') return;

    const history = getExamHistory();
    // Avoid duplicates if saving same ID
    const newHistory = [exam, ...history.filter(h => h.id !== exam.id)];

    // Limit history to 50 items to prevent overflow
    if (newHistory.length > 50) {
        newHistory.pop();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};

export const updateExamScore = (id: string, score: number) => {
    if (typeof window === 'undefined') return;
    const history = getExamHistory();
    const examIndex = history.findIndex(h => h.id === id);

    if (examIndex !== -1) {
        history[examIndex].score = score;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
};

export const getExamHistory = (): SavedExam[] => {
    if (typeof window === 'undefined') return [];

    try {
        const item = localStorage.getItem(STORAGE_KEY);
        return item ? JSON.parse(item) : [];
    } catch (e) {
        console.error("Failed to load history", e);
        return [];
    }
};

export const clearHistory = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
