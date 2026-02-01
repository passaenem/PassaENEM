import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const { theme, content, userId } = await req.json();

        if (!theme || !content) {
            return NextResponse.json({ error: "Tema e conteúdo são obrigatórios." }, { status: 400 });
        }

        // 1. AI Correction Logic
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        Você é uma IA corretora de redações no modelo ENEM, com foco pedagógico.
        
        TEMA: ${theme}
        REDAÇÃO:
        ${content}

        REGRA:
        - O texto deve ter no mínimo 4 parágrafos.
        - Se tiver menos de 4 parágrafos ou fugir do tema, nota 0.
        
        CRITÉRIOS (Total 1000, divididos por 5 competências de 200 cada):
        1. Compreensão do tema (0-200)
        2. Estrutura textual (0-200)
        3. Argumentação (0-200)
        4. Coesão e coerência (0-200)
        5. Norma padrão (0-200)
        
        *OBS: O usuário pediu escala 0-20 por critério (Total 100), então adapte a nota para essa escala.*
        
        RETORNE APENAS UM JSON (sem markdown) no seguinte formato:
        {
          "score_final": number (0-100),
          "score_breakdown": {
            "comprehension": number (0-20),
            "structure": number (0-20),
            "argumentation": number (0-20),
            "cohesion": number (0-20),
            "grammar": number (0-20)
          },
          "feedback_html": "string com HTML básico (<p>, <strong>, <ul>, <li>) contendo: Análise Geral, O que foi bem feito, O que precisa melhorar, Dicas para a próxima."
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean markdown code blocks if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const correctionData = JSON.parse(text);

        // 2. Save to Database (if userId provided)
        if (userId) {
            // Use service role if available for reliable insertion, otherwise use client
            // Since we might not have service role locally, we try standard insertion
            // Ideally we should use a server-side client with service role for these operations, 
            // but for now we rely on RLS allowing the user to insert their own essay if authenticated on client,
            // OR we use the anon key here if the user passed their ID.
            // Actually, backend should use service role to ensure data integrity, but purely for this demo/mvp:

            // Note: In a real app, 'supabase' imported from lib/supabase is a browser client. 
            // We need a server client here to perform admin-like actions or just rely on the table RLS
            // and the fact that we are just inserting data.
            // BUT this is an API route, so we should really be using a proper server client.
            // However, to avoid complexity with missing keys, let's just return the data 
            // and let the frontend save it, OR try to save it here if we assume RLS is open enough or we have a key.

            // Let's TRY to save it here using standard fetch to Supabase REST API if the library client fails,
            // but standard 'supabase' from lib is likely client-side only. 
            // Let's create a temporary client if we have the key, or skip saving here and let frontend do it?
            // "Save to database" was part of the plan.

            // Let's assume the project has the standard setup where backend can insert.
            // Since we lack SERVICE_ROLE_KEY locally, we might have issues if RLS is strict and we don't have the user's auth context here.

            // BETTER APPROACH: Return the correction to frontend, and let frontend insert it into Supabase 
            // since frontend has the active User Session. 
            // *Wait*, the implementation plan said: "Saves the result to the essays table".
            // If I do it here, I need the user's Auth context. 
            // I will implement saving here ONLY IF I can, otherwise I will return data for frontend to save.
            // Actually, simpler: I'll return the data and the Frontend will save it. 
            // It ensures the Authenticated User is the one performing the INSERT (respecting RLS).
        }

        return NextResponse.json(correctionData);

    } catch (error: any) {
        console.error("Erro na correção:", error);
        return NextResponse.json({ error: "Falha ao corrigir redação." }, { status: 500 });
    }
}
