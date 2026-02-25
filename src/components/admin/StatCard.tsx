'use client';

import type { LucideIcon } from 'lucide-react';
import { MiniChart } from '@/components/admin/MiniChart';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  sparkline?: number[];
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'neutral',
  sparkline,
}: StatCardProps) {
  const changeColors = {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-[#8b919a]',
  };

  return (
    <div className="border border-[#e8e8e3] bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center bg-[#f0f0ec]">
              <Icon className="h-4 w-4 text-[#5c6370]" />
            </div>
            <span className="text-xs font-semibold text-[#8b919a] uppercase tracking-wider">
              {label}
            </span>
          </div>
          <p className="text-2xl font-bold text-[#0c0f14] tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <MiniChart
            data={sparkline}
            color={changeType === 'negative' ? '#dc2626' : '#C8A75E'}
            className="mt-2"
          />
        )}
      </div>
    </div>
  );
}
