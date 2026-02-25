'use client';

import { useState } from 'react';
import { Code2, Bot, Wrench, HelpCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ServiceRequestCategory, ServiceRequestUrgency } from '@/types/database';

interface ServiceRequestWizardProps {
  onCreated: () => void;
}

const categories: {
  value: ServiceRequestCategory;
  label: string;
  description: string;
  icon: typeof Code2;
  estimate: string;
}[] = [
  {
    value: 'api_integration',
    label: 'API Integration',
    description: 'Connect ConsentHaul to your existing systems via API',
    icon: Code2,
    estimate: 'Starting at $2,500',
  },
  {
    value: 'mcp_setup',
    label: 'MCP Setup',
    description: 'Set up Model Context Protocol for AI agent access',
    icon: Bot,
    estimate: 'Starting at $1,500',
  },
  {
    value: 'custom_integration',
    label: 'Custom Integration',
    description: 'Custom TMS integration or bespoke development',
    icon: Wrench,
    estimate: "We'll provide a custom quote within 24 hours",
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Something else — tell us what you need',
    icon: HelpCircle,
    estimate: "We'll provide a custom quote within 24 hours",
  },
];

const urgencyOptions: { value: ServiceRequestUrgency; label: string }[] = [
  { value: 'low', label: 'Low — No rush' },
  { value: 'medium', label: 'Medium — Within a few weeks' },
  { value: 'high', label: 'High — As soon as possible' },
];

const stepLabels = ['Category', 'Details', 'Review', 'Done'];

export function ServiceRequestWizard({ onCreated }: ServiceRequestWizardProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ServiceRequestCategory | null>(null);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<ServiceRequestUrgency>('medium');
  const [tmsSystem, setTmsSystem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = categories.find((c) => c.value === category);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description,
          urgency,
          tms_system: tmsSystem || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      setStep(4);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(1);
    setCategory(null);
    setDescription('');
    setUrgency('medium');
    setTmsSystem('');
    setError('');
  }

  return (
    <div className="border border-[#e8e8e3] bg-white">
      {/* Header */}
      <div className="border-b border-[#e8e8e3] px-6 py-4">
        <h2 className="text-sm font-bold text-[#0c0f14] uppercase tracking-wider">
          Request an Integration
        </h2>
        <p className="mt-1 text-sm text-[#8b919a]">
          Our engineering team handles every integration personally.
        </p>
      </div>

      {/* Step indicator — numbered labels */}
      <div className="border-b border-[#e8e8e3] px-6 py-3">
        <div className="flex gap-1">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const isActive = s === step;
            const isCompleted = s < step;
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="flex items-center w-full gap-0">
                  <div
                    className={`h-1 flex-1 transition-colors duration-300 ${
                      s <= step ? 'bg-[#C8A75E]' : 'bg-[#e8e8e3]'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wider uppercase transition-colors duration-300 ${
                    isActive
                      ? 'text-[#C8A75E]'
                      : isCompleted
                        ? 'text-[#0c0f14]'
                        : 'text-[#b5b5ae]'
                  }`}
                >
                  {s}. {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {/* Step 1: Category */}
        {step === 1 && (
          <div className="animate-fade-in">
            <p className="mb-4 text-sm font-medium text-[#3a3f49]">
              What kind of help do you need?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const selected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-start gap-3 p-4 border text-left transition-all duration-200 ${
                      selected
                        ? 'border-[#C8A75E] border-l-2 border-l-[#C8A75E] bg-[#C8A75E]/5'
                        : 'border-[#e8e8e3] hover:border-[#d4d4cf] hover:-translate-y-0.5 hover:shadow-sm'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 mt-0.5 shrink-0 transition-colors ${
                        selected ? 'text-[#C8A75E]' : 'text-[#8b919a]'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-[#0c0f14]">
                        {cat.label}
                      </p>
                      <p className="text-xs text-[#8b919a] mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!category}
                className="bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="animate-fade-in">
            <p className="mb-4 text-sm font-medium text-[#3a3f49]">
              Tell us about your needs
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you need — the more detail, the better our quote..."
                  rows={4}
                  className="w-full border border-[#e8e8e3] px-3 py-2 text-sm text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#C8A75E] focus:outline-none focus:ring-1 focus:ring-[#C8A75E]"
                />
                {description.length > 0 && description.length < 10 && (
                  <p className="mt-1 text-xs text-red-500">
                    At least 10 characters required
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-1.5">
                  Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as ServiceRequestUrgency)}
                  className="w-full border border-[#e8e8e3] px-3 py-2 text-sm text-[#0c0f14] focus:border-[#C8A75E] focus:outline-none focus:ring-1 focus:ring-[#C8A75E] bg-white"
                >
                  {urgencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b919a] uppercase tracking-wider mb-1.5">
                  TMS System (optional)
                </label>
                <input
                  type="text"
                  value={tmsSystem}
                  onChange={(e) => setTmsSystem(e.target.value)}
                  placeholder="e.g., Samsara, KeepTruckin, Trimble..."
                  className="w-full border border-[#e8e8e3] px-3 py-2 text-sm text-[#0c0f14] placeholder:text-[#b5b5ae] focus:border-[#C8A75E] focus:outline-none focus:ring-1 focus:ring-[#C8A75E]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={description.length < 10}
                className="bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && selectedCategory && (
          <div className="animate-fade-in">
            <p className="mb-4 text-sm font-medium text-[#3a3f49]">
              Review your request
            </p>

            {/* Dark branded header for summary */}
            <div className="mb-4">
              <div className="bg-[#0c0f14] px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.1em] text-[#C8A75E] uppercase">
                  Request Summary
                </span>
                <span className="text-[10px] text-[#6b6f76] tracking-wider uppercase">
                  {selectedCategory.label}
                </span>
              </div>
              <div className="border border-[#e8e8e3] border-t-0 divide-y divide-[#e8e8e3]">
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-[#8b919a]">Category</span>
                  <span className="text-sm font-medium text-[#0c0f14]">{selectedCategory.label}</span>
                </div>
                <div className="px-4 py-3">
                  <span className="text-sm text-[#8b919a]">Description</span>
                  <p className="mt-1 text-sm text-[#0c0f14]">{description}</p>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-[#8b919a]">Urgency</span>
                  <span className="text-sm font-medium text-[#0c0f14] capitalize">{urgency}</span>
                </div>
                {tmsSystem && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-sm text-[#8b919a]">TMS System</span>
                    <span className="text-sm font-medium text-[#0c0f14]">{tmsSystem}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-[#fafaf8]">
                  <span className="text-sm text-[#8b919a]">Estimate</span>
                  <span className="text-sm font-semibold text-[#C8A75E]">{selectedCategory.estimate}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8b919a] mb-6">
              Real human perfection — our engineering team handles every integration personally.
            </p>

            {error && (
              <div className="mb-4 border-l-3 border-red-500 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="text-center py-8 animate-fade-in">
            <div className="animate-scale-in inline-block mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            </div>
            <div className="mx-auto w-16 h-0.5 bg-gradient-to-r from-transparent via-[#C8A75E] to-transparent mb-4" />
            <h3 className="text-lg font-semibold text-[#0c0f14] mb-2">
              Request Submitted
            </h3>
            <p className="text-sm text-[#8b919a] mb-6">
              Our team will review your request and respond within 24 hours.
            </p>
            <Button
              variant="outline"
              onClick={reset}
            >
              Submit Another Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
