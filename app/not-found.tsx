import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <FileQuestion className="w-7 h-7 text-emerald-400" />
        </div>

        <h1 className="text-2xl font-black text-slate-100 mb-2">404 - Page Not Found</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The book, report, or accounting resource you are looking for does not exist or may have been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition active:scale-95 shadow-lg shadow-emerald-950"
        >
          <Home className="w-3.5 h-3.5" />
          Back to CashBook Dashboard
        </Link>
      </div>
    </div>
  );
}
