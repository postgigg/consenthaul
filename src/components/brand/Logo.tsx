/**
 * ConsentHaul brand logos
 * - LogoFull: wordmark + icon (nav bars, headers)
 * - LogoIcon: icon only (favicons, compact spaces)
 * - Both support light (default) and dark mode
 */

interface LogoProps {
  className?: string;
}

interface LogoFullProps extends LogoProps {
  mode?: 'light' | 'dark';
}

/** Full logo with wordmark — use in navbars and headers */
export function LogoFull({ mode = 'light', className = '' }: LogoFullProps) {
  const stroke = mode === 'dark' ? '#FFFFFF' : '#0A0A0A';
  const fill = mode === 'dark' ? '#FFFFFF' : '#0A0A0A';

  return (
    <svg
      width="200"
      height="32"
      viewBox="0 0 300 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ConsentHaul"
    >
      <rect x="1" y="1" width="46" height="46" rx="8" stroke={stroke} strokeWidth="1.5" />
      <path d="M34 9 H39 V14" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 26.0 L21.3 30.5 L31.8 18.8" stroke={stroke} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="39" cy="39" r="2.2" fill="#C8A75E" />
      <text
        x="64"
        y="30"
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
        fontSize="20"
        fontWeight="650"
        letterSpacing="1.8"
        fill={fill}
      >
        CONSENTHAUL
      </text>
    </svg>
  );
}

/** Icon only — use in compact spaces, mobile headers, favicons */
export function LogoIcon({ className = '' }: LogoProps & { mode?: 'light' | 'dark'; size?: number }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ConsentHaul"
    >
      <rect x="3" y="3" width="42" height="42" rx="9" stroke="currentColor" strokeWidth="2" />
      <path d="M32 11 H37 V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 26.2 L20.8 31.0 L32.8 18.8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35.5" cy="35.5" r="2.6" fill="#C8A75E" />
    </svg>
  );
}
