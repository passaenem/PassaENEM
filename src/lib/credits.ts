
import { supabase } from "@/lib/supabase";

export type PlanType = 'free' | 'pro' | 'admin';

export interface UserCredits {
    plan_type: PlanType;
    credits: number;
    last_reset: string;
}

export const FREE_PLAN_LIMIT = 20;
export const PRO_PLAN_LIMIT = 350;

/**
 * Checks if the user needs a monthly reset.
 * @param userId 
 */
export async function checkAndResetCredits(userId: string) {
    if (!supabase) return;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan_type, credits, last_reset, plan_end_date')
        .eq('id', userId)
        .single();

    if (error || !profile) return;

    const lastReset = new Date(profile.last_reset);
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // 1. Check for Plan Expiration (Downgrade to Free)
    if (profile.plan_type === 'pro' && profile.plan_end_date) {
        const planEndDate = new Date(profile.plan_end_date);

        if (now > planEndDate) {
            // Plan expired! Demote to free
            await supabase
                .from('profiles')
                .update({
                    plan_type: 'free',
                    credits: FREE_PLAN_LIMIT, // Reset to free limit
                    plan_end_date: null
                })
                .eq('id', userId);

            return; // Exit after downgrade
        }
    }

    // 2. Monthly Credit Reset (only if still active plan)
    if (lastReset < oneMonthAgo) {
        const limit = profile.plan_type === 'pro' ? PRO_PLAN_LIMIT : FREE_PLAN_LIMIT;

        await supabase
            .from('profiles')
            .update({
                credits: limit,
                last_reset: now.toISOString()
            })
            .eq('id', userId);
    }
}

/**
 * Checks if user has enough credits.
 * Returns true if allowed, false if not.
 */
export async function checkCredits(userId: string, cost: number): Promise<{ allowed: boolean; plan: PlanType; currentCredits: number }> {
    // Admin Override (Hardcoded Security)
    if (userId === "426d48bb-fc97-4461-acc9-a8a59445b72d") {
        return { allowed: true, plan: 'admin', currentCredits: 9999 };
    }

    if (!supabase) return { allowed: false, plan: 'free', currentCredits: 0 };

    // First ensure credits are up to date
    await checkAndResetCredits(userId);

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan_type, credits')
        .eq('id', userId)
        .single();

    if (error || !profile) return { allowed: false, plan: 'free', currentCredits: 0 };

    if (profile.plan_type === 'admin') return { allowed: true, plan: 'admin', currentCredits: 9999 };

    if (profile.credits >= cost) {
        return { allowed: true, plan: profile.plan_type as PlanType, currentCredits: profile.credits };
    } else {
        return { allowed: false, plan: profile.plan_type as PlanType, currentCredits: profile.credits };
    }
}

/**
 * Deducts credits from user.
 */
export async function deductCredits(userId: string, cost: number) {
    // Admin Override
    if (userId === "426d48bb-fc97-4461-acc9-a8a59445b72d") return;

    if (!supabase) return;

    const { data: profile } = await supabase
        .from('profiles')
        .select('credits, plan_type')
        .eq('id', userId)
        .single();

    if (!profile || profile.plan_type === 'admin') return;

    const newCredits = Math.max(0, profile.credits - cost);

    await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId);
}
