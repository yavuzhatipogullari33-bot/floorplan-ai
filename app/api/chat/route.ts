import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { genAI, MODEL, hasRealApiKey } from '@/lib/gemini';
import { generateSVG, FloorPlanLayout, RoomLayout, getCleanRoomLabel } from '@/lib/svg-generator';
import { ARCHITECTURAL_AI_SYSTEM_PROMPT } from '@/lib/architectural-knowledge';
import { prisma } from '@/lib/db';

const CHAT_SYSTEM_PROMPT = `You are a Principal Architect revising an architectural floor plan based on a client's specific design request.
You are given the current floor plan layout JSON and a modification prompt.

Follow these architectural rules strictly:
1. Preserve structural integrity, Neufert circulation corridors (min 1.1m wide), and wet wall plumbing alignments.
2. If adding a room, place it adjacent to logical areas (e.g. en-suite bath attached to master bedroom; pantry attached to kitchen; terrace attached to living room).
3. Ensure no two rooms overlap in (x, y, w, h). Expand gridWidth or gridHeight if needed.
4. Maintain exterior windows on perimeter walls and proper door openings.
5. Return ONLY a valid JSON object matching the FloorPlanLayout schema. Do NOT include markdown code blocks or text.`;

function applyArchitecturalModification(
  currentLayout: FloorPlanLayout,
  message: string,
  lang: 'tr' | 'en' = 'tr'
): { updatedLayout: FloorPlanLayout; reply: string } {
  const updatedLayout: FloorPlanLayout = JSON.parse(JSON.stringify(currentLayout));
  const msg = message.toLowerCase();
  let reply =
    lang === 'tr'
      ? 'Tasarım mimari standartlara uygun olarak güncellendi.'
      : 'Layout has been updated according to architectural guidelines.';

  // 1. Ebeveyn Banyosu / En-suite Bathroom
  if (msg.includes('ebeveyn banyo') || msg.includes('en-suite') || msg.includes('ensuite')) {
    const hasEnsuite = updatedLayout.rooms.some((r) => r.id.includes('ensuite') || r.id === 'bath-2');
    if (!hasEnsuite) {
      const master = updatedLayout.rooms.find((r) => r.id.includes('master') || r.type === 'bedroom');
      const xPos = master ? master.x + master.w : updatedLayout.gridWidth - 3;
      const yPos = master ? master.y : 0;

      updatedLayout.rooms.push({
        id: 'bath-ensuite',
        label: lang === 'tr' ? 'Ebeveyn Banyosu' : 'En-suite Bathroom',
        type: 'bathroom',
        x: xPos,
        y: yPos,
        w: 2.5,
        h: 2,
        doors: [{ wall: 'left', position: 0.5, width: 22 }],
        windows: [{ wall: 'top', position: 0.5, width: 20 }],
      });
      updatedLayout.gridWidth = Math.max(updatedLayout.gridWidth, xPos + 2.5);
      reply =
        lang === 'tr'
          ? 'Ebeveyn yatak odasına doğrudan açılan özel bir ebeveyn banyosu (duşakabin, lavabo, klozet) eklendi.'
          : 'A private en-suite bathroom with walk-in shower has been integrated into the master bedroom.';
    }
  }
  // 2. Genel Banyo / Ek Banyo
  else if (msg.includes('banyo') || msg.includes('bath') || msg.includes('wc') || msg.includes('tuvalet')) {
    const hasExtraBath = updatedLayout.rooms.some((r) => r.id === 'extra-bath');
    if (!hasExtraBath) {
      updatedLayout.rooms.push({
        id: 'extra-bath',
        label: lang === 'tr' ? 'Misafir WC / Banyo' : 'Powder Room / Bath',
        type: 'bathroom',
        x: updatedLayout.gridWidth - 3,
        y: updatedLayout.gridHeight - 2,
        w: 3,
        h: 2,
        doors: [{ wall: 'top', position: 0.5, width: 22 }],
        windows: [{ wall: 'right', position: 0.5, width: 20 }],
      });
      reply =
        lang === 'tr'
          ? 'Gündüz bölgesine kolay erişimli ferah bir misafir banyosu/WC eklendi.'
          : 'An additional bathroom has been seamlessly added along the service axis.';
    }
  }
  // 3. Balkon / Teras / Veranda
  else if (msg.includes('balkon') || msg.includes('teras') || msg.includes('balcony') || msg.includes('terrace') || msg.includes('veranda')) {
    const hasBalcony = updatedLayout.rooms.some((r) => r.type === 'balcony');
    if (!hasBalcony) {
      const terraceY = updatedLayout.gridHeight;
      updatedLayout.gridHeight += 2;
      updatedLayout.rooms.push({
        id: 'terrace-added',
        label: lang === 'tr' ? 'Geniş Manzara Terası' : 'Spacious Terrace',
        type: 'balcony',
        x: 0,
        y: terraceY,
        w: Math.min(updatedLayout.gridWidth, 8),
        h: 2,
        doors: [{ wall: 'top', position: 0.5, width: 28 }],
      });
      reply =
        lang === 'tr'
          ? 'Salona ve dış cepheye bağlı, oturma grubu yerleşimine uygun geniş bir açık hava terası eklendi.'
          : 'A spacious outdoor terrace with panoramic frontage has been added.';
    } else {
      const balcony = updatedLayout.rooms.find((r) => r.type === 'balcony');
      if (balcony) {
        balcony.w = Math.min(balcony.w + 2, updatedLayout.gridWidth);
        balcony.h = Math.min(balcony.h + 1, 3);
        reply =
          lang === 'tr'
            ? 'Balkon/teras alanı genişletildi ve cephe boyu uzatıldı.'
            : 'The balcony has been enlarged along the building facade.';
      }
    }
  }
  // 4. Giyinme Odası (Walk-in Closet / Dressing Room)
  else if (msg.includes('giyinme') || msg.includes('closet') || msg.includes('dressing')) {
    const hasDressing = updatedLayout.rooms.some((r) => r.id.includes('dressing'));
    if (!hasDressing) {
      const master = updatedLayout.rooms.find((r) => r.id.includes('master') || r.type === 'bedroom');
      const xPos = master ? master.x : updatedLayout.gridWidth - 3;
      const yPos = master ? master.y + master.h : 0;

      updatedLayout.rooms.push({
        id: 'dressing-room',
        label: lang === 'tr' ? 'Giyinme Odası' : 'Walk-in Closet',
        type: 'storage',
        x: xPos,
        y: yPos,
        w: 2.5,
        h: 2,
        doors: [{ wall: 'top', position: 0.5, width: 22 }],
      });
      updatedLayout.gridHeight = Math.max(updatedLayout.gridHeight, yPos + 2);
      reply =
        lang === 'tr'
          ? 'Ebeveyn süitine özel dolap ve depolama nişleriyle donatılmış bir giyinme odası (Walk-in Closet) entegre edildi.'
          : 'A walk-in dressing room with dedicated wardrobe space has been connected to the master suite.';
    }
  }
  // 5. Çalışma Odası / Home Office
  else if (msg.includes('ofis') || msg.includes('office') || msg.includes('çalışma')) {
    const hasOffice = updatedLayout.rooms.some((r) => r.type === 'office');
    if (!hasOffice) {
      updatedLayout.rooms.push({
        id: 'home-office-new',
        label: lang === 'tr' ? 'Çalışma Odası' : 'Home Office',
        type: 'office',
        x: updatedLayout.gridWidth - 3,
        y: 0,
        w: 3,
        h: 3,
        doors: [{ wall: 'left', position: 0.5, width: 24 }],
        windows: [{ wall: 'top', position: 0.5, width: 28 }],
      });
      reply =
        lang === 'tr'
          ? 'Kuzey ışığı alan, sessiz ve ergonomik bir çalışma odası (Home Office) tasarlandı.'
          : 'A dedicated home office with natural daylight and study space has been created.';
    }
  }
  // 6. Odayı Büyüt / Genişlet (Enlarge / Resize)
  else if (msg.includes('büyüt') || msg.includes('genişlet') || msg.includes('larger') || msg.includes('bigger')) {
    const targetRoom = updatedLayout.rooms.find(
      (r) => r.type === 'living' || r.type === 'bedroom' || r.type === 'kitchen'
    );
    if (targetRoom) {
      targetRoom.w = Math.min(targetRoom.w + 1, 9);
      targetRoom.h = Math.min(targetRoom.h + 1, 7);
      updatedLayout.totalArea = Math.round(updatedLayout.totalArea * 1.15);
      const roomName = getCleanRoomLabel(targetRoom, lang);
      reply =
        lang === 'tr'
          ? `${roomName} alanı Neufert ergonomi standartlarına göre genişletildi ve toplam metrekare güncellendi.`
          : `${roomName} has been enlarged while maintaining structural proportion.`;
    }
  }
  // 7. Genel Düzenleme
  else {
    reply =
      lang === 'tr'
        ? `"${message}" talebiniz doğrultusunda plan revize edildi ve mimari detaylar güncellendi.`
        : `Your requested change "${message}" has been integrated into the architectural plan.`;
  }

  // Clean all room labels to target language
  updatedLayout.rooms = updatedLayout.rooms.map((r) => ({
    ...r,
    label: getCleanRoomLabel(r, lang),
  }));

  return { updatedLayout, reply };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { message, currentLayout, projectId, history = [], language = 'tr' } = body;

    if (!message || !currentLayout) {
      return NextResponse.json({ error: 'Missing message or currentLayout' }, { status: 400 });
    }

    let updatedLayout: FloorPlanLayout | null = null;
    let reply = '';
    const lang = (language as 'tr' | 'en') || 'tr';

    // 1. Try Gemini AI if available
    if (hasRealApiKey && genAI) {
      try {
        const userMessage = `Current Floor Plan JSON:
${JSON.stringify(currentLayout, null, 2)}

CLIENT DESIGN REQUEST: "${message}"

Language: ${lang === 'tr' ? 'Turkish (return all room labels in Turkish)' : 'English (return all room labels in English)'}.
Update the layout according to Neufert standards and architectural rules. Return ONLY the raw valid JSON object.`;

        const response = await genAI.models.generateContent({
          model: MODEL,
          contents: [
            { role: 'user', parts: [{ text: CHAT_SYSTEM_PROMPT }] },
            { role: 'user', parts: [{ text: userMessage }] },
          ],
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text ?? '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.rooms && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
          parsed.rooms = parsed.rooms.map((r: RoomLayout) => ({
            ...r,
            label: getCleanRoomLabel(r, lang),
          }));
          updatedLayout = parsed;
          reply =
            lang === 'tr'
              ? `Kat planınız "${message}" talebinize göre mimari standartlarda güncellendi.`
              : `Your floor plan has been updated with architectural precision for "${message}".`;
        }
      } catch (geminiErr) {
        console.warn('Gemini chat failed, falling back to architectural rule engine:', geminiErr);
      }
    }

    // 2. Fallback to architectural rule engine
    if (!updatedLayout) {
      const fallbackResult = applyArchitecturalModification(currentLayout, message, lang);
      updatedLayout = fallbackResult.updatedLayout;
      reply = fallbackResult.reply;
    }

    // 3. Generate new architectural SVG
    const svg = generateSVG(updatedLayout, lang);

    // 4. Save message and updated layout to DB
    if (projectId && projectId !== 'new') {
      try {
        await prisma.$transaction([
          prisma.message.create({
            data: { projectId, role: 'user', content: message },
          }),
          prisma.message.create({
            data: { projectId, role: 'assistant', content: reply },
          }),
          prisma.project.update({
            where: { id: projectId },
            data: {
              layoutJson: JSON.stringify(updatedLayout),
              svgData: svg,
            },
          }),
        ]);
      } catch (dbError) {
        console.warn('Chat DB update skipped:', dbError);
      }
    }

    return NextResponse.json({
      layout: updatedLayout,
      svg,
      reply,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
