import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { targetUserId, amount } = await req.json();

        if (!targetUserId || amount === undefined) {
            return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Erro de configuração." }, { status: 500 });
        }

        // 1. Verify Admin Session (Securely)
        const cookieStore = await cookies();

        const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        });

        const { data: { user } } = await supabaseAuth.auth.getUser();
        const ADMIN_ID = "426d48bb-fc97-4461-acc9-a8a59445b72d";

        if (!user || user.id !== ADMIN_ID) {
            return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
        }

        // 2. Perform Update with Service Role
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', targetUserId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: "Usuário alvo não encontrado." }, { status: 404 });
        }

        const newCredits = Math.max(0, (profile.credits || 0) + Number(amount));

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', targetUserId);

        if (updateError) {
            return NextResponse.json({ error: "Erro ao atualizar: " + updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, newCredits });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
