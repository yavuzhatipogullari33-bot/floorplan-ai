import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateFloorPlanWithGemini } from '@/lib/gemini';
import {
  generateSVG,
  FloorPlanLayout,
  RoomLayout,
  getCleanRoomLabel,
  generateArchitecturalLayout,
} from '@/lib/svg-generator';
import { ARCHITECTURAL_AI_SYSTEM_PROMPT } from '@/lib/architectural-knowledge';
import { generateCreativeFloorPlan } from '@/lib/architectural-creative-engine';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      projectId,
      description,
      bedrooms = 3,
      bathrooms = 2,
      totalArea = 120,
      style = 'modern',
      extras = [],
      language = 'tr',
      footprintShape,
      doorWall,
    } = body;

    let layoutJson: FloorPlanLayout | null = null;
    const targetLang = (language as 'tr' | 'en') || 'tr';

    // Inject shape keyword into description so prompt parser picks it up
    const shapeKeyword: Record<string, string> = {
      'rectangle': '',
      'l-shape': 'L şeklinde',
      'u-shape': 'U şeklinde avlu iç avlulu',
      't-shape': 'T şeklinde',
      'h-shape': 'H şeklinde iki kanatlı büyük',
      'cross': 'artı çapraz formunda',
      'l-indented': 'girintili L asimetrik',
      'stepped': 'kademeli basamaklı',
    };
    const enhancedDescription = footprintShape && shapeKeyword[footprintShape]
      ? `${shapeKeyword[footprintShape]} ${description || ''}`.trim()
      : (description || '');

    // ─── SHAPE-SELECTED PATH: Always use procedural engine ───────────────────
    // When the user explicitly picks a building footprint from the Shape Selector,
    // we SKIP Gemini entirely and route directly to our deterministic shape generators.
    // This guarantees the selected shape is always honoured.
    if (footprintShape && footprintShape !== 'rectangle') {
      layoutJson = generateCreativeFloorPlan({
        description: enhancedDescription,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        totalArea: Number(totalArea),
        style,
        extras,
        lang: targetLang,
      });
    }

    // 1. Try Google Gemini AI with Neufert standards, dynamic massing and polygon support
    if (!layoutJson) {
      layoutJson = await generateFloorPlanWithGemini({
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        totalArea: Number(totalArea),
        style,
        extras,
        description,
        language: targetLang,
        footprintShape,
      });
    }

    // 2. Creative Procedural Architectural Engine (Prompt-driven & Dynamic Variation)
    if (!layoutJson) {
      layoutJson = generateCreativeFloorPlan({
        description: enhancedDescription,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        totalArea: Number(totalArea),
        style,
        extras,
        lang: targetLang,
      });
    }

    // 3. Fallback to Dynamic Architectural Layout Engine (with Spine & Voids)
    if (!layoutJson) {
      layoutJson = generateArchitecturalLayout({
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        totalArea: Number(totalArea),
        style,
        extras,
        lang: targetLang,
      });
    }

    // 4. Generate architectural SVG with structural axes, columns, furniture and dimension lines
    const svg = generateSVG(layoutJson, targetLang);

    // 5. Save to Database if projectId is available
    if (projectId && projectId !== 'new') {
      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            layoutJson: JSON.stringify(layoutJson),
            svgData: svg,
            bedrooms: Number(bedrooms),
            bathrooms: Number(bathrooms),
            totalArea: Number(totalArea),
            style,
            description,
          },
        });
      } catch (dbError) {
        console.warn('Project DB update skipped:', dbError);
      }
    }

    return NextResponse.json({
      layout: layoutJson,
      svg,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
