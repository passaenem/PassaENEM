
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: usages, error } = await supabase
        .from("coupon_usages")
        .select(`
            id,
            redeemed_at,
            coupon: coupons (
                code,
                credits
            )
        `)
        .eq("user_id", user.id)
        .order("redeemed_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(usages);
}
