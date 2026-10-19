import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import { db } from '@/lib/db/mock-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const user = AuthService.getCurrentUser(userId);

  return NextResponse.json({
    user,
    availablePersonas: db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tier: u.tier,
      status: u.status,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, personaId } = body;

    let user = null;
    if (personaId) {
      user = db.users.find((u) => u.id === personaId) || null;
    } else if (email) {
      user = AuthService.authenticate(email);
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
