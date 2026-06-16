import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type JoyColor = 'ocean' | 'coral' | 'sunset' | 'peach' | 'emerald' | 'amethyst' | 'gold';

const gradients: Record<JoyColor, string> = {
  ocean: 'from-resort-ocean to-cyan-400',
  coral: 'from-resort-coral to-violet-400',
  sunset: 'from-resort-sunset to-emerald-400',
  peach: 'from-resort-peach to-slate-400',
  emerald: 'from-resort-emerald to-teal-300',
  amethyst: 'from-resort-amethyst to-blue-400',
  gold: 'from-resort-ocean to-indigo-400'
};

const shadows: Record<JoyColor, string> = {
  ocean: 'shadow-blue-500/40',
  coral: 'shadow-indigo-500/40',
  sunset: 'shadow-teal-500/40',
  peach: 'shadow-slate-500/40',
  emerald: 'shadow-cyan-500/40',
  amethyst: 'shadow-violet-500/40',
  gold: 'shadow-blue-500/40'
};

export function JoyIcon({
  icon: Icon,
  color = 'gold',
  size = 'md',
  className
}: {
  icon: any;
  color?: JoyColor;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-[1.35rem]'
  };

  const iconSizes = { sm: 16, md: 22, lg: 28 };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center shrink-0 bg-gradient-to-br text-white',
        gradients[color],
        shadows[color],
        'shadow-lg border border-white/20',
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 bg-white/10 mix-blend-overlay rounded-inherit" />
      <Icon size={iconSizes[size]} strokeWidth={2.2} className="relative z-10 drop-shadow-md" />
    </div>
  );
}
