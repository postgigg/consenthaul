'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];

interface DriverFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<DriverRow>;
  onSuccess?: (driver: DriverRow) => void;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
] as const;

export function DriverForm({ mode, initialData, onSuccess }: DriverFormProps) {
  const [firstName, setFirstName] = useState(initialData?.first_name ?? '');
  const [lastName, setLastName] = useState(initialData?.last_name ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [cdlNumber, setCdlNumber] = useState(initialData?.cdl_number ?? '');
  const [cdlState, setCdlState] = useState(initialData?.cdl_state ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.date_of_birth ?? '');
  const [hireDate, setHireDate] = useState(initialData?.hire_date ?? '');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'es'>(
    (initialData?.preferred_language as 'en' | 'es') ?? 'en',
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Populate form when initialData changes (e.g. async load in edit mode)
  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name ?? '');
      setLastName(initialData.last_name ?? '');
      setPhone(initialData.phone ?? '');
      setEmail(initialData.email ?? '');
      setCdlNumber(initialData.cdl_number ?? '');
      setCdlState(initialData.cdl_state ?? '');
      setDateOfBirth(initialData.date_of_birth ?? '');
      setHireDate(initialData.hire_date ?? '');
      setPreferredLanguage((initialData.preferred_language as 'en' | 'es') ?? 'en');
    }
  }, [initialData]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.first_name = 'First name is required';
    if (!lastName.trim()) errs.last_name = 'Last name is required';
    if (!phone.trim() && !email.trim()) errs.phone = 'Either phone or email is required';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Invalid email address';
    }
    if (cdlState && cdlState.length !== 2) errs.cdl_state = 'Must be a 2-letter state code';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    const body = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      cdl_number: cdlNumber.trim() || undefined,
      cdl_state: cdlState || undefined,
      date_of_birth: dateOfBirth || undefined,
      hire_date: hireDate || undefined,
      preferred_language: preferredLanguage,
    };

    try {
      const url =
        mode === 'edit' && initialData?.id
          ? `/api/drivers/${initialData.id}`
          : '/api/drivers';

      const res = await fetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to save driver.');
        return;
      }

      onSuccess?.(data);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: {
      type?: string;
      placeholder?: string;
      required?: boolean;
    },
  ) {
    const fieldError = fieldErrors[id];
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium text-[#3a3f49]">
          {label}
          {opts?.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <Input
          id={id}
          type={opts?.type ?? 'text'}
          placeholder={opts?.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={!!fieldError}
        />
        {fieldError && (
          <p className="text-xs text-red-600">{fieldError}</p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Add Driver' : 'Edit Driver'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Enter the driver details below. Either phone or email is required.'
            : 'Update the driver information below.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {renderField('first_name', 'First Name', firstName, setFirstName, {
              placeholder: 'John',
              required: true,
            })}
            {renderField('last_name', 'Last Name', lastName, setLastName, {
              placeholder: 'Doe',
              required: true,
            })}
            {renderField('phone', 'Phone', phone, setPhone, {
              type: 'tel',
              placeholder: '+1 (555) 000-0000',
            })}
            {renderField('email', 'Email', email, setEmail, {
              type: 'email',
              placeholder: 'driver@example.com',
            })}
            {renderField('cdl_number', 'CDL Number', cdlNumber, setCdlNumber, {
              placeholder: 'A1234567',
            })}

            {/* CDL State dropdown */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#3a3f49]">CDL State</label>
              <Select value={cdlState} onValueChange={setCdlState}>
                <SelectTrigger className={fieldErrors.cdl_state ? 'border-red-500' : ''}>
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
              {fieldErrors.cdl_state && (
                <p className="text-xs text-red-600">{fieldErrors.cdl_state}</p>
              )}
            </div>

            {renderField('date_of_birth', 'Date of Birth', dateOfBirth, setDateOfBirth, {
              type: 'date',
            })}
            {renderField('hire_date', 'Hire Date', hireDate, setHireDate, {
              type: 'date',
            })}

            {/* Preferred language */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-[#3a3f49]">
                Preferred Language
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredLanguage('en')}
                  className={`flex-1 border px-4 py-2 text-sm font-medium transition-colors sm:max-w-[160px] ${
                    preferredLanguage === 'en'
                      ? 'border-[#C8A75E] bg-[#fafaf8] text-[#C8A75E]'
                      : 'border-[#d4d4cf] bg-white text-[#3a3f49] hover:bg-[#fafaf8]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLanguage('es')}
                  className={`flex-1 border px-4 py-2 text-sm font-medium transition-colors sm:max-w-[160px] ${
                    preferredLanguage === 'es'
                      ? 'border-[#C8A75E] bg-[#fafaf8] text-[#C8A75E]'
                      : 'border-[#d4d4cf] bg-white text-[#3a3f49] hover:bg-[#fafaf8]'
                  }`}
                >
                  Espanol
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" loading={submitting}>
              {mode === 'create' ? 'Add Driver' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
