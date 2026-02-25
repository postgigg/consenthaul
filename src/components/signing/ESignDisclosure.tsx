'use client';

import { useState } from 'react';
import { ESIGN_DISCLOSURE_EN, ESIGN_DISCLOSURE_ES } from '@/lib/constants';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface ESignDisclosureProps {
  language: 'en' | 'es';
  companyName: string;
}

const labels = {
  en: {
    toggle: 'View all disclosures',
    collapse: 'Collapse disclosures',
    requiredNotice: 'Federal law (E-Sign Act, 15 U.S.C. § 7001) requires that you receive the following disclosures before consenting electronically.',
  },
  es: {
    toggle: 'Ver todas las divulgaciones',
    collapse: 'Cerrar divulgaciones',
    requiredNotice: 'La ley federal (Ley E-Sign, 15 U.S.C. § 7001) requiere que reciba las siguientes divulgaciones antes de consentir electrónicamente.',
  },
};

export function ESignDisclosure({ language, companyName }: ESignDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const disclosure = language === 'es' ? ESIGN_DISCLOSURE_ES : ESIGN_DISCLOSURE_EN;
  const t = labels[language];

  // Replace generic "your employer" with actual company name in disclosure text
  const injectCompany = (text: string) =>
    text.replace(/your employer/gi, companyName).replace(/su empleador/gi, companyName);

  return (
    <div className="bg-white border border-[#e8e8e3] mb-6">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-[#C8A75E] shrink-0" />
          <h2
            className="text-sm font-bold text-[#0c0f14] uppercase tracking-widest"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            {disclosure.title}
          </h2>
        </div>
        <p className="text-xs text-[#6b6f76] leading-relaxed">
          {t.requiredNotice}
        </p>
      </div>

      {/* Disclosure items — first 2 always visible, rest collapsible */}
      <div className="px-5 pb-2">
        {disclosure.disclosures.slice(0, 2).map((item, i) => (
          <div key={i} className="mb-3 last:mb-2">
            <p className="text-xs font-bold text-[#3a3f49] mb-0.5">
              {i + 1}. {item.heading}
            </p>
            <p className="text-xs text-[#6b6f76] leading-relaxed">
              {injectCompany(item.body)}
            </p>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="px-5 pb-2">
          {disclosure.disclosures.slice(2).map((item, i) => (
            <div key={i + 2} className="mb-3 last:mb-2">
              <p className="text-xs font-bold text-[#3a3f49] mb-0.5">
                {i + 3}. {item.heading}
              </p>
              <p className="text-xs text-[#6b6f76] leading-relaxed">
                {injectCompany(item.body)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#C8A75E] hover:text-[#b08f3e] border-t border-[#e8e8e3] transition-colors"
      >
        {expanded ? (
          <>
            {t.collapse}
            <ChevronUp className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            {t.toggle} ({disclosure.disclosures.length - 2} more)
            <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  );
}
