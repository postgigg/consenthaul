'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  KeyRound,
  Smartphone,
  Monitor,
  LogOut,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { Database } from '@/types/database';

type UserSessionRow = Database['public']['Tables']['user_sessions']['Row'];

interface MfaFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
}

interface EnrollmentData {
  id: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export default function SecuritySettingsPage() {
  const supabase = createClient();

  // ---------------------------------------------------------------------------
  // MFA state
  // ---------------------------------------------------------------------------
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[]>([]);
  const [mfaLoading, setMfaLoading] = useState(true);

  // Enrollment flow
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // Unenroll
  const [unenrolling, setUnenrolling] = useState(false);

  // ---------------------------------------------------------------------------
  // Password change state
  // ---------------------------------------------------------------------------
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // Sessions state
  // ---------------------------------------------------------------------------
  const [sessions, setSessions] = useState<UserSessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);
  const [endingAll, setEndingAll] = useState(false);

  // ---------------------------------------------------------------------------
  // Load MFA factors
  // ---------------------------------------------------------------------------
  const loadMfaStatus = useCallback(async () => {
    setMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error('Failed to load MFA factors:', error);
        return;
      }

      const verifiedFactors = (data.totp ?? []).filter(
        (f) => f.status === 'verified',
      );
      setMfaFactors(
        verifiedFactors.map((f) => ({
          id: f.id,
          friendly_name: f.friendly_name ?? null,
          factor_type: f.factor_type,
          status: f.status,
        })),
      );
      setMfaEnabled(verifiedFactors.length > 0);
    } catch {
      // Silently fail
    } finally {
      setMfaLoading(false);
    }
  }, [supabase]);

  // ---------------------------------------------------------------------------
  // Load sessions
  // ---------------------------------------------------------------------------
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/auth/sessions');
      if (!res.ok) {
        console.error('Failed to load sessions:', res.status);
        return;
      }
      const json = await res.json();
      setSessions(json.data ?? []);
    } catch {
      // Silently fail
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMfaStatus();
    loadSessions();
  }, [loadMfaStatus, loadSessions]);

  // ---------------------------------------------------------------------------
  // MFA enrollment
  // ---------------------------------------------------------------------------
  async function handleStartEnroll() {
    setEnrolling(true);
    setEnrollError(null);
    setEnrollSuccess(false);
    setEnrollmentData(null);
    setVerifyCode('');

    try {
      const res = await fetch('/api/auth/mfa/enroll', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        setEnrollError(json.message ?? json.error ?? 'Failed to start enrollment.');
        setEnrolling(false);
        return;
      }

      setEnrollmentData(json.data);
    } catch {
      setEnrollError('An unexpected error occurred.');
    }
    // Keep enrolling=true to show the QR code step
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollmentData || verifyCode.length !== 6) return;

    setVerifying(true);
    setEnrollError(null);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factor_id: enrollmentData.id,
          code: verifyCode,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setEnrollError(json.message ?? json.error ?? 'Verification failed.');
        setVerifying(false);
        return;
      }

      setEnrollSuccess(true);
      setEnrolling(false);
      setEnrollmentData(null);
      setVerifyCode('');
      await loadMfaStatus();
    } catch {
      setEnrollError('An unexpected error occurred.');
    } finally {
      setVerifying(false);
    }
  }

  function handleCancelEnroll() {
    setEnrolling(false);
    setEnrollmentData(null);
    setVerifyCode('');
    setEnrollError(null);
    setShowSecret(false);
  }

  // ---------------------------------------------------------------------------
  // MFA unenroll
  // ---------------------------------------------------------------------------
  async function handleUnenroll(factorId: string) {
    if (
      !confirm(
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
      )
    ) {
      return;
    }

    setUnenrolling(true);

    try {
      const res = await fetch('/api/auth/mfa/unenroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor_id: factorId }),
      });

      if (!res.ok) {
        const json = await res.json();
        setEnrollError(json.message ?? json.error ?? 'Failed to disable MFA.');
        return;
      }

      setEnrollSuccess(false);
      await loadMfaStatus();
    } catch {
      setEnrollError('An unexpected error occurred.');
    } finally {
      setUnenrolling(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Password change
  // ---------------------------------------------------------------------------
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordChanging(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch {
      setPasswordError('An unexpected error occurred.');
    } finally {
      setPasswordChanging(false);
    }
  }

  // ---------------------------------------------------------------------------
  // End a single session
  // ---------------------------------------------------------------------------
  async function handleEndSession(sessionId: string) {
    setEndingSessionId(sessionId);

    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // Silently fail
    } finally {
      setEndingSessionId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // End all other sessions
  // ---------------------------------------------------------------------------
  async function handleEndAllSessions() {
    if (
      !confirm(
        'Are you sure you want to log out all other sessions? Anyone else using your account will be signed out.',
      )
    ) {
      return;
    }

    setEndingAll(true);

    try {
      const res = await fetch('/api/auth/sessions', { method: 'DELETE' });

      if (res.ok) {
        await loadSessions();
      }
    } catch {
      // Silently fail
    } finally {
      setEndingAll(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0c0f14]">Security</h1>
        <p className="mt-1 text-sm text-[#8b919a]">
          Manage two-factor authentication, password, and active sessions.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Two-Factor Authentication */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#b5b5ae]" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">
                  Two-Factor Authentication
                </CardTitle>
                {!mfaLoading && (
                  <Badge variant={mfaEnabled ? 'success' : 'secondary'}>
                    {mfaEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Add an extra layer of security to your account with a
                time-based one-time password (TOTP) authenticator app.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#0c0f14]" />
            </div>
          ) : mfaEnabled ? (
            /* MFA is active -- show enrolled factors with option to disable */
            <div className="space-y-4">
              {mfaFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between rounded-lg border border-[#e8e8e3] p-4"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-[#0c0f14]">
                        {factor.friendly_name ?? 'Authenticator App'}
                      </p>
                      <p className="text-xs text-[#8b919a]">
                        TOTP -- Verified
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={unenrolling}
                    onClick={() => handleUnenroll(factor.id)}
                  >
                    {unenrolling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldOff className="h-3.5 w-3.5" />
                    )}
                    Disable
                  </Button>
                </div>
              ))}
            </div>
          ) : enrolling && enrollmentData ? (
            /* Enrollment flow -- QR code + verify */
            <div className="space-y-6">
              <div className="rounded-lg border border-[#e8e8e3] p-6">
                <p className="mb-4 text-sm font-medium text-[#3a3f49]">
                  1. Scan this QR code with your authenticator app
                </p>

                {/* QR Code -- the Supabase MFA enroll returns a data URI */}
                <div className="flex justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Data URI QR code from Supabase */}
                  <img
                    src={enrollmentData.totp.qr_code}
                    alt="TOTP QR Code"
                    className="h-48 w-48 rounded-lg border border-[#e8e8e3]"
                  />
                </div>

                {/* Manual secret entry */}
                <div className="text-center">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-[#8b919a] hover:text-[#3a3f49] transition-colors"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {showSecret ? 'Hide' : 'Show'} manual entry key
                  </button>
                  {showSecret && (
                    <p className="mt-2 font-mono text-xs text-[#3a3f49] bg-[#f0f0ec] px-3 py-2 rounded select-all break-all">
                      {enrollmentData.totp.secret}
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={handleVerifyCode}>
                <p className="mb-3 text-sm font-medium text-[#3a3f49]">
                  2. Enter the 6-digit code from your authenticator app
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) =>
                      setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="max-w-[160px] font-mono text-center text-lg tracking-widest"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    disabled={verifying || verifyCode.length !== 6}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Verify
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEnroll}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* No MFA -- show enable button */
            <div className="flex items-center gap-4">
              <Smartphone className="h-8 w-8 text-[#d4d4cf]" />
              <div className="flex-1">
                <p className="text-sm text-[#8b919a]">
                  Protect your account by requiring a code from an authenticator
                  app (e.g., Google Authenticator, Authy, 1Password) in
                  addition to your password.
                </p>
              </div>
              <Button onClick={handleStartEnroll}>
                <Shield className="h-4 w-4" />
                Enable 2FA
              </Button>
            </div>
          )}

          {/* Success / Error messages */}
          {enrollError && (
            <div
              className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {enrollError}
            </div>
          )}

          {enrollSuccess && (
            <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Two-factor authentication has been enabled successfully.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Password */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#b5b5ae]" />
            <div>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>
                Update your password. You will stay signed in on this device.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium text-[#3a3f49]"
                >
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-[#3a3f49]"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {passwordError && (
              <div
                className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Password updated successfully.
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={passwordChanging || !newPassword || !confirmPassword}
              >
                {passwordChanging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Active Sessions */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-[#b5b5ae]" />
              <div>
                <CardTitle className="text-base">Active Sessions</CardTitle>
                <CardDescription>
                  Devices and browsers where you are currently signed in.
                </CardDescription>
              </div>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleEndAllSessions}
                disabled={endingAll}
              >
                {endingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                Log Out All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[#0c0f14]" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center">
              <Monitor className="mx-auto h-8 w-8 text-[#d4d4cf] mb-3" />
              <p className="text-sm text-[#8b919a]">No active sessions found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device / Browser</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="max-w-[260px]">
                      <p className="truncate text-sm text-[#0c0f14]">
                        {session.user_agent
                          ? truncateUserAgent(session.user_agent)
                          : 'Unknown device'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-[#8b919a]">
                      {session.ip_address ?? '---'}
                    </TableCell>
                    <TableCell className="text-sm text-[#8b919a]">
                      {formatDate(session.last_active_at, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-[#8b919a]">
                      {formatDate(session.expires_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={endingSessionId === session.id}
                        onClick={() => handleEndSession(session.id)}
                      >
                        {endingSessionId === session.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <LogOut className="h-3.5 w-3.5" />
                        )}
                        End
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Truncate a raw user agent string to a short readable label.
 * Extracts the browser and OS when possible.
 */
function truncateUserAgent(ua: string): string {
  // Try to extract a readable browser name
  if (ua.includes('Chrome') && !ua.includes('Edg')) return extractUAPart(ua, 'Chrome');
  if (ua.includes('Edg')) return extractUAPart(ua, 'Edg').replace('Edg', 'Edge');
  if (ua.includes('Firefox')) return extractUAPart(ua, 'Firefox');
  if (ua.includes('Safari') && !ua.includes('Chrome')) return extractUAPart(ua, 'Safari');

  // Fallback: first 60 characters
  return ua.length > 60 ? ua.slice(0, 60) + '...' : ua;
}

function extractUAPart(ua: string, browser: string): string {
  const os = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac')
      ? 'macOS'
      : ua.includes('Linux')
        ? 'Linux'
        : ua.includes('Android')
          ? 'Android'
          : ua.includes('iPhone')
            ? 'iOS'
            : 'Unknown OS';

  const match = ua.match(new RegExp(`${browser}/([\\d.]+)`));
  const version = match ? ` ${match[1].split('.')[0]}` : '';

  return `${browser}${version} on ${os}`;
}
