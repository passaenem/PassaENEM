import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Gere um tema de redação no estilo ENEM. 
        O tema deve ser atual, relevante para a sociedade brasileira e seguir o padrão de frase temática do ENEM (ex: "Os desafios de...", "A importância de...", "Caminhos para combater...").
        Além do tema, gere um pequeno texto motivador (texto de apoio) de 1 parágrafo (aprox. 50-80 palavras) dando contexto sobre o assunto, citando algum dado ou fato relevante.
        
        Retorne APENAS um JSON no seguinte formato, sem markdown ou code blocks:
        {
            "theme": "O tema gerado aqui",
            "support_text": "O texto de apoio aqui"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Robust JSON extraction
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');

        let jsonString = text;
        if (startIndex !== -1 && endIndex !== -1) {
            jsonString = text.substring(startIndex, endIndex + 1);
        }

        const data = JSON.parse(jsonString);

        return NextResponse.json({ theme: data.theme, support_text: data.support_text });


    } catch (error) {
        console.error("Error generating theme:", error);
        return NextResponse.json(
            { error: "Failed to generate theme" },
            { status: 500 }
        );
    }
}
