import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { handleProActivation } from "@/lib/payments";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get("topic") || url.searchParams.get("type");
        const id = url.searchParams.get("id") || url.searchParams.get("data.id");

        console.log(`[Webhook] 🔔 Notification Received! Topic: ${topic}, ID: ${id}`);
        console.log(`[Webhook] URL: ${req.url}`);

        if (!id) {
            console.log("[Webhook] ⚠️ No ID provided, ignoring.");
            return NextResponse.json({ status: "ignored", message: "No ID provided" });
        }

        if (topic === "payment") {
            console.log(`[Webhook] 🔍 Fetching payment ${id} from Mercado Pago...`);
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: id });

            console.log(`[Webhook] 🧾 Payment Status: ${paymentData.status}`);
            console.log(`[Webhook] 👤 External Reference (User ID): ${paymentData.external_reference}`);
            console.log(`[Webhook] 💰 Amount: ${paymentData.transaction_amount}`);
            console.log(`[Webhook] 🏷️ Metadata:`, paymentData.metadata);

            if (paymentData.status === 'approved' || paymentData.status === 'authorized') {
                const userId = paymentData.external_reference;
                const amount = paymentData.transaction_amount;
                const type = paymentData.metadata?.plan_type || 'unknown';

                if (userId) {
                    console.log(`[Webhook] ✅ Payment Valid. Triggering activation for user ${userId}...`);

                    try {
                        const result = await handleProActivation(userId, amount, type, id);
                        if (result.success) {
                            console.log(`[Webhook] 🚀 Activation Successful for user ${userId}`);
                        } else {
                            console.error(`[Webhook] ❌ Activation function returned error:`, result.error);
                        }
                    } catch (activationError) {
                        console.error(`[Webhook] ❌ Critical Error during activation:`, activationError);
                    }

                } else {
                    console.warn(`[Webhook] ⚠️ Payment approved but NO External Reference found. Cannot link to user.`);
                }
            } else {
                console.log(`[Webhook] ℹ️ Payment not approved yet (Status: ${paymentData.status}). Waiting...`);
            }
        }
        else if (topic === "merchant_order") {
            console.log(`[Webhook] ℹ️ Merchant Order update (Ignored for now).`);
        }
        else {
            console.log(`[Webhook] ℹ️ Unhandled topic: ${topic}`);
        }

        return NextResponse.json({ status: "success" });

    } catch (error: any) {
        console.error("[Webhook] 🔥 CRITICAL ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
