'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Bell, Mail, Loader2, Save } from 'lucide-react';

interface NotificationPreferences {
  email_consent_signed: boolean;
  email_consent_expired: boolean;
  email_low_credits: boolean;
  email_team_changes: boolean;
  email_compliance_alerts: boolean;
  email_weekly_digest: boolean;
  in_app_enabled: boolean;
}

const EMAIL_TOGGLES: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: 'email_consent_signed',
    label: 'Consent Signed',
    description: 'Receive an email when a driver signs a consent form.',
  },
  {
    key: 'email_consent_expired',
    label: 'Consent Expired',
    description: 'Receive an email when a consent form expires.',
  },
  {
    key: 'email_low_credits',
    label: 'Low Credits',
    description: 'Receive an email when your credit balance is running low.',
  },
  {
    key: 'email_team_changes',
    label: 'Team Changes',
    description: 'Receive an email when team members are added or removed.',
  },
  {
    key: 'email_compliance_alerts',
    label: 'Compliance Alerts',
    description:
      'Receive an email for regulatory changes and compliance issues.',
  },
  {
    key: 'email_weekly_digest',
    label: 'Weekly Digest',
    description:
      'Receive a weekly summary of consent activity and key metrics.',
  },
];

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email_consent_signed: true,
    email_consent_expired: true,
    email_low_credits: true,
    email_team_changes: true,
    email_compliance_alerts: true,
    email_weekly_digest: true,
    in_app_enabled: true,
  });

  useEffect(() => {
    async function loadPreferences() {
      setLoading(true);
      try {
        const res = await fetch('/api/notifications/preferences');
        const json = await res.json();
        if (res.ok && json.data) {
          setPrefs({
            email_consent_signed: json.data.email_consent_signed ?? true,
            email_consent_expired: json.data.email_consent_expired ?? true,
            email_low_credits: json.data.email_low_credits ?? true,
            email_team_changes: json.data.email_team_changes ?? true,
            email_compliance_alerts: json.data.email_compliance_alerts ?? true,
            email_weekly_digest: json.data.email_weekly_digest ?? true,
            in_app_enabled: json.data.in_app_enabled ?? true,
          });
        }
      } catch {
        setError('Failed to load notification preferences.');
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  function togglePref(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.message ?? 'Failed to save preferences.');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#0c0f14]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0c0f14]">
          Notification Preferences
        </h1>
        <p className="mt-1 text-sm text-[#8b919a]">
          Choose which notifications you receive and how they are delivered.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Email notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#b5b5ae]" />
              <div>
                <CardTitle className="text-base">Email Notifications</CardTitle>
                <CardDescription>
                  Control which events trigger an email notification.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {EMAIL_TOGGLES.map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-[#fafaf8] transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-[#3a3f49]">
                    {toggle.label}
                  </p>
                  <p className="text-xs text-[#8b919a]">
                    {toggle.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[toggle.key]}
                  onClick={() => togglePref(toggle.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0c0f14] focus:ring-offset-2 ${
                    prefs[toggle.key] ? 'bg-[#0c0f14]' : 'bg-[#d4d4cf]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      prefs[toggle.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* In-app notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#b5b5ae]" />
              <div>
                <CardTitle className="text-base">
                  In-App Notifications
                </CardTitle>
                <CardDescription>
                  Notifications shown within the ConsentHaul dashboard.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <label className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-[#fafaf8] transition-colors cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-[#3a3f49]">
                  Enable In-App Notifications
                </p>
                <p className="text-xs text-[#8b919a]">
                  Show notification badges and alerts within the dashboard.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.in_app_enabled}
                onClick={() => togglePref('in_app_enabled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0c0f14] focus:ring-offset-2 ${
                  prefs.in_app_enabled ? 'bg-[#0c0f14]' : 'bg-[#d4d4cf]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    prefs.in_app_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </CardContent>
        </Card>

        {/* Error / Success */}
        {error && (
          <div
            className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Notification preferences saved successfully.
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
