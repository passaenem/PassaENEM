import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Use global client for Cron

export const dynamic = 'force-dynamic';

const FREE_PLAN_LIMIT = 20;
const PRO_PLAN_LIMIT = 350;

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Supabase not initialized" }, { status: 500 });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString();

        // 1. Find users who need reset
        // last_reset < 30 days ago OR last_reset IS NULL
        const { data: usersToReset, error: fetchError } = await supabase
            .from('profiles')
            .select('id, plan_type, last_reset, email')
            .or(`last_reset.lt.${cutoffDate},last_reset.is.null`);

        if (fetchError) throw fetchError;

        if (!usersToReset || usersToReset.length === 0) {
            return NextResponse.json({ message: "No users need credit renewal today", count: 0 });
        }

        console.log(`Found ${usersToReset.length} users for credit renewal.`);

        // 2. Reset their credits based on plan
        const updates = usersToReset.map(user => {
            const limit = user.plan_type === 'pro' ? PRO_PLAN_LIMIT : FREE_PLAN_LIMIT;

            return supabase!
                .from('profiles')
                .update({
                    credits: limit,
                    last_reset: now.toISOString()
                })
                .eq('id', user.id);
        });

        await Promise.all(updates);

        return NextResponse.json({
            success: true,
            message: `Renewed credits for ${usersToReset.length} users`,
            renewed_count: usersToReset.length
        });

    } catch (error: any) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
