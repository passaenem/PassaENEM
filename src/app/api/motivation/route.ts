import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

// Cache interface
interface DailyMotivation {
    id: string;
    date: string;
    message: string;
}

export async function GET() {
    try {
        // Use Brazil time to determine "today"
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

        // 0. Check Supabase connection
        if (!supabase) {
            console.warn("Supabase client not initialized");
            return NextResponse.json({ message: "A disciplina é a mãe do sucesso. Vamos!" });
        }

        // 1. Check if we already have a message for today
        const { data: existing, error: dbError } = await supabase
            .from('daily_motivations')
            .select('*')
            .eq('date', today)
            .single();

        if (existing) {
            return NextResponse.json({ message: existing.message });
        }

        // 2. If not, generate one using AI
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY; // Fallback
        if (!apiKey) {
            console.error("GEMINI_API_KEY not set");
            return NextResponse.json({ message: "Bora estudar! O futuro te espera. 🚀" }); // Fallback
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      Gere UMA frase curta e motivacional para um estudante que está acessando uma plataforma de estudos (ENEM/Concursos).
      
      Regras:
      1. Curta (máximo 15 palavras).
      2. Direta e disciplinada (estilo "Hard Work").
      3. Sem "coachês" barato ou excesso de empolgação.
      4. Tom sério mas encorajador.
      5. NÃO use aspas na resposta.
      
      Exemplos aprovados:
      - "O esforço de hoje é o gabarito de amanhã."
      - "Constância vence a intensidade. Comece."
      - "Foco total. Seu concorrente está estudando agora."
      - "Sem desculpas. Apenas faça."
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Cleanup if needed
        text = text.replace(/^["']|["']$/g, '');

        // 3. Save to DB so we don't call AI again today
        if (supabase) {
            const { error: insertError } = await supabase
                .from('daily_motivations')
                .insert({ date: today, message: text });

            if (insertError) {
                console.error("Error saving motivation:", insertError);
                // Determine if error is unique violation (race condition) -> if so, just ignore and return text
            }
        }

        return NextResponse.json({ message: text });

    } catch (error) {
        console.error("Error in daily motivation API:", error);
        return NextResponse.json({ message: "A disciplina é a mãe do sucesso. Vamos!" }, { status: 200 }); // Fallback
    }
}
