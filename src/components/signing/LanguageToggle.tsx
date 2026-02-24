'use client';

import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  /** Current language code. */
  language: 'en' | 'es';
  /** Called when the user selects a different language. */
  onChange: (language: 'en' | 'es') => void;
  /** Optional additional CSS classes. */
  className?: string;
}

/**
 * A simple English / Espanol toggle for the public signing page.
 */
export function LanguageToggle({ language, onChange, className }: LanguageToggleProps) {
  return (
    <div
      className={cn('inline-flex rounded-lg border border-gray-300 bg-white p-0.5', className)}
      role="radiogroup"
      aria-label="Language selection"
    >
      <button
        type="button"
        role="radio"
        aria-checked={language === 'en'}
        onClick={() => onChange('en')}
        className={cn(
          'relative rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          language === 'en'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        )}
      >
        <span className="mr-1.5" aria-hidden="true">EN</span>
        <span className="hidden sm:inline">English</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={language === 'es'}
        onClick={() => onChange('es')}
        className={cn(
          'relative rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          language === 'es'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        )}
      >
        <span className="mr-1.5" aria-hidden="true">ES</span>
        <span className="hidden sm:inline">Espanol</span>
      </button>
    </div>
  );
}
