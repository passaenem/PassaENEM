import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Optional: Verify Vercel Cron Header to prevent unauthorized calls
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

        console.log("Starting Daily Motivation Cron Job...");

        // 1. Generate Message
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not set");
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
            6. SEJA CRIATIVO e EVITE repetições de frases clichês.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim().replace(/^["']|["']$/g, '');

        // 2. Determine Date (Brazil Time)
        // Ensure we are setting it for the "Current" day in BRT
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

        // 3. Save to Supabase
        if (!supabase) throw new Error("Supabase not initialized");

        const { error } = await supabase
            .from('daily_motivations')
            .upsert(
                { date: today, message: text },
                { onConflict: 'date' }
            );

        if (error) {
            throw new Error(`Supabase Error: ${error.message}`);
        }

        console.log(`Success! Date: ${today}, Message: ${text}`);
        return NextResponse.json({ success: true, date: today, message: text });

    } catch (error: any) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
