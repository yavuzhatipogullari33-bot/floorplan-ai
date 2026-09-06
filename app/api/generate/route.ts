import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { genAI, MODEL, hasRealApiKey } from '@/lib/gemini';
import { generateSVG, FloorPlanLayout, RoomLayout, getCleanRoomLabel } from '@/lib/svg-generator';
import { ARCHITECTURAL_AI_SYSTEM_PROMPT } from '@/lib/architectural-knowledge';
import { generateCreativeFloorPlan } from '@/lib/architectural-creative-engine';
import { prisma } from '@/lib/db';

/**
 * ARCHITECTURAL PROCEDURAL GENERATOR
 * Neufert standartları ve profesyonel mimari zonlama kurallarına dayalı zeki plan üretici.
 * 1+1'den 5+1 ve Müstakil Villaya kadar tüm konut tipolojilerini üretir.
 */
function generateArchitecturalLayout(params: {
  bedrooms: number;
  bathrooms: number;
  totalArea: number;
  style: string;
  extras: string[];
  lang?: 'tr' | 'en';
}): FloorPlanLayout {
  const { bedrooms = 3, bathrooms = 2, totalArea = 120, extras = [], lang = 'tr' } = params;

  const rooms: RoomLayout[] = [];
  const numBeds = Math.max(1, Math.min(Number(bedrooms) || 3, 5));
  const numBaths = Math.max(1, Math.min(Number(bathrooms) || 2, 4));

  // Determine grid dimensions based on room count and area
  let gridW = 12;
  let gridH = 8;

  if (numBeds === 1) {
    gridW = 10;
    gridH = 7;
  } else if (numBeds === 2) {
    gridW = 11;
    gridH = 8;
  } else if (numBeds === 3) {
    gridW = 13;
    gridH = 9;
  } else if (numBeds >= 4) {
    gridW = 15;
    gridH = 10;
  }

  // -------------------------------------------------------------
  // TYPOLOGY 1: 1+1 COMPACT & OPEN PLAN
  // -------------------------------------------------------------
  if (numBeds === 1) {
    // 1. Foyer (Giriş)
    rooms.push({
      id: 'foyer',
      label: lang === 'tr' ? 'Antre' : 'Foyer',
      type: 'hallway',
      x: 0,
      y: 0,
      w: 3,
      h: 3,
      doors: [{ wall: 'left', position: 0.5, width: 26 }, { wall: 'right', position: 0.5, width: 24 }],
    });

    // 2. Kitchen & Dining
    rooms.push({
      id: 'kitchen',
      label: lang === 'tr' ? 'Açık Mutfak' : 'Open Kitchen',
      type: 'kitchen',
      x: 3,
      y: 0,
      w: 4,
      h: 3,
      doors: [{ wall: 'left', position: 0.5, width: 24 }],
      windows: [{ wall: 'top', position: 0.5, width: 30 }],
    });

    // 3. Bathroom
    rooms.push({
      id: 'bath-1',
      label: lang === 'tr' ? 'Banyo' : 'Bathroom',
      type: 'bathroom',
      x: 7,
      y: 0,
      w: 3,
      h: 3,
      doors: [{ wall: 'bottom', position: 0.5, width: 22 }],
      windows: [{ wall: 'top', position: 0.5, width: 20 }],
    });

    // 4. Living Room
    rooms.push({
      id: 'living',
      label: lang === 'tr' ? 'Salon' : 'Living Room',
      type: 'living',
      x: 0,
      y: 3,
      w: 6,
      h: 4,
      doors: [{ wall: 'top', position: 0.3, width: 24 }, { wall: 'bottom', position: 0.5, width: 26 }],
      windows: [{ wall: 'left', position: 0.5, width: 36 }, { wall: 'bottom', position: 0.3, width: 36 }],
    });

    // 5. Bedroom
    rooms.push({
      id: 'master-bed',
      label: lang === 'tr' ? 'Yatak Odası' : 'Bedroom',
      type: 'bedroom',
      x: 6,
      y: 3,
      w: 4,
      h: 4,
      doors: [{ wall: 'left', position: 0.5, width: 24 }],
      windows: [{ wall: 'right', position: 0.5, width: 32 }, { wall: 'bottom', position: 0.5, width: 32 }],
    });
  }

  // -------------------------------------------------------------
  // TYPOLOGY 2: 2+1 BALANCED RESIDENCE
  // -------------------------------------------------------------
  else if (numBeds === 2) {
    // 1. Living Room (Salon)
    rooms.push({
      id: 'living',
      label: lang === 'tr' ? 'Salon' : 'Living Room',
      type: 'living',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      doors: [{ wall: 'bottom', position: 0.7, width: 26 }],
      windows: [{ wall: 'top', position: 0.5, width: 40 }, { wall: 'left', position: 0.5, width: 36 }],
    });

    // 2. Kitchen (Mutfak)
    rooms.push({
      id: 'kitchen',
      label: lang === 'tr' ? 'Mutfak' : 'Kitchen',
      type: 'kitchen',
      x: 6,
      y: 0,
      w: 5,
      h: 3,
      doors: [{ wall: 'bottom', position: 0.4, width: 24 }],
      windows: [{ wall: 'top', position: 0.5, width: 32 }, { wall: 'right', position: 0.5, width: 28 }],
    });

    // 3. Central Hallway (Antre / Gece Holü)
    rooms.push({
      id: 'hallway',
      label: lang === 'tr' ? 'Antre / Gece Holü' : 'Hallway',
      type: 'hallway',
      x: 3,
      y: 3,
      w: 8,
      h: 1.5,
      doors: [
        { wall: 'top', position: 0.2, width: 24 },
        { wall: 'top', position: 0.7, width: 24 },
        { wall: 'bottom', position: 0.2, width: 24 },
        { wall: 'bottom', position: 0.7, width: 24 },
      ],
    });

    // 4. Master Bedroom
    rooms.push({
      id: 'master-bed',
      label: lang === 'tr' ? 'Ebeveyn Yatak Odası' : 'Master Bedroom',
      type: 'bedroom',
      x: 0,
      y: 4.5,
      w: 4.5,
      h: 3.5,
      doors: [{ wall: 'top', position: 0.8, width: 24 }],
      windows: [{ wall: 'left', position: 0.5, width: 32 }, { wall: 'bottom', position: 0.5, width: 32 }],
    });

    // 5. Main Bathroom
    rooms.push({
      id: 'bath-1',
      label: lang === 'tr' ? 'Ana Banyo' : 'Main Bathroom',
      type: 'bathroom',
      x: 4.5,
      y: 4.5,
      w: 2.5,
      h: 3.5,
      doors: [{ wall: 'top', position: 0.5, width: 22 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 20 }],
    });

    // 6. Bedroom 2 (Çocuk / Misafir)
    rooms.push({
      id: 'bed-2',
      label: lang === 'tr' ? 'Yatak Odası 2' : 'Bedroom 2',
      type: 'bedroom',
      x: 7,
      y: 4.5,
      w: 4,
      h: 3.5,
      doors: [{ wall: 'top', position: 0.3, width: 24 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 30 }, { wall: 'right', position: 0.5, width: 30 }],
    });

    // Optional En-suite or powder room if requested
    if (numBaths >= 2) {
      rooms.push({
        id: 'bath-2',
        label: lang === 'tr' ? 'Ebeveyn Banyosu' : 'En-suite Bath',
        type: 'bathroom',
        x: 0,
        y: 4,
        w: 2.5,
        h: 2,
        doors: [{ wall: 'right', position: 0.5, width: 22 }],
      });
    }
  }

  // -------------------------------------------------------------
  // TYPOLOGY 3: 3+1 FAMILY RESIDENCE WITH MASTER EN-SUITE & BALCONY
  // -------------------------------------------------------------
  else if (numBeds === 3) {
    // 1. Living Room (Salon - Day Zone)
    rooms.push({
      id: 'living',
      label: lang === 'tr' ? 'Salon' : 'Living Room',
      type: 'living',
      x: 0,
      y: 0,
      w: 6,
      h: 5,
      doors: [{ wall: 'bottom', position: 0.7, width: 26 }],
      windows: [{ wall: 'top', position: 0.4, width: 44 }, { wall: 'left', position: 0.5, width: 38 }],
    });

    // 2. Kitchen (Mutfak - Service/Day Zone)
    rooms.push({
      id: 'kitchen',
      label: lang === 'tr' ? 'Mutfak' : 'Kitchen',
      type: 'kitchen',
      x: 6,
      y: 0,
      w: 4,
      h: 3.5,
      doors: [{ wall: 'bottom', position: 0.4, width: 24 }],
      windows: [{ wall: 'top', position: 0.5, width: 32 }],
    });

    // 3. Dining Area (Yemek Alanı)
    rooms.push({
      id: 'dining',
      label: lang === 'tr' ? 'Yemek Alanı' : 'Dining Area',
      type: 'dining',
      x: 10,
      y: 0,
      w: 3,
      h: 3.5,
      doors: [{ wall: 'left', position: 0.5, width: 24 }],
      windows: [{ wall: 'top', position: 0.5, width: 30 }, { wall: 'right', position: 0.5, width: 30 }],
    });

    // 4. Central Foyer & Night Corridor (Circulation Axis)
    rooms.push({
      id: 'hallway',
      label: lang === 'tr' ? 'Antre / Gece Holü' : 'Foyer & Hallway',
      type: 'hallway',
      x: 5,
      y: 3.5,
      w: 8,
      h: 1.5,
      doors: [
        { wall: 'top', position: 0.2, width: 24 },
        { wall: 'top', position: 0.6, width: 24 },
        { wall: 'bottom', position: 0.2, width: 24 },
        { wall: 'bottom', position: 0.5, width: 24 },
        { wall: 'bottom', position: 0.8, width: 24 },
      ],
    });

    // 5. Master Suite (Ebeveyn Yatak Odası)
    rooms.push({
      id: 'master-bed',
      label: lang === 'tr' ? 'Ebeveyn Yatak Odası' : 'Master Bedroom',
      type: 'bedroom',
      x: 0,
      y: 5,
      w: 5,
      h: 4,
      doors: [{ wall: 'top', position: 0.8, width: 24 }],
      windows: [{ wall: 'left', position: 0.5, width: 36 }, { wall: 'bottom', position: 0.5, width: 36 }],
    });

    // 6. Master En-suite Bathroom
    rooms.push({
      id: 'bath-2',
      label: lang === 'tr' ? 'Ebeveyn Banyosu' : 'En-suite Bath',
      type: 'bathroom',
      x: 5,
      y: 5,
      w: 2.5,
      h: 2,
      doors: [{ wall: 'left', position: 0.5, width: 22 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 18 }],
    });

    // 7. Main Family Bathroom
    rooms.push({
      id: 'bath-1',
      label: lang === 'tr' ? 'Genel Banyo' : 'Main Bathroom',
      type: 'bathroom',
      x: 5,
      y: 7,
      w: 2.5,
      h: 2,
      doors: [{ wall: 'top', position: 0.5, width: 22 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 18 }],
    });

    // 8. Bedroom 2 (Çocuk Odası)
    rooms.push({
      id: 'bed-2',
      label: lang === 'tr' ? 'Yatak Odası 2' : 'Bedroom 2',
      type: 'bedroom',
      x: 7.5,
      y: 5,
      w: 2.8,
      h: 4,
      doors: [{ wall: 'top', position: 0.5, width: 24 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 30 }],
    });

    // 9. Bedroom 3 (Genç / Misafir Odası)
    rooms.push({
      id: 'bed-3',
      label: lang === 'tr' ? 'Yatak Odası 3' : 'Bedroom 3',
      type: 'bedroom',
      x: 10.3,
      y: 5,
      w: 2.7,
      h: 4,
      doors: [{ wall: 'top', position: 0.5, width: 24 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 30 }, { wall: 'right', position: 0.5, width: 30 }],
    });
  }

  // -------------------------------------------------------------
  // TYPOLOGY 4: 4+1 / 5+1 / LUXURY VILLA RESIDENCE
  // -------------------------------------------------------------
  else {
    // 1. Grand Living Room (Büyük Salon)
    rooms.push({
      id: 'living',
      label: lang === 'tr' ? 'Büyük Salon' : 'Grand Living Room',
      type: 'living',
      x: 0,
      y: 0,
      w: 7,
      h: 5,
      doors: [{ wall: 'bottom', position: 0.6, width: 28 }],
      windows: [{ wall: 'top', position: 0.4, width: 48 }, { wall: 'left', position: 0.5, width: 40 }],
    });

    // 2. Island Kitchen (Ada Mutfak)
    rooms.push({
      id: 'kitchen',
      label: lang === 'tr' ? 'Mutfak & Ada' : 'Kitchen & Island',
      type: 'kitchen',
      x: 7,
      y: 0,
      w: 4.5,
      h: 4,
      doors: [{ wall: 'bottom', position: 0.4, width: 24 }],
      windows: [{ wall: 'top', position: 0.5, width: 36 }],
    });

    // 3. Formal Dining Room
    rooms.push({
      id: 'dining',
      label: lang === 'tr' ? 'Yemek Salonu' : 'Formal Dining',
      type: 'dining',
      x: 11.5,
      y: 0,
      w: 3.5,
      h: 4,
      doors: [{ wall: 'left', position: 0.5, width: 24 }],
      windows: [{ wall: 'top', position: 0.5, width: 32 }, { wall: 'right', position: 0.5, width: 32 }],
    });

    // 4. Central Foyer & Gallery Hallway
    rooms.push({
      id: 'hallway',
      label: lang === 'tr' ? 'Giriş Holü & Galeri' : 'Central Foyer & Gallery',
      type: 'hallway',
      x: 6,
      y: 4,
      w: 9,
      h: 1.8,
      doors: [
        { wall: 'top', position: 0.15, width: 24 },
        { wall: 'top', position: 0.55, width: 24 },
        { wall: 'bottom', position: 0.2, width: 24 },
        { wall: 'bottom', position: 0.5, width: 24 },
        { wall: 'bottom', position: 0.8, width: 24 },
      ],
    });

    // 5. Master Suite (Ebeveyn Süiti)
    rooms.push({
      id: 'master-bed',
      label: lang === 'tr' ? 'Ebeveyn Süiti' : 'Master Suite',
      type: 'bedroom',
      x: 0,
      y: 5,
      w: 5.5,
      h: 5,
      doors: [{ wall: 'top', position: 0.8, width: 24 }],
      windows: [{ wall: 'left', position: 0.5, width: 40 }, { wall: 'bottom', position: 0.5, width: 40 }],
    });

    // 6. Master En-suite Bathroom
    rooms.push({
      id: 'bath-2',
      label: lang === 'tr' ? 'Ebeveyn Banyosu' : 'En-suite Bath',
      type: 'bathroom',
      x: 5.5,
      y: 5.8,
      w: 2.5,
      h: 2.2,
      doors: [{ wall: 'left', position: 0.5, width: 22 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 18 }],
    });

    // 7. Main Bathroom & Powder Room
    rooms.push({
      id: 'bath-1',
      label: lang === 'tr' ? 'Genel Banyo' : 'Main Bathroom',
      type: 'bathroom',
      x: 5.5,
      y: 8,
      w: 2.5,
      h: 2,
      doors: [{ wall: 'top', position: 0.5, width: 22 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 18 }],
    });

    // 8. Bedroom 2
    rooms.push({
      id: 'bed-2',
      label: lang === 'tr' ? 'Yatak Odası 2' : 'Bedroom 2',
      type: 'bedroom',
      x: 8,
      y: 5.8,
      w: 3.5,
      h: 4.2,
      doors: [{ wall: 'top', position: 0.4, width: 24 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 32 }],
    });

    // 9. Bedroom 3
    rooms.push({
      id: 'bed-3',
      label: lang === 'tr' ? 'Yatak Odası 3' : 'Bedroom 3',
      type: 'bedroom',
      x: 11.5,
      y: 5.8,
      w: 3.5,
      h: 4.2,
      doors: [{ wall: 'top', position: 0.4, width: 24 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 32 }, { wall: 'right', position: 0.5, width: 32 }],
    });

    // 10. Dedicated Home Office / Library
    rooms.push({
      id: 'office',
      label: lang === 'tr' ? 'Çalışma Odası' : 'Home Office',
      type: 'office',
      x: 11.5,
      y: 2,
      w: 3.5,
      h: 2,
      doors: [{ wall: 'left', position: 0.5, width: 24 }],
      windows: [{ wall: 'right', position: 0.5, width: 26 }],
    });
  }

  // -------------------------------------------------------------
  // EXTRAS & OUTDOOR LIVING (Balkon / Teras / Veranda)
  // -------------------------------------------------------------
  if (extras.includes('Balcony') || extras.includes('Balkon') || extras.includes('Teras') || extras.includes('Veranda')) {
    rooms.push({
      id: 'terrace-main',
      label: lang === 'tr' ? 'Manzara Terası' : 'Main Terrace',
      type: 'balcony',
      x: 0,
      y: gridH,
      w: Math.min(gridW, 8),
      h: 1.5,
      doors: [{ wall: 'top', position: 0.5, width: 28 }],
    });
    gridH += 1.5;
  }

  const totalGrid = rooms.reduce((sum, r) => sum + r.w * r.h, 0);
  const scale = totalGrid > 0 ? Math.sqrt(totalArea / totalGrid) : 1.0;

  return {
    rooms,
    totalArea,
    gridWidth: gridW,
    gridHeight: gridH,
    scale,
  };
}

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

    // 1. Try Google Gemini AI (only when no specific shape is selected)
    if (!layoutJson && hasRealApiKey && genAI) {
      try {
        const shapeHint = footprintShape
          ? `\n- Building Footprint Shape: ${footprintShape} (IMPORTANT: design rooms to fit this footprint)`
          : '';
        const userPrompt = `DESIGN SPECIFICATIONS:
- Number of Bedrooms: ${bedrooms}
- Number of Bathrooms: ${bathrooms}
- Target Total Area: ~${totalArea} m²
- Architectural Style: ${style}
- Requested Extras/Amenities: ${extras.join(', ') || 'Standard residential layout'}
- User Design Notes: ${description || 'Design an optimal, well-proportioned, luxury residence.'}${shapeHint}
- Primary Language for Room Labels: ${targetLang === 'tr' ? 'Turkish (e.g. Salon, Mutfak, Ebeveyn Yatak Odası, Ana Banyo, Koridor)' : 'English (e.g. Living Room, Kitchen, Master Bedroom, Main Bathroom, Hallway)'}.

Apply all Neufert standards, circulation corridors, wet wall groupings, and window placements. Return ONLY the raw valid JSON matching the specified schema.`;

        const response = await genAI.models.generateContent({
          model: MODEL,
          contents: [{ role: 'user', parts: [{ text: ARCHITECTURAL_AI_SYSTEM_PROMPT + '\n\n' + userPrompt }] }],
          config: {
            temperature: 0.4, // lower temperature for strictly valid architectural layouts
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text ?? '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.rooms && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
          parsed.rooms = parsed.rooms.map((r: RoomLayout) => ({
            ...r,
            label: getCleanRoomLabel(r, targetLang),
          }));
          const totalGrid = parsed.rooms.reduce((sum: number, r: RoomLayout) => sum + (r.w * r.h), 0);
          if (totalGrid > 0) {
            parsed.scale = Math.sqrt(Number(totalArea) / totalGrid);
            parsed.totalArea = Number(totalArea);
          }
          layoutJson = parsed;
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to architectural engine:', geminiError);
      }
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

    // 3. Generate architectural SVG with furniture and dimension lines
    const svg = generateSVG(layoutJson, targetLang);

    // 4. Save to Database if projectId is available
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
