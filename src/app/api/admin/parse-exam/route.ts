import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
export const runtime = 'nodejs'; // Enforce Node.js runtime for this route

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // Use dynamic import for ESM compatibility
        const pdfModule = await import('pdf-parse');
        const pdf = (pdfModule as any).default || pdfModule;
        const data = await pdf(buffer);
        return data.text;
    } catch (error: any) {
        console.error("Error extracting text from PDF:", error);
        console.error("Buffer Size:", buffer?.length);
        throw new Error(`Failed to parse PDF text: ${error.message || error}`);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { pdfUrl, gabaritoUrl } = body;

        if (!pdfUrl) {
            return NextResponse.json({ success: false, error: "PDF URL is required" }, { status: 400 });
        }

        // Validate URLs to prevent SSRF (basic check, though Supabase storage URLs are predictable)
        // For now, allow any URL as it's an admin feature.

        // Fetch PDF
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        const pdfArrayBuffer = await pdfResponse.arrayBuffer();
        const buffer = Buffer.from(pdfArrayBuffer);

        // 1. Prepare Parts for Gemini
        const parts: any[] = [];

        // Prompt
        const promptText = `
            Você é um especialista em estruturar provas do ENEM.
            
            Tarefa:
            1. Analise o arquivo PDF fornecido da PROVA e extraia as questões.
            2. Se houver um arquivo PDF de GABARITO, cruze as informações para identificar a resposta correta.
            
            Regras de Extração:
            - Corrija quebras de linha indevidas no enunciado.
            - Ignore textos de cabeçalho/rodapé repetitivos (ex: "ENEM 2023").
            - 'correct_answer' deve ser a letra da alternativa correta (A, B, C, D, E). Se não tiver gabarito, null.
            - 'area': Classifique em Linguagens, Humanas, Natureza, Matemática.
            
            Retorne APENAS um JSON válido seguindo este esquema estrito:
            {
                "questions": [
                    {
                        "question_number": 1,
                        "statement": "Texto completo do enunciado...",
                        "alternatives": ["Texto da alternativa A", "Texto da alternativa B", ...],
                        "correct_answer": "A", 
                        "area": "Linguagens"
                    }
                ]
            }
        `;
        parts.push({ text: promptText });

        // PDF Part
        parts.push({
            inlineData: {
                data: buffer.toString("base64"),
                mimeType: "application/pdf",
            },
        });

        // Gabarito Part (if exists)
        if (gabaritoUrl) {
            try {
                const gabaritoResponse = await fetch(gabaritoUrl);
                if (gabaritoResponse.ok) {
                    const gabaritoArrayBuffer = await gabaritoResponse.arrayBuffer();
                    const gabaritoBuffer = Buffer.from(gabaritoArrayBuffer);
                    parts.push({
                        text: "Este é o arquivo do GABARITO. Use-o para encontrar as respostas corretas:",
                    });
                    parts.push({
                        inlineData: {
                            data: gabaritoBuffer.toString("base64"),
                            mimeType: "application/pdf",
                        },
                    });
                }
            } catch (err) {
                console.warn("Failed to fetch/include Gabarito:", err);
            }
        }

        // 2. Process with Gemini
        // Increase safety settings? Flash is usually fine.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // 3. Parse JSON
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);

        return NextResponse.json({ success: true, data: parsedData.questions });

    } catch (error: any) {
        console.error("Parse API Error:", error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
