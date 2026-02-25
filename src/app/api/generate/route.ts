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
        // NEW: EXPERT EDUCATOR PERSONA (Applied to both CONCURSO and ENEM logic)
        // We unify the logic to ensure high quality for all types.

        let finalPrompt = "";
        const commonRules = `
Você é um educador especialista em provas do ENEM e concursos públicos, com foco em aprendizado real, estratégia de prova e desenvolvimento cognitivo do aluno.

OBJETIVO PRINCIPAL:
Não apenas avaliar, mas ENSINAR o aluno a compreender o conteúdo, memorizar conceitos e melhorar o desempenho em provas reais.

DIRETRIZES OBRIGATÓRIAS:

1. CRIAÇÃO DE QUESTÕES (BASE REAL)
- AJA COMO UM BANCO DE QUESTÕES: Baseie-se fortemente em questões REAIS que caíram em provas anteriores (2018-2025) da banca/prova solicitada.
- Se possível, adapte questões clássicas para garantir fidelidade ao estilo de cobrança.
- Priorize os temas "queridinhos" da banca (aqueles que sempre caem).
- O enunciado deve ser rico e contextualizado, idêntico ao da prova real.

2. DISTRIBUIÇÃO EQUILIBRADA DAS RESPOSTAS CORRETAS (OBRIGATÓRIO)
- Ao gerar um conjunto de questões, distribua as alternativas corretas de forma BALANCEADA entre as letras A, B, C, D e E.
- NUNCA concentre a maioria das respostas corretas em uma única letra.
- A distribuição deve ser natural, sem padrão previsível (ex: não sequencial A, B, C, D...).
- REGRA FINAL OBRIGATÓRIA: Antes de retornar o JSON, faça uma VERIFICAÇÃO INTERNA contando quantas vezes cada letra aparece como "alternativa_correta". Se alguma letra representar mais de 40% das respostas do simulado, REORGANIZE as questões para equilibrar a distribuição.
- Exemplo de distribuição saudável para 10 questões: A(2), B(2), C(2), D(2), E(2). Para 5 questões: cada letra pode aparecer 1 vez. Variações são aceitas, mas sem dominância.
`;

        const explanationRules = `
        // 2. EXPLICAÇÃO PEDAGÓGICA (ULTRA-CONCISA E VISUAL)
        REGRA DE OURO: SEJA DIRETO. Use frases curtas (max 15 palavras). Use tópicos.
        
        ESTRUTURA DA EXPLICAÇÃO (JSON):
        a) "analise_erro": Se o aluno errou, qual foi o raciocínio errado dele? (Ex: "Você confundiu Mitocôndria com Cloroplasto"). Seja empático mas direto.
        b) "gabarito_detalhado": LISTA de 3 a 4 pontos curtos explicando a correta. (Ex: ["Produz ATP", "Respiração Celular", "Usa Glicose"]).
        c) "metafora": A MELHOR parte. Uma analogia simples e visual. (Ex: "Mitocôndria = Usina de Energia").
        d) "por_que_nao_outras": Explique em 1 linha por que cada distrator está errado.
        e) "enem_contexto": Qual habilidade ou padrão da banca isso segue?
        f) "dica_revisao": Uma frase "imediata" para lembrar na prova.
        
        FORMATO DE SAÍDA: JSON APENAS.
        `;

        if (type === 'CONCURSO') {
            finalPrompt = `
${commonRules}
${explanationRules}

CONTEXTO: CONCURSO PÚBLICO
- Área: ${params.area || "Geral"}
- Cargo: ${params.cargo || "Não especificado"}
- Banca: ${params.banca || "Genérica"}
- Disciplina: ${params.disciplina || "Conhecimentos Gerais"}
- Nível: ${params.nivel || "Médio"}

JSON ESPERADO:
{
  "tipo_prova": "CONCURSO",
  "area": "${params.area}",
  "tema": "${params.disciplina}",
  "questoes": [
    {
      "id": 1,
      "enunciado": "Texto da questão...",
      "alternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "alternativa_correta": "A",
      "explicacao": {
        "analise_erro": "Você provavelmente pensou que...",
        "gabarito_detalhado": ["Ponto chave 1", "Ponto chave 2", "Conclusão"],
        "metafora": "Imagine uma ESTRADA ESBURACADA...",
        "por_que_nao_outras": "B: Errada pois fala de X.\\nC: Errada pois o prazo é Y.",
        "enem_contexto": "A banca FGV ama cobrar exceções desta lei.",
        "dica_revisao": "Prazo de 5 dias = Recurso Administrativo."
      },
      "dificuldade": "${params.nivel}",
      "pontuacao": 175
    }
  ]
}
`;
        } else {
            // ENEM / GERAL Logic
            finalPrompt = `
${commonRules}
${explanationRules}

CONTEXTO: ENEM / VESTIBULAR
- Área: ${params.area || "Geral"}
- Tema: ${params.tema || params.disciplina || "Geral"}
- Nível: ${params.nivel || "Médio"}

MEMÓRIA DO ENEM:
- Questões interpretativas e contextualizadas.

JSON ESPERADO:
{
  "tipo_prova": "ENEM",
  "area": "${params.area}",
  "tema": "${params.tema}",
  "questoes": [
    {
      "id": 1,
      "enunciado": "Texto base... Comando...",
      "alternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "alternativa_correta": "A",
      "explicacao": {
        "analise_erro": "Você confundiu o conceito X com Y.",
        "gabarito_detalhado": ["O texto afirma que...", "A ciência explica que...", "Logo, a correta é A."],
        "metafora": "A célula é como uma FÁBRICA...",
        "por_que_nao_outras": "B: Errada porque contradiz o texto.\\nC: Errada pois é o oposto.",
        "enem_contexto": "Habilidade H12: Relacionar conceitos...",
        "dica_revisao": "Energia = Mitocôndria."
      },
      "dificuldade": "${params.nivel}",
      "pontuacao": 175
    }
  ]
}
`;
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
        const rawQuestions = parsedData.questoes.map((q: any) => ({
            rawData: q,
            alternativa_correta: q.alternativa_correta as string
        }));

        // ── VERIFICAÇÃO DE DISTRIBUIÇÃO BALANCEADA ────────────────────────────────
        // Conta a frequência de cada letra correta
        const letterCount: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
        for (const rq of rawQuestions) {
            const letter = rq.alternativa_correta?.toUpperCase();
            if (letter && letter in letterCount) letterCount[letter]++;
        }

        const totalQ = rawQuestions.length;
        const maxAllowed = Math.ceil(totalQ * 0.45); // Nenhuma letra pode ter mais de 45% das respostas

        // Shuffle das alternativas para equilibrar caso haja desequilíbrio
        const dominantLetter = Object.entries(letterCount).find(([, count]) => count > maxAllowed)?.[0];

        if (dominantLetter) {
            console.warn(`[Balance] Letra "${dominantLetter}" concentra ${letterCount[dominantLetter]}/${totalQ} respostas. Rebalanceando...`);

            // Para cada questão onde a letra dominante é correta (exceto algumas),
            // rotacionamos as alternativas para mover a correta para outra posição.
            const optionKeys = ["A", "B", "C", "D", "E"];
            let fixCount = 0;
            const maxFixes = letterCount[dominantLetter] - Math.floor(totalQ / optionKeys.length) - 1;

            for (const rq of rawQuestions) {
                if (fixCount >= maxFixes) break;
                if (rq.alternativa_correta?.toUpperCase() !== dominantLetter) continue;

                // Encontra uma letra sub-representada para ser a nova correta
                const targetLetter = optionKeys.find(
                    k => k !== dominantLetter && letterCount[k] < Math.ceil(totalQ / optionKeys.length)
                );
                if (!targetLetter) break;

                // Troca os textos das alternativas entre dominantLetter e targetLetter
                const q = rq.rawData;
                const temp = q.alternativas[dominantLetter];
                q.alternativas[dominantLetter] = q.alternativas[targetLetter];
                q.alternativas[targetLetter] = temp;
                q.alternativa_correta = targetLetter;
                rq.alternativa_correta = targetLetter;

                letterCount[dominantLetter]--;
                letterCount[targetLetter]++;
                fixCount++;
            }

            console.log(`[Balance] Distribuição final:`, letterCount);
        }
        // ─────────────────────────────────────────────────────────────────────────

        const adaptedQuestions = rawQuestions.map(({ rawData: q }) => {
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
                pontuacao: q.pontuacao || Math.floor(Math.random() * 4 + 1) * 100
            };
        });

        // 4. Deduct Credits (Server-Side) - NOW WE DEDUCT
        if (userId) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service Role

            if (supabaseUrl && supabaseKey) {
                const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('credits, plan_type')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    const isAdmin = userId === "426d48bb-fc97-4461-acc9-a8a59445b72d" || profile.plan_type === 'admin';
                    if (!isAdmin) {
                        // Deduct cost (usually 1 per generation or proportional to quantity)
                        // Assuming 1 credit per generation request for now, or match existing logic?
                        // Frontend was deducting "Number(formData.quantidade)" in some places?
                        // Let's check logic: if prompt generates 5 questions, cost is 5?
                        // Credits are usually "generations" or "questions"?
                        // Looking at dashboard: "Credits: 20". A question batch might cost more.
                        // In lib/credits.ts calling code passed "quantity".
                        // So we deduct 'quantity'.
                        const cost = quantity;

                        await supabaseAdmin
                            .from('profiles')
                            .update({ credits: Math.max(0, profile.credits - cost) })
                            .eq('id', userId);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, data: adaptedQuestions });

    } catch (error: any) {
        console.error("Generate Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to generate questions" },
            { status: 500 }
        );
    }
}
