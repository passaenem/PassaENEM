import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { objective, examDate, daysPerWeek, hoursPerDay, occupation, difficulties, strengths, level } = body;

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("API Key missing");
        }

        const prompt = `
Você é um educador especialista em provas do ENEM e concursos públicos, com foco em aprendizado real e organização de estudos.

OBJETIVO:
Criar um CRONOGRAMA DE ESTUDOS PERSONALIZADO (Semana 1) para o aluno com base nos dados abaixo:

PERFIL DO ALUNO:
- Objetivo: ${objective}
- Data da Prova: ${examDate}
- Disponibilidade: ${daysPerWeek} dias/semana, ${hoursPerDay} por dia
- Ocupação: ${occupation}
- Dificuldades (Prioridade Alta): ${difficulties.join(", ")}
- Pontos Fortes (Manutenção): ${strengths.join(", ")}
- Nível Autoavaliado: ${level}

DIRETRIZES OBRIGATÓRIAS:
1. DISTRIBUIÇÃO INTELIGENTE
- Aloque mais tempo (e dias frescos) para as Dificuldades.
- Mantenha contato constante com Pontos Fortes (via exercícios/revisão) para não esquecer.
- Respeite a carga horária de ${hoursPerDay}.

2. ESTRUTURA DO ESTUDO (CICLO DE ESTUDO)
Para cada bloco de estudo, defina O QUE fazer:
- Teoria (Vídeo/Leitura)
- Prática (Exercícios)
- Revisão (Flashcards/Resumo)

3. FORMATO DE SAÍDA (JSON OBRIGATÓRIO)
Retorne APENAS um JSON válido seguindo estritamente este formato, sem textos adicionais:

{
  "summary": "Resumo motivacional e dicas gerais para esse perfil...",
  "schedule": [
    {
      "day": "Segunda-feira",
      "blocks": [
        {
          "subject": "Matemática",
          "topic": "Funções de 1º Grau",
          "details": "Foco em interpretar gráficos. (Teoria + 10 exercícios)",
          "duration": "1h"
        },
        {
          "subject": "Redação",
          "topic": "Estrutura do Texto Dissertativo",
          "details": "Ler cartilha nota 1000.",
          "duration": "1h"
        }
      ]
    },
    {
      "day": "Terça-feira",
      "blocks": []
    }
  ]
}

Gere o cronograma para os ${daysPerWeek} dias de estudo. Se faltar dias da semana (ex: aluno estuda 5 dias), não inclua os dias de descanso no array ou deixe vazio.
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiContent) throw new Error("No content from AI");

        const parsedSchedule = JSON.parse(aiContent);

        return NextResponse.json({ success: true, data: parsedSchedule });

    } catch (error: any) {
        console.error("Schedule Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
