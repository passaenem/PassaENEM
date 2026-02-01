import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Gere um tema de redação no estilo ENEM. 
        O tema deve ser atual, relevante para a sociedade brasileira e seguir o padrão de frase temática do ENEM (ex: "Os desafios de...", "A importância de...", "Caminhos para combater...").
        Retorne APENAS o título do tema, sem aspas e sem texto adicional.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const theme = response.text().trim();

        return NextResponse.json({ theme });
    } catch (error) {
        console.error("Error generating theme:", error);
        return NextResponse.json(
            { error: "Failed to generate theme" },
            { status: 500 }
        );
    }
}
