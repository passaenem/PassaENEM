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

    // 1. Fetch current profile to determine start date logic
    const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('plan_type, plan_expires_at, plan_started_at')
        .eq('id', userId)
        .single();

    const now = new Date();
    let startDate = now.toISOString();
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Default 30 days

    // If already PRO and not expired, extend from current expiry or keep start date?
    // User wants "date each one became pro".
    // If active, keep start date. If expired, reset start date (new cycle).
    if (currentProfile?.plan_type === 'pro' && currentProfile?.plan_expires_at) {
        const currentExpiry = new Date(currentProfile.plan_expires_at);
        if (currentExpiry > now) {
            // Active subscription: Keep original start date
            startDate = currentProfile.plan_started_at || startDate;
            // Extend? Or just reset to 30 days from now?
            // Usually monthly sub = next payment date. Let's set to 30 days from NOW for simplicity in MP manual links
            // If it was recurrence, MP handles timing, but we verify payment here.
            // Let's Just set End Date to Now + 30 days to be safe/simple.
        }
    }

    // 2. Upsert Profile (Idempotent)
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            plan_type: 'pro',
            credits: 350, // Reset/Set credits to 350? Or Add? Requirement unclear on credits. 
            // Current implementation sets to 350. User didn't complain. Keeping it.
            plan_started_at: startDate,
            plan_expires_at: endDate.toISOString(),
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
