import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client scoped to the current request/response pair,
 * refreshes the auth session (rewriting cookies on the response), and
 * redirects unauthenticated users away from protected /dashboard routes.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth during build when env vars are not available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror cookies onto the request so downstream Server Components
          // that call cookies() see the refreshed values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Rebuild the response with updated request cookies, then set
          // each cookie on the outgoing response headers as well.
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  // A simple mistake here can make it very hard to debug session issues.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  const protectedPaths = ['/dashboard', '/billing', '/drivers', '/consents', '/settings', '/templates', '/admin'];
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect users with unverified emails away from protected routes
  if (user && isProtected && !user.email_confirmed_at) {
    const url = request.nextUrl.clone();
    url.pathname = '/verify-email';
    return NextResponse.redirect(url);
  }

  // F3: Check if the user's organization is suspended
  if (user && isProtected && !request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile) {
      const { data: org } = await supabase
        .from('organizations')
        .select('is_suspended')
        .eq('id', profile.organization_id)
        .single();

      if (org?.is_suspended) {
        const url = request.nextUrl.clone();
        url.pathname = '/suspended';
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: Always return the supabaseResponse object as-is.
  // If you create a new NextResponse instead, the refreshed session
  // cookies will be lost and the user will be logged out on the next
  // request.
  return supabaseResponse;
}
