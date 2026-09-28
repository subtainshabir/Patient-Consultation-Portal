import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'auto',
  showSubtitle = true,
  className,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg p-1.5',
    md: 'w-10 h-10 rounded-xl p-2',
    lg: 'w-12 h-12 rounded-2xl p-2.5',
  };

  const titleSizes = {
    sm: 'text-sm font-bold',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
  };

  const subSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const isDark = variant === 'dark';

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {/* Icon emblem */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0 bg-gradient-to-br from-medical-600 to-medical-800 text-white shadow-md shadow-medical-900/10 border border-medical-500/30',
          iconSizes[size]
        )}
      >
        <Activity className="w-full h-full stroke-[2.5]" />
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            'tracking-tight font-sans',
            titleSizes[size],
            isDark ? 'text-white' : 'text-navy-950'
          )}
        >
          Dr. Rauf Neurology
        </span>
        {showSubtitle && (
          <span
            className={cn(
              'mt-1 font-medium tracking-normal',
              subSizes[size],
              isDark ? 'text-medical-200' : 'text-medical-700'
            )}
          >
            Patient Consultation Portal
          </span>
        )}
      </div>
    </div>
  );
};
