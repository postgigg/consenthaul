import { LogoFull } from '@/components/brand/Logo';

export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0f14] flex items-center justify-center">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative text-center px-6">
        <LogoFull mode="dark" className="h-6 w-auto mx-auto" />

        <div className="mt-10 w-16 h-0.5 bg-[#C8A75E] mx-auto" />

        <h1
          className="mt-10 text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05]"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Coming Soon
        </h1>

        <p className="mt-6 text-[#5c6370] text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          We&apos;re building something new for motor carriers.
        </p>

        <div className="mt-12 inline-flex items-center gap-3 border border-[#1e2129] px-6 py-3">
          <div className="w-2 h-2 rounded-full bg-[#C8A75E] animate-pulse" />
          <span className="text-xs font-bold text-[#5c6370] uppercase tracking-[0.2em]">
            In Development
          </span>
        </div>

        <p className="mt-16 text-[0.7rem] text-[#3a3f47]">
          &copy; {new Date().getFullYear()} Workbird LLC
        </p>
      </div>
    </div>
  );
}
