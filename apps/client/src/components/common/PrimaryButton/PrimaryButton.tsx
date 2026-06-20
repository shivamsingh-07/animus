import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';

type PrimaryButtonProps =
  | (ComponentPropsWithoutRef<'button'> & { to?: never; children: ReactNode })
  | (ComponentPropsWithoutRef<typeof Link> & { to: string; children: ReactNode });

export function PrimaryButton({ className, children, ...props }: PrimaryButtonProps) {
  const classes = cn('btn-primary', className);

  if ('to' in props && props.to) {
    const { to, ...linkProps } = props;
    return (
      <Link to={to} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { type = 'button', ...buttonProps } = props as ComponentPropsWithoutRef<'button'>;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
