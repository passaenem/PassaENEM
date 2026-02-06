import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use Brazil time for date consistency
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

        const { error } = await supabase
            .from('daily_motivation_views')
            .insert({ user_id: user.id, date: today });

        if (error) {
            // Ignore unique constraint violation (already viewed)
            if (error.code === '23505') {
                return NextResponse.json({ success: true, message: "Already viewed" });
            }
            throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error logging view:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
