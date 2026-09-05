import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/projects — list user's projects
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ projects });
}

// POST /api/projects — create new project
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, style, bedrooms, bathrooms, totalArea } = body;

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: name ?? 'Untitled Floor Plan',
      description: description ?? '',
      style: style ?? 'modern',
      bedrooms: bedrooms ?? 3,
      bathrooms: bathrooms ?? 2,
      totalArea: totalArea ?? 120,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
