import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  is_platform_admin?: boolean;
};

/**
 * Verify the current user is a platform admin.
 * Checks the `is_platform_admin` flag on the profile,
 * with a fallback to the PLATFORM_ADMIN_EMAILS env var.
 *
 * Returns the profile if authorized, otherwise redirects to /dashboard.
 */
export async function getAdminUser(): Promise<Profile> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Check is_platform_admin flag
  const typedProfile = profile as Profile;
  if (typedProfile.is_platform_admin) {
    return typedProfile;
  }

  // Fallback: check PLATFORM_ADMIN_EMAILS env var
  const adminEmails = process.env.PLATFORM_ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) ?? [];
  if (adminEmails.includes(typedProfile.email.toLowerCase())) {
    return typedProfile;
  }

  // Not an admin — redirect to dashboard
  redirect('/dashboard');
}

/**
 * API-route version: returns the profile or null (no redirect).
 */
export async function getAdminUserApi(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const typedProfile = profile as Profile;
  if (typedProfile.is_platform_admin) return typedProfile;

  const adminEmails = process.env.PLATFORM_ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) ?? [];
  if (adminEmails.includes(typedProfile.email.toLowerCase())) return typedProfile;

  return null;
}
