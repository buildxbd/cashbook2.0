'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          </div>

          <h1 className="text-xl font-bold text-slate-100 mb-2">Critical Application Error</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            A fatal error occurred at root level. Your accounting ledger entries stored in the database remain safe.
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition active:scale-95 shadow-lg shadow-emerald-950"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload CashBook
          </button>
        </div>
      </body>
    </html>
  );
}
