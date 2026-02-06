import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser();

        // Hardcoded Admin Check (matches middleware)
        const ADMIN_ID = '426d48bb-fc97-4461-acc9-a8a59445b72d';

        if (!user || user.id !== ADMIN_ID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { userId, days } = body;

        console.log(`Admin ${user.id} granting PRO to ${userId} for ${days} days`);

        if (!userId || !days) {
            return NextResponse.json({ error: "Missing userId or days" }, { status: 400 });
        }

        // 2. Calculate Expiration
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(days));

        // 3. Update Profile
        const { error } = await supabase
            .from('profiles')
            .update({
                plan_type: 'pro',
                plan_expires_at: expiryDate.toISOString()
            })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            newPlan: 'pro',
            expiresAt: expiryDate.toISOString()
        });

    } catch (error: any) {
        console.error("Error granting pro:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
