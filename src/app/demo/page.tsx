import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import { SigningDemo } from '@/components/landing/SigningDemo';
import { ApiWorkflowDemo } from '@/components/landing/ApiWorkflowDemo';
import { AiAgentDemo } from '@/components/landing/AiAgentDemo';

export const metadata: Metadata = {
  title: 'Interactive Signing Demo — ConsentHaul',
  description:
    'Try the exact FMCSA consent signing experience a CDL driver goes through. Draw your signature and generate a real compliant PDF.',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Nav */}
      <header className="border-b border-[#e8e8e3] bg-white">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3">
            <LogoFull mode="light" className="h-5 w-auto" />
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#8b919a] uppercase tracking-widest hover:text-[#0c0f14] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
      </header>

      {/* Section 1 — Driver Signing Demo (iPhone frame) */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(12,15,20,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(12,15,20,.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — text */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-0.5 bg-[#C8A75E]" />
                <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">Interactive demo</span>
              </div>

              <h1
                className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-4 max-w-lg"
                style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
              >
                Try the{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">Driver Signing</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/30 -z-0" />
                </span>{' '}
                Experience
              </h1>

              <p className="text-[#6b6f76] text-lg leading-relaxed max-w-xl">
                Go through the exact same flow a CDL driver sees — review the FMCSA consent document,
                draw your signature, and generate a real PDF.
              </p>
            </div>

            {/* Right — phone */}
            <div className="flex justify-center lg:justify-end">
              <SigningDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — API Demo */}
      <section className="relative overflow-hidden bg-[#0c0f14]">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(200,167,94,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200,167,94,.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#6b6f76] uppercase tracking-[0.2em]">REST API</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 max-w-lg"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Automate With the{' '}
            <span className="relative inline-block">
              <span className="relative z-10">REST API</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/30 -z-0" />
            </span>
          </h2>

          <p className="text-[#8b919a] text-lg leading-relaxed max-w-xl mb-16">
            Four API calls. Driver created, consent sent, status tracked, signed PDF downloaded.
            Integrate into your TMS or onboarding flow.
          </p>

          <ApiWorkflowDemo />
        </div>
      </section>

      {/* Section 3 — AI Agent Demo */}
      <section className="relative overflow-hidden bg-[#f8f8f6]">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(12,15,20,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(12,15,20,.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-[#C8A75E]" />
            <span className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em]">MCP for AI agents</span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold text-[#0c0f14] tracking-tight mb-4 max-w-lg"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Let{' '}
            <span className="relative inline-block">
              <span className="relative z-10">AI Agents</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#C8A75E]/30 -z-0" />
            </span>{' '}
            Handle Compliance
          </h2>

          <p className="text-[#6b6f76] text-lg leading-relaxed max-w-xl mb-16">
            Connect Claude or any MCP-compatible agent. Create drivers, send consents, check status,
            and download PDFs — all through natural language.
          </p>

          <AiAgentDemo />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8e8e3] py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#b5b5ae]">
            &copy; {new Date().getFullYear()} ConsentHaul &middot; Operated by Flotac Ltd
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-[#b5b5ae] hover:text-[#6b6f76] transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-[#b5b5ae] hover:text-[#6b6f76] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
