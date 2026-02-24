import Link from 'next/link';
import { LogoFull } from '@/components/brand/Logo';
import { LogoIcon } from '@/components/brand/Logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark brand surface */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative bg-[#0c0f14] flex-col justify-between p-10 overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <LogoFull mode="dark" />
        </div>

        {/* Middle: Value prop */}
        <div className="relative z-10 space-y-6">
          <h2
            className="text-[2.5rem] leading-[1.1] font-bold text-white tracking-tight"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            FMCSA consent,
            <br />
            <span className="text-[#C8A75E]">done right.</span>
          </h2>
          <p className="text-[#8b919a] text-base leading-relaxed max-w-sm">
            Send consent links. Collect driver signatures. Get signed PDFs back.
            Clearinghouse compliance without the paperwork.
          </p>
          <div className="flex gap-6 pt-2">
            <div>
              <p className="text-[#C8A75E] text-2xl font-bold tabular-nums">3yr</p>
              <p className="text-[#5c6370] text-xs uppercase tracking-wider mt-0.5">Retention</p>
            </div>
            <div className="w-px bg-[#1e2129]" />
            <div>
              <p className="text-[#C8A75E] text-2xl font-bold tabular-nums">$0.50</p>
              <p className="text-[#5c6370] text-xs uppercase tracking-wider mt-0.5">Per consent</p>
            </div>
            <div className="w-px bg-[#1e2129]" />
            <div>
              <p className="text-[#C8A75E] text-2xl font-bold tabular-nums">SMS</p>
              <p className="text-[#5c6370] text-xs uppercase tracking-wider mt-0.5">+ WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Bottom: footer */}
        <div className="relative z-10">
          <div className="w-8 h-px bg-[#C8A75E]/30 mb-4" />
          <p className="text-[#5c6370] text-xs">
            &copy; {new Date().getFullYear()} ConsentHaul
          </p>
          <p className="text-[#3a3f49] text-[0.7rem] mt-1">
            Operated by Workbird LLC
          </p>
          <div className="flex gap-4 mt-3">
            <Link href="/terms" className="text-[#5c6370] text-[0.7rem] hover:text-[#C8A75E] transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[#5c6370] text-[0.7rem] hover:text-[#C8A75E] transition-colors">Privacy</Link>
          </div>
        </div>

        {/* Diagonal accent line */}
        <div className="absolute -right-20 top-1/2 w-[400px] h-px bg-gradient-to-r from-transparent via-[#C8A75E]/20 to-transparent -rotate-45" />
      </div>

      {/* Right panel — form area */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#f8f8f6]">
        {/* Mobile logo (hidden on desktop) */}
        <div className="lg:hidden px-6 pt-8 pb-2">
          <LogoIcon className="text-[#0A0A0A] w-8 h-8" />
        </div>

        {/* Centered form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden px-6 pb-6">
          <div className="border-t border-[#e8e8e3] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[#b5b5ae] text-[0.7rem]">
              &copy; {new Date().getFullYear()} ConsentHaul &middot; Workbird LLC
            </p>
            <div className="flex gap-4">
              <Link href="/terms" className="text-[#8b919a] text-[0.7rem] hover:text-[#0c0f14] transition-colors">Terms</Link>
              <Link href="/privacy" className="text-[#8b919a] text-[0.7rem] hover:text-[#0c0f14] transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
