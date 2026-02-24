'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="w-full h-1 bg-red-500 mb-10" />
        <p className="text-xs font-bold text-[#8b919a] uppercase tracking-[0.2em] mb-4">Error</p>
        <h1
          className="text-4xl font-bold text-[#0c0f14] tracking-tight"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Something went wrong
        </h1>
        <p className="mt-4 text-[#6b6f76] text-base leading-relaxed">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-8">
          <button
            onClick={reset}
            className="bg-[#0c0f14] text-white font-bold text-sm uppercase tracking-wider px-6 py-3 hover:bg-[#1a1e27] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
