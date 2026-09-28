import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-800/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function TransactionListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse gap-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="w-28 sm:w-44 h-4 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-16 h-3 rounded" />
                <Skeleton className="w-12 h-3 rounded" />
              </div>
            </div>
          </div>
          <div className="text-right space-y-2 shrink-0">
            <Skeleton className="w-20 sm:w-28 h-5 rounded ml-auto" />
            <Skeleton className="w-16 h-3 rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BalanceSummaryHeaderSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
          <Skeleton className="w-36 h-7 rounded" />
          <Skeleton className="w-20 h-3 rounded" />
        </div>
      ))}
    </div>
  );
}
