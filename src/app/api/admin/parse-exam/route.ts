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
            Tarefa: Extrair o GABARITO desta prova.
            
            Analise o documento (Gabarito Oficial) e retorne um JSON com o número da questão e a resposta correta.
            
            Retorne APENAS um JSON válido:
            {
                "answers": [
                    { "q": 1, "a": "A" },
                    { "q": 2, "a": "C" },
                    ...
                ]
            }
        `;
        parts.push({ text: promptText });

        // Gabarito Part (REQUIRED now)
        if (!gabaritoUrl) {
            return NextResponse.json({ success: false, error: "Gabarito URL is required for this mode." }, { status: 400 });
        }

        try {
            const gabaritoResponse = await fetch(gabaritoUrl);
            if (!gabaritoResponse.ok) throw new Error("Failed to fetch Gabarito PDF");

            const gabaritoArrayBuffer = await gabaritoResponse.arrayBuffer();
            const gabaritoBuffer = Buffer.from(gabaritoArrayBuffer);

            parts.push({
                inlineData: {
                    data: gabaritoBuffer.toString("base64"),
                    mimeType: "application/pdf",
                },
            });
        } catch (err: any) {
            return NextResponse.json({ success: false, error: "Failed to download Gabarito: " + err.message }, { status: 400 });
        }

        // 2. Process with Gemini
        // Use gemini-1.5-flash as it is efficient
        // If 1.5-flash fails, fallback to 1.0-pro (text only) is not possible with PDF.
        // We assume 1.5-flash is available. If 404, valid model name must be checked.
        // Using "gemini-1.5-flash-latest" or just "gemini-1.5-flash"
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // 3. Parse JSON
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);

        return NextResponse.json({ success: true, data: parsedData.answers });

    } catch (error: any) {
        console.error("Parse API Error:", error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
