import { createClient } from "@supabase/supabase-js";

export async function handleProActivation(userId: string, amount: number | undefined, type: string, paymentId: string) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("[Payment] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing! Cannot grant permissions.");
        return { success: false, error: "Server Configuration Error: Missing Service Key" };
    }

    // Initialize Supabase Admin client to bypass RLS for updates
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`[Payment] Activating PRO for user ${userId}, Amount: ${amount}, Type: ${type}, PaymentID: ${paymentId}`);
    console.log(`[Payment] Using Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)}...`);

    // 1. Calculate End Date
    const endDate = new Date();
    // Default 30 days for all paid plans currently, including test plan as per request
    endDate.setDate(endDate.getDate() + 30);

    // 2. Upsert Profile (Idempotent)
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            plan_type: 'pro',
            credits: 350,
            plan_end_date: endDate.toISOString(),
            updated_at: new Date().toISOString()
        });

    if (updateError) {
        console.error("[Payment] Profile update error:", updateError);
        return { success: false, error: updateError };
    }

    // 3. Log Payment (Idempotent check needed ideally, but insert is fine for now, duplicate logs are better than none)
    // To handle idempotency better, we could check if payment_id exists first, but let's just log.
    const { error: logError } = await supabaseAdmin.from('payments').insert({
        user_id: userId,
        amount: amount || 0,
        status: 'approved',
        type: type,
        external_id: paymentId,
        created_at: new Date().toISOString()
    });

    if (logError) {
        console.error("[Payment] Payment log error:", logError);
        // Don't fail the whole process if logging fails
    } else {
        console.log(`[Payment] User ${userId} upgraded to PRO via payment ${paymentId}.`);
    }

    return { success: true };
}
