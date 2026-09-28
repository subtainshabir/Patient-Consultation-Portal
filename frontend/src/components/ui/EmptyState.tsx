import React from 'react';
import { type LucideIcon, FolderOpen } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-dashed border-navy-200',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center text-navy-400 mb-4 border border-navy-100">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-navy-900 mb-1">{title}</h3>
      <p className="text-sm text-navy-500 max-w-sm leading-relaxed mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
