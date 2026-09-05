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

export interface FloorPlanLayout {
  rooms: RoomLayout[];
  totalArea: number;
  gridWidth: number;
  gridHeight: number;
  scale: number; // meters per grid unit
}

// Color mapping for room types
export const ROOM_COLORS: Record<RoomType, { fill: string; stroke: string; label: string }> = {
  living: { fill: '#F0FDF4', stroke: '#16A34A', label: 'Living Room' },
  kitchen: { fill: '#FFF7ED', stroke: '#EA580C', label: 'Kitchen' },
  dining: { fill: '#FFFBEB', stroke: '#D97706', label: 'Dining Room' },
  bedroom: { fill: '#EFF6FF', stroke: '#2563EB', label: 'Bedroom' },
  bathroom: { fill: '#F0F9FF', stroke: '#0284C7', label: 'Bathroom' },
  hallway: { fill: '#F9FAFB', stroke: '#6B7280', label: 'Hallway' },
  garage: { fill: '#F5F5F4', stroke: '#78716C', label: 'Garage' },
  balcony: { fill: '#F7FEE7', stroke: '#65A30D', label: 'Balcony' },
  storage: { fill: '#FDF4FF', stroke: '#A855F7', label: 'Storage' },
  laundry: { fill: '#FFF1F2', stroke: '#E11D48', label: 'Laundry' },
  office: { fill: '#F8FAFC', stroke: '#475569', label: 'Office' },
};

// Pure Single-Language Dictionaries
export const ROOM_LABELS_TR: Record<RoomType, string> = {
  living: 'Oturma Odası',
  kitchen: 'Mutfak',
  dining: 'Yemek Odası',
  bedroom: 'Yatak Odası',
  bathroom: 'Banyo',
  hallway: 'Koridor',
  garage: 'Garaj',
  balcony: 'Balkon',
  storage: 'Kiler',
  laundry: 'Çamaşır Odası',
  office: 'Çalışma Odası',
};

export const ROOM_LABELS_EN: Record<RoomType, string> = {
  living: 'Living Room',
  kitchen: 'Kitchen',
  dining: 'Dining Room',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  hallway: 'Hallway',
  garage: 'Garage',
  balcony: 'Balcony',
  storage: 'Storage',
  laundry: 'Laundry',
  office: 'Home Office',
};

export function getCleanRoomLabel(room: RoomLayout, lang: 'tr' | 'en' = 'tr'): string {
  // If label contains a slash (e.g. "Oturma Odası / Living Room"), extract only the requested language
  if (room.label && room.label.includes('/')) {
    const parts = room.label.split('/').map((s) => s.trim());
    return lang === 'tr' ? parts[0] : parts[1] || parts[0];
  }

  // If label is custom and doesn't have slash, check if it matches an English or Turkish term
  if (lang === 'tr') {
    if (room.id === 'master-bed') return 'Ebeveyn Yatak Odası';
    if (room.id === 'bed-2') return 'Yatak Odası 2';
    if (room.id === 'bed-3') return 'Yatak Odası 3';
    if (room.id === 'bath-1') return 'Ana Banyo';
    if (room.id === 'bath-2') return 'Misafir Banyo';
    return ROOM_LABELS_TR[room.type] || room.label || 'Oda';
  } else {
    if (room.id === 'master-bed') return 'Master Bedroom';
    if (room.id === 'bed-2') return 'Bedroom 2';
    if (room.id === 'bed-3') return 'Bedroom 3';
    if (room.id === 'bath-1') return 'Main Bathroom';
    if (room.id === 'bath-2') return 'Guest Bathroom';
    return ROOM_LABELS_EN[room.type] || room.label || 'Room';
  }
}

export const CELL_SIZE = 60; // pixels per grid unit
export const PADDING = 40;
export const WALL_THICKNESS = 3.5;
export const DEFAULT_DOOR_SIZE = 24;
export const DEFAULT_WINDOW_SIZE = 28;

export function generateSVG(layout: FloorPlanLayout, lang: 'tr' | 'en' = 'tr'): string {
  const { rooms, gridWidth, gridHeight, scale } = layout;
  const svgWidth = Math.max(gridWidth * CELL_SIZE + PADDING * 2, 600);
  const svgHeight = Math.max(gridHeight * CELL_SIZE + PADDING * 2, 450);

  let svgContent = '';

  // Draw rooms
  for (const room of rooms) {
    const x = room.x * CELL_SIZE + PADDING;
    const y = room.y * CELL_SIZE + PADDING;
    const width = room.w * CELL_SIZE;
    const height = room.h * CELL_SIZE;
    const colors = ROOM_COLORS[room.type] ?? ROOM_COLORS.hallway;
    const areaM2 = (room.w * room.h * scale * scale).toFixed(1);
    const displayLabel = getCleanRoomLabel(room, lang);

    // Room background
    svgContent += `
      <rect
        x="${x}" y="${y}"
        width="${width}" height="${height}"
        fill="${colors.fill}"
        stroke="${colors.stroke}"
        stroke-width="${WALL_THICKNESS}"
        rx="2"
      />`;

    // Doors
    if (room.doors) {
      for (const door of room.doors) {
        svgContent += generateDoorSVG(x, y, width, height, door);
      }
    }

    // Windows
    if (room.windows) {
      for (const win of room.windows) {
        svgContent += generateWindowSVG(x, y, width, height, win);
      }
    }

    // Room label
    const cx = x + width / 2;
    const cy = y + height / 2;

    svgContent += `
      <text
        x="${cx}" y="${cy - 8}"
        text-anchor="middle"
        font-family="Inter, system-ui, sans-serif"
        font-size="11"
        font-weight="600"
        fill="${colors.stroke}"
      >${displayLabel}</text>
      <text
        x="${cx}" y="${cy + 8}"
        text-anchor="middle"
        font-family="Inter, system-ui, sans-serif"
        font-size="9"
        fill="#9CA3AF"
      >${areaM2} m²</text>`;
  }

  // Grid lines (subtle)
  let gridLines = '';
  for (let gx = 0; gx <= gridWidth; gx++) {
    gridLines += `<line x1="${gx * CELL_SIZE + PADDING}" y1="${PADDING}" x2="${gx * CELL_SIZE + PADDING}" y2="${gridHeight * CELL_SIZE + PADDING}" stroke="#E5E7EB" stroke-width="0.5"/>`;
  }
  for (let gy = 0; gy <= gridHeight; gy++) {
    gridLines += `<line x1="${PADDING}" y1="${gy * CELL_SIZE + PADDING}" x2="${gridWidth * CELL_SIZE + PADDING}" y2="${gy * CELL_SIZE + PADDING}" stroke="#E5E7EB" stroke-width="0.5"/>`;
  }

  // Scale indicator
  const scaleBarWidth = CELL_SIZE; // 1 unit
  const scaleLabel = `${scale}m`;
  const scaleX = PADDING;
  const scaleY = svgHeight - 15;
  const scaleBar = `
    <line x1="${scaleX}" y1="${scaleY}" x2="${scaleX + scaleBarWidth}" y2="${scaleY}" stroke="#6B7280" stroke-width="1.5"/>
    <line x1="${scaleX}" y1="${scaleY - 4}" x2="${scaleX}" y2="${scaleY + 4}" stroke="#6B7280" stroke-width="1.5"/>
    <line x1="${scaleX + scaleBarWidth}" y1="${scaleY - 4}" x2="${scaleX + scaleBarWidth}" y2="${scaleY + 4}" stroke="#6B7280" stroke-width="1.5"/>
    <text x="${scaleX + scaleBarWidth / 2}" y="${scaleY - 6}" text-anchor="middle" font-family="Inter, system-ui" font-size="8" fill="#6B7280">${scaleLabel}</text>`;

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${svgWidth} ${svgHeight}"
    width="${svgWidth}"
    height="${svgHeight}"
    style="background: #FAFAFA;"
  >
    <!-- Grid -->
    ${gridLines}
    <!-- Rooms -->
    ${svgContent}
    <!-- Scale -->
    ${scaleBar}
    <!-- Compass -->
    <text x="${svgWidth - PADDING}" y="${PADDING + 10}" text-anchor="middle" font-family="Inter, system-ui" font-size="12" font-weight="bold" fill="#374151">N</text>
    <line x1="${svgWidth - PADDING}" y1="${PADDING + 14}" x2="${svgWidth - PADDING}" y2="${PADDING + 30}" stroke="#374151" stroke-width="1.5" marker-end="url(#arrow)"/>
    <defs>
      <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
        <path d="M0,0 L3,6 L6,0" fill="#374151"/>
      </marker>
    </defs>
  </svg>`;
}

export function generateDoorSVG(
  rx: number, ry: number, rw: number, rh: number,
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
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="white" stroke-width="5"/>
        <path d="M${x1},${ry} A${dSize},${dSize} 0 0,1 ${x1},${ry + dSize}" stroke="#64748B" stroke-width="1.5" fill="none" stroke-dasharray="2,2"/>
        <line x1="${x1}" y1="${ry}" x2="${x1}" y2="${ry + dSize}" stroke="#64748B" stroke-width="1.8"/>`;
    case 'bottom':
      x1 = rx + door.position * rw - dSize / 2;
      y1 = ry + rh;
      x2 = x1 + dSize;
      y2 = ry + rh;
      return `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="white" stroke-width="5"/>
        <path d="M${x1},${ry + rh} A${dSize},${dSize} 0 0,0 ${x1},${ry + rh - dSize}" stroke="#64748B" stroke-width="1.5" fill="none" stroke-dasharray="2,2"/>
        <line x1="${x1}" y1="${ry + rh}" x2="${x1}" y2="${ry + rh - dSize}" stroke="#64748B" stroke-width="1.8"/>`;
    case 'left':
      x1 = rx;
      y1 = ry + door.position * rh - dSize / 2;
      x2 = rx;
      y2 = y1 + dSize;
      return `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="white" stroke-width="5"/>
        <path d="M${rx},${y1} A${dSize},${dSize} 0 0,1 ${rx + dSize},${y1}" stroke="#64748B" stroke-width="1.5" fill="none" stroke-dasharray="2,2"/>
        <line x1="${rx}" y1="${y1}" x2="${rx + dSize}" y2="${y1}" stroke="#64748B" stroke-width="1.8"/>`;
    case 'right':
      x1 = rx + rw;
      y1 = ry + door.position * rh - dSize / 2;
      x2 = rx + rw;
      y2 = y1 + dSize;
      return `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="white" stroke-width="5"/>
        <path d="M${rx + rw},${y1} A${dSize},${dSize} 0 0,0 ${rx + rw - dSize},${y1}" stroke="#64748B" stroke-width="1.5" fill="none" stroke-dasharray="2,2"/>
        <line x1="${rx + rw}" y1="${y1}" x2="${rx + rw - dSize}" y2="${y1}" stroke="#64748B" stroke-width="1.8"/>`;
    default:
      return '';
  }
}

export function generateWindowSVG(
  rx: number, ry: number, rw: number, rh: number,
  win: WindowPlacement
): string {
  const wSize = win.width || DEFAULT_WINDOW_SIZE;
  switch (win.wall) {
    case 'top':
      return `<rect x="${rx + win.position * rw - wSize / 2}" y="${ry - 3}" width="${wSize}" height="6" fill="#BAE6FD" stroke="#0284C7" stroke-width="1.2" rx="1"/>`;
    case 'bottom':
      return `<rect x="${rx + win.position * rw - wSize / 2}" y="${ry + rh - 3}" width="${wSize}" height="6" fill="#BAE6FD" stroke="#0284C7" stroke-width="1.2" rx="1"/>`;
    case 'left':
      return `<rect x="${rx - 3}" y="${ry + win.position * rh - wSize / 2}" width="6" height="${wSize}" fill="#BAE6FD" stroke="#0284C7" stroke-width="1.2" rx="1"/>`;
    case 'right':
      return `<rect x="${rx + rw - 3}" y="${ry + win.position * rh - wSize / 2}" width="6" height="${wSize}" fill="#BAE6FD" stroke="#0284C7" stroke-width="1.2" rx="1"/>`;
    default:
      return '';
  }
}
