import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurriculumForWeek } from "@/lib/curriculum";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, week = 1, objective, examDate, daysPerWeek, hoursPerDay, occupation, difficulties, strengths, level } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 0. Persistence Check: Does this user already have a schedule for this week?
    if (userId) {
      const { data: existingSchedule } = await supabaseAdmin
        .from('user_schedules')
        .select('schedule_data')
        .eq('user_id', userId)
        .eq('week_number', week)
        .single();

      if (existingSchedule) {
        console.log("Returning cached schedule for week", week);
        return NextResponse.json({ success: true, data: existingSchedule.schedule_data, cached: true });
      }
    }

    // 1. Credits Check & Deduction (Cost: 3) -- ONLY IF NOT CACHED
    const COST = 3;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits, plan_type')
        .eq('id', userId)
        .single();

      if (profile) {
        const isAdmin = userId === "426d48bb-fc97-4461-acc9-a8a59445b72d" || profile.plan_type === 'admin';
        if (!isAdmin) {
          if (profile.credits < COST) {
            return NextResponse.json(
              { success: false, error: `Créditos insuficientes. Necessário: ${COST}, Disponível: ${profile.credits}` },
              { status: 403 }
            );
          }
          // Deduction happens AFTER successful generation to be safe, but we can reserve/deduct here.
          // Let's deduct here to prevent race conditions, or ideally transaction.
          await supabaseAdmin
            .from('profiles')
            .update({ credits: profile.credits - COST })
            .eq('id', userId);
        }
      }
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("API Key missing");
    }

    // 2. Get Curriculum for the Week
    let weekContext = "";
    const curriculum = getCurriculumForWeek(week);
    if (curriculum) {
      weekContext = `
MATÉRIAS E TÓPICOS OBRIGATÓRIOS PARA A SEMANA ${week}:
${Object.entries(curriculum).map(([subject, topic]) => `- ${subject}: ${topic}`).join("\n")}

IMPORTANTE: Você DEVE usar estritamente estes tópicos para preencher os blocos de estudo.
`;
    } else {
      weekContext = `Se for Semana 1: Foco em base e fundamentos. Se for Semana 2+: Aumente complexidade.`;
    }

    const prompt = `
Você é um MENTOR PEDAGÓGICO especialista em alta performance nos estudos.
Não apenas liste tópicos, mas ENSINE COMO ESTUDAR.

OBJETIVO:
Criar o CRONOGRAMA DA SEMANA ${week} para o aluno.
${weekContext}

PERFIL DO ALUNO:
- Objetivo: ${objective}
- Data da Prova: ${examDate}
- Disponibilidade: ${daysPerWeek} dias/semana, ${hoursPerDay} por dia
- Ocupação: ${occupation}
- Dificuldades (Prioridade Alta): ${difficulties.join(", ")}
- Pontos Fortes (Manutenção): ${strengths.join(", ")}
- Nível: ${level}

DIRETRIZES OBRIGATÓRIAS (PEDAGOGIA ATIVA):
1. O QUE ESTUDAR: Tópico específico (não genérico).
2. OBJETIVO: O que o aluno deve saber ao final? (Ex: "Entender como bhaskara se relaciona com o gráfico").
3. COMO ESTUDAR (MÉTODO): Seja prescritivo. (Ex: "Vídeo curto + 10 questões fáceis").
4. METÁFORA: Uma analogia simples para fixar o conceito mentalmente.

FORMATO DE SAÍDA (JSON OBRIGATÓRIO):
Retorne APENAS este JSON:

{
  "summary": "Dica do Mentor para a SEMANA ${week}...",
  "schedule": [
    {
      "day": "Segunda-feira",
      "blocks": [
        {
          "subject": "Matemática",
          "topic": "Funções do 2º Grau",
          "objective": "Identificar raízes e vértice no gráfico.",
          "metaphor": "O vértice é o ponto de retorno de uma bola jogada para cima.",
          "method": "Ver aula sobre Delta > 0, = 0 e < 0. Fazer 15 questões de fixação.",
          "duration": "1h"
        }
      ]
    }
  ]
}

Gere para ${daysPerWeek} dias. Respeite ${hoursPerDay}/dia. Distribua as matérias obrigatórias ao longo dos dias.
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

    // 3. Save to Persistence (User Schedules)
    if (userId) {
      try {
        await supabaseAdmin.from('user_schedules').insert({
          user_id: userId,
          week_number: week,
          schedule_data: parsedSchedule
        });
      } catch (saveError) {
        console.error("Failed to save schedule persistence:", saveError);
        // Non-blocking, continue
      }
    }

    return NextResponse.json({ success: true, data: parsedSchedule });

  } catch (error: any) {
    console.error("Schedule Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
