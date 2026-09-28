'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Search,
  Filter,
} from 'lucide-react';
import { AuditLogItem } from '@/lib/services/ledger-service';
import { Role } from '@prisma/client';
import { canViewAuditLogs } from '@/lib/auth/permissions';

interface AuditLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
}

export function AuditLogViewer({
  isOpen,
  onClose,
  currentUser,
}: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    if (isOpen && canViewAuditLogs(currentUser.role)) {
      const fetchLogs = async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/audit-logs?role=${currentUser.role}&limit=100`);
          const data = await res.json();
          if (data.success) {
            setLogs(data.data);
          }
        } catch (err) {
          console.error('Failed to load audit logs:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLogs();
    }
  }, [isOpen, currentUser.role]);

  if (!isOpen) return null;

  const isAuthorized = canViewAuditLogs(currentUser.role);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inId = log.transactionId?.toLowerCase().includes(q);
      const inActor = log.performedByName?.toLowerCase().includes(q);
      const inAction = log.action.toLowerCase().includes(q);
      if (!inId && !inActor && !inAction) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Plus className="w-3 h-3" /> Created
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Edit2 className="w-3 h-3" /> Updated
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Trash2 className="w-3 h-3" /> Deleted
          </span>
        );
      case 'ROLE_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <UserCheck className="w-3 h-3" /> Role Change
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
            {action}
          </span>
        );
    }
  };

  const formatTimestamp = (ts: string | Date) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} at ${d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Immutable Audit Trail
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Tamper-Proof
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Full chronological ledger edits, author attribution, and state changes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAuthorized ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-200">Access Restricted</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your active role (<strong>{currentUser.role}</strong>) does not have authorization to view the immutable audit trail. This feature requires <strong>OWNER</strong> or <strong>FINANCE_MANAGER</strong> privilege.
            </p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by actor or transaction ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="ROLE_CHANGE">Role Change</option>
                </select>
                <span className="text-slate-500 text-[11px] font-mono">
                  {filteredLogs.length} events
                </span>
              </div>
            </div>

            {/* Logs List */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading audit history...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No audit events match your filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="font-semibold text-slate-200">
                          {log.performedByName || 'System Actor'}
                        </span>
                        {log.performedByRole && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{log.performedByRole}]
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatTimestamp(log.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Entity: <span className="font-mono text-slate-300">{log.entityType}</span>{' '}
                      {log.transactionId && (
                        <span>
                          (Ref: <code className="text-emerald-400">{log.transactionId}</code>)
                        </span>
                      )}
                    </div>

                    {/* Change Diff view */}
                    {(log.oldValues || log.newValues) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                        {log.oldValues && (
                          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-rose-300 overflow-x-auto">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                              Previous Value:
                            </span>
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(log.oldValues, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValues && (
                          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-emerald-300 overflow-x-auto">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                              Updated Value:
                            </span>
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(log.newValues, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
