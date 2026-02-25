export default function UnsubscribedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-16 w-16 flex items-center justify-center bg-green-100 rounded-full">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[#0c0f14]">You&apos;ve been unsubscribed</h1>
        <p className="text-sm text-[#8b919a]">
          You will no longer receive outreach emails from ConsentHaul.
          If you unsubscribed by mistake, please contact us at support@consenthaul.com.
        </p>
      </div>
    </div>
  );
}
