import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
export const runtime = 'nodejs'; // Enforce Node.js runtime for this route

// Text Extraction Helper
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const pdfModule = await import('pdf-parse');
        const pdf = (pdfModule as any).default || pdfModule;
        const data = await pdf(buffer);
        return data.text;
    } catch (error: any) {
        console.error("PDF-Parse Error:", error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gabaritoUrl } = body;

        if (!gabaritoUrl) {
            return NextResponse.json({ success: false, error: "Gabarito URL is required." }, { status: 400 });
        }

        // 1. Fetch Gabarito PDF
        const gabaritoResponse = await fetch(gabaritoUrl);
        if (!gabaritoResponse.ok) throw new Error("Failed to fetch Gabarito PDF");

        const gabaritoArrayBuffer = await gabaritoResponse.arrayBuffer();
        const gabaritoBuffer = Buffer.from(gabaritoArrayBuffer);

        // 2. Extract Text (using pdf-parse)
        // Gabaritos are usually simple tables/lists, pdf-parse handles them well enough for AI to clean up.
        const gabaritoText = await extractTextFromPDF(gabaritoBuffer);

        if (!gabaritoText || gabaritoText.length < 10) {
            throw new Error("Gabarito PDF appears empty or unreadable.");
        }

        // 3. Process with Gemini Pro (Text Only)
        // Using 'gemini-pro' which is widely available and stable for text.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            Tarefa: Extrair o GABARITO deste texto obtido de um PDF.
            
            Texto do PDF:
            """
            ${gabaritoText.slice(0, 10000)}
            """
            
            Instruções:
            - Identifique o número da questão e a alternativa correta (A, B, C, D, E).
            - Retorne APENAS um JSON válido.
            - Formato: { "answers": [{ "q": 1, "a": "A" }, ...] }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 4. Parse JSON
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);

        return NextResponse.json({ success: true, data: parsedData.answers });

    } catch (error: any) {
        console.error("Parse API Error:", error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
