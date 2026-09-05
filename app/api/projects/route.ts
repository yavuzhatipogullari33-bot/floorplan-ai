import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/projects — list user's projects
export async function GET() {
  try {
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
  } catch (error: any) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json({ projects: [], error: error?.message }, { status: 200 });
  }
}


// POST /api/projects — create new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, style, bedrooms, bathrooms, totalArea } = body;

    // Ensure user exists in db before creating project
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user && session.user.email) {
      await prisma.user.upsert({
        where: { email: session.user.email },
        update: { id: session.user.id },
        create: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name ?? 'Kullanıcı',
          role: session.user.role ?? 'user',
        },
      });
    }

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name: name ?? 'Untitled Floor Plan',
        description: description ?? '',
        style: style ?? 'modern',
        bedrooms: Number(bedrooms) || 3,
        bathrooms: Number(bathrooms) || 2,
        totalArea: Number(totalArea) || 120,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create project', details: String(error) },
      { status: 500 }
    );
  }
}

