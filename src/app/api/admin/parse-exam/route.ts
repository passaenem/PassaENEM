import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
export const runtime = 'nodejs'; // Enforce Node.js runtime for this route

const PDF_CO_API_KEY = "leandropiresnunes64@gmail.com_VB9NK4D1mW21vvlZqQuuI4tWAmcSz1mvXgdPFxrrPcnTnMv52AYt4De42B0Iu04O";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gabaritoUrl } = body;

        if (!gabaritoUrl) {
            return NextResponse.json({ success: false, error: "Gabarito URL is required." }, { status: 400 });
        }

        // 1. Text Extraction via PDF.co
        // We use their API to convert the remote PDF URL to text directly.
        // No need to download the file locally first.

        const pdfCoResponse = await fetch("https://api.pdf.co/v1/pdf/convert/to/text", {
            method: "POST",
            headers: {
                "x-api-key": PDF_CO_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: gabaritoUrl,
                inline: true,
                async: false
            })
        });

        if (!pdfCoResponse.ok) {
            const errText = await pdfCoResponse.text();
            throw new Error(`PDF.co API Error (${pdfCoResponse.status}): ${errText}`);
        }

        const pdfCoData = await pdfCoResponse.json();

        if (pdfCoData.error) {
            throw new Error(`PDF.co Error: ${pdfCoData.message}`);
        }

        const gabaritoText = pdfCoData.body;

        if (!gabaritoText || gabaritoText.length < 10) {
            throw new Error("Gabarito Text appears empty.");
        }

        // 2. Process with Gemini Pro (Text Only)
        // Using 'gemini-pro' which is widely available and stable for text.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            Tarefa: Extrair o GABARITO deste texto obtido da conversão de um PDF.
            
            Texto:
            """
            ${gabaritoText.slice(0, 15000)}
            """
            
            Instruções:
            - Identifique o número da questão e a alternativa correta (A, B, C, D, E).
            - Ignore cabeçalhos, rodapés ou textos irrelevantes.
            - Retorne APENAS um JSON válido.
            - Formato: { "answers": [{ "q": 1, "a": "A" }, ...] }
        `;

        const result = await model.generateContent(prompt);
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
