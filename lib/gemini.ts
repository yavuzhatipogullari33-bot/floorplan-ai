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
