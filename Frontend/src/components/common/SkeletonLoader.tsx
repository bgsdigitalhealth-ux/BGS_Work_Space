import React from 'react';

export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-xs animate-pulse"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-1/4" />
          </div>
        </div>
        <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
      </div>
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs animate-pulse space-y-4">
    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
      <div className="h-5 bg-slate-200 rounded w-1/4" />
      <div className="h-8 bg-slate-200 rounded w-32" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 items-center py-2.5 border-b border-slate-100/80 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-3.5 rounded-xl border border-slate-100 bg-white flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-3.5 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
        <div className="h-6 bg-slate-200 rounded w-20 shrink-0" />
      </div>
    ))}
  </div>
);
