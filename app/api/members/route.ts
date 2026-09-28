import { NextRequest, NextResponse } from 'next/server';
import { LedgerService } from '@/lib/services/ledger-service';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') ?? undefined;
    const members = await LedgerService.getMembers(businessId);
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role, performedBy } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    const newMember = await LedgerService.addMember({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      role: role as Role,
      performedBy: performedBy || { id: 'usr_owner_01', name: 'Tanvir Hossain', role: 'OWNER' as Role },
    });

    return NextResponse.json(
      { success: true, data: newMember, message: `Staff member ${name} invited as ${role}` },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, newRole, performedBy } = body;

    if (!memberId || !newRole) {
      return NextResponse.json(
        { success: false, error: 'memberId and newRole are required' },
        { status: 400 }
      );
    }

    const updated = await LedgerService.updateMemberRole({
      memberId,
      newRole: newRole as Role,
      performedBy: performedBy || { id: 'usr_owner_01', name: 'Tanvir Hossain', role: 'OWNER' as Role },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Role updated to ${newRole}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const role = (searchParams.get('role') || 'OWNER') as Role;
    const userId = searchParams.get('userId') || 'usr_owner_01';
    const userName = searchParams.get('userName') || 'Tanvir Hossain';

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'memberId query parameter is required' },
        { status: 400 }
      );
    }

    const res = await LedgerService.removeMember(memberId, {
      id: userId,
      name: userName,
      role,
    });

    return NextResponse.json({ success: true, message: res.message });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
