import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Define Public Routes (Accessible without login)
    // - / (Landing Page)
    // - /login
    // - /cadastro
    // - /auth/callback (Supabase Auth)
    // - /api/webhook/* (Mercado Pago need access)
    // - /api/cron/* (Cron jobs if any)
    const isPublic =
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/cadastro') ||
        request.nextUrl.pathname.startsWith('/api/webhook') ||
        request.nextUrl.pathname.startsWith('/api/cron');

    if (!user) {
        // If user is NOT logged in and tries to access a restricted page
        if (!isPublic) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    } else {
        // If user IS logged in...

        // A. Prevent access to Login/Cadastro pages (Redirect to dashboard)
        if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/cadastro')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // B. Admin Route Protection
        if (request.nextUrl.pathname.startsWith('/admin')) {
            // Hardcoded Admin ID check (Fastest and safest for now)
            // ID fetched from SQL policies: 426d48bb-fc97-4461-acc9-a8a59445b72d
            const ADMIN_ID = '426d48bb-fc97-4461-acc9-a8a59445b72d';

            if (user.id !== ADMIN_ID) {
                console.warn(`[Middleware] Unauthorized Admin Access Attempt by ${user.id} (${user.email})`);
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
