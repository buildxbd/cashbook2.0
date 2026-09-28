'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CashBook Error Boundary caught exception]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <AlertOctagon className="w-7 h-7 text-rose-400" />
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          An unexpected error occurred while loading this view. The ledger data is preserved safely.
        </p>

        {error.message && (
          <div className="mb-6 p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs font-mono text-rose-300 break-words">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition active:scale-95 shadow-lg shadow-emerald-950"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
          >
            <Home className="w-3.5 h-3.5" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
