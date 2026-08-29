import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#1e8c78] text-white shadow-2xs dark:bg-[#5ec2ac] dark:text-[#091f1a]',
        secondary:
          'border-[#1e8c78]/20 bg-[#c5fcee] text-[#1e8c78] dark:bg-[#164e43] dark:border-[#5ec2ac]/30 dark:text-[#c5fcee]',
        brand:
          'border-[#5ec2ac]/30 bg-[#5ec2ac]/15 text-[#1e8c78] dark:bg-[#5ec2ac]/20 dark:text-[#c5fcee]',
        outline:
          'border-border text-foreground',
        destructive:
          'border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        success:
          'border-[#5ec2ac]/40 bg-[#c5fcee]/60 text-[#1e8c78] dark:bg-[#164e43]/60 dark:text-[#c5fcee]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
