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
        const { userId } = body;

        console.log(`Admin ${user.id} revoking PRO from ${userId}`);

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        // 2. Update Profile to Free
        // We clear valid dates to indicate no active plan.
        const { error } = await supabase
            .from('profiles')
            .update({
                plan_type: 'free',
                plan_expires_at: null,
                plan_started_at: null
            })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            newPlan: 'free'
        });

    } catch (error: any) {
        console.error("Error revoking pro:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
