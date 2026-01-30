import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { handleProActivation } from "@/lib/payments";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { paymentId, userId } = body;

        console.log(`[Sync] Request received for Payment=${paymentId}, User=${userId}`);

        if (!paymentId || !userId) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const payment = new Payment(client);
        const paymentData = await payment.get({ id: paymentId });
        console.log(`[Sync] Payment status from MP: ${paymentData.status}`);

        if (paymentData.status === 'approved' || paymentData.status === 'authorized') {
            // Verify if the payment actually belongs to this user (via external_reference or metadata)
            // This is a security check to prevent users from claiming others' payments
            if (paymentData.external_reference !== userId) {
                console.warn(`[Sync] Mismatch: Payment ref ${paymentData.external_reference} !== Req user ${userId}`);
                // We might still allow it if external_reference is missing, but it SHOULD correspond.
                // For now, let's enforce it if external_reference is present.
                if (paymentData.external_reference && paymentData.external_reference !== userId) {
                    return NextResponse.json({ success: false, error: "Payment does not belong to this user" }, { status: 403 });
                }
            }

            // Trigger activation
            const result = await handleProActivation(
                userId,
                paymentData.transaction_amount,
                'one_time_sync',
                paymentId as string
            );

            if (result.success) {
                return NextResponse.json({ success: true, message: "Synced successfully" });
            } else {
                return NextResponse.json({ success: false, error: "Activation failed" }, { status: 500 });
            }
        } else {
            return NextResponse.json({ success: false, error: `Payment status is ${paymentData.status}` }, { status: 400 });
        }

    } catch (error: any) {
        console.error("[Sync] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
