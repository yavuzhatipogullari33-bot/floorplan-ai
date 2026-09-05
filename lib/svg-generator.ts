export interface RoomLayout {
  id: string;
  label: string;
  x: number; // grid units
  y: number;
  w: number;
  h: number;
  type: RoomType;
  doors?: DoorPlacement[];
  windows?: WindowPlacement[];
  furniture?: FurniturePlacement[];
}

export type RoomType =
  | 'living'
  | 'kitchen'
  | 'dining'
  | 'bedroom'
  | 'bathroom'
  | 'hallway'
  | 'garage'
  | 'balcony'
  | 'storage'
  | 'laundry'
  | 'office';

export interface DoorPlacement {
  id?: string;
  wall: 'top' | 'right' | 'bottom' | 'left';
  position: number; // 0-1 along the wall
  width?: number; // width in pixels / size (default 24)
}

export interface WindowPlacement {
  id?: string;
  wall: 'top' | 'right' | 'bottom' | 'left';
  position: number; // 0-1 along the wall
  width?: number; // width in pixels / size (default 28)
}

export interface FurniturePlacement {
  type: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  rotation?: number;
}

export interface FloorPlanLayout {
  rooms: RoomLayout[];
  totalArea: number;
  gridWidth: number;
  gridHeight: number;
  scale: number; // meters per grid unit
}

// Architectural color palette - subtle blueprint / architectural rendering tones
export const ROOM_COLORS: Record<RoomType, { fill: string; stroke: string; label: string; accent: string }> = {
  living: { fill: '#F8FAFC', stroke: '#334155', label: 'Living Room', accent: '#0EA5E9' },
  kitchen: { fill: '#FFFDF7', stroke: '#475569', label: 'Kitchen', accent: '#F59E0B' },
  dining: { fill: '#FDFBF7', stroke: '#475569', label: 'Dining Room', accent: '#D97706' },
  bedroom: { fill: '#F8FAFC', stroke: '#334155', label: 'Bedroom', accent: '#3B82F6' },
  bathroom: { fill: '#F0F9FF', stroke: '#0284C7', label: 'Bathroom', accent: '#0284C7' },
  hallway: { fill: '#F1F5F9', stroke: '#64748B', label: 'Hallway', accent: '#64748B' },
  garage: { fill: '#F8FAFC', stroke: '#64748B', label: 'Garage', accent: '#64748B' },
  balcony: { fill: '#F0FDF4', stroke: '#16A34A', label: 'Balcony', accent: '#16A34A' },
  storage: { fill: '#FAF5FF', stroke: '#7E22CE', label: 'Storage', accent: '#9333EA' },
  laundry: { fill: '#FFF1F2', stroke: '#E11D48', label: 'Laundry', accent: '#E11D48' },
  office: { fill: '#F8FAFC', stroke: '#334155', label: 'Office', accent: '#6366F1' },
};

// Pure Single-Language Dictionaries
export const ROOM_LABELS_TR: Record<RoomType, string> = {
  living: 'Salon',
  kitchen: 'Mutfak',
  dining: 'Yemek Alanı',
  bedroom: 'Yatak Odası',
  bathroom: 'Banyo',
  hallway: 'Antre / Hol',
  garage: 'Garaj',
  balcony: 'Balkon / Teras',
  storage: 'Kiler / Depo',
  laundry: 'Çamaşır Odası',
  office: 'Çalışma Odası',
};

export const ROOM_LABELS_EN: Record<RoomType, string> = {
  living: 'Living Room',
  kitchen: 'Kitchen',
  dining: 'Dining Area',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  hallway: 'Foyer / Hallway',
  garage: 'Garage',
  balcony: 'Balcony / Terrace',
  storage: 'Pantry / Storage',
  laundry: 'Laundry Room',
  office: 'Home Office',
};

export function getCleanRoomLabel(room: RoomLayout, lang: 'tr' | 'en' = 'tr'): string {
  if (room.label && room.label.includes('/')) {
    const parts = room.label.split('/').map((s) => s.trim());
    return lang === 'tr' ? parts[0] : parts[1] || parts[0];
  }

  if (lang === 'tr') {
    if (room.id === 'master-bed' || room.id?.includes('master')) return 'Ebeveyn Yatak Odası';
    if (room.id === 'bed-2') return 'Yatak Odası 2';
    if (room.id === 'bed-3') return 'Yatak Odası 3';
    if (room.id === 'bed-4') return 'Misafir Yatak Odası';
    if (room.id === 'bath-1' || room.id === 'bath-main') return 'Genel Banyo';
    if (room.id === 'bath-2' || room.id?.includes('ensuite')) return 'Ebeveyn Banyosu';
    if (room.id?.includes('wc')) return 'Misafir WC';
    if (room.id?.includes('dressing') || room.id?.includes('closet')) return 'Giyinme Odası';
    return ROOM_LABELS_TR[room.type] || room.label || 'Oda';
  } else {
    if (room.id === 'master-bed' || room.id?.includes('master')) return 'Master Bedroom';
    if (room.id === 'bed-2') return 'Bedroom 2';
    if (room.id === 'bed-3') return 'Bedroom 3';
    if (room.id === 'bed-4') return 'Guest Bedroom';
    if (room.id === 'bath-1' || room.id === 'bath-main') return 'Main Bathroom';
    if (room.id === 'bath-2' || room.id?.includes('ensuite')) return 'En-suite Bathroom';
    if (room.id?.includes('wc')) return 'Powder Room';
    if (room.id?.includes('dressing') || room.id?.includes('closet')) return 'Walk-in Closet';
    return ROOM_LABELS_EN[room.type] || room.label || 'Room';
  }
}

export const CELL_SIZE = 60; // pixels per grid unit
export const PADDING = 60; // extra padding for architectural dimensions
export const WALL_THICKNESS = 4.0;
export const DEFAULT_DOOR_SIZE = 24;
export const DEFAULT_WINDOW_SIZE = 28;

/**
 * ARCHITECTURAL FURNITURE SVG RENDERER
 * Gerçek mimari plan tefrişat sembolleri (yatak, koltuk, lavabo, evye, ocak vb.)
 */
function renderArchitecturalFurniture(
  x: number,
  y: number,
  w: number,
  h: number,
  type: RoomType,
  roomId: string
): string {
  // Only render furniture if room is at least 2x2 grid units (120x120 px)
  if (w < 100 || h < 100) return '';

  let svg = '';

  switch (type) {
    case 'bedroom': {
      const isMaster = roomId.includes('master') || (w >= 180 && h >= 180);
      if (isMaster) {
        // King-size Bed (110x130px) + Pillows + Blanket + Nightstands
        const bedW = Math.min(w * 0.55, 110);
        const bedH = Math.min(h * 0.65, 125);
        const bedX = x + (w - bedW) / 2;
        const bedY = y + 10;
        const nightstandSize = 22;

        svg += `
          <!-- Master Bed Frame -->
          <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH}" rx="4" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.2"/>
          <!-- Headboard -->
          <rect x="${bedX - 2}" y="${bedY}" width="${bedW + 4}" height="10" rx="2" fill="#E2E8F0" stroke="#64748B" stroke-width="1.2"/>
          <!-- Pillows -->
          <rect x="${bedX + 8}" y="${bedY + 14}" width="${bedW * 0.38}" height="18" rx="3" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
          <rect x="${bedX + bedW - 8 - bedW * 0.38}" y="${bedY + 14}" width="${bedW * 0.38}" height="18" rx="3" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
          <!-- Blanket / Duvet Fold -->
          <path d="M${bedX + 4},${bedY + 45} L${bedX + bedW - 4},${bedY + 45}" stroke="#CBD5E1" stroke-width="1.2" stroke-dasharray="3,3"/>
          <rect x="${bedX + 4}" y="${bedY + 45}" width="${bedW - 8}" height="${bedH - 49}" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
          <!-- Left Nightstand -->
          <rect x="${bedX - nightstandSize - 4}" y="${bedY + 6}" width="${nightstandSize}" height="${nightstandSize}" rx="2" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1"/>
          <circle cx="${bedX - nightstandSize / 2 - 4}" cy="${bedY + 6 + nightstandSize / 2}" r="3" fill="#E2E8F0"/>
          <!-- Right Nightstand -->
          <rect x="${bedX + bedW + 4}" y="${bedY + 6}" width="${nightstandSize}" height="${nightstandSize}" rx="2" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1"/>
          <circle cx="${bedX + bedW + 4 + nightstandSize / 2}" cy="${bedY + 6 + nightstandSize / 2}" r="3" fill="#E2E8F0"/>
          <!-- Wardrobe Line -->
          <rect x="${x + 8}" y="${y + h - 22}" width="${w - 16}" height="14" rx="1" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
          <line x1="${x + 8}" y1="${y + h - 22}" x2="${x + w - 8}" y2="${y + h - 8}" stroke="#E2E8F0" stroke-width="0.8"/>
        `;
      } else {
        // Single Bed (70x110px) + Desk
        const bedW = Math.min(w * 0.45, 75);
        const bedH = Math.min(h * 0.65, 115);
        const bedX = x + 10;
        const bedY = y + 10;

        svg += `
          <!-- Single Bed Frame -->
          <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH}" rx="3" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.2"/>
          <rect x="${bedX - 1}" y="${bedY}" width="${bedW + 2}" height="8" rx="2" fill="#E2E8F0" stroke="#64748B" stroke-width="1"/>
          <rect x="${bedX + (bedW - 36) / 2}" y="${bedY + 12}" width="36" height="16" rx="3" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
          <rect x="${bedX + 4}" y="${bedY + 38}" width="${bedW - 8}" height="${bedH - 42}" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.8"/>
          <!-- Study Desk & Chair -->
          <rect x="${x + w - 65}" y="${y + 10}" width="55" height="26" rx="2" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1"/>
          <circle cx="${x + w - 37}" cy="${y + 48}" r="9" fill="#F1F5F9" stroke="#64748B" stroke-width="1"/>
          <!-- Wardrobe -->
          <rect x="${x + w - 32}" y="${y + h - 70}" width="24" height="60" rx="1" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
        `;
      }
      break;
    }

    case 'living': {
      // Contemporary L-Shaped Sectional Sofa + Coffee Table + TV Wall
      const sofaW = Math.min(w * 0.6, 160);
      const sofaH = Math.min(h * 0.55, 140);
      const sofaX = x + 18;
      const sofaY = y + 18;
      const depth = 32;

      svg += `
        <!-- Area Rug -->
        <rect x="${sofaX - 6}" y="${sofaY - 6}" width="${sofaW + 28}" height="${sofaH + 28}" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4,4"/>
        <!-- L-Sofa Base -->
        <path d="M${sofaX},${sofaY} L${sofaX + sofaW},${sofaY} L${sofaX + sofaW},${sofaY + depth} L${sofaX + depth},${sofaY + depth} L${sofaX + depth},${sofaY + sofaH} L${sofaX},${sofaY + sofaH} Z" fill="#FFFFFF" stroke="#64748B" stroke-width="1.4" rx="4"/>
        <!-- Cushions Details -->
        <line x1="${sofaX + sofaW * 0.33}" y1="${sofaY}" x2="${sofaX + sofaW * 0.33}" y2="${sofaY + depth}" stroke="#CBD5E1" stroke-width="1"/>
        <line x1="${sofaX + sofaW * 0.66}" y1="${sofaY}" x2="${sofaX + sofaW * 0.66}" y2="${sofaY + depth}" stroke="#CBD5E1" stroke-width="1"/>
        <line x1="${sofaX}" y1="${sofaY + sofaH * 0.55}" x2="${sofaX + depth}" y2="${sofaY + sofaH * 0.55}" stroke="#CBD5E1" stroke-width="1"/>
        <!-- Coffee Table (Sehpa) -->
        <rect x="${sofaX + depth + 14}" y="${sofaY + depth + 12}" width="${Math.min(sofaW * 0.45, 60)}" height="${Math.min(sofaH * 0.4, 38)}" rx="4" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.2"/>
        <!-- TV Console Unit on opposite wall -->
        <rect x="${x + w - 24}" y="${y + 30}" width="14" height="${Math.min(h - 60, 110)}" rx="2" fill="#E2E8F0" stroke="#64748B" stroke-width="1.2"/>
        <line x1="${x + w - 17}" y1="${y + 40}" x2="${x + w - 17}" y2="${y + 30 + Math.min(h - 60, 110) - 10}" stroke="#0F172A" stroke-width="2.5"/>
      `;
      break;
    }

    case 'kitchen': {
      // Perimeter Countertop + Double Sink + 4-Burner Stovetop + Refrigerator
      const counterDepth = 28;
      svg += `
        <!-- L-Countertop Base -->
        <path d="M${x + 4},${y + 4} L${x + w - 4},${y + 4} L${x + w - 4},${y + counterDepth} L${x + counterDepth},${y + counterDepth} L${x + counterDepth},${y + h - 4} L${x + 4},${y + h - 4} Z" fill="#F8FAFC" stroke="#64748B" stroke-width="1.2"/>
        <!-- Double Basin Sink (Evye) -->
        <rect x="${x + 40}" y="${y + 7}" width="38" height="16" rx="2" fill="#FFFFFF" stroke="#0284C7" stroke-width="1"/>
        <rect x="${x + 43}" y="${y + 9}" width="15" height="12" rx="1" fill="#E0F2FE" stroke="#0284C7" stroke-width="0.8"/>
        <rect x="${x + 60}" y="${y + 9}" width="15" height="12" rx="1" fill="#E0F2FE" stroke="#0284C7" stroke-width="0.8"/>
        <circle cx="${x + 59}" cy="${y + 8}" r="2" fill="#0369A1"/>
        <!-- 4-Burner Stovetop (Ocak) -->
        <rect x="${x + 95}" y="${y + 6}" width="30" height="18" rx="2" fill="#FFFFFF" stroke="#475569" stroke-width="1"/>
        <circle cx="${x + 102}" cy="${y + 11}" r="3" fill="#CBD5E1"/>
        <circle cx="${x + 118}" cy="${y + 11}" r="3" fill="#CBD5E1"/>
        <circle cx="${x + 102}" cy="${y + 19}" r="3" fill="#CBD5E1"/>
        <circle cx="${x + 118}" cy="${y + 19}" r="3" fill="#CBD5E1"/>
        <!-- Refrigerator (Buzdolabı) -->
        <rect x="${x + 6}" y="${y + h - 42}" width="22" height="34" rx="2" fill="#FFFFFF" stroke="#475569" stroke-width="1.2"/>
        <line x1="${x + 6}" y1="${y + h - 30}" x2="${x + 28}" y2="${y + h - 30}" stroke="#94A3B8" stroke-width="1"/>
        <text x="${x + 17}" y="${y + h - 18}" text-anchor="middle" font-family="Inter, system-ui" font-size="7" font-weight="bold" fill="#64748B">REF</text>
      `;

      // Optional Kitchen Island if room is very wide
      if (w >= 220 && h >= 180) {
        svg += `
          <!-- Island Counter -->
          <rect x="${x + 65}" y="${y + 55}" width="${Math.min(w * 0.4, 85)}" height="38" rx="3" fill="#FFFFFF" stroke="#64748B" stroke-width="1.2"/>
          <line x1="${x + 65}" y1="${y + 74}" x2="${x + 65 + Math.min(w * 0.4, 85)}" y2="${y + 74}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="2,2"/>
        `;
      }
      break;
    }

    case 'dining': {
      // Dining Table + 6 Chairs
      const tableW = Math.min(w * 0.6, 90);
      const tableH = Math.min(h * 0.45, 52);
      const tableX = x + (w - tableW) / 2;
      const tableY = y + (h - tableH) / 2;
      const chairW = 14;
      const chairD = 10;

      svg += `
        <!-- Dining Table -->
        <rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="6" fill="#FFFFFF" stroke="#64748B" stroke-width="1.3"/>
        <!-- Top Chairs -->
        <rect x="${tableX + tableW * 0.2 - chairW / 2}" y="${tableY - chairD - 2}" width="${chairW}" height="${chairD}" rx="2" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
        <rect x="${tableX + tableW * 0.5 - chairW / 2}" y="${tableY - chairD - 2}" width="${chairW}" height="${chairD}" rx="2" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
        <rect x="${tableX + tableW * 0.8 - chairW / 2}" y="${tableY - chairD - 2}" width="${chairW}" height="${chairD}" rx="2" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
        <!-- Bottom Chairs -->
        <rect x="${tableX + tableW * 0.2 - chairW / 2}" y="${tableY + tableH + 2}" width="${chairW}" height="${chairD}" rx="2" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
        <rect x="${tableX + tableW * 0.5 - chairW / 2}" y="${tableY + tableH + 2}" width="${chairW}" height="${chairD}" rx="2" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
        <rect x="${tableX + tableW * 0.8 - chairW / 2}" y="${tableY + tableH + 2}" width="${chairW}" height="${chairD}" rx="2" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
      `;
      break;
    }

    case 'bathroom': {
      // Walk-in Shower + Floating Vanity Basin + Wall-hung Toilet (Asma Klozet)
      const showerSize = Math.min(w * 0.45, h * 0.55, 50);
      svg += `
        <!-- Glass Walk-in Shower Enclosure -->
        <rect x="${x + 6}" y="${y + 6}" width="${showerSize}" height="${showerSize}" rx="2" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.2"/>
        <line x1="${x + 6}" y1="${y + 6}" x2="${x + 6 + showerSize}" y2="${y + 6 + showerSize}" stroke="#BAE6FD" stroke-width="1" stroke-dasharray="2,2"/>
        <circle cx="${x + 6 + showerSize / 2}" cy="${y + 6 + showerSize / 2}" r="3" fill="#0284C7"/>
        <!-- Vanity Sink (Lavabo) -->
        <rect x="${x + w - 42}" y="${y + 6}" width="34" height="20" rx="3" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.2"/>
        <ellipse cx="${x + w - 25}" cy="${y + 16}" rx="11" ry="6" fill="#E0F2FE" stroke="#0284C7" stroke-width="0.8"/>
        <!-- Wall-hung Toilet (Klozet) -->
        <rect x="${x + w - 32}" y="${y + h - 38}" width="24" height="12" rx="2" fill="#E2E8F0" stroke="#64748B" stroke-width="1"/>
        <path d="M${x + w - 30},${y + h - 26} Q${x + w - 20},${y + h - 10} ${x + w - 10},${y + h - 26} Z" fill="#FFFFFF" stroke="#64748B" stroke-width="1"/>
      `;
      break;
    }

    case 'office': {
      // Executive Desk + Ergonomic Chair + Bookshelf
      const deskW = Math.min(w * 0.6, 95);
      const deskH = Math.min(h * 0.45, 42);
      const deskX = x + (w - deskW) / 2;
      const deskY = y + 25;

      svg += `
        <!-- Desk -->
        <rect x="${deskX}" y="${deskY}" width="${deskW}" height="${deskH}" rx="3" fill="#FFFFFF" stroke="#475569" stroke-width="1.2"/>
        <!-- Laptop / Monitor -->
        <rect x="${deskX + (deskW - 24) / 2}" y="${deskY + 8}" width="24" height="14" rx="2" fill="#F1F5F9" stroke="#64748B" stroke-width="0.8"/>
        <!-- Swivel Chair -->
        <circle cx="${deskX + deskW / 2}" cy="${deskY + deskH + 16}" r="11" fill="#F8FAFC" stroke="#475569" stroke-width="1.2"/>
        <!-- Bookshelf / Storage Line -->
        <rect x="${x + 6}" y="${y + h - 20}" width="${w - 12}" height="14" rx="2" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>
      `;
      break;
    }

    case 'balcony': {
      // Outdoor Decking & Railing
      svg += `
        <!-- Terrace Railing -->
        <line x1="${x + 4}" y1="${y + h - 4}" x2="${x + w - 4}" y2="${y + h - 4}" stroke="#16A34A" stroke-width="2.5" stroke-dasharray="6,3"/>
        <!-- Outdoor Table & Chairs -->
        <circle cx="${x + w / 2}" cy="${y + h / 2}" r="12" fill="#FFFFFF" stroke="#16A34A" stroke-width="1"/>
        <circle cx="${x + w / 2 - 18}" cy="${y + h / 2}" r="5" fill="#DCFCE7" stroke="#16A34A" stroke-width="0.8"/>
        <circle cx="${x + w / 2 + 18}" cy="${y + h / 2}" r="5" fill="#DCFCE7" stroke="#16A34A" stroke-width="0.8"/>
      `;
      break;
    }

    default:
      break;
  }

  return svg;
}

/**
 * ARCHITECTURAL DIMENSION LINES (ÖLÇÜLENDİRME ÇİZGİLERİ)
 * Planın kenarlarında 45° mimari tık işaretli aks ölçüleri
 */
function renderDimensionLines(layout: FloorPlanLayout): string {
  const { rooms, gridWidth, gridHeight, scale } = layout;
  let dims = '';

  const minX = rooms.length > 0 ? Math.min(...rooms.map(r => r.x)) : 0;
  const maxX = rooms.length > 0 ? Math.max(...rooms.map(r => r.x + r.w)) : gridWidth;
  const minY = rooms.length > 0 ? Math.min(...rooms.map(r => r.y)) : 0;
  const maxY = rooms.length > 0 ? Math.max(...rooms.map(r => r.y + r.h)) : gridHeight;

  const buildingW = maxX - minX;
  const buildingH = maxY - minY;

  const totalWidthM = (buildingW * scale).toFixed(2);
  const totalHeightM = (buildingH * scale).toFixed(2);

  const startX = PADDING + minX * CELL_SIZE;
  const startY = PADDING + minY * CELL_SIZE;
  const planW = buildingW * CELL_SIZE;
  const planH = buildingH * CELL_SIZE;

  // Top overall dimension line
  const topDimY = PADDING - 24;
  dims += `
    <!-- Top Overall Dimension Line -->
    <line x1="${startX}" y1="${topDimY}" x2="${startX + planW}" y2="${topDimY}" stroke="#64748B" stroke-width="1.2"/>
    <!-- 45-degree Architectural Ticks -->
    <line x1="${startX - 4}" y1="${topDimY + 4}" x2="${startX + 4}" y2="${topDimY - 4}" stroke="#1E293B" stroke-width="2"/>
    <line x1="${startX + planW - 4}" y1="${topDimY + 4}" x2="${startX + planW + 4}" y2="${topDimY - 4}" stroke="#1E293B" stroke-width="2"/>
    <!-- Extension Witness Lines -->
    <line x1="${startX}" y1="${topDimY - 6}" x2="${startX}" y2="${startY + 2}" stroke="#CBD5E1" stroke-width="0.8"/>
    <line x1="${startX + planW}" y1="${topDimY - 6}" x2="${startX + planW}" y2="${startY + 2}" stroke="#CBD5E1" stroke-width="0.8"/>
    <!-- Dimension Text -->
    <rect x="${startX + planW / 2 - 28}" y="${topDimY - 12}" width="56" height="15" fill="#FAFAFA" rx="2"/>
    <text x="${startX + planW / 2}" y="${topDimY - 2}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="700" fill="#334155">${totalWidthM} m</text>
  `;

  // Left overall dimension line
  const leftDimX = PADDING - 24;
  dims += `
    <!-- Left Overall Dimension Line -->
    <line x1="${leftDimX}" y1="${startY}" x2="${leftDimX}" y2="${startY + planH}" stroke="#64748B" stroke-width="1.2"/>
    <!-- 45-degree Architectural Ticks -->
    <line x1="${leftDimX - 4}" y1="${startY + 4}" x2="${leftDimX + 4}" y2="${startY - 4}" stroke="#1E293B" stroke-width="2"/>
    <line x1="${leftDimX - 4}" y1="${startY + planH + 4}" x2="${leftDimX + 4}" y2="${startY + planH - 4}" stroke="#1E293B" stroke-width="2"/>
    <!-- Extension Witness Lines -->
    <line x1="${leftDimX - 6}" y1="${startY}" x2="${startX + 2}" y2="${startY}" stroke="#CBD5E1" stroke-width="0.8"/>
    <line x1="${leftDimX - 6}" y1="${startY + planH}" x2="${startX + 2}" y2="${startY + planH}" stroke="#CBD5E1" stroke-width="0.8"/>
    <!-- Dimension Text (Rotated 90deg) -->
    <text x="${leftDimX - 8}" y="${startY + planH / 2}" text-anchor="middle" transform="rotate(-90 ${leftDimX - 8} ${startY + planH / 2})" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="700" fill="#334155">${totalHeightM} m</text>
  `;

  return dims;
}

/**
 * MAIN GENERATE SVG FUNCTION
 */
export function generateSVG(layout: FloorPlanLayout, lang: 'tr' | 'en' = 'tr'): string {
  const { rooms, gridWidth, gridHeight, scale } = layout;
  const svgWidth = Math.max(gridWidth * CELL_SIZE + PADDING * 2 + 40, 750);
  const svgHeight = Math.max(gridHeight * CELL_SIZE + PADDING * 2 + 60, 560);

  let roomsSvg = '';
  let furnitureSvg = '';
  let openingsSvg = '';

  // 1. Draw rooms & furniture
  for (const room of rooms) {
    const x = room.x * CELL_SIZE + PADDING;
    const y = room.y * CELL_SIZE + PADDING;
    const width = room.w * CELL_SIZE;
    const height = room.h * CELL_SIZE;
    const colors = ROOM_COLORS[room.type] ?? ROOM_COLORS.hallway;
    const areaM2 = (room.w * room.h * scale * scale).toFixed(1);
    const roomWM = (room.w * scale).toFixed(1);
    const roomHM = (room.h * scale).toFixed(1);
    const displayLabel = getCleanRoomLabel(room, lang);

    // Double-line architectural wall representation
    // Outer wall footprint
    roomsSvg += `
      <g id="room-${room.id}">
        <!-- Room Base Floor Fill -->
        <rect
          x="${x}" y="${y}"
          width="${width}" height="${height}"
          fill="${colors.fill}"
          stroke="#1E293B"
          stroke-width="${WALL_THICKNESS}"
          rx="1"
        />
        <!-- Inner Plaster Line (İç Sıva Hattı) -->
        <rect
          x="${x + 2}" y="${y + 2}"
          width="${width - 4}" height="${height - 4}"
          fill="none"
          stroke="#E2E8F0"
          stroke-width="0.8"
        />
      </g>`;

    // Render internal architectural furniture
    furnitureSvg += renderArchitecturalFurniture(x, y, width, height, room.type, room.id);

    // Render doors
    if (room.doors) {
      for (const door of room.doors) {
        openingsSvg += generateDoorSVG(x, y, width, height, door);
      }
    }

    // Render windows
    if (room.windows) {
      for (const win of room.windows) {
        openingsSvg += generateWindowSVG(x, y, width, height, win);
      }
    }

    // Professional Room Label & Area Badge (Piramit rozet)
    const cx = x + width / 2;
    const cy = y + height - 22;

    roomsSvg += `
      <!-- Architectural Room Stamp -->
      <g class="room-stamp" pointer-events="none">
        <rect
          x="${cx - 54}" y="${cy - 12}"
          width="108" height="26"
          rx="5"
          fill="#FFFFFF"
          fill-opacity="0.94"
          stroke="#CBD5E1"
          stroke-width="0.8"
        />
        <text
          x="${cx}" y="${cy}"
          text-anchor="middle"
          font-family="Inter, system-ui, sans-serif"
          font-size="10"
          font-weight="700"
          letter-spacing="-0.01em"
          fill="#0F172A"
        >${displayLabel}</text>
        <text
          x="${cx}" y="${cy + 10}"
          text-anchor="middle"
          font-family="Inter, system-ui, sans-serif"
          font-size="8"
          font-weight="600"
          fill="${colors.accent}"
        >${areaM2} m² (${roomWM}×${roomHM}m)</text>
      </g>`;
  }

  // 2. Subtle architectural grid lines
  let gridLines = '';
  for (let gx = 0; gx <= gridWidth; gx++) {
    gridLines += `<line x1="${gx * CELL_SIZE + PADDING}" y1="${PADDING}" x2="${gx * CELL_SIZE + PADDING}" y2="${gridHeight * CELL_SIZE + PADDING}" stroke="#F1F5F9" stroke-width="0.8"/>`;
  }
  for (let gy = 0; gy <= gridHeight; gy++) {
    gridLines += `<line x1="${PADDING}" y1="${gy * CELL_SIZE + PADDING}" x2="${gridWidth * CELL_SIZE + PADDING}" y2="${gy * CELL_SIZE + PADDING}" stroke="#F1F5F9" stroke-width="0.8"/>`;
  }

  // 3. Dimension lines
  const dimensionLines = renderDimensionLines(layout);

  // 4. Scale bar & Title stamp (Mimari Pafta Başlığı)
  const scaleBarWidth = CELL_SIZE * 2; // 2 units
  const scaleLabel = `${(scale * 2).toFixed(1)}m`;
  const scaleX = PADDING;
  const scaleY = svgHeight - 20;

  const titleBlock = `
    <!-- Architectural Title Block / Pafta Rozeti -->
    <g transform="translate(${scaleX}, ${scaleY - 10})">
      <rect x="-4" y="-22" width="240" height="28" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
      <text x="6" y="-6" font-family="Inter, system-ui, sans-serif" font-size="9" font-weight="700" fill="#0F172A">
        ${lang === 'tr' ? 'MİMARİ KAT PLANI' : 'ARCHITECTURAL FLOOR PLAN'}
      </text>
      <text x="135" y="-6" font-family="Inter, system-ui, sans-serif" font-size="8.5" font-weight="600" fill="#64748B">
        ${lang === 'tr' ? 'Net Alan:' : 'Total:'} ${layout.totalArea} m² | 1:${Math.round(100 / scale)}
      </text>
      <!-- Metric Scale Bar -->
      <line x1="0" y1="0" x2="${scaleBarWidth}" y2="0" stroke="#0F172A" stroke-width="2"/>
      <line x1="0" y1="-3" x2="0" y2="3" stroke="#0F172A" stroke-width="2"/>
      <line x1="${scaleBarWidth / 2}" y1="-2" x2="${scaleBarWidth / 2}" y2="2" stroke="#0F172A" stroke-width="1"/>
      <line x1="${scaleBarWidth}" y1="-3" x2="${scaleBarWidth}" y2="3" stroke="#0F172A" stroke-width="2"/>
      <text x="${scaleBarWidth + 6}" y="3" font-family="Inter, system-ui, sans-serif" font-size="8" font-weight="600" fill="#64748B">${scaleLabel}</text>
    </g>
  `;

  // 5. Professional North Arrow (Kuzey Oku)
  const northX = svgWidth - PADDING - 20;
  const northY = PADDING - 10;
  const compass = `
    <!-- Professional North Arrow -->
    <g transform="translate(${northX}, ${northY})">
      <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
      <polygon points="0,-13 -5,0 0,-3" fill="#0F172A"/>
      <polygon points="0,-13 5,0 0,-3" fill="#64748B"/>
      <polygon points="0,13 -5,0 0,3" fill="#CBD5E1"/>
      <polygon points="0,13 5,0 0,3" fill="#E2E8F0"/>
      <text x="0" y="-17" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="9" font-weight="900" fill="#0F172A">N</text>
    </g>
  `;

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${svgWidth} ${svgHeight}"
    width="${svgWidth}"
    height="${svgHeight}"
    style="background: #FAFAFA; font-family: Inter, system-ui, -apple-system, sans-serif;"
  >
    <!-- Background Architectural Grid -->
    ${gridLines}

    <!-- Dimension Lines -->
    ${dimensionLines}

    <!-- Room Walls & Floors -->
    ${roomsSvg}

    <!-- Architectural Furniture (Tefrişat) -->
    ${furnitureSvg}

    <!-- Openings (Doors & Windows) -->
    ${openingsSvg}

    <!-- Scale & Title Stamp -->
    ${titleBlock}

    <!-- Compass -->
    ${compass}
  </svg>`;
}

/**
 * 90° ARCHITECTURAL DOOR WITH SWING ARC
 */
export function generateDoorSVG(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  door: DoorPlacement
): string {
  const dSize = door.width || DEFAULT_DOOR_SIZE;
  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

  switch (door.wall) {
    case 'top':
      x1 = rx + door.position * rw - dSize / 2;
      y1 = ry;
      x2 = x1 + dSize;
      y2 = ry;
      return `
        <!-- Door Wall Opening Cut -->
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFFFFF" stroke-width="6"/>
        <!-- 90-degree Quarter Arc Swing (Kesikli Açılış Yayı) -->
        <path d="M${x1},${ry} A${dSize},${dSize} 0 0,1 ${x1},${ry + dSize}" stroke="#94A3B8" stroke-width="1.2" fill="none" stroke-dasharray="2,2"/>
        <!-- Door Panel Line -->
        <line x1="${x1}" y1="${ry}" x2="${x1}" y2="${ry + dSize}" stroke="#334155" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'bottom':
      x1 = rx + door.position * rw - dSize / 2;
      y1 = ry + rh;
      x2 = x1 + dSize;
      y2 = ry + rh;
      return `
        <!-- Door Wall Opening Cut -->
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFFFFF" stroke-width="6"/>
        <!-- 90-degree Quarter Arc Swing -->
        <path d="M${x1},${ry + rh} A${dSize},${dSize} 0 0,0 ${x1},${ry + rh - dSize}" stroke="#94A3B8" stroke-width="1.2" fill="none" stroke-dasharray="2,2"/>
        <!-- Door Panel Line -->
        <line x1="${x1}" y1="${ry + rh}" x2="${x1}" y2="${ry + rh - dSize}" stroke="#334155" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'left':
      x1 = rx;
      y1 = ry + door.position * rh - dSize / 2;
      x2 = rx;
      y2 = y1 + dSize;
      return `
        <!-- Door Wall Opening Cut -->
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFFFFF" stroke-width="6"/>
        <!-- 90-degree Quarter Arc Swing -->
        <path d="M${rx},${y1} A${dSize},${dSize} 0 0,1 ${rx + dSize},${y1}" stroke="#94A3B8" stroke-width="1.2" fill="none" stroke-dasharray="2,2"/>
        <!-- Door Panel Line -->
        <line x1="${rx}" y1="${y1}" x2="${rx + dSize}" y2="${y1}" stroke="#334155" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'right':
      x1 = rx + rw;
      y1 = ry + door.position * rh - dSize / 2;
      x2 = rx + rw;
      y2 = y1 + dSize;
      return `
        <!-- Door Wall Opening Cut -->
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFFFFF" stroke-width="6"/>
        <!-- 90-degree Quarter Arc Swing -->
        <path d="M${rx + rw},${y1} A${dSize},${dSize} 0 0,0 ${rx + rw - dSize},${y1}" stroke="#94A3B8" stroke-width="1.2" fill="none" stroke-dasharray="2,2"/>
        <!-- Door Panel Line -->
        <line x1="${rx + rw}" y1="${y1}" x2="${rx + rw - dSize}" y2="${y1}" stroke="#334155" stroke-width="2.2" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

/**
 * ARCHITECTURAL DUAL-GLAZED WINDOW WITH SILL
 */
export function generateWindowSVG(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  win: WindowPlacement
): string {
  const wSize = win.width || DEFAULT_WINDOW_SIZE;
  switch (win.wall) {
    case 'top': {
      const wx = rx + win.position * rw - wSize / 2;
      const wy = ry - 3;
      return `
        <!-- Window Wall Cut -->
        <line x1="${wx}" y1="${ry}" x2="${wx + wSize}" y2="${ry}" stroke="#FFFFFF" stroke-width="6"/>
        <!-- Window Sill (Denizlik) & Dual Glazing Frame -->
        <rect x="${wx}" y="${wy}" width="${wSize}" height="6" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.2" rx="1"/>
        <line x1="${wx + 2}" y1="${ry}" x2="${wx + wSize - 2}" y2="${ry}" stroke="#38BDF8" stroke-width="1"/>
        <line x1="${wx + wSize / 2}" y1="${wy}" x2="${wx + wSize / 2}" y2="${wy + 6}" stroke="#0284C7" stroke-width="1"/>`;
    }
    case 'bottom': {
      const wx = rx + win.position * rw - wSize / 2;
      const wy = ry + rh - 3;
      return `
        <!-- Window Wall Cut -->
        <line x1="${wx}" y1="${ry + rh}" x2="${wx + wSize}" y2="${ry + rh}" stroke="#FFFFFF" stroke-width="6"/>
        <!-- Window Sill & Glazing Frame -->
        <rect x="${wx}" y="${wy}" width="${wSize}" height="6" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.2" rx="1"/>
        <line x1="${wx + 2}" y1="${ry + rh}" x2="${wx + wSize - 2}" y2="${ry + rh}" stroke="#38BDF8" stroke-width="1"/>
        <line x1="${wx + wSize / 2}" y1="${wy}" x2="${wx + wSize / 2}" y2="${wy + 6}" stroke="#0284C7" stroke-width="1"/>`;
    }
    case 'left': {
      const wx = rx - 3;
      const wy = ry + win.position * rh - wSize / 2;
      return `
        <!-- Window Wall Cut -->
        <line x1="${rx}" y1="${wy}" x2="${rx}" y2="${wy + wSize}" stroke="#FFFFFF" stroke-width="6"/>
        <!-- Window Sill & Glazing Frame -->
        <rect x="${wx}" y="${wy}" width="6" height="${wSize}" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.2" rx="1"/>
        <line x1="${rx}" y1="${wy + 2}" x2="${rx}" y2="${wy + wSize - 2}" stroke="#38BDF8" stroke-width="1"/>
        <line x1="${wx}" y1="${wy + wSize / 2}" x2="${wx + 6}" y2="${wy + wSize / 2}" stroke="#0284C7" stroke-width="1"/>`;
    }
    case 'right': {
      const wx = rx + rw - 3;
      const wy = ry + win.position * rh - wSize / 2;
      return `
        <!-- Window Wall Cut -->
        <line x1="${rx + rw}" y1="${wy}" x2="${rx + rw}" y2="${wy + wSize}" stroke="#FFFFFF" stroke-width="6"/>
        <!-- Window Sill & Glazing Frame -->
        <rect x="${wx}" y="${wy}" width="6" height="${wSize}" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.2" rx="1"/>
        <line x1="${rx + rw}" y1="${wy + 2}" x2="${rx + rw}" y2="${wy + wSize - 2}" stroke="#38BDF8" stroke-width="1"/>
        <line x1="${wx}" y1="${wy + wSize / 2}" x2="${wx + 6}" y2="${wy + wSize / 2}" stroke="#0284C7" stroke-width="1"/>`;
    }
    default:
      return '';
  }
}
