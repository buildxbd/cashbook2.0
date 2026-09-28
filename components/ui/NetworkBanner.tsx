'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle, CloudUpload } from 'lucide-react';
import { syncEngine, SyncStatus } from '@/lib/offline/sync-engine';

export function NetworkBanner() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
  });
  const [dismissed, setDismissed] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newStatus) => {
      setStatus(newStatus);
      if (newStatus.isOnline && newStatus.pendingCount === 0 && !newStatus.isSyncing) {
        // If we just finished syncing
        setJustSynced((prev) => {
          if (!prev && status.pendingCount > 0) {
            setTimeout(() => setJustSynced(false), 4000);
            return true;
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, [status.pendingCount]);

  const handleManualSync = async () => {
    await syncEngine.syncPendingTransactions();
  };

  // If online, no pending items, and not syncing, and not just finished syncing, banner can be hidden
  if (status.isOnline && status.pendingCount === 0 && !status.isSyncing && !justSynced) {
    return null;
  }

  return (
    <div
      className={`w-full transition-all duration-300 border-b px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between z-50 sticky top-0 backdrop-blur-md shadow-md ${
        !status.isOnline
          ? 'bg-rose-950/90 border-rose-800 text-rose-200'
          : status.isSyncing
          ? 'bg-blue-950/90 border-blue-800 text-blue-200'
          : justSynced
          ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          : 'bg-amber-950/90 border-amber-800 text-amber-200'
      }`}
    >
      <div className="flex items-center gap-2.5 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {!status.isOnline ? (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>🔴 Offline Mode:</strong> Transactions will be saved locally in IndexedDB and auto-synced when connected.
              </span>
            </>
          ) : status.isSyncing ? (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping shrink-0" />
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              <span>
                <strong>🟢 Online - Auto-syncing pending items...</strong> ({status.pendingCount} left in queue)
              </span>
            </>
          ) : justSynced ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>🟢 Synced:</strong> All offline records have been successfully submitted to server.
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>🟢 Online:</strong> {status.pendingCount} offline transaction(s) pending sync.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status.pendingCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/10 border border-white/20">
              Queue: {status.pendingCount}
            </span>
          )}

          {status.isOnline && status.pendingCount > 0 && !status.isSyncing && (
            <button
              onClick={handleManualSync}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              Sync Now
            </button>
          )}

          {status.isOnline && !status.isSyncing && (
            <button
              onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white text-xs px-1"
              aria-label="Dismiss"
            >
              {dismissed ? '' : '✕'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PendingQueueBadge() {
  const [count, setCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    return syncEngine.subscribe((status) => {
      setCount(status.pendingCount);
      setIsOnline(status.isOnline);
    });
  }, []);

  if (count === 0 && isOnline) return null;

  return (
    <div
      title={isOnline ? `${count} items waiting to sync` : 'Device offline (local storage active)'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        !isOnline
          ? 'bg-rose-950/70 border-rose-700/60 text-rose-300'
          : count > 0
          ? 'bg-amber-950/70 border-amber-700/60 text-amber-300 animate-pulse'
          : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          !isOnline ? 'bg-rose-500 animate-pulse' : count > 0 ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
      />
      <span>{count > 0 ? `${count} Offline Pending` : 'Offline Mode'}</span>
    </div>
  );
}
