'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, RotateCw, FlipHorizontal2, FlipVertical2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FootprintShape =
  | 'rectangle'
  | 'l-shape'
  | 'u-shape'
  | 't-shape'
  | 'h-shape'
  | 'cross'
  | 'l-indented'
  | 'stepped';

export type DoorWall = 'top' | 'right' | 'bottom' | 'left';

export interface ShapeSelection {
  shape: FootprintShape;
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  doorWall: DoorWall;
  doorPosition: number;   // 0..1 along the wall
  totalArea: number;
}

interface ShapeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: ShapeSelection) => void;
  totalArea: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 440;
const CANVAS_H = 340;
const PAD = 52;

// ─── Shape Gallery ──────────────────────────────────────────────────────────

interface ShapeInfo { id: FootprintShape; labelTr: string; }
const SHAPES: ShapeInfo[] = [
  { id: 'rectangle',  labelTr: 'Dikdörtgen' },
  { id: 'l-shape',    labelTr: 'L-Şekli' },
  { id: 'u-shape',    labelTr: 'U-Şekli' },
  { id: 't-shape',    labelTr: 'T-Şekli' },
  { id: 'h-shape',    labelTr: 'H-Şekli' },
  { id: 'cross',      labelTr: 'Artı' },
  { id: 'l-indented', labelTr: 'Girintili L' },
  { id: 'stepped',    labelTr: 'Kademeli' },
];

// ─── Geometry Engine ──────────────────────────────────────────────────────────

interface WallSegment {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  isHoriz: boolean;
  labelX: number; labelY: number;
  lengthM: string;
}

interface ShapeGeo {
  polygon: string;
  walls: WallSegment[];
  guideLines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  centerX: number;
  centerY: number;
}

function makeGeo(shape: FootprintShape, totalArea: number): ShapeGeo {
  const W = CANVAS_W - PAD * 2;
  const H = CANVAS_H - PAD * 2;
  const ox = PAD, oy = PAD;
  const x = (f: number) => ox + f * W;
  const y = (f: number) => oy + f * H;
  const sqrtA = Math.sqrt(totalArea);
  const mH = (f: number) => `${(f * sqrtA * 1.3).toFixed(2)} m`;
  const mV = (f: number) => `${(f * sqrtA * 0.9).toFixed(2)} m`;

  function seg(id: string, x1: number, y1: number, x2: number, y2: number, isHoriz: boolean, oX = 0, oY = 0): WallSegment {
    return { id, x1, y1, x2, y2, isHoriz,
      labelX: (x1 + x2) / 2 + oX, labelY: (y1 + y2) / 2 + oY,
      lengthM: isHoriz ? mH(Math.abs(x2 - x1) / W) : mV(Math.abs(y2 - y1) / H) };
  }

  switch (shape) {
    case 'rectangle':
      return {
        polygon: `${x(0)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          seg('top',    x(0), y(0), x(1), y(0), true,  0, -14),
          seg('right',  x(1), y(0), x(1), y(1), false, 18, 0),
          seg('bottom', x(0), y(1), x(1), y(1), true,  0, 14),
          seg('left',   x(0), y(0), x(0), y(1), false,-22, 0),
        ],
        guideLines: [{ x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H }],
        centerX: x(0.5), centerY: y(0.5),
      };

    case 'l-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(0.5)},${y(0)} ${x(0.5)},${y(0.45)} ${x(1)},${y(0.45)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          seg('top-l',      x(0), y(0), x(0.5), y(0), true,  0, -14),
          seg('inner-v',    x(0.5), y(0), x(0.5), y(0.45), false, 16, 0),
          seg('top-r',      x(0.5), y(0.45), x(1), y(0.45), true, 0, -14),
          seg('right',      x(1), y(0.45), x(1), y(1), false, 18, 0),
          seg('bottom',     x(0), y(1), x(1), y(1), true, 0, 14),
          seg('left',       x(0), y(0), x(0), y(1), false,-22, 0),
        ],
        guideLines: [{ x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H }],
        centerX: x(0.3), centerY: y(0.72),
      };

    case 'u-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(0.32)},${y(0)} ${x(0.32)},${y(0.5)} ${x(0.68)},${y(0.5)} ${x(0.68)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          seg('top-l',  x(0), y(0), x(0.32), y(0), true, 0, -14),
          seg('wing-l', x(0.32), y(0), x(0.32), y(0.5), false, 16, 0),
          seg('bridge', x(0.32), y(0.5), x(0.68), y(0.5), true, 0, 14),
          seg('wing-r', x(0.68), y(0.5), x(0.68), y(0), false,-18, 0),
          seg('top-r',  x(0.68), y(0), x(1), y(0), true, 0, -14),
          seg('right',  x(1), y(0), x(1), y(1), false, 18, 0),
          seg('bottom', x(0), y(1), x(1), y(1), true, 0, 14),
          seg('left',   x(0), y(0), x(0), y(1), false,-22, 0),
        ],
        guideLines: [{ x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H }],
        centerX: x(0.5), centerY: y(0.78),
      };

    case 't-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(0.38)} ${x(0.65)},${y(0.38)} ${x(0.65)},${y(1)} ${x(0.35)},${y(1)} ${x(0.35)},${y(0.38)} ${x(0)},${y(0.38)}`,
        walls: [
          seg('top',      x(0), y(0), x(1), y(0), true, 0, -14),
          seg('right-t',  x(1), y(0), x(1), y(0.38), false, 18, 0),
          seg('step-r',   x(0.65), y(0.38), x(1), y(0.38), true, 0, -12),
          seg('stem-r',   x(0.65), y(0.38), x(0.65), y(1), false, 18, 0),
          seg('bottom',   x(0.35), y(1), x(0.65), y(1), true, 0, 14),
          seg('stem-l',   x(0.35), y(0.38), x(0.35), y(1), false,-18, 0),
          seg('step-l',   x(0), y(0.38), x(0.35), y(0.38), true, 0, -12),
          seg('left-t',   x(0), y(0), x(0), y(0.38), false,-22, 0),
        ],
        guideLines: [{ x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H }],
        centerX: x(0.5), centerY: y(0.18),
      };

    case 'h-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(0.35)},${y(0)} ${x(0.35)},${y(0.36)} ${x(0.65)},${y(0.36)} ${x(0.65)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(0.65)},${y(1)} ${x(0.65)},${y(0.64)} ${x(0.35)},${y(0.64)} ${x(0.35)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          seg('top-l',    x(0), y(0), x(0.35), y(0), true, 0, -14),
          seg('top-r',    x(0.65), y(0), x(1), y(0), true, 0, -14),
          seg('right',    x(1), y(0), x(1), y(1), false, 18, 0),
          seg('bot-r',    x(0.65), y(1), x(1), y(1), true, 0, 14),
          seg('bot-l',    x(0), y(1), x(0.35), y(1), true, 0, 14),
          seg('left',     x(0), y(0), x(0), y(1), false,-22, 0),
          seg('bridge-t', x(0.35), y(0.36), x(0.65), y(0.36), true, 0, -10),
          seg('bridge-b', x(0.35), y(0.64), x(0.65), y(0.64), true, 0, 12),
          seg('il-t',     x(0.35), y(0), x(0.35), y(0.36), false, 16, 0),
          seg('ir-t',     x(0.65), y(0), x(0.65), y(0.36), false,-18, 0),
          seg('il-b',     x(0.35), y(0.64), x(0.35), y(1), false, 16, 0),
          seg('ir-b',     x(0.65), y(0.64), x(0.65), y(1), false,-18, 0),
        ],
        guideLines: [
          { x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H },
          { x1: 0, y1: y(0.5), x2: CANVAS_W, y2: y(0.5) },
        ],
        centerX: x(0.175), centerY: y(0.5),
      };

    case 'cross':
      return {
        polygon: `${x(0.32)},${y(0)} ${x(0.68)},${y(0)} ${x(0.68)},${y(0.32)} ${x(1)},${y(0.32)} ${x(1)},${y(0.68)} ${x(0.68)},${y(0.68)} ${x(0.68)},${y(1)} ${x(0.32)},${y(1)} ${x(0.32)},${y(0.68)} ${x(0)},${y(0.68)} ${x(0)},${y(0.32)} ${x(0.32)},${y(0.32)}`,
        walls: [
          seg('top',   x(0.32), y(0), x(0.68), y(0), true, 0, -14),
          seg('rt',    x(0.68), y(0), x(0.68), y(0.32), false, 16, 0),
          seg('top-r', x(0.68), y(0.32), x(1), y(0.32), true, 0, -12),
          seg('right', x(1), y(0.32), x(1), y(0.68), false, 18, 0),
          seg('bot-r', x(0.68), y(0.68), x(1), y(0.68), true, 0, 12),
          seg('rb',    x(0.68), y(0.68), x(0.68), y(1), false, 16, 0),
          seg('bottom',x(0.32), y(1), x(0.68), y(1), true, 0, 14),
          seg('lb',    x(0.32), y(0.68), x(0.32), y(1), false,-16, 0),
          seg('bot-l', x(0), y(0.68), x(0.32), y(0.68), true, 0, 12),
          seg('left',  x(0), y(0.32), x(0), y(0.68), false,-22, 0),
          seg('top-l', x(0), y(0.32), x(0.32), y(0.32), true, 0, -12),
          seg('lt',    x(0.32), y(0), x(0.32), y(0.32), false,-16, 0),
        ],
        guideLines: [
          { x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H },
          { x1: 0, y1: y(0.5), x2: CANVAS_W, y2: y(0.5) },
        ],
        centerX: x(0.5), centerY: y(0.5),
      };

    case 'l-indented':
      return {
        polygon: `${x(0)},${y(0)} ${x(0.62)},${y(0)} ${x(0.62)},${y(0.38)} ${x(1)},${y(0.38)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          seg('top-l',   x(0), y(0), x(0.62), y(0), true, 0, -14),
          seg('step-v',  x(0.62), y(0), x(0.62), y(0.38), false, 16, 0),
          seg('step-h',  x(0.62), y(0.38), x(1), y(0.38), true, 0, -14),
          seg('right',   x(1), y(0.38), x(1), y(1), false, 18, 0),
          seg('bottom',  x(0), y(1), x(1), y(1), true, 0, 14),
          seg('left',    x(0), y(0), x(0), y(1), false,-22, 0),
        ],
        guideLines: [{ x1: x(0.62), y1: 0, x2: x(0.62), y2: CANVAS_H }],
        centerX: x(0.38), centerY: y(0.68),
      };

    case 'stepped':
      return {
        polygon: `${x(0)},${y(0.33)} ${x(0.33)},${y(0.33)} ${x(0.33)},${y(0)} ${x(0.66)},${y(0)} ${x(0.66)},${y(0.33)} ${x(1)},${y(0.33)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          seg('top-mid',  x(0.33), y(0), x(0.66), y(0), true, 0, -14),
          seg('step-r-v', x(0.66), y(0), x(0.66), y(0.33), false, 16, 0),
          seg('step-r-h', x(0.66), y(0.33), x(1), y(0.33), true, 0, -12),
          seg('right',    x(1), y(0.33), x(1), y(1), false, 18, 0),
          seg('bottom',   x(0), y(1), x(1), y(1), true, 0, 14),
          seg('left',     x(0), y(0.33), x(0), y(1), false,-22, 0),
          seg('step-l-h', x(0), y(0.33), x(0.33), y(0.33), true, 0, -12),
          seg('step-l-v', x(0.33), y(0.33), x(0.33), y(0), false,-16, 0),
        ],
        guideLines: [
          { x1: x(0.33), y1: 0, x2: x(0.33), y2: CANVAS_H },
          { x1: x(0.66), y1: 0, x2: x(0.66), y2: CANVAS_H },
        ],
        centerX: x(0.55), centerY: y(0.7),
      };

    default:
      return makeGeo('rectangle', totalArea);
  }
}

// ─── Mini Icon SVGs ──────────────────────────────────────────────────────────

const ICON_PATHS: Record<FootprintShape, string> = {
  'rectangle':  '2,2 38,2 38,30 2,30',
  'l-shape':    '2,2 20,2 20,14 38,14 38,30 2,30',
  'u-shape':    '2,2 14,2 14,16 26,16 26,2 38,2 38,30 2,30',
  't-shape':    '2,2 38,2 38,12 26,12 26,30 14,30 14,12 2,12',
  'h-shape':    '2,2 14,2 14,12 26,12 26,2 38,2 38,30 26,30 26,20 14,20 14,30 2,30',
  'cross':      '14,2 26,2 26,12 38,12 38,20 26,20 26,30 14,30 14,20 2,20 2,12 14,12',
  'l-indented': '2,2 26,2 26,12 38,12 38,30 2,30',
  'stepped':    '14,2 26,2 26,10 38,10 38,30 2,30 2,20 14,20',
};

function ShapeIcon({ shape, selected }: { shape: FootprintShape; selected: boolean }) {
  return (
    <svg viewBox="0 0 40 32" width={36} height={28}>
      <polygon points={ICON_PATHS[shape]} fill={selected ? '#1d4ed8' : '#ffffff'} stroke={selected ? '#1d4ed8' : '#9ca3af'} strokeWidth={1.5} />
    </svg>
  );
}

// ─── Door on wall computed position ──────────────────────────────────────────

function computeDoorPos(geo: ShapeGeo, doorWall: DoorWall, doorPosition: number) {
  // Find the longest wall matching doorWall orientation
  const isHorizDoor = doorWall === 'top' || doorWall === 'bottom';
  const candidates = geo.walls.filter(w => w.isHoriz === isHorizDoor);
  if (candidates.length === 0) return null;
  // Pick the longest matching wall
  const wall = candidates.reduce((a, b) =>
    Math.abs(a.x2 - a.x1) + Math.abs(a.y2 - a.y1) > Math.abs(b.x2 - b.x1) + Math.abs(b.y2 - b.y1) ? a : b);
  const dx = wall.isHoriz ? doorPosition : 0;
  const dy = wall.isHoriz ? 0 : doorPosition;
  return {
    x: wall.x1 + (wall.x2 - wall.x1) * dx + (wall.isHoriz ? 0 : 0),
    y: wall.y1 + (wall.y2 - wall.y1) * dy,
    isHoriz: wall.isHoriz,
    wallX1: wall.x1, wallY1: wall.y1, wallX2: wall.x2, wallY2: wall.y2,
  };
}

// ─── Modal Component ──────────────────────────────────────────────────────────

export default function ShapeSelectorModal({ isOpen, onClose, onConfirm, totalArea }: ShapeSelectorModalProps) {
  const [selectedShape, setSelectedShape] = useState<FootprintShape>('h-shape');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [doorWall, setDoorWall] = useState<DoorWall>('bottom');
  const [doorPosition, setDoorPosition] = useState(0.5);

  // Interactive drag state
  const [hoveredWall, setHoveredWall] = useState<string | null>(null);
  const [draggingDoor, setDraggingDoor] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; pos: number } | null>(null);

  const geo = makeGeo(selectedShape, totalArea);

  // SVG transform from flip/rotation
  const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
  const transforms: string[] = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation} ${cx} ${cy})`);
  if (flipH) transforms.push(`translate(${CANVAS_W} 0) scale(-1 1)`);
  if (flipV) transforms.push(`translate(0 ${CANVAS_H}) scale(1 -1)`);
  const svgTransform = transforms.join(' ') || undefined;

  // Door position info
  const doorInfo = computeDoorPos(geo, doorWall, doorPosition);

  // Pointer handlers for wall hover & door drag
  const handleSVGPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (draggingDoor && dragStartRef.current && doorInfo) {
      // Move door position along its wall
      const wallLen = doorInfo.isHoriz
        ? doorInfo.wallX2 - doorInfo.wallX1
        : doorInfo.wallY2 - doorInfo.wallY1;
      const delta = doorInfo.isHoriz
        ? (mx - dragStartRef.current.x) / wallLen
        : (my - dragStartRef.current.y) / wallLen;
      const newPos = Math.max(0.08, Math.min(0.92, dragStartRef.current.pos + delta));
      setDoorPosition(newPos);
    }
  }, [draggingDoor, doorInfo]);

  const handleSVGPointerUp = useCallback(() => {
    setDraggingDoor(false);
    dragStartRef.current = null;
  }, []);

  const handleDoorPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX - (svgRef.current?.getBoundingClientRect().left ?? 0), y: e.clientY - (svgRef.current?.getBoundingClientRect().top ?? 0), pos: doorPosition };
    setDraggingDoor(true);
  }, [doorPosition]);

  // Reset door position when shape changes
  useEffect(() => {
    setDoorPosition(0.5);
  }, [selectedShape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 580, maxHeight: '96vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Şekil Seçin</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
        </div>

        {/* Canvas */}
        <div className="relative flex-shrink-0 mx-4 mt-4 rounded-xl border border-gray-200 overflow-hidden select-none" style={{ background: '#f8f9fb' }}>
          <svg
            ref={svgRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="block"
            style={{ background: '#f8f9fb', cursor: draggingDoor ? 'grabbing' : 'default' }}
            onPointerMove={handleSVGPointerMove}
            onPointerUp={handleSVGPointerUp}
            onPointerLeave={handleSVGPointerUp}
          >
            <defs>
              <pattern id="sg-dots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#d1d5db" />
              </pattern>
            </defs>
            <rect width={CANVAS_W} height={CANVAS_H} fill="url(#sg-dots)" />

            {/* Guide lines */}
            {geo.guideLines.map((gl, i) => (
              <line key={i} x1={gl.x1} y1={gl.y1} x2={gl.x2} y2={gl.y2}
                stroke="#3b82f6" strokeWidth={1} strokeDasharray="5,5" opacity={0.35} />
            ))}

            {/* All shape + handles transformed */}
            <g transform={svgTransform}>
              {/* Shape polygon */}
              <polygon points={geo.polygon} fill="white" stroke="#1d4ed8" strokeWidth={2.5} />

              {/* Interactive wall segments — hover for highlight, click to set door wall */}
              {geo.walls.map(wall => {
                const isHovered = hoveredWall === wall.id;
                return (
                  <g key={wall.id}>
                    {/* Invisible wide hit area */}
                    <line
                      x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
                      stroke="transparent" strokeWidth={20}
                      style={{ cursor: 'pointer' }}
                      onPointerEnter={() => setHoveredWall(wall.id)}
                      onPointerLeave={() => setHoveredWall(null)}
                      onClick={() => {
                        const w: DoorWall = wall.isHoriz
                          ? (wall.y1 < CANVAS_H / 2 ? 'top' : 'bottom')
                          : (wall.x1 < CANVAS_W / 2 ? 'left' : 'right');
                        setDoorWall(w);
                        setDoorPosition(0.5);
                      }}
                    />
                    {/* Visible wall — highlights on hover */}
                    <line
                      x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
                      stroke={isHovered ? '#2563eb' : '#1d4ed8'}
                      strokeWidth={isHovered ? 4 : 2.5}
                      className="pointer-events-none"
                    />
                    {/* Midpoint grip bar */}
                    <g transform={`translate(${(wall.x1 + wall.x2) / 2}, ${(wall.y1 + wall.y2) / 2})`} className="pointer-events-none">
                      {wall.isHoriz ? (
                        <>
                          <rect x={-14} y={-4} width={28} height={8} rx={4} fill={isHovered ? '#2563eb' : '#dbeafe'} stroke="#1d4ed8" strokeWidth={1.2} />
                          <line x1={-5} y1={-2.5} x2={-5} y2={2.5} stroke={isHovered ? 'white' : '#1d4ed8'} strokeWidth={1.2} />
                          <line x1={0}  y1={-2.5} x2={0}  y2={2.5} stroke={isHovered ? 'white' : '#1d4ed8'} strokeWidth={1.2} />
                          <line x1={5}  y1={-2.5} x2={5}  y2={2.5} stroke={isHovered ? 'white' : '#1d4ed8'} strokeWidth={1.2} />
                        </>
                      ) : (
                        <>
                          <rect x={-4} y={-14} width={8} height={28} rx={4} fill={isHovered ? '#2563eb' : '#dbeafe'} stroke="#1d4ed8" strokeWidth={1.2} />
                          <line x1={-2.5} y1={-5} x2={2.5} y2={-5} stroke={isHovered ? 'white' : '#1d4ed8'} strokeWidth={1.2} />
                          <line x1={-2.5} y1={0}  x2={2.5} y2={0}  stroke={isHovered ? 'white' : '#1d4ed8'} strokeWidth={1.2} />
                          <line x1={-2.5} y1={5}  x2={2.5} y2={5}  stroke={isHovered ? 'white' : '#1d4ed8'} strokeWidth={1.2} />
                        </>
                      )}
                    </g>
                    {/* Measurement label */}
                    <text x={wall.labelX} y={wall.labelY} textAnchor="middle" dominantBaseline="middle"
                      fontSize="10" fontWeight="600" fill="#1d4ed8" fontFamily="Inter, system-ui, sans-serif"
                      className="pointer-events-none">
                      {wall.lengthM}
                    </text>
                  </g>
                );
              })}

              {/* Living area badge */}
              <text x={geo.centerX} y={geo.centerY - 9} textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fill="#6b7280" fontFamily="Inter, system-ui, sans-serif" className="pointer-events-none">
                Yaşam alanı
              </text>
              <text x={geo.centerX} y={geo.centerY + 9} textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontWeight="700" fill="#1d4ed8" fontFamily="Inter, system-ui, sans-serif" className="pointer-events-none">
                {totalArea} m²
              </text>

              {/* Door — draggable */}
              {doorInfo && (
                <g
                  style={{ cursor: draggingDoor ? 'grabbing' : 'grab' }}
                  onPointerDown={handleDoorPointerDown}
                >
                  {/* Door swing arc */}
                  {doorInfo.isHoriz ? (
                    <>
                      <rect x={doorInfo.x - 14} y={doorInfo.y - 4} width={28} height={8} fill="#1e3a8a" rx={2} />
                      <path d={`M${doorInfo.x - 14},${doorInfo.y} A14,14 0 0,1 ${doorInfo.x - 14},${doorInfo.y + 14}`}
                        fill="none" stroke="#1e3a8a" strokeWidth={1.5} strokeDasharray="3,2" />
                    </>
                  ) : (
                    <>
                      <rect x={doorInfo.x - 4} y={doorInfo.y - 14} width={8} height={28} fill="#1e3a8a" rx={2} />
                      <path d={`M${doorInfo.x},${doorInfo.y - 14} A14,14 0 0,1 ${doorInfo.x + 14},${doorInfo.y - 14}`}
                        fill="none" stroke="#1e3a8a" strokeWidth={1.5} strokeDasharray="3,2" />
                    </>
                  )}
                  {/* Door label */}
                  <text
                    x={doorInfo.x + (doorInfo.isHoriz ? 0 : 22)}
                    y={doorInfo.y + (doorInfo.isHoriz ? 22 : 0)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="9" fill="#374151" fontFamily="Inter, system-ui, sans-serif">
                    Front door
                  </text>
                  {/* Drag handle circle */}
                  <circle cx={doorInfo.x} cy={doorInfo.y} r={5} fill="#60a5fa" stroke="#1d4ed8" strokeWidth={1.5} opacity={0.85} />
                </g>
              )}
            </g>

            {/* Helper tooltip */}
            {hoveredWall && (
              <rect x={CANVAS_W / 2 - 88} y={CANVAS_H - 24} width={176} height={20} rx={10} fill="#1e3a8a" opacity={0.85} />
            )}
            {hoveredWall && (
              <text x={CANVAS_W / 2} y={CANVAS_H - 12} textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="600" fill="white" fontFamily="Inter, system-ui, sans-serif">
                Tıkla → Kapıyı bu duvara taşı · Kapıyı sürükle
              </text>
            )}
          </svg>

          {/* Right toolbar */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {[
              { icon: <RotateCw className="w-4 h-4" />, label: 'Döndür', onClick: () => setRotation(r => ((r + 90) % 360) as 0 | 90 | 180 | 270), active: rotation !== 0 },
              { icon: <FlipHorizontal2 className="w-4 h-4" />, label: 'Yatay Aynala', onClick: () => setFlipH(v => !v), active: flipH },
              { icon: <FlipVertical2 className="w-4 h-4" />, label: 'Dikey Aynala', onClick: () => setFlipV(v => !v), active: flipV },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} title={btn.label}
                className={cn('w-9 h-9 rounded-full border bg-white flex items-center justify-center shadow-sm transition-all hover:border-blue-400 hover:text-blue-600',
                  btn.active ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500')}>
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Location row */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 mx-4 mt-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Yer:</span>
            <span className="text-blue-600 font-medium underline underline-offset-2">Ön kapı</span>
            <select value={doorWall} onChange={e => { setDoorWall(e.target.value as DoorWall); setDoorPosition(0.5); }}
              className="border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-600 bg-white">
              <option value="bottom">Alt Cephe</option>
              <option value="top">Üst Cephe</option>
              <option value="left">Sol Cephe</option>
              <option value="right">Sağ Cephe</option>
            </select>
          </div>
          <span className="text-xs text-gray-500 font-medium">Duvar Kalınlığı: 15&rdquo;</span>
        </div>

        {/* Shape gallery */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-8 gap-1.5">
            {SHAPES.map(s => (
              <button key={s.id} onClick={() => setSelectedShape(s.id)} title={s.labelTr}
                className={cn('flex items-center justify-center p-2 rounded-xl border-2 transition-all',
                  selectedShape === s.id ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50')}>
                <ShapeIcon shape={s.id} selected={selectedShape === s.id} />
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">💡 Duvar üzerine gel → kapı duvarı değiştir &nbsp;·&nbsp; Kapıyı sürükle → konumlandır</p>
          <div className="flex gap-3 flex-shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              İptal etmek
            </button>
            <button
              onClick={() => { onConfirm({ shape: selectedShape, rotation, flipH, flipV, doorWall, doorPosition, totalArea }); onClose(); }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Bu şekli kullanın
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
