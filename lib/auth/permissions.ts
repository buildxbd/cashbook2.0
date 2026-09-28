import { Role } from '@prisma/client';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const DEMO_USERS: UserSession[] = [
  {
    id: 'usr_owner_01',
    name: 'Tanvir Hossain (Owner)',
    email: 'tanvir@buildx.bd',
    role: 'OWNER',
  },
  {
    id: 'usr_finance_02',
    name: 'Farhana Ahmed (Finance Manager)',
    email: 'farhana.fin@buildx.bd',
    role: 'FINANCE_MANAGER',
  },
  {
    id: 'usr_operator_03',
    name: 'Karim Uddin (Data Operator)',
    email: 'karim.op@buildx.bd',
    role: 'DATA_OPERATOR',
  },
  {
    id: 'usr_viewer_04',
    name: 'Ayesha Siddiqua (Viewer)',
    email: 'ayesha.auditor@buildx.bd',
    role: 'VIEWER',
  },
];

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Checks whether a transaction exceeds the 24-hour immutable edit lock threshold
 */
export function isTransactionLockedByAge(createdAt: Date | string): boolean {
  const createdTime = new Date(createdAt).getTime();
  const currentTime = Date.now();
  return currentTime - createdTime > TWENTY_FOUR_HOURS_MS;
}

/**
 * Gets human-readable age of a transaction (e.g., "2h ago", "28h ago (Locked)")
 */
export function getTransactionLockInfo(
  createdAt: Date | string,
  isExplicitlyLocked: boolean = false
): { isLocked: boolean; reason: string; remainingHours: number } {
  const createdTime = new Date(createdAt).getTime();
  const ageMs = Date.now() - createdTime;
  const ageHours = ageMs / (60 * 60 * 1000);
  const isAgeLocked = ageMs > TWENTY_FOUR_HOURS_MS;

  if (isExplicitlyLocked) {
    return {
      isLocked: true,
      reason: 'Reconciled & Manually Locked by Finance',
      remainingHours: 0,
    };
  }

  if (isAgeLocked) {
    return {
      isLocked: true,
      reason: 'Automated 24h Compliance Lock Active',
      remainingHours: 0,
    };
  }

  const remaining = Math.max(0, Math.ceil(24 - ageHours));
  return {
    isLocked: false,
    reason: `${remaining}h remaining in edit window`,
    remainingHours: remaining,
  };
}

/**
 * Validates if the user can create new cash in/out entries
 */
export function canAddTransaction(role: Role): boolean {
  return role === 'OWNER' || role === 'FINANCE_MANAGER' || role === 'DATA_OPERATOR';
}

/**
 * Validates if the user can edit a specific transaction based on age and role
 */
export function canEditTransaction(
  role: Role,
  transaction: { createdAt: Date | string; isLocked?: boolean; createdById?: string },
  currentUserId?: string
): { allowed: boolean; reason?: string } {
  if (role === 'VIEWER') {
    return { allowed: false, reason: 'Viewers have read-only access and cannot edit entries.' };
  }

  const lockInfo = getTransactionLockInfo(transaction.createdAt, transaction.isLocked);

  // OWNER has universal lock override
  if (role === 'OWNER') {
    return { allowed: true };
  }

  // FINANCE_MANAGER has compliance override
  if (role === 'FINANCE_MANAGER') {
    return { allowed: true };
  }

  // DATA_OPERATOR: only editable within 24 hours
  if (role === 'DATA_OPERATOR') {
    if (lockInfo.isLocked) {
      return {
        allowed: false,
        reason:
          '24-Hour Edit Window Expired. This entry is locked for accounting compliance. Request Owner or Finance Manager override.',
      };
    }

    if (currentUserId && transaction.createdById && transaction.createdById !== currentUserId) {
      return {
        allowed: false,
        reason: 'Data Operators can only edit entries they personally authored.',
      };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: 'Unauthorized action.' };
}

/**
 * Validates if the user can delete a specific transaction
 */
export function canDeleteTransaction(
  role: Role,
  transaction: { createdAt: Date | string; isLocked?: boolean; createdById?: string },
  currentUserId?: string
): { allowed: boolean; reason?: string } {
  if (role === 'VIEWER') {
    return { allowed: false, reason: 'Viewers cannot delete entries.' };
  }

  const lockInfo = getTransactionLockInfo(transaction.createdAt, transaction.isLocked);

  if (role === 'OWNER') {
    return { allowed: true };
  }

  if (role === 'FINANCE_MANAGER') {
    return { allowed: true };
  }

  if (role === 'DATA_OPERATOR') {
    if (lockInfo.isLocked) {
      return {
        allowed: false,
        reason:
          '24-Hour Window Expired. Locked entries cannot be deleted by Data Operators. Contact Finance Manager.',
      };
    }

    if (currentUserId && transaction.createdById && transaction.createdById !== currentUserId) {
      return {
        allowed: false,
        reason: 'Data Operators can only delete entries they authored within 24 hours.',
      };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: 'Unauthorized action.' };
}

/**
 * Validates if user can invite or manage staff members
 */
export function canManageStaff(role: Role, targetRole?: Role): boolean {
  if (role === 'OWNER') return true;
  if (role === 'FINANCE_MANAGER') {
    // Finance Manager can only manage Data Operators and Viewers
    if (targetRole && (targetRole === 'OWNER' || targetRole === 'FINANCE_MANAGER')) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Validates if user can view detailed immutable audit logs
 */
export function canViewAuditLogs(role: Role): boolean {
  return role === 'OWNER' || role === 'FINANCE_MANAGER';
}
