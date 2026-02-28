'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  UserPlus,
  Send,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
] as const;

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

const STEPS = [
  { label: 'Company Setup', icon: Building2 },
  { label: 'Add Driver', icon: UserPlus },
  { label: 'Send Consent', icon: Send },
  { label: 'Complete', icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [orgId, setOrgId] = useState('');

  // Step 1: Company setup
  const [companyName, setCompanyName] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Step 2: Add driver
  const [driverFirstName, setDriverFirstName] = useState('');
  const [driverLastName, setDriverLastName] = useState('');
  const [driverCdl, setDriverCdl] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [addedDriverId, setAddedDriverId] = useState<string | null>(null);

  // Step 3: Consent
  const [deliveryMethod, setDeliveryMethod] = useState('sms');
  const [consentSent, setConsentSent] = useState(false);

  // General
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confetti state for step 4
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          router.push('/login');
          return;
        }

        setOrgId(profile.organization_id);

        const { data: org } = await supabase
          .from('organizations')
          .select('name, dot_number, mc_number, address_line1, city, state, zip, settings')
          .eq('id', profile.organization_id)
          .single();

        if (!org) {
          router.push('/login');
          return;
        }

        // Check if onboarding is already complete
        const settings = (org.settings ?? {}) as Record<string, unknown>;
        if (settings.onboarding_completed === true) {
          router.push('/dashboard');
          return;
        }

        // Pre-fill existing org data
        if (org.name) setCompanyName(org.name);
        if (org.dot_number) setDotNumber(org.dot_number);
        if (org.mc_number) setMcNumber(org.mc_number);
        if (org.address_line1) setAddressLine1(org.address_line1);
        if (org.city) setCity(org.city);
        if (org.state) setState(org.state);
        if (org.zip) setZip(org.zip);
      } catch {
        setError('Failed to load onboarding data.');
      } finally {
        setLoading(false);
      }
    }

    checkOnboarding();
  }, [supabase, router]);

  const handleNext = useCallback(() => {
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Step 1: Save company info
  async function handleSaveCompany() {
    if (!companyName.trim()) {
      setError('Organization name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from('organizations')
        .update({
          name: companyName.trim(),
          dot_number: dotNumber.trim() || null,
          mc_number: mcNumber.trim() || null,
          address_line1: addressLine1.trim() || null,
          city: city.trim() || null,
          state: state || null,
          zip: zip.trim() || null,
        })
        .eq('id', orgId);

      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      handleNext();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  // Step 2: Add driver
  async function handleAddDriver() {
    if (!driverFirstName.trim() || !driverLastName.trim()) {
      setError('Driver first and last name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data: driver, error: driverErr } = await supabase
        .from('drivers')
        .insert({
          organization_id: orgId,
          first_name: driverFirstName.trim(),
          last_name: driverLastName.trim(),
          cdl_number: driverCdl.trim() || null,
          phone: driverPhone.trim() || null,
          email: driverEmail.trim() || null,
        })
        .select('id')
        .single();

      if (driverErr) {
        setError(driverErr.message);
        return;
      }
      setAddedDriverId(driver.id);
      handleNext();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  // Step 3: Send consent
  async function handleSendConsent() {
    if (!addedDriverId) {
      setError('No driver selected. Please go back and add a driver.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: addedDriverId,
          consent_type: 'limited_query',
          delivery_method: deliveryMethod,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Failed to send consent.');
        return;
      }

      setConsentSent(true);
      handleNext();
      setShowConfetti(true);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  // Step 4: Mark onboarding complete
  async function handleComplete() {
    setSaving(true);
    try {
      // Fetch current settings to merge
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

      const existingSettings = (org?.settings ?? {}) as Record<string, unknown>;

      await supabase
        .from('organizations')
        .update({
          settings: {
            ...existingSettings,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          },
        })
        .eq('id', orgId);

      router.push('/dashboard');
    } catch {
      // Even if settings update fails, redirect to dashboard
      router.push('/dashboard');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#0c0f14]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-between px-4">
        {STEPS.map((step, idx) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  idx < currentStep
                    ? 'border-[#C8A75E] bg-[#C8A75E] text-white'
                    : idx === currentStep
                      ? 'border-[#0c0f14] bg-[#0c0f14] text-[#C8A75E]'
                      : 'border-[#d4d4cf] bg-white text-[#8b919a]'
                }`}
              >
                {idx < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`mt-2 text-[0.65rem] font-bold uppercase tracking-wider ${
                  idx <= currentStep ? 'text-[#0c0f14]' : 'text-[#8b919a]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-8 sm:w-16 transition-colors ${
                  idx < currentStep ? 'bg-[#C8A75E]' : 'bg-[#d4d4cf]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-8">
          {/* Step 1: Company Setup */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
                <h2 className="text-xl font-bold text-[#0c0f14]">
                  Welcome to ConsentHaul
                </h2>
                <p className="mt-1 text-sm text-[#8b919a]">
                  Let&apos;s set up your carrier profile. This information appears on
                  consent forms sent to your drivers.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="company-name" className="text-sm font-medium text-[#3a3f49]">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ACME Trucking LLC"
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
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="address" className="text-sm font-medium text-[#3a3f49]">
                    Address
                  </label>
                  <Input
                    id="address"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="123 Main St"
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

              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Add Driver */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
                <h2 className="text-xl font-bold text-[#0c0f14]">
                  Add Your First Driver
                </h2>
                <p className="mt-1 text-sm text-[#8b919a]">
                  Register a driver to send them an FMCSA Clearinghouse consent form.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="driver-first" className="text-sm font-medium text-[#3a3f49]">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="driver-first"
                    value={driverFirstName}
                    onChange={(e) => setDriverFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="driver-last" className="text-sm font-medium text-[#3a3f49]">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="driver-last"
                    value={driverLastName}
                    onChange={(e) => setDriverLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="driver-cdl" className="text-sm font-medium text-[#3a3f49]">
                    CDL Number
                  </label>
                  <Input
                    id="driver-cdl"
                    value={driverCdl}
                    onChange={(e) => setDriverCdl(e.target.value)}
                    placeholder="D1234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="driver-phone" className="text-sm font-medium text-[#3a3f49]">
                    Phone Number
                  </label>
                  <Input
                    id="driver-phone"
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="driver-email" className="text-sm font-medium text-[#3a3f49]">
                    Email Address
                  </label>
                  <Input
                    id="driver-email"
                    type="email"
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      handleNext();
                    }}
                  >
                    Skip for Now
                  </Button>
                  <Button onClick={handleAddDriver} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        Add Driver
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Send Consent */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <div className="w-8 h-0.5 bg-[#C8A75E] mb-4" />
                <h2 className="text-xl font-bold text-[#0c0f14]">
                  Send Your First Consent
                </h2>
                <p className="mt-1 text-sm text-[#8b919a]">
                  {addedDriverId
                    ? 'Choose how to deliver the consent form to your driver.'
                    : 'You skipped adding a driver. You can send consents later from the dashboard.'}
                </p>
              </div>

              {addedDriverId ? (
                <>
                  <div className="border border-[#e8e8e3] bg-[#fafaf8] px-4 py-3">
                    <p className="text-sm text-[#3a3f49]">
                      Sending to:{' '}
                      <span className="font-bold text-[#0c0f14]">
                        {driverFirstName} {driverLastName}
                      </span>
                    </p>
                    {driverCdl && (
                      <p className="text-xs text-[#8b919a] mt-0.5">
                        CDL: {driverCdl}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#3a3f49]">
                      Delivery Method
                    </label>
                    <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS Text Message</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[#8b919a]">
                      The driver will receive a secure signing link via{' '}
                      {deliveryMethod === 'sms'
                        ? 'text message'
                        : deliveryMethod === 'email'
                          ? 'email'
                          : 'WhatsApp'}
                      .
                    </p>
                  </div>
                </>
              ) : (
                <div className="border border-amber-200 bg-amber-50/50 px-4 py-3">
                  <p className="text-sm text-amber-800">
                    No driver added yet. You can send consent requests later from your
                    dashboard.
                  </p>
                </div>
              )}

              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-3">
                  {!addedDriverId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setError(null);
                        handleNext();
                        setShowConfetti(true);
                      }}
                    >
                      Skip to Finish
                    </Button>
                  )}
                  {addedDriverId && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setError(null);
                          handleNext();
                          setShowConfetti(true);
                        }}
                      >
                        Skip for Now
                      </Button>
                      <Button onClick={handleSendConsent} disabled={saving || consentSent}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Consent
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 3 && (
            <div className="space-y-8 text-center py-8">
              {/* Confetti animation */}
              {showConfetti && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute inline-block w-2 h-2 rounded-full animate-ping"
                        style={{
                          backgroundColor: i % 3 === 0 ? '#C8A75E' : i % 3 === 1 ? '#0c0f14' : '#8b919a',
                          left: `${15 + Math.random() * 70}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 1.5}s`,
                          animationDuration: `${1 + Math.random() * 1.5}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0c0f14]">
                  <CheckCircle2 className="h-10 w-10 text-[#C8A75E]" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0c0f14]">
                  You&apos;re All Set!
                </h2>
                <p className="mt-2 text-sm text-[#8b919a] max-w-md mx-auto">
                  Your ConsentHaul account is ready. Start managing FMCSA
                  Clearinghouse consents, track driver compliance, and stay
                  audit-ready.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-lg mx-auto text-left">
                <div className="border border-[#e8e8e3] p-4">
                  <p className="text-xs font-bold text-[#3a3f49] uppercase tracking-wider">
                    Company
                  </p>
                  <p className="mt-1 text-sm text-[#0c0f14] font-medium truncate">
                    {companyName || 'Not set'}
                  </p>
                </div>
                <div className="border border-[#e8e8e3] p-4">
                  <p className="text-xs font-bold text-[#3a3f49] uppercase tracking-wider">
                    Drivers
                  </p>
                  <p className="mt-1 text-sm text-[#0c0f14] font-medium">
                    {addedDriverId ? '1 added' : '0 added'}
                  </p>
                </div>
                <div className="border border-[#e8e8e3] p-4">
                  <p className="text-xs font-bold text-[#3a3f49] uppercase tracking-wider">
                    Consents
                  </p>
                  <p className="mt-1 text-sm text-[#0c0f14] font-medium">
                    {consentSent ? '1 sent' : '0 sent'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button onClick={handleComplete} disabled={saving} className="px-8">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
