import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="w-full h-1 bg-[#C8A75E] mb-10" />
        <p className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em] mb-4">Error 404</p>
        <h1
          className="text-4xl font-bold text-[#0c0f14] tracking-tight"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Page not found
        </h1>
        <p className="mt-4 text-[#6b6f76] text-base leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="bg-[#0c0f14] text-white font-bold text-sm uppercase tracking-wider px-6 py-3 hover:bg-[#1a1e27] transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/login"
            className="border border-[#d4d4cf] text-[#3a3f49] font-bold text-sm uppercase tracking-wider px-6 py-3 hover:bg-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
