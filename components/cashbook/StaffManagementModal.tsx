'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Users,
  Shield,
  Trash2,
  Crown,
  Briefcase,
  Eye,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { StaffMember } from '@/lib/services/ledger-service';
import { canManageStaff } from '@/lib/auth/permissions';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
}

export function StaffManagementModal({
  isOpen,
  onClose,
  currentUser,
}: StaffManagementModalProps) {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for new invite
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('DATA_OPERATOR');

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch {
      setErrorMsg('Failed to load staff members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          performedBy: currentUser,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to invite staff member');
      }

      setSuccessMsg(`Invited ${name} as ${role}`);
      setName('');
      setEmail('');
      setPhone('');
      await loadMembers();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          newRole,
          performedBy: currentUser,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update role');
      }

      setSuccessMsg(`Role updated to ${newRole}`);
      await loadMembers();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${memberName}?`)) return;

    try {
      setErrorMsg(null);
      const params = new URLSearchParams({
        memberId,
        role: currentUser.role,
        userId: currentUser.id,
        userName: currentUser.name,
      });

      const res = await fetch(`/api/members?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to revoke access');
      }

      setSuccessMsg(`Access revoked for ${memberName}`);
      await loadMembers();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  if (!isOpen) return null;

  const isUserAuthorizedToManage = canManageStaff(currentUser.role);

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Crown className="w-3 h-3" /> Owner
          </span>
        );
      case 'FINANCE_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Shield className="w-3 h-3" /> Finance Manager
          </span>
        );
      case 'DATA_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Briefcase className="w-3 h-3" /> Data Operator
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600">
            <Eye className="w-3 h-3" /> Viewer (Read Only)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Staff & Role-Based Access Control
              </h3>
              <p className="text-xs text-slate-400">
                Manage business personnel permissions (Owner, Finance Manager, Operator, Viewer)
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Invite Form (only if authorized) */}
          {isUserAuthorizedToManage ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <UserPlus className="w-4 h-4 text-emerald-400" /> Invite New Staff Member
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Address *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (Optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Assigned Role:</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {currentUser.role === 'OWNER' && (
                        <option value="FINANCE_MANAGER">Finance Manager</option>
                      )}
                      <option value="DATA_OPERATOR">Data Operator (24h edit window)</option>
                      <option value="VIEWER">Viewer (Read-only)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !name || !email}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                  >
                    {isSubmitting ? 'Inviting...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-400">
              Your active role (<strong>{currentUser.role}</strong>) has read-only permission for staff management. Only Owners and Finance Managers can invite staff.
            </div>
          )}

          {/* Member List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Team Members ({members.length})
            </h4>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-500">Loading members...</div>
            ) : (
              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                {members.map((m) => {
                  const isOwner = m.role === 'OWNER';
                  const canModifyThisMember =
                    isUserAuthorizedToManage && !isOwner && m.userId !== currentUser.id;

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 text-xs sm:text-sm">
                            {m.name}
                          </span>
                          {getRoleBadge(m.role)}
                          {m.userId === currentUser.id && (
                            <span className="text-[10px] text-emerald-400 font-mono">(You)</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {m.email} {m.phone ? `• ${m.phone}` : ''}
                        </p>
                      </div>

                      {/* Role selector / Actions */}
                      {canModifyThisMember && (
                        <div className="flex items-center gap-2">
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                          >
                            {currentUser.role === 'OWNER' && (
                              <option value="FINANCE_MANAGER">Finance Manager</option>
                            )}
                            <option value="DATA_OPERATOR">Data Operator</option>
                            <option value="VIEWER">Viewer</option>
                          </select>

                          <button
                            onClick={() => handleRemoveMember(m.id, m.name)}
                            title="Revoke Access"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
