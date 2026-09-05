import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { genAI, MODEL, hasRealApiKey } from '@/lib/gemini';
import { generateSVG, FloorPlanLayout, RoomLayout, getCleanRoomLabel } from '@/lib/svg-generator';
import { prisma } from '@/lib/db';

const SYSTEM_PROMPT = `You are an expert architect AI that generates detailed floor plan layouts.
Output ONLY valid JSON matching this exact TypeScript schema:
{
  "totalArea": number, // in m²
  "gridWidth": number, // total width in grid units (e.g. 10-16)
  "gridHeight": number, // total height in grid units (e.g. 8-12)
  "scale": number, // meters per grid unit (e.g. 1.2 or 1.5)
  "rooms": [
    {
      "id": string,
      "label": string,
      "type": "living" | "kitchen" | "dining" | "bedroom" | "bathroom" | "hallway" | "garage" | "balcony" | "storage" | "laundry" | "office",
      "x": number, // grid units from left
      "y": number, // grid units from top
      "w": number, // width in grid units
      "h": number, // height in grid units
      "doors": [ { "wall": "top"|"right"|"bottom"|"left", "position": 0.5 } ],
      "windows": [ { "wall": "top"|"right"|"bottom"|"left", "position": 0.5 } ]
    }
  ]
}

Layout guidelines:
- Rooms should be adjacent and not overlap.
- Living/dining/kitchen should be near each other.
- Bedrooms should have access to hallway/bathrooms.
- Exterior walls should have windows.
- Total width and height must contain all rooms.`;

function generateProceduralLayout(params: {
  bedrooms: number;
  bathrooms: number;
  totalArea: number;
  style: string;
  extras: string[];
  lang?: 'tr' | 'en';
}): FloorPlanLayout {
  const { bedrooms = 3, bathrooms = 2, totalArea = 120, extras = [], lang = 'tr' } = params;

  const rooms: RoomLayout[] = [];
  const gridW = 12;
  const gridH = 8;
  const scale = Number((Math.sqrt(totalArea / (gridW * gridH))).toFixed(2));

  // 1. Living Room (Top Left)
  rooms.push({
    id: 'living',
    label: lang === 'tr' ? 'Oturma Odası' : 'Living Room',
    type: 'living',
    x: 0,
    y: 0,
    w: 5,
    h: 4,
    doors: [{ wall: 'bottom', position: 0.5 }],
    windows: [{ wall: 'top', position: 0.3 }, { wall: 'left', position: 0.5 }],
  });

  // 2. Kitchen (Top Mid)
  rooms.push({
    id: 'kitchen',
    label: lang === 'tr' ? 'Mutfak' : 'Kitchen',
    type: 'kitchen',
    x: 5,
    y: 0,
    w: 4,
    h: 3,
    doors: [{ wall: 'left', position: 0.5 }],
    windows: [{ wall: 'top', position: 0.5 }],
  });

  // 3. Dining (Top Right)
  rooms.push({
    id: 'dining',
    label: lang === 'tr' ? 'Yemek Odası' : 'Dining Room',
    type: 'dining',
    x: 9,
    y: 0,
    w: 3,
    h: 3,
    doors: [{ wall: 'left', position: 0.5 }],
    windows: [{ wall: 'top', position: 0.5 }, { wall: 'right', position: 0.5 }],
  });

  // 4. Hallway (Center Circulation)
  rooms.push({
    id: 'hallway',
    label: lang === 'tr' ? 'Koridor' : 'Hallway',
    type: 'hallway',
    x: 5,
    y: 3,
    w: 7,
    h: 1,
    doors: [{ wall: 'top', position: 0.2 }, { wall: 'bottom', position: 0.3 }],
  });

  // 5. Master Bedroom (Bottom Left)
  rooms.push({
    id: 'master-bed',
    label: lang === 'tr' ? 'Ebeveyn Yatak Odası' : 'Master Bedroom',
    type: 'bedroom',
    x: 0,
    y: 4,
    w: 4,
    h: 4,
    doors: [{ wall: 'top', position: 0.5 }],
    windows: [{ wall: 'left', position: 0.5 }, { wall: 'bottom', position: 0.5 }],
  });

  // 6. Master Bathroom / Main Bathroom
  rooms.push({
    id: 'bath-1',
    label: lang === 'tr' ? 'Ana Banyo' : 'Main Bathroom',
    type: 'bathroom',
    x: 4,
    y: 4,
    w: 2,
    h: 2,
    doors: [{ wall: 'top', position: 0.5 }],
    windows: [{ wall: 'bottom', position: 0.5 }],
  });

  // Additional bedrooms
  if (bedrooms >= 2) {
    rooms.push({
      id: 'bed-2',
      label: lang === 'tr' ? 'Yatak Odası 2' : 'Bedroom 2',
      type: 'bedroom',
      x: 6,
      y: 4,
      w: 3,
      h: 4,
      doors: [{ wall: 'top', position: 0.5 }],
      windows: [{ wall: 'bottom', position: 0.5 }],
    });
  }

  if (bedrooms >= 3) {
    rooms.push({
      id: 'bed-3',
      label: lang === 'tr' ? 'Yatak Odası 3' : 'Bedroom 3',
      type: 'bedroom',
      x: 9,
      y: 4,
      w: 3,
      h: 4,
      doors: [{ wall: 'top', position: 0.5 }],
      windows: [{ wall: 'bottom', position: 0.5 }, { wall: 'right', position: 0.5 }],
    });
  }

  if (bathrooms >= 2) {
    rooms.push({
      id: 'bath-2',
      label: lang === 'tr' ? 'Misafir Banyo' : 'Guest Bathroom',
      type: 'bathroom',
      x: 4,
      y: 6,
      w: 2,
      h: 2,
      doors: [{ wall: 'top', position: 0.5 }],
      windows: [{ wall: 'bottom', position: 0.5 }],
    });
  }

  // Handle extras if requested
  if (extras.includes('Home office') || extras.includes('Çalışma Odası')) {
    rooms.push({
      id: 'office',
      label: lang === 'tr' ? 'Çalışma Odası' : 'Home Office',
      type: 'office',
      x: 9,
      y: 2,
      w: 3,
      h: 2,
      doors: [{ wall: 'left', position: 0.5 }],
      windows: [{ wall: 'right', position: 0.5 }],
    });
  }

  if (extras.includes('Balcony') || extras.includes('Balkon')) {
    rooms.push({
      id: 'balcony',
      label: lang === 'tr' ? 'Balkon' : 'Balcony',
      type: 'balcony',
      x: 0,
      y: 8,
      w: 4,
      h: 1,
      doors: [{ wall: 'top', position: 0.5 }],
    });
  }

  return {
    rooms,
    totalArea,
    gridWidth: gridW,
    gridHeight: gridH + (extras.includes('Balcony') || extras.includes('Balkon') ? 1 : 0),
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
    } = body;

    let layoutJson: FloorPlanLayout | null = null;

    // 1. Try Google Gemini AI if configured
    if (hasRealApiKey && genAI) {
      try {
        const userPrompt = `Generate a floor plan with:
- ${bedrooms} bedrooms
- ${bathrooms} bathrooms
- Total area: ~${totalArea} m²
- Style: ${style}
- Extra requirements: ${extras.join(', ') || 'none'}
- Additional description: ${description || 'none'}
- Output room labels in ${language === 'tr' ? 'Turkish' : 'English'}.

Create a practical, well-proportioned layout.`;

        const response = await genAI.models.generateContent({
          model: MODEL,
          contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }] }],
          config: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text ?? '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.rooms && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
          // Normalize room labels to single clean language
          parsed.rooms = parsed.rooms.map((r: RoomLayout) => ({
            ...r,
            label: getCleanRoomLabel(r, language as 'tr' | 'en'),
          }));
          layoutJson = parsed;
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to architectural engine:', geminiError);
      }
    }

    // 2. Procedural Fallback Engine if AI is offline / unconfigured
    if (!layoutJson) {
      layoutJson = generateProceduralLayout({
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        totalArea: Number(totalArea),
        style,
        extras,
        lang: language as 'tr' | 'en',
      });
    }

    // 3. Generate SVG from layout with correct single language
    const svg = generateSVG(layoutJson, language as 'tr' | 'en');

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
