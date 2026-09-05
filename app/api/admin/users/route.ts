import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Oturum açılmadı.' }, { status: 401 });
    }

    const isAdmin =
      session.user.role === 'admin' ||
      session.user.email?.toLowerCase() === 'yavuzhatipogullari33@gmail.com';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Bu sayfaya erişim yetkiniz yok.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Kullanıcılar alınırken hata oluştu.' }, { status: 500 });
  }
}
