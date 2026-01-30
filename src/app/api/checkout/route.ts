import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference, PreApproval } from "mercadopago";
import { supabase } from "@/lib/supabase";

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { planType, userEmail, userId } = body;

        console.log("Checkout Request:", { planType, userEmail, userId });

        if (!userId) {
            console.error("Missing userId in request");
            return NextResponse.json({ error: "User ID missing" }, { status: 400 });
        }

        if (!process.env.MP_ACCESS_TOKEN) {
            return NextResponse.json({ error: "Server misconfigured: MP_ACCESS_TOKEN missing" }, { status: 500 });
        }

        const appUrl = (
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null) ||
            'http://localhost:3000'
        ).replace(/\/$/, ''); // Remove trailing slash

        console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
        console.log("Using appUrl:", appUrl);

        // Mercado Pago Production credentials restrict localhost in subscriptions.
        // We use a fallback for local testing of the flow.
        const isLocalhost = appUrl.includes('localhost');
        const fallbackUrl = "https://www.google.com";

        const backUrls = isLocalhost ? {
            success: fallbackUrl,
            failure: fallbackUrl,
            pending: fallbackUrl,
        } : {
            success: `${appUrl}/payment/success`,
            failure: `${appUrl}/payment/failure`,
            pending: `${appUrl}/payment/pending`,
        };

        console.log("Back URLs:", backUrls);

        // Specific back_url for subscriptions (must be valid HTTPS in Prod)
        const subscriptionBackUrl = isLocalhost ? fallbackUrl : backUrls.success;

        if (planType === 'monthly') {
            // One-time Payment (Pro Mensal - R$ 49.90)
            const preference = new Preference(client);
            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: 'pro-monthly',
                            title: 'PassaENEM Pro - Mensal',
                            quantity: 1,
                            unit_price: 49.9, // Mercado Pago accepts decimals for unit_price
                            currency_id: 'BRL',
                        },
                    ],
                    payer: {
                        email: userEmail,
                    },
                    back_urls: backUrls,
                    auto_return: 'approved',
                    notification_url: `${appUrl}/api/webhook/mercadopago`,
                    external_reference: userId, // PASS USER ID HERE
                    metadata: {
                        plan_type: 'monthly',
                        user_id: userId // AND HERE
                    }
                }
            });

            return NextResponse.json({ url: result.init_point });

        } else if (planType === 'test') {
            // Test Payment (R$ 1.00)
            const preference = new Preference(client);
            const preferenceBody = {
                items: [
                    {
                        id: 'test-plan',
                        title: 'PassaENEM - Teste de Pagamento',
                        quantity: 1,
                        unit_price: 1.00,
                        currency_id: 'BRL',
                    },
                ],
                payer: {
                    email: userEmail,
                },
                back_urls: backUrls,
                auto_return: 'approved',
                notification_url: `${appUrl}/api/webhook/mercadopago`,
                external_reference: userId,
                metadata: {
                    plan_type: 'test',
                    user_id: userId
                }
            };

            console.log("[Checkout] Creating preference with notification_url:", preferenceBody.notification_url);

            const result = await preference.create({
                body: preferenceBody
            });

            return NextResponse.json({ url: result.init_point });

        } else if (planType === 'recurring') {
            // Subscription (Pro Recorrente - R$ 35.00/mês)
            const preapproval = new PreApproval(client);
            const result = await preapproval.create({
                body: {
                    reason: 'PassaENEM Pro - Assinatura Mensal',
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: 'months',
                        transaction_amount: 35, // Must be integer, not float
                        currency_id: 'BRL',
                    },
                    payer_email: userEmail,
                    back_url: subscriptionBackUrl,
                    external_reference: userId,
                }
            });

            return NextResponse.json({ url: result.init_point });
        }

        return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });

    } catch (error: any) {
        console.error("Mercado Pago Error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return NextResponse.json({
            error: error.message || error.cause?.message || "Invalid request data"
        }, { status: 500 });
    }
}
