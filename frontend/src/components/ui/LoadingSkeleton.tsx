import React from 'react';
import { cn } from '../../utils/cn';

export const SkeletonLine: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn('animate-pulse bg-navy-200/70 rounded', className)}
      aria-hidden="true"
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'p-5 bg-white rounded-xl border border-navy-200/80 shadow-card flex flex-col gap-4 animate-pulse',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-4 w-1/3" />
        <SkeletonLine className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonLine className="h-8 w-1/2" />
      <SkeletonLine className="h-3 w-4/5" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full bg-white rounded-xl border border-navy-200/80 shadow-card overflow-hidden animate-pulse',
        className
      )}
      aria-hidden="true"
    >
      {/* Table Header */}
      <div className="bg-navy-50/70 border-b border-navy-200/70 p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine key={`th-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-navy-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <SkeletonLine
                key={`td-${r}-${c}`}
                className={cn('h-4 flex-1', c === 0 ? 'w-1/3' : 'w-full')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonForm: React.FC<{ fields?: number; className?: string }> = ({
  fields = 4,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-6 bg-white rounded-xl border border-navy-200/80 shadow-card flex flex-col gap-5 animate-pulse',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex flex-col gap-2">
        <SkeletonLine className="h-5 w-1/4" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkeletonLine className="h-3.5 w-1/3" />
            <SkeletonLine className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-navy-100">
        <SkeletonLine className="h-10 w-24 rounded-lg" />
        <SkeletonLine className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
};
