import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';
import { sendWelcomeEmail } from '@/lib/messaging/email';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Fire-and-forget: send welcome email if not already sent
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, welcome_email_sent_at')
            .eq('id', user.id)
            .single();

          if (!profile || profile.welcome_email_sent_at) return;

          await sendWelcomeEmail({
            to: profile.email,
            userName: profile.full_name,
          });

          await supabase
            .from('profiles')
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq('id', user.id);
        } catch (err) {
          console.error('[auth/callback] Welcome email failed:', err);
        }
      })();

      return response;
    }

    console.error('[auth/callback] Exchange failed:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
