import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const mpToken = process.env.MP_ACCESS_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL;

    let dbConnection = false;
    let dbError = null;

    if (sbUrl && sbServiceKey) {
        try {
            const supabaseAdmin = createClient(sbUrl, sbServiceKey);
            const { data, error } = await supabaseAdmin.from('profiles').select('count').limit(1).single();
            if (!error) {
                dbConnection = true;
            } else {
                dbError = error.message;
            }
        } catch (e: any) {
            dbError = e.message;
        }
    }

    return NextResponse.json({
        env: {
            NEXT_PUBLIC_SUPABASE_URL: !!sbUrl,
            SUPABASE_SERVICE_ROLE_KEY: !!sbServiceKey,
            MP_ACCESS_TOKEN: !!mpToken,
            NEXT_PUBLIC_APP_URL: appUrl ? appUrl : 'Missing (using fallback)',
        },
        db: {
            connected: dbConnection,
            error: dbError
        }
    });
}
