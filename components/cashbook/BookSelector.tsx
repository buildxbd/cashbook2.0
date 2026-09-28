'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, Plus, Check } from 'lucide-react';

export interface BookItem {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    transactions: number;
  };
}

interface BookSelectorProps {
  books: BookItem[];
  selectedBookId: string;
  onSelectBook: (bookId: string) => void;
  onCreateBook: (name: string, description: string) => Promise<void>;
  isLoading?: boolean;
}

export function BookSelector({
  books,
  selectedBookId,
  onSelectBook,
  onCreateBook,
  isLoading = false,
}: BookSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookDesc, setNewBookDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentBook = books.find((b) => b.id === selectedBookId) || books[0];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreateBook(newBookName.trim(), newBookDesc.trim());
      setNewBookName('');
      setNewBookDesc('');
      setIsModalOpen(false);
      setIsOpen(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-left shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 group min-w-[240px]"
      >
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400">Current Ledger</p>
          <p className="text-sm font-semibold text-slate-100 truncate">
            {currentBook ? currentBook.name : 'Select CashBook...'}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-2 max-h-64 overflow-y-auto space-y-1">
              {books.map((book) => {
                const isSelected = book.id === selectedBookId;
                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      onSelectBook(book.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-sm font-medium truncate">{book.name}</p>
                      {book.description && (
                        <p className="text-xs text-slate-400 truncate">
                          {book.description}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="p-2 bg-slate-950/60">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700/80 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-semibold tracking-wide transition-colors border border-slate-700/60"
              >
                <Plus className="w-4 h-4" />
                Add New Ledger / Book
              </button>
            </div>
          </div>
        </>
      )}

      {/* New Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Create New Ledger</h3>
                <p className="text-xs text-slate-400">Create a separate book for projects, branches, or petty cash.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ledger Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chittagong Branch, Project Bravo"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Field expenses, fuel, and site worker allowance"
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newBookName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all"
                >
                  {isSubmitting ? 'Creating...' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
