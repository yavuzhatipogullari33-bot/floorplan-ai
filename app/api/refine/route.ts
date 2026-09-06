import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { refineFloorPlanWithGemini } from '@/lib/gemini';
import { generateSVG, FloorPlanLayout } from '@/lib/svg-generator';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { instruction, currentLayout, projectId, language = 'tr' } = body;

    if (!instruction || !currentLayout) {
      return NextResponse.json(
        { error: 'Instruction and currentLayout are required' },
        { status: 400 }
      );
    }

    const targetLang = (language as 'tr' | 'en') || 'tr';

    // Call differential refinement with locked room protection
    const result = await refineFloorPlanWithGemini({
      currentLayout,
      instruction,
      language: targetLang,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Refinement failed' },
        { status: 500 }
      );
    }

    const { updatedLayout, reply } = result;

    // Generate fresh SVG with all layers (axes, columns, furniture, dimensions)
    const svg = generateSVG(updatedLayout, targetLang);

    // Save to Database if projectId is present
    if (projectId && projectId !== 'new') {
      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            layoutJson: JSON.stringify(updatedLayout),
            svgData: svg,
            totalArea: updatedLayout.totalArea,
          },
        });
      } catch (dbError) {
        console.warn('Project DB update skipped in refine:', dbError);
      }
    }

    return NextResponse.json({
      layout: updatedLayout,
      svg,
      reply,
    });
  } catch (error) {
    console.error('Refine error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
