import { NextRequest, NextResponse } from 'next/server';
import { LedgerService } from '@/lib/services/ledger-service';
import { Role } from '@prisma/client';
import { canViewAuditLogs } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') || 'OWNER') as Role;
    const limit = Number(searchParams.get('limit') || '50');

    if (!canViewAuditLogs(role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Access Denied: Role "${role}" cannot view immutable audit logs. Requires Owner or Finance Manager privilege.`,
        },
        { status: 403 }
      );
    }

    const logs = await LedgerService.getAuditLogs({ limit });
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
