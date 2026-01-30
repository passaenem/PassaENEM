import { NextResponse } from "next/server";
import { PROMPTS } from "@/lib/prompts";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, userId, ...params } = body;

        // 0. Security & Validation
        const quantity = Number(params.quantidade || 5);

        // a) Validate Max Questions
        if (quantity > 100) {
            return NextResponse.json(
                { success: false, error: "O limite máximo é de 100 questões por prova." },
                { status: 400 }
            );
        }

        // b) Validate Credits (Server-Side)
        if (userId) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role for safe checking

            if (supabaseUrl && supabaseKey) {
                const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('credits, plan_type')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    // Admin exemption
                    const isAdmin = userId === "426d48bb-fc97-4461-acc9-a8a59445b72d" || profile.plan_type === 'admin';

                    if (!isAdmin && profile.credits < quantity) {
                        return NextResponse.json(
                            { success: false, error: `Limite de questões atingido. Necessário: ${quantity}, Disponível: ${profile.credits}` },
                            { status: 403 }
                        );
                    }
                }
            }
        }

        // 1. Construct the Prompt
        let finalPrompt = "";

        if (type === 'CONCURSO') {
            finalPrompt = `
Você é uma IA especializada na criação de questões para concursos públicos brasileiros.
As questões devem seguir o estilo de bancas organizadoras reais e respeitar o nível do cargo.

Parâmetros recebidos:
- Área do Concurso: ${params.area || "Geral"}
- Subárea / Cargo: ${params.cargo || "Não especificado"}
- Banca: ${params.banca || "Genérica / Estilo Geral"}
- Disciplina: ${params.disciplina || "Conhecimentos Gerais"}
- Nível de dificuldade: ${params.nivel || "Médio"}
- Quantidade de questões: ${quantity}

Regras obrigatórias:
1. Se houver Subárea / Cargo, as questões DEVEM ser específicas para esse cargo.
2. Caso a Área possua múltiplas subáreas (ex: Saúde, Policial, Tecnologia), NÃO gere conteúdo genérico.
3. Respeite o estilo da banca informada:
   - FCC: enunciados longos, alternativas técnicas
   - FGV: contextualização, interpretação e casos práticos
   - VUNESP: objetividade e literalidade
   - CESPE/Cebraspe: assertivas certo/errado ou alto rigor conceitual (Sempre adapte para Múltipla Escolha ABCDE neste sistema)
   - IBFC / AOCP: abordagem direta e cobrança normativa

Siga OBRIGATORIAMENTE o passo a passo abaixo antes de gerar qualquer conteúdo.

========================
PASSO 1 — PLANEJAMENTO DA PROVA
========================
Antes de escrever as questões, planeje mentalmente:
- Distribuição equilibrada de dificuldade
- Linguagem adequada ao nível informado
- Apenas UMA alternativa correta por questão
- Conteúdo coerente com a área e o tema

========================
PASSO 2 — FORMATO DE SAÍDA (OBRIGATÓRIO)
========================
Retorne APENAS um JSON válido, sem textos fora dele, seguindo exatamente este modelo:

{
  "tipo_prova": "CONCURSO",
  "area": "${params.area}",
  "tema": "${params.disciplina}",
  "tempo_total_minutos": ${params.tempo || 15},
  "pontuacao_total": ${quantity},
  "questoes": [
    {
      "id": 1,
      "enunciado": "Texto completo da questão",
      "alternativas": {
        "A": "Texto alternativa A",
        "B": "Texto alternativa B",
        "C": "Texto alternativa C",
        "D": "Texto alternativa D",
        "E": "Texto alternativa E"
      },
      "alternativa_correta": "A",
      "explicacao": "Explicação clara e objetiva",
      "dificuldade": "${params.nivel}",
      "pontuacao": 175
    }
  ]
}

REGRAS FINAIS (CRÍTICAS):
- NÃO escreva nada fora do JSON
- NÃO use markdown
- NÃO explique o que está fazendo
- NÃO invente dados incorretos
`;
        } else {
            // Default (ENEM or General)
            finalPrompt = PROMPTS.SYSTEM_BASE
                .replace('{tipo_prova}', type)
                .replace('{area}', params.area || "Geral")
                .replace('{tema}', params.tema || params.disciplina || "Geral")
                .replace('{nivel}', params.nivel || "Médio")
                .replace('{quantidade}', quantity.toString())
                .replace('{tempo}', params.tempo || 15);
        }

        // 2. Call Google Gemini API (Direct)
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("API Key is MISSING in environment variables");
            throw new Error("API Key missing");
        }

        const modelName = "gemini-2.5-flash"; // Or 2.0-flash experimental if available, sticking to known working

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: finalPrompt + `\n\nUser Request: Gere ${params.quantidade} questões sobre ${params.tema || params.disciplina}.` }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    response_mime_type: "application/json"
                }
            })
        });

        // --- SUPABASE LOGGING (FIRE AND FORGET) ---
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                // Try to get user ID if sent in headers or body, but for now just log the action
                // Ideally we'd parse cookies here but let's keep it simple for speed
                const userId = body.userId || null;

                await supabase.from('app_usage_logs').insert([
                    {
                        user_id: userId,
                        action: 'ai_generation',
                        details: {
                            type,
                            topic: params.tema || params.disciplina,
                            questions_count: params.quantidade,
                            model: modelName
                        }
                    }
                ]);
            }
        } catch (logErr) {
            console.warn("Failed to log usage:", logErr);
            // Don't fail the request if logging fails
        }
        // -------------------------------------------

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API Error Response:", errText);

            if (response.status === 429) {
                throw new Error("Limite de uso gratuito atingido. Aguarde cerca de 30 segundos e tente novamente.");
            }

            throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        // Extract text from Gemini structure: candidates[0].content.parts[0].text
        const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiContent) {
            console.error("Gemini response missing content", data);
            throw new Error("No content received from Gemini");
        }

        // 3. Parse and Adapt JSON
        let parsedData;
        try {
            const cleanContent = aiContent.replace(/```json|```/g, '').trim();
            parsedData = JSON.parse(cleanContent);
        } catch (e) {
            console.error("JSON Parse Error:", aiContent);
            throw new Error("Failed to parse AI response.");
        }

        // Adapt strict JSON schema to our Frontend interface
        const adaptedQuestions = parsedData.questoes.map((q: any) => {
            const optionKeys = ["A", "B", "C", "D", "E"];
            const optionsArray = optionKeys.map(key => q.alternativas[key]);
            const correctIndex = optionKeys.indexOf(q.alternativa_correta);

            return {
                id: q.id || Math.random().toString(36).substr(2, 9),
                type: type,
                question: q.enunciado,
                options: optionsArray,
                correctAnswer: correctIndex, // Index (0-4)
                explanation: q.explicacao,
                difficulty: q.dificuldade,
                topic: params.tema || params.disciplina,
                context: q.contexto || undefined,
                pontuacao: q.pontuacao || Math.floor(Math.random() * 4 + 1) * 100 // Fallback random 100-400
            };
        });

        return NextResponse.json({ success: true, data: adaptedQuestions });

    } catch (error: any) {
        console.error("Generate Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to generate questions" },
            { status: 500 }
        );
    }
}
