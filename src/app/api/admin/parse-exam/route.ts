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
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("Failed to parse PDF text.");
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const gabaritoFile = formData.get("gabarito") as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Extract Text
        const rawText = await extractTextFromPDF(buffer);

        let gabaritoText = "";
        if (gabaritoFile) {
            const gabaritoBuffer = Buffer.from(await gabaritoFile.arrayBuffer());
            gabaritoText = await extractTextFromPDF(gabaritoBuffer);
        }

        if (!rawText || rawText.length < 100) {
            return NextResponse.json({ success: false, error: "Could not extract sufficient text from PDF." }, { status: 400 });
        }

        // 2. Process with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using 1.5 Flash for speed/cost

        const prompt = `
            Você é um especialista em estruturar provas do ENEM.
            
            Tarefa:
            1. Analise o TEXTO DA PROVA abaixo e extraia as questões.
            2. Se houver um TEXTO DO GABARITO, tente encontrar a resposta correta para cada questão e preencha o campo 'correct_answer' (A, B, C, D, E).
            
            Regras de Extração:
            - Corrija quebras de linha indevidas no enunciado.
            - Ignore textos de cabeçalho/rodapé repetitivos (ex: "ENEM 2023 - PROVA AMARELA").
            - Se houver imagens na questão, o campo image_url deve ser null (será preenchido manualmente). Indicadores de imagem no texto como "(Figura 1)" devem ser mantidos no enunciado.
            - 'correct_answer' deve ser a letra da alternativa correta. Se não achar no gabarito, null.
            
            Retorne APENAS um JSON válido seguindo este esquema estrito:
            {
                "questions": [
                    {
                        "question_number": 1,
                        "statement": "Texto completo do enunciado...",
                        "alternatives": ["Texto da alternativa A", "Texto da alternativa B", ...],
                        "correct_answer": "A", // Preenchido pelo gabarito ou null
                        "area": "Linguagens" // Estime baseado no conteúdo: Linguagens, Humanas, Natureza, Matemática
                    }
                ]
            }

            TEXTO DO GABARITO:
            ${gabaritoText.slice(0, 5000)}

            TEXTO DA PROVA:
            ${rawText.slice(0, 30000)} // Limit context if too large, but Flash handles ~1M tokens so usually fine.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 3. Parse JSON
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);

        return NextResponse.json({ success: true, data: parsedData.questions });

    } catch (error: any) {
        console.error("Parse API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
