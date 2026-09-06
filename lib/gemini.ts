import { GoogleGenAI } from '@google/genai';
import { FloorPlanLayout, RoomLayout, getCleanRoomLabel } from '@/lib/svg-generator';
import { ARCHITECTURAL_AI_SYSTEM_PROMPT } from '@/lib/architectural-knowledge';

const apiKey = process.env.GEMINI_API_KEY || '';

export const hasRealApiKey = Boolean(apiKey && apiKey !== 'placeholder' && apiKey.length > 10);

export const genAI = hasRealApiKey ? new GoogleGenAI({ apiKey }) : null;

export const MODEL = 'gemini-2.0-flash';

export interface GenerateFloorPlanOptions {
  bedrooms: number;
  bathrooms: number;
  totalArea: number;
  style?: string;
  extras?: string[];
  description?: string;
  language?: 'tr' | 'en';
  footprintShape?: string;
}

/**
 * Calls Google Gemini API with Neufert architectural prompts to produce
 * articulated, non-monotonous layouts with polygon and dynamic massing support.
 */
export async function generateFloorPlanWithGemini(
  options: GenerateFloorPlanOptions
): Promise<FloorPlanLayout | null> {
  if (!hasRealApiKey || !genAI) {
    return null;
  }

  const {
    bedrooms = 3,
    bathrooms = 2,
    totalArea = 120,
    style = 'modern',
    extras = [],
    description = '',
    language = 'tr',
    footprintShape,
  } = options;

  const targetLang = (language as 'tr' | 'en') || 'tr';

  const shapeDirective = footprintShape && footprintShape !== 'rectangle'
    ? `\n- REQUIRED MASSING/FOOTPRINT: Design strictly following a ${footprintShape} architectural footprint with articulated wings and setbacks.`
    : '\n- REQUIRED MASSING/FOOTPRINT: Do NOT use a simple box. Adopt an articulated L-shape, U-shape, Courtyard, or Stepped Terrace massing.';

  const userPrompt = `DESIGN SPECIFICATIONS:
- Number of Bedrooms: ${bedrooms}
- Number of Bathrooms: ${bathrooms}
- Target Total Area: ~${totalArea} m²
- Architectural Style: ${style}
- Requested Extras/Amenities: ${extras.join(', ') || 'Standard residential layout'}
- User Design Notes: ${description || 'Design a bespoke, architecturally distinct residence.'}${shapeDirective}
- Primary Language for Room Labels: ${
    targetLang === 'tr'
      ? 'Turkish (e.g. Salon, Mutfak, Ebeveyn Yatak Odası, Ana Banyo, Koridor, Balkon/Teras)'
      : 'English (e.g. Living Room, Kitchen, Master Bedroom, Main Bathroom, Hallway, Terrace)'
  }.

STRICT ARCHITECTURAL INSTRUCTIONS:
1. Avoid rectangular shoebox plans. Articulate the footprint with projecting wings, setbacks, or polygons.
2. Group all wet areas (bathrooms, kitchen, laundry) along common plumbing shaft walls.
3. Ensure living spaces open directly to an outdoor private terrace or garden.
4. Separate night zones (bedrooms) from day zones via an acoustic circulation buffer.

Return ONLY the raw valid JSON matching the specified schema.`;

  try {
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: ARCHITECTURAL_AI_SYSTEM_PROMPT + '\n\n' + userPrompt }],
        },
      ],
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text ?? '';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    if (!cleaned) return null;

    const parsed: FloorPlanLayout = JSON.parse(cleaned);

    if (parsed.rooms && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
      parsed.rooms = parsed.rooms.map((r: RoomLayout) => ({
        ...r,
        label: getCleanRoomLabel(r, targetLang),
      }));

      // Calculate total grid units taking polygons into account
      const totalGridUnits = parsed.rooms.reduce((acc, r) => {
        if (r.polygon && r.polygon.length >= 3) {
          let area = 0;
          const n = r.polygon.length;
          for (let i = 0; i < n; i++) {
            const [x1, y1] = r.polygon[i];
            const [x2, y2] = r.polygon[(i + 1) % n];
            area += x1 * y2 - x2 * y1;
          }
          return acc + Math.abs(area) / 2;
        }
        return acc + (r.w * r.h);
      }, 0);

      if (totalGridUnits > 0) {
        parsed.scale = Math.sqrt(Number(totalArea) / totalGridUnits);
        parsed.totalArea = Number(totalArea);
      }

      return parsed;
    }

    return null;
  } catch (error) {
    console.warn('Gemini generateFloorPlanWithGemini failed:', error);
    return null;
  }
}

export interface RefineFloorPlanOptions {
  currentLayout: FloorPlanLayout;
  instruction: string;
  language?: 'tr' | 'en';
}

/**
 * PLAN REFINEMENT & CORRECTION (PLAN İYİLEŞTİRME VE DÜZELTME)
 * - Diferansiyel Güncelleme: Tüm projeyi baştan üretmek yerine sadece hedeflenen odayı
 *   ve komşuluk sınırlarını/poligonlarını günceller.
 * - Kilitli Oda Koruması (Locked Room Protection): "locked: true" olan odaların koordinatları
 *   ve ebatları kesinlikle korunur, yapay zeka tarafından değiştirilemez.
 */
export async function refineFloorPlanWithGemini(
  options: RefineFloorPlanOptions
): Promise<{ updatedLayout: FloorPlanLayout; reply: string } | null> {
  const { currentLayout, instruction, language = 'tr' } = options;
  const targetLang = (language as 'tr' | 'en') || 'tr';

  // Identify locked rooms
  const lockedRooms = currentLayout.rooms.filter((r) => r.locked);
  const lockedSummary = lockedRooms.length > 0
    ? `\nCRITICAL LOCKED ROOMS (DO NOT MODIFY THESE ROOMS OR ALTER THEIR COORDINATES AT ALL):\n` +
      lockedRooms.map((r) => `- ID "${r.id}" (${r.label}): x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h}${r.polygon ? `, polygon=${JSON.stringify(r.polygon)}` : ''}`).join('\n')
    : '\nNo rooms are currently locked.';

  if (!hasRealApiKey || !genAI) {
    return refineFloorPlanProcedural(currentLayout, instruction, targetLang);
  }

  const refinePrompt = `You are a Principal Architect performing a DIFFERENTIAL PLAN REFINEMENT on an existing residential layout.

EXISTING FLOOR PLAN LAYOUT:
${JSON.stringify(currentLayout, null, 2)}

USER REFINEMENT INSTRUCTION:
"${instruction}"
${lockedSummary}

STRICT ARCHITECTURAL REFINEMENT RULES:
1. DIFFERENTIAL EDIT ONLY:
   - DO NOT regenerate or discard the existing floor plan!
   - Keep unchanged rooms at their existing positions, room IDs, and dimensions.
   - Modify ONLY the rooms directly referenced or affected by the user's instruction (e.g. expanding the living room, shifting the foyer, resizing the bedroom).
   - If a room expands, shift or re-carve only its immediate neighboring walls/polygons so that rooms remain snug with NO overlapping areas and NO isolated voids.
2. STRICT LOCKED ROOM IMMUTABILITY:
   - Any room with "locked": true MUST remain at its EXACT original (x, y, w, h) and polygon coordinates. Under NO circumstances should locked rooms be moved or modified.
3. PRESERVE CIRCULATION & WET WALLS:
   - Ensure the central corridor/spine retains access to all rooms.
   - Maintain wet walls for bathrooms/kitchen.
4. RETURN FORMAT:
   Return ONLY a valid JSON object matching the FloorPlanLayout schema:
   {
     "rooms": [ ... ],
     "totalArea": number,
     "gridWidth": number,
     "gridHeight": number,
     "scale": number
   }`;

  try {
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: ARCHITECTURAL_AI_SYSTEM_PROMPT + '\n\n' + refinePrompt }],
        },
      ],
      config: {
        temperature: 0.3, // low temperature for precise differential adjustment
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text ?? '';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    if (!cleaned) return refineFloorPlanProcedural(currentLayout, instruction, targetLang);

    const parsed: FloorPlanLayout = JSON.parse(cleaned);

    if (parsed.rooms && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
      // 1. Enforce locked room coordinates deterministically (Safety Guarantee)
      for (const lockedRoom of lockedRooms) {
        const roomIdx = parsed.rooms.findIndex((r) => r.id === lockedRoom.id);
        if (roomIdx !== -1) {
          parsed.rooms[roomIdx] = {
            ...parsed.rooms[roomIdx],
            x: lockedRoom.x,
            y: lockedRoom.y,
            w: lockedRoom.w,
            h: lockedRoom.h,
            polygon: lockedRoom.polygon,
            locked: true,
          };
        } else {
          // If the AI somehow omitted a locked room, restore it completely
          parsed.rooms.push({ ...lockedRoom });
        }
      }

      // 2. Ensure labels
      parsed.rooms = parsed.rooms.map((r: RoomLayout) => ({
        ...r,
        label: getCleanRoomLabel(r, targetLang),
      }));

      // 3. Recalculate grid scale accurately
      const totalGridUnits = parsed.rooms.reduce((acc, r) => {
        if (r.polygon && r.polygon.length >= 3) {
          let area = 0;
          const n = r.polygon.length;
          for (let i = 0; i < n; i++) {
            const [x1, y1] = r.polygon[i];
            const [x2, y2] = r.polygon[(i + 1) % n];
            area += x1 * y2 - x2 * y1;
          }
          return acc + Math.abs(area) / 2;
        }
        return acc + (r.w * r.h);
      }, 0);

      const targetArea = currentLayout.totalArea || 120;
      if (totalGridUnits > 0) {
        parsed.scale = Math.sqrt(Number(targetArea) / totalGridUnits);
        parsed.totalArea = Number(targetArea);
      }

      const reply = targetLang === 'tr'
        ? `Tasarım "${instruction}" talimatı doğrultusunda diferansiyel olarak güncellendi. Kilitli odalar korundu.`
        : `Plan differentially updated per instruction: "${instruction}". Locked rooms were preserved.`;

      return { updatedLayout: parsed, reply };
    }

    return refineFloorPlanProcedural(currentLayout, instruction, targetLang);
  } catch (error) {
    console.warn('Gemini refineFloorPlanWithGemini failed, using procedural fallback:', error);
    return refineFloorPlanProcedural(currentLayout, instruction, targetLang);
  }
}

/**
 * Procedural Differential Refinement (Deterministic Fallback)
 * Kilitli odalara asla dokunmadan diferansiyel büyüme/yer değiştirme uygular.
 */
export function refineFloorPlanProcedural(
  currentLayout: FloorPlanLayout,
  instruction: string,
  lang: 'tr' | 'en' = 'tr'
): { updatedLayout: FloorPlanLayout; reply: string } {
  const updated: FloorPlanLayout = JSON.parse(JSON.stringify(currentLayout));
  const msg = instruction.toLowerCase();
  let reply = lang === 'tr' ? 'Plan başarıyla güncellendi.' : 'Plan updated successfully.';

  // 1. Salonu Büyüt / Daha Ferah Yap
  if (msg.includes('salon') || msg.includes('ferah') || msg.includes('büyüt') || msg.includes('genişlet') || msg.includes('living')) {
    const living = updated.rooms.find((r) => r.type === 'living');
    if (living && !living.locked) {
      living.w += 1.5;
      living.h += 0.5;
      updated.gridWidth = Math.max(updated.gridWidth, living.x + living.w + 1);
      reply = lang === 'tr'
        ? 'Salon alanı genişletildi ve kütle sınırları diferansiyel olarak uyarlandı.'
        : 'Living room expanded with greater spatial depth.';
    }
  }

  // 2. Girişi Sağa Al
  else if (msg.includes('giriş') || msg.includes('antre') || msg.includes('foyer') || msg.includes('sağa')) {
    const foyer = updated.rooms.find((r) => r.type === 'hallway' || r.id.includes('foyer'));
    if (foyer && !foyer.locked) {
      foyer.x += 1.5;
      updated.gridWidth = Math.max(updated.gridWidth, foyer.x + foyer.w + 1);
      reply = lang === 'tr'
        ? 'Giriş ve antre aksı sağa kaydırılarak sirkülasyon rahatlatıldı.'
        : 'Entry foyer shifted to the right for optimized circulation.';
    }
  }

  // 3. Ebeveyn Odasını Genişlet
  else if (msg.includes('ebeveyn') || msg.includes('master') || msg.includes('yatak')) {
    const master = updated.rooms.find((r) => r.id.includes('master') || r.type === 'bedroom');
    if (master && !master.locked) {
      master.w += 1.0;
      master.h += 1.0;
      updated.gridWidth = Math.max(updated.gridWidth, master.x + master.w + 1);
      reply = lang === 'tr'
        ? 'Ebeveyn yatak odası süiti diferansiyel olarak genişletildi.'
        : 'Master bedroom suite differentially expanded.';
    }
  }

  // Recalculate scale
  const totalGrid = updated.rooms.reduce((sum, r) => sum + r.w * r.h, 0);
  if (totalGrid > 0 && updated.totalArea) {
    updated.scale = Math.sqrt(updated.totalArea / totalGrid);
  }

  return { updatedLayout: updated, reply };
}
