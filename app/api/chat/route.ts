import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { genAI, MODEL, hasRealApiKey } from '@/lib/gemini';
import { generateSVG, FloorPlanLayout, RoomLayout, getCleanRoomLabel } from '@/lib/svg-generator';
import { prisma } from '@/lib/db';

const CHAT_SYSTEM_PROMPT = `You are an expert architect AI. The user wants to modify an existing floor plan layout.
You will receive the current layout JSON and a modification request.
Respond with ONLY a valid JSON object of the updated layout. No text, no markdown.

Apply the requested changes while keeping the overall structure logical:
- Maintain proper room adjacency
- Ensure rooms don't overlap
- Keep proportions realistic
- Update gridWidth and gridHeight if rooms expand or move

The JSON schema is the same FloorPlanLayout format. Return the COMPLETE updated layout, not just the changed parts.`;

function applyRuleBasedModification(
  currentLayout: FloorPlanLayout,
  message: string,
  lang: 'tr' | 'en' = 'tr'
): { updatedLayout: FloorPlanLayout; reply: string } {
  const updatedLayout: FloorPlanLayout = JSON.parse(JSON.stringify(currentLayout));
  const msg = message.toLowerCase();
  let reply =
    lang === 'tr'
      ? 'Tasarım isteğiniz doğrultusunda güncellendi.'
      : 'Layout has been updated according to your request.';

  if (msg.includes('banyo') || msg.includes('bath')) {
    const hasBath2 = updatedLayout.rooms.some((r) => r.id === 'extra-bath');
    if (!hasBath2) {
      updatedLayout.rooms.push({
        id: 'extra-bath',
        label: lang === 'tr' ? 'Ek Banyo' : 'Extra Bathroom',
        type: 'bathroom',
        x: updatedLayout.gridWidth - 3,
        y: updatedLayout.gridHeight - 2,
        w: 3,
        h: 2,
        doors: [{ wall: 'top', position: 0.5 }],
        windows: [{ wall: 'right', position: 0.5 }],
      });
      reply =
        lang === 'tr'
          ? 'Yeni bir ebeveyn/misafir banyosu eklendi.'
          : 'A new bathroom has been added to the floor plan.';
    }
  } else if (msg.includes('balkon') || msg.includes('balcony')) {
    const hasBalcony = updatedLayout.rooms.some((r) => r.type === 'balcony');
    if (!hasBalcony) {
      updatedLayout.gridHeight += 1;
      updatedLayout.rooms.push({
        id: 'balcony-new',
        label: lang === 'tr' ? 'Geniş Balkon' : 'Spacious Balcony',
        type: 'balcony',
        x: 0,
        y: updatedLayout.gridHeight - 1,
        w: 5,
        h: 1,
        doors: [{ wall: 'top', position: 0.5 }],
      });
      reply =
        lang === 'tr'
          ? 'Yatak odası ve oturma alanına bağlı ferah bir balkon eklendi.'
          : 'A spacious balcony has been added to the floor plan.';
    }
  } else if (msg.includes('büyüt') || msg.includes('larger') || msg.includes('bigger')) {
    const targetRoom = updatedLayout.rooms.find(
      (r) => r.type === 'living' || r.type === 'bedroom'
    );
    if (targetRoom) {
      targetRoom.w = Math.min(targetRoom.w + 1, 8);
      targetRoom.h = Math.min(targetRoom.h + 1, 6);
      updatedLayout.totalArea = Math.round(updatedLayout.totalArea * 1.15);
      const roomName = getCleanRoomLabel(targetRoom, lang);
      reply =
        lang === 'tr'
          ? `${roomName} alanı genişletildi ve toplam metrekare güncellendi.`
          : `${roomName} dimensions have been enlarged.`;
    }
  } else if (msg.includes('ofis') || msg.includes('office') || msg.includes('çalışma')) {
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
        doors: [{ wall: 'left', position: 0.5 }],
        windows: [{ wall: 'top', position: 0.5 }],
      });
      reply =
        lang === 'tr'
          ? 'Sessiz ve aydınlık bir çalışma odası (Home Office) eklendi.'
          : 'A dedicated home office has been added to the layout.';
    }
  }

  // Clean all room labels to match target language
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
        const userMessage = `Current layout JSON:
${JSON.stringify(currentLayout, null, 2)}

User request: ${message}
Output all room labels in ${lang === 'tr' ? 'Turkish' : 'English'}.

Return the updated layout JSON.`;

        const response = await genAI.models.generateContent({
          model: MODEL,
          contents: [
            { role: 'user', parts: [{ text: CHAT_SYSTEM_PROMPT }] },
            { role: 'user', parts: [{ text: userMessage }] },
          ],
          config: {
            temperature: 0.5,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text ?? '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.rooms && Array.isArray(parsed.rooms)) {
          parsed.rooms = parsed.rooms.map((r: RoomLayout) => ({
            ...r,
            label: getCleanRoomLabel(r, lang),
          }));
          updatedLayout = parsed;
          reply =
            lang === 'tr'
              ? `Kat planınız "${message}" talebinize göre güncellendi.`
              : `Your floor plan has been updated based on "${message}".`;
        }
      } catch (geminiErr) {
        console.warn('Gemini chat failed, falling back to rule engine:', geminiErr);
      }
    }

    // 2. Fallback to rule engine
    if (!updatedLayout) {
      const fallbackResult = applyRuleBasedModification(currentLayout, message, lang);
      updatedLayout = fallbackResult.updatedLayout;
      reply = fallbackResult.reply;
    }

    // Generate new SVG in target language
    const svg = generateSVG(updatedLayout, lang);

    // Save message and updated layout to DB
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
