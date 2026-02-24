import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[#0c0f14] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[#0c0f14] text-white',
        secondary: 'bg-[#f0f0ec] text-[#3a3f49]',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        destructive: 'bg-red-50 text-red-700 border border-red-200',
        outline: 'border border-[#d4d4cf] text-[#6b6f76] bg-transparent',
        gold: 'bg-[#C8A75E]/10 text-[#9a7d3a] border border-[#C8A75E]/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
