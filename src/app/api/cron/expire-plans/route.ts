import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Use global client for Cron (Bypass auth/cookie requirement)

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Supabase not initialized" }, { status: 500 });
        }

        const todayISO = new Date().toISOString();

        // 1. Find expired users
        // plan_type = 'pro' AND plan_expires_at < NOW()
        const { data: expiredUsers, error: fetchError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('plan_type', 'pro')
            .lt('plan_expires_at', todayISO);

        if (fetchError) throw fetchError;

        if (!expiredUsers || expiredUsers.length === 0) {
            return NextResponse.json({ message: "No expired plans found", count: 0 });
        }

        console.log(`Found ${expiredUsers.length} expired pro plans. Reverting to free...`);

        // 2. Update them to 'free' and clear expiration
        const updates = expiredUsers.map(user =>
            supabase
                .from('profiles')
                .update({ plan_type: 'free', plan_expires_at: null })
                .eq('id', user.id)
        );

        await Promise.all(updates);

        return NextResponse.json({
            success: true,
            message: `Reverted ${expiredUsers.length} users to Free plan`,
            users: expiredUsers.map(u => u.email)
        });

    } catch (error: any) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
