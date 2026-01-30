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

        // Ensure to import the function at the top
        // import { handleProActivation } from "@/lib/payments";

        if (topic === "payment") {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: id });

            console.log("Payment status:", paymentData.status);
            if (paymentData.status === 'approved' || paymentData.status === 'authorized') {
                const userId = paymentData.external_reference;
                const amount = paymentData.transaction_amount;

                if (userId) {
                    // Start Import Fix
                    const { handleProActivation } = await import("@/lib/payments");
                    await handleProActivation(userId, amount, 'one_time', id);
                } else {
                    console.warn(`Payment ${id} approved but no external_reference (userId) found.`);
                }
            }
        }
        // ...
        // DELETE the local handleProActivation function definition at the bottom of the file

        else if (topic === "subscription_preapproval") {
            // We can handle subscription status changes here if needed
        }

        return NextResponse.json({ status: "success" });

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// End of file
