
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
        return NextResponse.json({ error: "Código do cupom é obrigatório" }, { status: 400 });
    }

    // 1. Fetch Coupon
    const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

    if (couponError || !coupon) {
        return NextResponse.json({ error: "Cupom inválido ou não encontrado" }, { status: 404 });
    }

    // 2. Validate Coupon Status
    if (!coupon.active) {
        return NextResponse.json({ error: "Este cupom foi desativado" }, { status: 400 });
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
        return NextResponse.json({ error: "Este cupom atingiu o limite de uso" }, { status: 400 });
    }

    // 3. Check if user already used ANY coupon (Global Limit: 1 coupon per user)
    const { data: usage, error: usageError } = await supabase
        .from("coupon_usages")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (usage) {
        return NextResponse.json({ error: "Você já resgatou um cupom anteriormente. Limite de 1 por usuário." }, { status: 400 });
    }

    // 4. Redeeming Process (Atomic Transaction ideally, but Supabase JS doesn't support easy transactions yet unless via RPC)
    // We will do optimistic checks and rely on unique constraints if needed, but RLS prevents race conditions somewhat.
    // Ideally we usage a Postgres Function (RPC) for this.

    // For now, simpler approach:
    // Insert usage -> Update coupon count -> Add credits

    const { error: insertError } = await supabase
        .from("coupon_usages")
        .insert({
            coupon_id: coupon.id,
            user_id: user.id
        });

    if (insertError) {
        if (insertError.code === '23505') { // Unique violation
            return NextResponse.json({ error: "Você já utilizou este cupom" }, { status: 400 });
        }
        return NextResponse.json({ error: "Erro ao processar cupom" }, { status: 500 });
    }

    // 5. Add Credits Logic
    console.log(`[Redeem] Adding ${coupon.credits} credits to user ${user.id}`);

    // Try RPC first (Preferred - Security Definer)
    const { error: rpcError } = await supabase.rpc('add_user_credits', {
        user_id: user.id,
        amount: Number(coupon.credits)
    });

    if (rpcError) {
        console.error("[Redeem] RPC Error:", rpcError);

        // Fallback: Direct Update (Only works if RLS allows or Service Role is used - likely to fail if RLS is strict)
        // We attempt to fetch current credits and update.
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (fetchError || !profile) {
            console.error("[Redeem] Fetch Profile Error:", fetchError);
            return NextResponse.json({ error: "Erro ao buscar perfil do usuário." }, { status: 500 });
        }

        const newCredits = (profile.credits || 0) + Number(coupon.credits);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', user.id);

        if (updateError) {
            console.error("[Redeem] Update Fallback Error:", updateError);
            // Critical failure: Coupon usage recorded but credits NOT added.
            // Ideally we should rollback the usage here, but we lack transactions.
            // We will return a specific error so the frontend knows.
            return NextResponse.json({
                error: "Cupom validado, mas houve um erro ao adicionar os créditos. Por favor, contate o suporte imediatamente."
            }, { status: 500 });
        }

        console.log("[Redeem] Credits added via fallback update.");
    } else {
        console.log("[Redeem] Credits added via RPC.");
    }

    return NextResponse.json({ success: true, message: `Cupom resgatado! ${coupon.credits} créditos adicionados.` });
}
