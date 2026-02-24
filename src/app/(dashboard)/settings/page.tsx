'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2, Building2, Settings2, Upload } from 'lucide-react';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

interface OrgSettings {
  default_language?: string;
  consent_duration_days?: number;
  auto_remind?: boolean;
  remind_days_before?: number;
  timezone?: string;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
] as const;

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
] as const;

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Organization fields
  const [orgId, setOrgId] = useState('');
  const [name, setName] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Settings (stored in org.settings JSON)
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [consentDuration, setConsentDuration] = useState('365');
  const [autoRemind, setAutoRemind] = useState(false);
  const [remindDaysBefore, setRemindDaysBefore] = useState('30');
  const [timezone, setTimezone] = useState('America/New_York');

  useEffect(() => {
    async function loadOrg() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        const profile = profileData as Pick<ProfileRow, 'organization_id'> | null;
        if (!profile) return;

        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();
        const org = orgData as OrganizationRow | null;
        if (!org) return;

        setOrgId(org.id);
        setName(org.name);
        setDotNumber(org.dot_number ?? '');
        setMcNumber(org.mc_number ?? '');
        setAddressLine1(org.address_line1 ?? '');
        setAddressLine2(org.address_line2 ?? '');
        setCity(org.city ?? '');
        setState(org.state ?? '');
        setZip(org.zip ?? '');
        setPhone(org.phone ?? '');
        setLogoUrl(org.logo_url ?? '');

        // Parse settings JSON
        const settings = (org.settings ?? {}) as OrgSettings;
        setDefaultLanguage(settings.default_language ?? 'en');
        setConsentDuration(String(settings.consent_duration_days ?? 365));
        setAutoRemind(settings.auto_remind ?? false);
        setRemindDaysBefore(String(settings.remind_days_before ?? 30));
        setTimezone(settings.timezone ?? 'America/New_York');
      } catch {
        setError('Failed to load organization settings.');
      } finally {
        setLoading(false);
      }
    }

    loadOrg();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const settings: OrgSettings = {
        default_language: defaultLanguage,
        consent_duration_days: parseInt(consentDuration, 10) || 365,
        auto_remind: autoRemind,
        remind_days_before: parseInt(remindDaysBefore, 10) || 30,
        timezone,
      };

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          name: name.trim(),
          dot_number: dotNumber.trim() || null,
          mc_number: mcNumber.trim() || null,
          address_line1: addressLine1.trim() || null,
          address_line2: addressLine2.trim() || null,
          city: city.trim() || null,
          state: state || null,
          zip: zip.trim() || null,
          phone: phone.trim() || null,
          logo_url: logoUrl.trim() || null,
          settings: settings as unknown as Database['public']['Tables']['organizations']['Row']['settings'],
        })
        .eq('id', orgId);

      if (updateError) {
        setError(updateError.message);
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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${orgId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setError('Failed to upload logo.');
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('assets').getPublicUrl(path);

      setLogoUrl(publicUrl);
    } catch {
      setError('An unexpected error occurred during upload.');
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
        <h1 className="text-2xl font-bold text-[#0c0f14]">Settings</h1>
        <p className="mt-1 text-sm text-[#8b919a]">
          Manage your organization profile and consent preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#b5b5ae]" />
              <div>
                <CardTitle className="text-base">Organization Profile</CardTitle>
                <CardDescription>
                  Your carrier information as it appears on consent forms.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="org-name" className="text-sm font-medium text-[#3a3f49]">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ACME Trucking LLC"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="org-phone" className="text-sm font-medium text-[#3a3f49]">
                  Phone
                </label>
                <Input
                  id="org-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="dot-number" className="text-sm font-medium text-[#3a3f49]">
                  DOT Number
                </label>
                <Input
                  id="dot-number"
                  value={dotNumber}
                  onChange={(e) => setDotNumber(e.target.value)}
                  placeholder="1234567"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mc-number" className="text-sm font-medium text-[#3a3f49]">
                  MC Number
                </label>
                <Input
                  id="mc-number"
                  value={mcNumber}
                  onChange={(e) => setMcNumber(e.target.value)}
                  placeholder="MC-123456"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="address1" className="text-sm font-medium text-[#3a3f49]">
                  Address Line 1
                </label>
                <Input
                  id="address1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="address2" className="text-sm font-medium text-[#3a3f49]">
                  Address Line 2
                </label>
                <Input
                  id="address2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Suite 100"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="city" className="text-sm font-medium text-[#3a3f49]">
                  City
                </label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Dallas"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#3a3f49]">State</label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="zip" className="text-sm font-medium text-[#3a3f49]">
                  ZIP Code
                </label>
                <Input
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="75201"
                />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#3a3f49]">Company Logo</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- Dynamic user-uploaded logo preview */
                  <img
                    src={logoUrl}
                    alt="Company logo"
                    className="h-16 w-16 rounded-lg border border-[#e8e8e3] object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[#d4d4cf] bg-[#fafaf8]">
                    <Building2 className="h-6 w-6 text-[#d4d4cf]" />
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[#d4d4cf] bg-white px-3 py-2 text-sm font-medium text-[#3a3f49] hover:bg-[#fafaf8] transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-[#b5b5ae]" />
              <div>
                <CardTitle className="text-base">Consent Preferences</CardTitle>
                <CardDescription>
                  Default settings applied to new consent requests.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#3a3f49]">
                  Default Language
                </label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="consent-duration" className="text-sm font-medium text-[#3a3f49]">
                  Consent Duration (days)
                </label>
                <Input
                  id="consent-duration"
                  type="number"
                  value={consentDuration}
                  onChange={(e) => setConsentDuration(e.target.value)}
                  placeholder="365"
                  min="1"
                  max="3650"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#3a3f49]">Timezone</label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace('_', ' ').replace('America/', '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-[#3a3f49]">
                  <input
                    type="checkbox"
                    checked={autoRemind}
                    onChange={(e) => setAutoRemind(e.target.checked)}
                    className="h-4 w-4 rounded border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14]"
                  />
                  Auto-Remind Drivers
                </label>
                {autoRemind && (
                  <div className="space-y-1.5 ml-6">
                    <label
                      htmlFor="remind-days"
                      className="text-xs font-medium text-[#8b919a]"
                    >
                      Remind days before expiration
                    </label>
                    <Input
                      id="remind-days"
                      type="number"
                      value={remindDaysBefore}
                      onChange={(e) => setRemindDaysBefore(e.target.value)}
                      placeholder="30"
                      min="1"
                      max="90"
                      className="max-w-[120px]"
                    />
                  </div>
                )}
              </div>
            </div>
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
            Settings saved successfully.
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
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
