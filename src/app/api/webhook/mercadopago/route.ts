import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get("topic") || url.searchParams.get("type");
        const id = url.searchParams.get("id") || url.searchParams.get("data.id");

        console.log(`Webhook received: Topic=${topic}, ID=${id}`);

        if (!id) {
            return NextResponse.json({ status: "ignored", message: "No ID provided" });
        }

        if (topic === "payment") {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: id });

            console.log("Payment status:", paymentData.status);

            if (paymentData.status === 'approved' || paymentData.status === 'authorized') {
                const userId = paymentData.external_reference;
                const amount = paymentData.transaction_amount;

                if (userId) {
                    await handleProActivation(userId, amount, 'one_time', id);
                } else {
                    console.warn(`Payment ${id} approved but no external_reference (userId) found.`);
                }
            }
        }
        else if (topic === "subscription_preapproval") {
            // We can handle subscription status changes here if needed
        }

        return NextResponse.json({ status: "success" });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleProActivation(userId: string, amount: number | undefined, type: string, paymentId: string) {
    // Initialize Supabase Admin client to bypass RLS for updates
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Activate PRO
    const endDate = new Date();

    // Check if it's the Test Plan (R$ 1.00) => 1 Day Duration
    // Otherwise (R$ 35.00 or R$ 49.90) => 30 Days Duration
    if (amount === 1.00) {
        endDate.setDate(endDate.getDate() + 1); // 1 Day for Test
    } else {
        endDate.setDate(endDate.getDate() + 30); // 30 Days for Monthly/Recurring
    }

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            plan_type: 'pro',
            credits: 120,
            plan_end_date: endDate.toISOString(),
        })
        .eq('id', userId);

    if (updateError) {
        console.error("Profile update error:", updateError);
        return;
    }

    // 2. Log Payment
    const { error: logError } = await supabaseAdmin.from('payments').insert({
        user_id: userId,
        amount: amount,
        status: 'approved',
        type: type,
        external_id: paymentId
    });

    if (logError) console.error("Payment log error:", logError);
    else console.log(`User ${userId} upgraded to PRO via payment ${paymentId}.`);
}
