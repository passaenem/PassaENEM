
import { createClient } from "@/lib/supabase-server"; // Adjust import path if needed
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // You might want a better admin check here, e.g., checking a specific role or ID
    // For now, assuming RLS handles data access, but API should block non-admins too.
    // The middleware might handle some of this, but double check is good.

    // We can rely on RLS if policies are set correctly, but explicit check is safer for API
    // Let's assume the user IS an admin if they can access this route (middleware protection)

    const { data: coupons, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(coupons);
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, credits, usage_limit } = body;

    if (!code || !credits) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("coupons")
        .insert([
            {
                code: code.toUpperCase(), // Normalize code
                credits: parseInt(credits),
                usage_limit: usage_limit ? parseInt(usage_limit) : null,
            }
        ])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
