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

        // 2. Parse Answers with Regex (No AI needed)
        // Gabarito text usually follows patterns like "1 A", "91 - B", etc.
        // We look for Number followed by A-E.

        const answers: { q: number, a: string }[] = [];
        // Regex matches strictly: Start/Space + (1-3 digits) + separator? + (A-E) + End/Space
        // Examples: "1 A", "10. C", "45 - B", "12 D"
        const regex = /(?:^|\s)(\d{1,3})(?:\s*[-–.]\s*|\s+)([A-E])(?=\s|$)/gim;

        let match;
        while ((match = regex.exec(gabaritoText)) !== null) {
            const q = parseInt(match[1], 10);
            const a = match[2].toUpperCase();

            // Basic validation to avoid years (2024) or page numbers usually
            // ENEM has 180 questions max usually.
            if (q > 0 && q <= 200) {
                // Check if duplicate, overwrite or ignore? Overwrite is safer for corrections.
                const existingIndex = answers.findIndex(item => item.q === q);
                if (existingIndex >= 0) {
                    answers[existingIndex].a = a;
                } else {
                    answers.push({ q, a });
                }
            }
        }

        // Sort by question number
        answers.sort((a, b) => a.q - b.q);

        if (answers.length === 0) {
            // Fallback: Try a simpler Regex if the first one failed completely
            // Sometimes it's just "1A", "2B"
            const simpleRegex = /(\d{1,3})([A-E])/gi;
            while ((match = simpleRegex.exec(gabaritoText)) !== null) {
                const q = parseInt(match[1], 10);
                const a = match[2].toUpperCase();
                if (q > 0 && q <= 200) {
                    if (!answers.find(i => i.q === q)) answers.push({ q, a });
                }
            }
            answers.sort((a, b) => a.q - b.q);
        }

        if (answers.length === 0) {
            throw new Error("Não foi possível identificar padrões de resposta (ex: '1 A') no texto extraído.");
        }

        return NextResponse.json({ success: true, data: answers });

    } catch (error: any) {
        console.error("Parse API Error:", error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
