import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create an SSR client just for middleware (cookie handling)
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

    // IMPORTANT: use getUser to validate validity of the token
    const { data: { user } } = await supabase.auth.getUser()

    // Guard Clauses
    const isProtectedPath =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/exam') ||
        request.nextUrl.pathname.startsWith('/history') ||
        request.nextUrl.pathname.startsWith('/generator') ||
        request.nextUrl.pathname.startsWith('/challenges');

    const isAuthPath = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login';

    if (!user && isProtectedPath) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (user && isAuthPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response
}

export const config = {
    matcher: [
        '/',
        '/login',
        '/dashboard/:path*',
        '/exam/:path*',
        '/history/:path*',
        '/generator/:path*',
        '/challenges/:path*'
    ],
}
