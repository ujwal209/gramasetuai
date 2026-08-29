import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#1e8c78] text-white hover:bg-[#187564] shadow-xs dark:bg-[#5ec2ac] dark:text-[#091f1a] dark:hover:bg-[#4eb39d]',
        brand:
          'bg-gradient-to-r from-[#1e8c78] to-[#5ec2ac] text-white hover:opacity-95 shadow-md shadow-[#5ec2ac]/20',
        destructive:
          'bg-rose-600 text-white hover:bg-rose-700 shadow-xs dark:bg-rose-900 dark:text-rose-100',
        outline:
          'border border-input bg-background hover:bg-muted hover:text-foreground',
        secondary:
          'bg-[#c5fcee] text-[#1e8c78] hover:bg-[#b2fbe8] dark:bg-[#164e43] dark:text-[#c5fcee] dark:hover:bg-[#1b5e52]',
        ghost:
          'hover:bg-muted hover:text-foreground',
        link:
          'text-[#1e8c78] underline-offset-4 hover:underline dark:text-[#5ec2ac]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-sm font-bold',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
