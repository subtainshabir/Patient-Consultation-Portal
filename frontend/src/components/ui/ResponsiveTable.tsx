import React from 'react';
import { cn } from '../../utils/cn';
import { SkeletonTable } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  mobileLayout?: 'cards' | 'scroll';
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'Records will appear here once created.',
  className,
  mobileLayout = 'cards',
}: ResponsiveTableProps<T>) {
  if (isLoading) {
    return <SkeletonTable rows={4} columns={columns.length} className={className} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={cn('my-4', className)}
      />
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Cards Layout (when mobileLayout === 'cards') */}
      {mobileLayout === 'cards' && (
        <div className="md:hidden flex flex-col gap-3">
          {data.map((item, rowIdx) => (
            <div
              key={keyExtractor(item, rowIdx)}
              className="bg-white p-4 rounded-xl border border-navy-200/90 shadow-card flex flex-col gap-2.5"
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between text-sm py-1 border-b border-navy-100 last:border-none">
                  <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                    {col.header}
                  </span>
                  <div className="text-navy-900 font-medium text-right">
                    {col.render ? col.render(item, rowIdx) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Desktop & Scrollable Table View */}
      <div
        className={cn(
          'w-full bg-white rounded-xl border border-navy-200/80 shadow-card overflow-hidden',
          mobileLayout === 'cards' ? 'hidden md:block' : 'overflow-x-auto'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-50/80 border-b border-navy-200/80 text-navy-700 text-xs font-semibold uppercase tracking-wider">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn('px-4 py-3.5 whitespace-nowrap', col.headerClassName)}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100/80 text-sm text-navy-800">
              {data.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item, rowIdx)}
                  className="hover:bg-navy-50/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5 text-navy-700', col.className)}
                    >
                      {col.render
                        ? col.render(item, rowIdx)
                        : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
