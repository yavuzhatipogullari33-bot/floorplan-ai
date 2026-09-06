import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generateSVG,
  FloorPlanLayout,
  FloorLevel,
  RoomLayout,
  RoomType,
} from '@/lib/svg-generator';
import { prisma } from '@/lib/db';

interface WizardRequestBody {
  projectId?: string;
  lotWidth: number;
  lotDepth: number;
  northOrientation: number;
  targetArea: number;
  floorsCount: 1 | 2 | 3;
  hasBasement: boolean;
  hasAttic: boolean;
  buildingStyle: 'modern' | 'courtyard' | 'pavilion';
  floorPrograms: Array<{
    level: number;
    name: string;
    elevation: number;
    rooms: Array<{
      id: string;
      type: string;
      label: string;
      targetArea?: number;
    }>;
  }>;
  language?: 'tr' | 'en';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as WizardRequestBody;

    const {
      projectId,
      lotWidth = 20,
      lotDepth = 25,
      northOrientation = 0,
      targetArea = 200,
      floorsCount = 2,
      hasBasement = false,
      hasAttic = false,
      buildingStyle = 'modern',
      floorPrograms = [],
      language = 'tr',
    } = body;

    const lang = language === 'en' ? 'en' : 'tr';

    // 1. Grid dimensions derived from lot dimensions and style
    // Grid units typically 0.8m - 1.2m
    const gridW = Math.max(14, Math.min(26, Math.round(lotWidth * 0.75)));
    const gridH = Math.max(12, Math.min(24, Math.round(lotDepth * 0.7)));

    // 2. Aks Tutarlılığı: Vertical Circulation & Shaft Cores
    // Calculate locked coordinates for Staircase and Shaft on Ground Floor
    // Core placement: Center-left circulation spine
    const stairX = Math.max(1, Math.round(gridW * 0.35));
    const stairY = Math.max(1, Math.round(gridH * 0.38));
    const stairW = 3.2;
    const stairH = 4.2;

    const shaftX = stairX + stairW + 0.5;
    const shaftY = stairY + 0.5;
    const shaftW = 1.4;
    const shaftH = 1.4;

    // Ground floor living room coordinates (for upper floor void calculation)
    let groundLivingBox = {
      x: 1,
      y: stairY + stairH + 0.5,
      w: Math.round(gridW * 0.55),
      h: Math.max(4.5, gridH - (stairY + stairH + 1)),
    };

    // 3. Generate layout for each floor level in floorPrograms
    const generatedFloors: FloorLevel[] = [];

    for (let fIdx = 0; fIdx < floorPrograms.length; fIdx++) {
      const prog = floorPrograms[fIdx];
      const level = prog.level;
      const floorRooms: RoomLayout[] = [];

      // Calculate area per floor approximately
      const perFloorTargetArea = targetArea / Math.max(1, floorPrograms.length);

      if (level === 0) {
        // ─── GROUND FLOOR (Level 0) ───
        // Circulation Spine & Staircase
        floorRooms.push({
          id: `f0-stair`,
          label: lang === 'tr' ? 'Ana Merdiven Kovası' : 'Main Staircase',
          type: 'staircase',
          x: stairX,
          y: stairY,
          w: stairW,
          h: stairH,
          locked: true, // Fixed vertical axis
          doors: [{ wall: 'left', position: 0.5, width: 24 }],
        });

        // Tesisat Şaftı
        floorRooms.push({
          id: `f0-shaft`,
          label: lang === 'tr' ? 'Tesisat Şaftı' : 'Plumbing Shaft',
          type: 'shaft',
          x: shaftX,
          y: shaftY,
          w: shaftW,
          h: shaftH,
          locked: true,
        });

        // Entrance Hall / Antre (Leading from front)
        floorRooms.push({
          id: `f0-hall`,
          label: lang === 'tr' ? 'Giriş Holü & Vestiyer' : 'Entrance Foyer',
          type: 'hallway',
          x: stairX - 3.5,
          y: stairY,
          w: 3.5,
          h: stairH,
          doors: [
            { wall: 'left', position: 0.5, width: 28 }, // Main Entrance Door
            { wall: 'right', position: 0.5, width: 24 },
          ],
        });

        // Guest WC (Adjacent to Hall and Shaft)
        floorRooms.push({
          id: `f0-wc`,
          label: lang === 'tr' ? 'Misafir WC & Lavabo' : 'Powder Room / Guest WC',
          type: 'bathroom',
          x: shaftX,
          y: shaftY + shaftH + 0.2,
          w: shaftW + 1.2,
          h: 2.2,
          doors: [{ wall: 'left', position: 0.5, width: 22 }],
          windows: [{ wall: 'right', position: 0.5, width: 20 }],
        });

        // Living Room (Day Zone - South / Garden facing)
        floorRooms.push({
          id: `f0-living`,
          label: lang === 'tr' ? 'Geniş Salon & Şömine' : 'Living Room & Hearth',
          type: 'living',
          x: groundLivingBox.x,
          y: groundLivingBox.y,
          w: groundLivingBox.w,
          h: groundLivingBox.h,
          doors: [
            { wall: 'top', position: 0.3, width: 26 },
            { wall: 'bottom', position: 0.5, width: 36 }, // Garden sliding doors
          ],
          windows: [
            { wall: 'left', position: 0.5, width: 34 },
            { wall: 'bottom', position: 0.8, width: 34 },
          ],
        });

        // Kitchen & Dining (Facing Garden / Terrace)
        const kitchenX = groundLivingBox.x + groundLivingBox.w + 0.5;
        const kitchenW = Math.max(5, gridW - kitchenX - 1);
        const kitchenH = groundLivingBox.h;

        floorRooms.push({
          id: `f0-kitchen`,
          label: lang === 'tr' ? 'Ada Mutfak & Yemek Alanı' : 'Island Kitchen & Dining',
          type: 'kitchen',
          x: kitchenX,
          y: groundLivingBox.y,
          w: kitchenW,
          h: kitchenH,
          doors: [
            { wall: 'left', position: 0.5, width: 26 },
            { wall: 'bottom', position: 0.5, width: 32 },
          ],
          windows: [
            { wall: 'right', position: 0.5, width: 32 },
            { wall: 'bottom', position: 0.8, width: 32 },
          ],
        });

        // Veranda / Garden Terrace (Outdoor extension)
        floorRooms.push({
          id: `f0-terrace`,
          label: lang === 'tr' ? 'Bahçe Verandası' : 'Garden Veranda & Terrace',
          type: 'balcony',
          x: groundLivingBox.x,
          y: groundLivingBox.y + groundLivingBox.h + 0.5,
          w: groundLivingBox.w + kitchenW + 0.5,
          h: 3.2,
          doors: [{ wall: 'top', position: 0.4, width: 36 }],
        });

      } else if (level === 1) {
        // ─── 1. FLOOR (Level 1) ───
        // Merdiven Kovası: STRICTLY LOCKED at identical (stairX, stairY, stairW, stairH)
        floorRooms.push({
          id: `f1-stair`,
          label: lang === 'tr' ? 'Merdiven Kovası' : 'Staircase Well',
          type: 'staircase',
          x: stairX,
          y: stairY,
          w: stairW,
          h: stairH,
          locked: true,
          doors: [{ wall: 'left', position: 0.5, width: 24 }],
        });

        // Tesisat Şaftı: STRICTLY LOCKED at identical (shaftX, shaftY, shaftW, shaftH)
        floorRooms.push({
          id: `f1-shaft`,
          label: lang === 'tr' ? 'Tesisat Şaftı' : 'Plumbing Shaft',
          type: 'shaft',
          x: shaftX,
          y: shaftY,
          w: shaftW,
          h: shaftH,
          locked: true,
        });

        // Galeri Boşluğu (Void): Positioned directly over ground-floor living room
        floorRooms.push({
          id: `f1-void`,
          label: lang === 'tr' ? 'Salon Üzeri Galeri Boşluğu' : 'Living Room Gallery Void',
          type: 'void',
          x: groundLivingBox.x,
          y: groundLivingBox.y,
          w: Math.round(groundLivingBox.w * 0.65),
          h: Math.round(groundLivingBox.h * 0.65),
          locked: true,
        });

        // Night Hallway / Gallery corridor
        floorRooms.push({
          id: `f1-hall`,
          label: lang === 'tr' ? 'Galeri Holü & Sirkülasyon' : 'Upper Gallery Hallway',
          type: 'hallway',
          x: stairX - 3.2,
          y: stairY,
          w: 3.2,
          h: stairH + 2,
          doors: [
            { wall: 'right', position: 0.3, width: 24 },
            { wall: 'top', position: 0.5, width: 24 },
            { wall: 'left', position: 0.5, width: 24 },
          ],
        });

        // Master Bedroom Suite (Ebeveyn Yatak Odası)
        floorRooms.push({
          id: `f1-master`,
          label: lang === 'tr' ? 'Ebeveyn Yatak Odası' : 'Master Bedroom Suite',
          type: 'bedroom',
          x: 1,
          y: 1,
          w: Math.max(5, stairX - 1.2),
          h: stairY - 1,
          doors: [{ wall: 'bottom', position: 0.8, width: 24 }],
          windows: [
            { wall: 'top', position: 0.5, width: 34 },
            { wall: 'left', position: 0.5, width: 34 },
          ],
        });

        // Ensuite Master Bathroom (Ebeveyn Banyosu)
        floorRooms.push({
          id: `f1-mbath`,
          label: lang === 'tr' ? 'Ebeveyn Banyosu' : 'Ensuite Bathroom',
          type: 'bathroom',
          x: stairX,
          y: 1,
          w: stairW,
          h: stairY - 1,
          doors: [{ wall: 'left', position: 0.5, width: 22 }],
          windows: [{ wall: 'top', position: 0.5, width: 22 }],
        });

        // Bedroom 2 (Çocuk Odası 1)
        floorRooms.push({
          id: `f1-bed2`,
          label: lang === 'tr' ? 'Yatak Odası 2' : 'Bedroom 2',
          type: 'bedroom',
          x: shaftX + shaftW + 0.5,
          y: stairY,
          w: Math.max(4.5, gridW - (shaftX + shaftW + 1.5)),
          h: stairH,
          doors: [{ wall: 'left', position: 0.3, width: 24 }],
          windows: [{ wall: 'right', position: 0.5, width: 32 }],
        });

        // Bedroom 3 (Çocuk Odası 2)
        floorRooms.push({
          id: `f1-bed3`,
          label: lang === 'tr' ? 'Yatak Odası 3' : 'Bedroom 3',
          type: 'bedroom',
          x: shaftX + shaftW + 0.5,
          y: 1,
          w: Math.max(4.5, gridW - (shaftX + shaftW + 1.5)),
          h: stairY - 1,
          doors: [{ wall: 'bottom', position: 0.3, width: 24 }],
          windows: [
            { wall: 'top', position: 0.5, width: 32 },
            { wall: 'right', position: 0.5, width: 32 },
          ],
        });

        // Family Bathroom & Laundry (Adjacent to Shaft)
        floorRooms.push({
          id: `f1-bath`,
          label: lang === 'tr' ? 'Aile Banyosu & WC' : 'Family Bathroom',
          type: 'bathroom',
          x: shaftX,
          y: shaftY + shaftH + 0.2,
          w: shaftW + 1.5,
          h: 2.5,
          doors: [{ wall: 'left', position: 0.5, width: 22 }],
          windows: [{ wall: 'right', position: 0.5, width: 20 }],
        });

        // Laundry Room
        floorRooms.push({
          id: `f1-laundry`,
          label: lang === 'tr' ? 'Çamaşır & Ütü Odası' : 'Laundry Room',
          type: 'laundry',
          x: shaftX,
          y: shaftY + shaftH + 2.9,
          w: shaftW + 1.5,
          h: 2.2,
          doors: [{ wall: 'left', position: 0.5, width: 22 }],
        });

      } else if (level === 2) {
        // ─── 2. FLOOR / PENTHOUSE (Level 2) ───
        // Merdiven Kovası: STRICTLY LOCKED at identical coordinates
        floorRooms.push({
          id: `f2-stair`,
          label: lang === 'tr' ? 'Merdiven Kovası' : 'Staircase Well',
          type: 'staircase',
          x: stairX,
          y: stairY,
          w: stairW,
          h: stairH,
          locked: true,
          doors: [{ wall: 'left', position: 0.5, width: 24 }],
        });

        // Tesisat Şaftı: STRICTLY LOCKED at identical coordinates
        floorRooms.push({
          id: `f2-shaft`,
          label: lang === 'tr' ? 'Tesisat Şaftı' : 'Plumbing Shaft',
          type: 'shaft',
          x: shaftX,
          y: shaftY,
          w: shaftW,
          h: shaftH,
          locked: true,
        });

        // Top Floor Lounge / Office
        floorRooms.push({
          id: `f2-office`,
          label: lang === 'tr' ? 'Çalışma & Kütüphane' : 'Study / Library Lounge',
          type: 'office',
          x: 1,
          y: 1,
          w: stairX + stairW - 1,
          h: stairY - 1,
          doors: [{ wall: 'bottom', position: 0.5, width: 24 }],
          windows: [
            { wall: 'top', position: 0.5, width: 36 },
            { wall: 'left', position: 0.5, width: 36 },
          ],
        });

        // Guest Suite
        floorRooms.push({
          id: `f2-guest`,
          label: lang === 'tr' ? 'Misafir Süiti' : 'Guest Suite',
          type: 'bedroom',
          x: 1,
          y: stairY,
          w: stairX - 1,
          h: stairH,
          doors: [{ wall: 'right', position: 0.5, width: 24 }],
          windows: [{ wall: 'left', position: 0.5, width: 30 }],
        });

        // Panoramic Roof Terrace
        floorRooms.push({
          id: `f2-terrace`,
          label: lang === 'tr' ? 'Panoramik Çatı Terası' : 'Panoramic Roof Terrace',
          type: 'balcony',
          x: stairX + stairW + 1,
          y: 1,
          w: gridW - (stairX + stairW + 2),
          h: gridH - 2,
          doors: [{ wall: 'left', position: 0.4, width: 32 }],
        });

      } else if (level === -1) {
        // ─── BASEMENT (Level -1) ───
        floorRooms.push({
          id: `fb-stair`,
          label: lang === 'tr' ? 'Merdiven İnişi' : 'Basement Staircase',
          type: 'staircase',
          x: stairX,
          y: stairY,
          w: stairW,
          h: stairH,
          locked: true,
          doors: [{ wall: 'left', position: 0.5, width: 24 }],
        });

        floorRooms.push({
          id: `fb-shaft`,
          label: lang === 'tr' ? 'Ana Tesisat Merkezi' : 'Main Technical Shaft',
          type: 'shaft',
          x: shaftX,
          y: shaftY,
          w: shaftW,
          h: shaftH,
          locked: true,
        });

        floorRooms.push({
          id: `fb-tech`,
          label: lang === 'tr' ? 'Mekanik & Kazan Dairesi' : 'Mechanical Room',
          type: 'storage',
          x: shaftX,
          y: shaftY + shaftH + 0.5,
          w: Math.max(4.5, gridW - shaftX - 1),
          h: 4.5,
          doors: [{ wall: 'left', position: 0.5, width: 24 }],
        });

        floorRooms.push({
          id: `fb-hobby`,
          label: lang === 'tr' ? 'Hobi / Sinema Odası' : 'Hobby & Cinema Room',
          type: 'living',
          x: 1,
          y: stairY + stairH + 0.5,
          w: Math.round(gridW * 0.6),
          h: Math.max(4, gridH - (stairY + stairH + 1.5)),
          doors: [{ wall: 'top', position: 0.5, width: 24 }],
        });

        floorRooms.push({
          id: `fb-store`,
          label: lang === 'tr' ? 'Genel Depo & Kiler' : 'General Storage',
          type: 'storage',
          x: 1,
          y: 1,
          w: stairX - 1,
          h: stairY + stairH - 1,
          doors: [{ wall: 'right', position: 0.5, width: 24 }],
        });

      } else {
        // ─── ATTIC / ROOF (Level 99) ───
        floorRooms.push({
          id: `fa-stair`,
          label: lang === 'tr' ? 'Çatı Merdiven Çıkışı' : 'Attic Stair Landing',
          type: 'staircase',
          x: stairX,
          y: stairY,
          w: stairW,
          h: stairH,
          locked: true,
        });

        floorRooms.push({
          id: `fa-lounge`,
          label: lang === 'tr' ? 'Çatı Lounge & Bar' : 'Rooftop Lounge & Bar',
          type: 'living',
          x: 2,
          y: 2,
          w: stairX - 2,
          h: stairY + stairH - 2,
          doors: [{ wall: 'right', position: 0.5, width: 24 }],
          windows: [{ wall: 'left', position: 0.5, width: 36 }],
        });

        floorRooms.push({
          id: `fa-terrace`,
          label: lang === 'tr' ? 'Panoramik Güneşlenme Terası' : 'Sundeck Terrace',
          type: 'balcony',
          x: stairX + stairW + 1,
          y: 1,
          w: gridW - (stairX + stairW + 2),
          h: gridH - 2,
          doors: [{ wall: 'left', position: 0.4, width: 32 }],
        });
      }

      // Calculate scale for this floor
      const floorGridUnits = floorRooms.reduce((sum, r) => sum + r.w * r.h, 0);
      const floorScale = floorGridUnits > 0 ? Math.sqrt(perFloorTargetArea / floorGridUnits) : 1.2;

      generatedFloors.push({
        level,
        name: prog.name,
        elevation: prog.elevation,
        rooms: floorRooms,
        totalArea: perFloorTargetArea,
      });
    }

    // 4. Generate SVG for each floor with ghost trace from lower floor
    // Level 0 has no lower floor, Level 1 has Level 0 ghost trace, Level 2 has Level 1 ghost trace
    const groundFloor = generatedFloors.find((f) => f.level === 0) || generatedFloors[0];

    for (let i = 0; i < generatedFloors.length; i++) {
      const fl = generatedFloors[i];
      let ghostRooms: RoomLayout[] | undefined = undefined;
      let showGhostTrace = false;

      if (fl.level > 0) {
        // Find immediate lower floor
        const lowerFloor = generatedFloors
          .filter((f) => f.level < fl.level)
          .sort((a, b) => b.level - a.level)[0];

        if (lowerFloor) {
          ghostRooms = lowerFloor.rooms;
          showGhostTrace = true;
        }
      }

      const tempLayout: FloorPlanLayout = {
        rooms: fl.rooms,
        totalArea: fl.totalArea || targetArea / generatedFloors.length,
        gridWidth: gridW,
        gridHeight: gridH,
        scale: 1.2,
        floors: generatedFloors,
        activeLevel: fl.level,
      };

      fl.svg = generateSVG(tempLayout, lang, {
        ghostRooms,
        showGhostTrace,
        activeLevel: fl.level,
        floorName: fl.name,
        elevation: fl.elevation,
      });
    }

    // 5. Compose Master Multi-Floor Layout
    const masterLayout: FloorPlanLayout = {
      rooms: groundFloor.rooms,
      totalArea: targetArea,
      gridWidth: gridW,
      gridHeight: gridH,
      scale: 1.2,
      floors: generatedFloors,
      activeLevel: groundFloor.level,
    };

    const initialSvg = groundFloor.svg || generateSVG(masterLayout, lang);

    // 6. Update Database if projectId provided
    if (projectId && projectId !== 'new') {
      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            layoutJson: JSON.stringify(masterLayout),
            svgData: initialSvg,
            totalArea: Number(targetArea),
            style: buildingStyle,
            description: `${floorsCount} Katlı ${buildingStyle.toUpperCase()} Villa - Arsa: ${lotWidth}x${lotDepth}m, Alan: ${targetArea}m²`,
          },
        });
      } catch (dbErr) {
        console.warn('DB update in wizard skipped:', dbErr);
      }
    }

    return NextResponse.json({
      layout: masterLayout,
      svg: initialSvg,
    });
  } catch (error) {
    console.error('Wizard generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
