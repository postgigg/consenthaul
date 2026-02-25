'use client';

import { useState } from 'react';
import { ServiceRequestWizard } from '@/components/help/ServiceRequestWizard';
import { ServiceRequestList } from '@/components/help/ServiceRequestList';
import {
  Zap,
  BarChart3,
  CalendarClock,
  Users,
  Bot,
  FileBarChart,
} from 'lucide-react';

const integrationIdeas = [
  {
    icon: Zap,
    title: 'TMS Auto-Consent',
    description:
      'Trigger FMCSA consent requests automatically when a driver is onboarded in your TMS',
  },
  {
    icon: BarChart3,
    title: 'Fleet Compliance Dashboard',
    description:
      'Real-time compliance status across your entire fleet, embedded in your existing tools',
  },
  {
    icon: CalendarClock,
    title: 'Automated Annual Reconsent',
    description:
      'Never miss an annual Clearinghouse query — auto-send consent requests on schedule',
  },
  {
    icon: Users,
    title: 'Driver Onboarding Pipeline',
    description:
      'Plug ConsentHaul into your hiring workflow — consent collected before day one',
  },
  {
    icon: Bot,
    title: 'AI Agent Automation',
    description:
      'Let Claude or GPT manage your entire consent workflow via MCP — zero manual work',
  },
  {
    icon: FileBarChart,
    title: 'Custom Reporting & Analytics',
    description:
      'FMCSA compliance reports, audit trails, and fleet analytics tailored to your ops',
  },
];

export default function HelpPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-[#0c0f14] -mx-6 -mt-6 px-8 py-12">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(200,167,94,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,167,94,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#C8A75E]" />
            <span className="text-[11px] font-bold tracking-[0.15em] text-[#C8A75E] uppercase">
              Custom Integrations
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            We Build It.{' '}
            <span className="text-[#C8A75E]">You Ship It.</span>
          </h1>

          <p className="text-sm text-[#8b919a] max-w-xl leading-relaxed">
            Real human engineering — our team handles every integration
            personally. No AI slop, no templates. Tell us what you need and
            we&apos;ll build it.
          </p>
        </div>
      </div>

      {/* Integration Ideas Grid */}
      <div>
        <p className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.1em] mb-4">
          What we can build for you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationIdeas.map((idea, i) => {
            const Icon = idea.icon;
            return (
              <div
                key={idea.title}
                className="stagger-fade-in border border-[#e8e8e3] bg-white p-5 border-l-2 border-l-[#C8A75E]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-[#C8A75E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#0c0f14] mb-1">
                      {idea.title}
                    </p>
                    <p className="text-xs text-[#8b919a] leading-relaxed">
                      {idea.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard + List */}
      <ServiceRequestWizard onCreated={() => setRefreshKey((k) => k + 1)} />
      <ServiceRequestList refreshKey={refreshKey} />
    </div>
  );
}
