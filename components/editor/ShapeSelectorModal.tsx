'use client';

import { useState } from 'react';
import { X, RotateCw, FlipHorizontal2, FlipVertical2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FootprintShape =
  | 'rectangle' | 'l-shape' | 'u-shape' | 't-shape'
  | 'h-shape'   | 'cross'   | 'l-indented' | 'stepped';

export type DoorWall = 'top' | 'right' | 'bottom' | 'left';

export interface ShapeSelection {
  shape: FootprintShape;
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  doorWall: DoorWall;
  doorPosition: number;
  totalArea: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (s: ShapeSelection) => void;
  totalArea: number;
}

// ─── Shape gallery data ──────────────────────────────────────────────────────

const SHAPES: { id: FootprintShape; labelTr: string }[] = [
  { id: 'rectangle',   labelTr: 'Dikdörtgen' },
  { id: 'l-shape',     labelTr: 'L-Şekli' },
  { id: 'u-shape',     labelTr: 'U-Şekli' },
  { id: 't-shape',     labelTr: 'T-Şekli' },
  { id: 'h-shape',     labelTr: 'H-Şekli' },
  { id: 'cross',       labelTr: 'Artı' },
  { id: 'l-indented',  labelTr: 'Girintili L' },
  { id: 'stepped',     labelTr: 'Kademeli' },
];

const ICON_PATHS: Record<FootprintShape, string> = {
  'rectangle':   '2,2 38,2 38,30 2,30',
  'l-shape':     '2,2 20,2 20,14 38,14 38,30 2,30',
  'u-shape':     '2,2 14,2 14,16 26,16 26,2 38,2 38,30 2,30',
  't-shape':     '2,2 38,2 38,12 26,12 26,30 14,30 14,12 2,12',
  'h-shape':     '2,2 14,2 14,12 26,12 26,2 38,2 38,30 26,30 26,20 14,20 14,30 2,30',
  'cross':       '14,2 26,2 26,12 38,12 38,20 26,20 26,30 14,30 14,20 2,20 2,12 14,12',
  'l-indented':  '2,2 26,2 26,12 38,12 38,30 2,30',
  'stepped':     '14,2 26,2 26,10 38,10 38,30 2,30 2,20 14,20',
};

// ─── Geometry ────────────────────────────────────────────────────────────────

const CW = 440;
const CH = 340;
const P  = 50;

interface WallDef {
  id: string;
  x1: number; y1: number; x2: number; y2: number;
  horiz: boolean;
  wall: DoorWall;
  labelOX: number; labelOY: number;
}

interface Geo {
  polygon: string;
  walls: WallDef[];
  guides: { x1: number; y1: number; x2: number; y2: number }[];
  cx: number; cy: number;
}

function buildGeo(shape: FootprintShape, area: number): Geo {
  const W = CW - P * 2, H = CH - P * 2;
  const x = (f: number) => P + f * W;
  const y = (f: number) => P + f * H;
  const sq = Math.sqrt(area);
  const mH = (f: number) => `${(f * sq * 1.3).toFixed(1)} m`;
  const mV = (f: number) => `${(f * sq * 0.9).toFixed(1)} m`;

  function w(id: string, x1: number, y1: number, x2: number, y2: number, wall: DoorWall, ox = 0, oy = 0): WallDef {
    const horiz = wall === 'top' || wall === 'bottom';
    return { id, x1, y1, x2, y2, horiz, wall, labelOX: ox, labelOY: oy };
  }

  switch (shape) {
    case 'rectangle':
      return {
        polygon: `${x(0)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          w('top',    x(0), y(0), x(1), y(0), 'top',    0, -16),
          w('right',  x(1), y(0), x(1), y(1), 'right',  20,  0),
          w('bottom', x(0), y(1), x(1), y(1), 'bottom', 0,  16),
          w('left',   x(0), y(0), x(0), y(1), 'left',  -24,  0),
        ],
        guides: [{ x1: x(.5), y1: 0, x2: x(.5), y2: CH }],
        cx: x(.5), cy: y(.5),
      };

    case 'l-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(.5)},${y(0)} ${x(.5)},${y(.45)} ${x(1)},${y(.45)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          w('top-l',   x(0),   y(0),    x(.5),  y(0),    'top',    0, -16),
          w('inner-v', x(.5),  y(0),    x(.5),  y(.45),  'right',  18,  0),
          w('step-h',  x(.5),  y(.45),  x(1),   y(.45),  'top',    0, -16),
          w('right',   x(1),   y(.45),  x(1),   y(1),    'right',  18,  0),
          w('bottom',  x(0),   y(1),    x(1),   y(1),    'bottom', 0,  16),
          w('left',    x(0),   y(0),    x(0),   y(1),    'left',  -24,  0),
        ],
        guides: [{ x1: x(.5), y1: 0, x2: x(.5), y2: CH }],
        cx: x(.3), cy: y(.72),
      };

    case 'u-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(.32)},${y(0)} ${x(.32)},${y(.5)} ${x(.68)},${y(.5)} ${x(.68)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          w('tl',   x(0),    y(0),   x(.32), y(0),   'top',    0, -16),
          w('wl',   x(.32),  y(0),   x(.32), y(.5),  'right',  18,  0),
          w('br',   x(.32),  y(.5),  x(.68), y(.5),  'bottom', 0,  16),
          w('wr',   x(.68),  y(.5),  x(.68), y(0),   'left',  -18,  0),
          w('tr',   x(.68),  y(0),   x(1),   y(0),   'top',    0, -16),
          w('right',x(1),    y(0),   x(1),   y(1),   'right',  18,  0),
          w('bot',  x(0),    y(1),   x(1),   y(1),   'bottom', 0,  16),
          w('left', x(0),    y(0),   x(0),   y(1),   'left',  -24,  0),
        ],
        guides: [{ x1: x(.5), y1: 0, x2: x(.5), y2: CH }],
        cx: x(.5), cy: y(.78),
      };

    case 't-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(.38)} ${x(.65)},${y(.38)} ${x(.65)},${y(1)} ${x(.35)},${y(1)} ${x(.35)},${y(.38)} ${x(0)},${y(.38)}`,
        walls: [
          w('top',    x(0),   y(0),   x(1),   y(0),   'top',    0, -16),
          w('rt',     x(1),   y(0),   x(1),   y(.38), 'right',  18,  0),
          w('sr',     x(.65), y(.38), x(1),   y(.38), 'bottom', 0,  16),
          w('svr',    x(.65), y(.38), x(.65), y(1),   'right',  18,  0),
          w('bot',    x(.35), y(1),   x(.65), y(1),   'bottom', 0,  16),
          w('svl',    x(.35), y(.38), x(.35), y(1),   'left',  -18,  0),
          w('sl',     x(0),   y(.38), x(.35), y(.38), 'bottom', 0,  16),
          w('lt',     x(0),   y(0),   x(0),   y(.38), 'left',  -24,  0),
        ],
        guides: [{ x1: x(.5), y1: 0, x2: x(.5), y2: CH }],
        cx: x(.5), cy: y(.18),
      };

    case 'h-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(.35)},${y(0)} ${x(.35)},${y(.36)} ${x(.65)},${y(.36)} ${x(.65)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(.65)},${y(1)} ${x(.65)},${y(.64)} ${x(.35)},${y(.64)} ${x(.35)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          w('tl',  x(0),   y(0),    x(.35),  y(0),    'top',    0, -16),
          w('tr',  x(.65), y(0),    x(1),    y(0),    'top',    0, -16),
          w('r',   x(1),   y(0),    x(1),    y(1),    'right',  18,  0),
          w('br',  x(.65), y(1),    x(1),    y(1),    'bottom', 0,  16),
          w('bl',  x(0),   y(1),    x(.35),  y(1),    'bottom', 0,  16),
          w('l',   x(0),   y(0),    x(0),    y(1),    'left',  -24,  0),
          w('bt',  x(.35), y(.36),  x(.65),  y(.36),  'top',    0, -12),
          w('bb',  x(.35), y(.64),  x(.65),  y(.64),  'bottom', 0,  12),
          w('ilt', x(.35), y(0),    x(.35),  y(.36),  'right',  14,  0),
          w('irt', x(.65), y(0),    x(.65),  y(.36),  'left',  -16,  0),
          w('ilb', x(.35), y(.64),  x(.35),  y(1),    'right',  14,  0),
          w('irb', x(.65), y(.64),  x(.65),  y(1),    'left',  -16,  0),
        ],
        guides: [
          { x1: x(.5), y1: 0, x2: x(.5), y2: CH },
          { x1: 0, y1: y(.5), x2: CW, y2: y(.5) },
        ],
        cx: x(.17), cy: y(.5),
      };

    case 'cross':
      return {
        polygon: `${x(.32)},${y(0)} ${x(.68)},${y(0)} ${x(.68)},${y(.32)} ${x(1)},${y(.32)} ${x(1)},${y(.68)} ${x(.68)},${y(.68)} ${x(.68)},${y(1)} ${x(.32)},${y(1)} ${x(.32)},${y(.68)} ${x(0)},${y(.68)} ${x(0)},${y(.32)} ${x(.32)},${y(.32)}`,
        walls: [
          w('top',  x(.32),y(0),   x(.68),y(0),   'top',    0, -16),
          w('tr-v', x(.68),y(0),   x(.68),y(.32), 'right',  16,  0),
          w('tr-h', x(.68),y(.32), x(1),  y(.32), 'top',    0, -13),
          w('r',    x(1),  y(.32), x(1),  y(.68), 'right',  18,  0),
          w('br-h', x(.68),y(.68), x(1),  y(.68), 'bottom', 0,  13),
          w('br-v', x(.68),y(.68), x(.68),y(1),   'right',  16,  0),
          w('bot',  x(.32),y(1),   x(.68),y(1),   'bottom', 0,  16),
          w('bl-v', x(.32),y(.68), x(.32),y(1),   'left',  -16,  0),
          w('bl-h', x(0),  y(.68), x(.32),y(.68), 'bottom', 0,  13),
          w('l',    x(0),  y(.32), x(0),  y(.68), 'left',  -24,  0),
          w('tl-h', x(0),  y(.32), x(.32),y(.32), 'top',    0, -13),
          w('tl-v', x(.32),y(0),   x(.32),y(.32), 'left',  -16,  0),
        ],
        guides: [
          { x1: x(.5), y1: 0, x2: x(.5), y2: CH },
          { x1: 0, y1: y(.5), x2: CW, y2: y(.5) },
        ],
        cx: x(.5), cy: y(.5),
      };

    case 'l-indented':
      return {
        polygon: `${x(0)},${y(0)} ${x(.62)},${y(0)} ${x(.62)},${y(.38)} ${x(1)},${y(.38)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          w('tl',  x(0),   y(0),   x(.62), y(0),   'top',    0, -16),
          w('sv',  x(.62), y(0),   x(.62), y(.38), 'right',  18,  0),
          w('sh',  x(.62), y(.38), x(1),   y(.38), 'top',    0, -16),
          w('r',   x(1),   y(.38), x(1),   y(1),   'right',  18,  0),
          w('bot', x(0),   y(1),   x(1),   y(1),   'bottom', 0,  16),
          w('l',   x(0),   y(0),   x(0),   y(1),   'left',  -24,  0),
        ],
        guides: [{ x1: x(.62), y1: 0, x2: x(.62), y2: CH }],
        cx: x(.38), cy: y(.68),
      };

    case 'stepped':
      return {
        polygon: `${x(0)},${y(.33)} ${x(.33)},${y(.33)} ${x(.33)},${y(0)} ${x(.66)},${y(0)} ${x(.66)},${y(.33)} ${x(1)},${y(.33)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        walls: [
          w('top-m',  x(.33),y(0),   x(.66),y(0),   'top',    0, -16),
          w('srv',    x(.66),y(0),   x(.66),y(.33),  'right',  16,  0),
          w('srh',    x(.66),y(.33), x(1),  y(.33),  'top',    0, -13),
          w('r',      x(1),  y(.33), x(1),  y(1),    'right',  18,  0),
          w('bot',    x(0),  y(1),   x(1),  y(1),    'bottom', 0,  16),
          w('l',      x(0),  y(.33), x(0),  y(1),    'left',  -24,  0),
          w('slh',    x(0),  y(.33), x(.33),y(.33),  'bottom', 0,  13),
          w('slv',    x(.33),y(.33), x(.33),y(0),    'left',  -16,  0),
        ],
        guides: [
          { x1: x(.33), y1: 0, x2: x(.33), y2: CH },
          { x1: x(.66), y1: 0, x2: x(.66), y2: CH },
        ],
        cx: x(.55), cy: y(.7),
      };
  }
}

function wallLabel(wall: WallDef, area: number): string {
  const sq = Math.sqrt(area);
  if (wall.horiz) {
    const frac = Math.abs(wall.x2 - wall.x1) / (CW - P * 2);
    return `${(frac * sq * 1.3).toFixed(1)} m`;
  } else {
    const frac = Math.abs(wall.y2 - wall.y1) / (CH - P * 2);
    return `${(frac * sq * 0.9).toFixed(1)} m`;
  }
}

// ─── Door position helper ────────────────────────────────────────────────────

function getDoorXY(walls: WallDef[], doorWall: DoorWall, pos: number) {
  const candidates = walls.filter(w => w.wall === doorWall);
  if (!candidates.length) return null;
  // pick longest
  const wall = candidates.reduce((a, b) => {
    const la = Math.abs(a.x2 - a.x1) + Math.abs(a.y2 - a.y1);
    const lb = Math.abs(b.x2 - b.x1) + Math.abs(b.y2 - b.y1);
    return la >= lb ? a : b;
  });
  return {
    x: wall.x1 + (wall.x2 - wall.x1) * pos,
    y: wall.y1 + (wall.y2 - wall.y1) * pos,
    horiz: wall.horiz,
  };
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ShapeSelectorModal({ isOpen, onClose, onConfirm, totalArea }: Props) {
  const [shape, setShape] = useState<FootprintShape>('h-shape');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [doorWall, setDoorWall] = useState<DoorWall>('bottom');
  const [doorPos, setDoorPos] = useState(0.5);
  const [hoveredWall, setHoveredWall] = useState<string | null>(null);

  const geo = buildGeo(shape, totalArea);

  // SVG group transform
  const cx = CW / 2, cy = CH / 2;
  const tfParts: string[] = [];
  if (rotation !== 0) tfParts.push(`rotate(${rotation} ${cx} ${cy})`);
  if (flipH) tfParts.push(`translate(${CW} 0) scale(-1 1)`);
  if (flipV) tfParts.push(`translate(0 ${CH}) scale(1 -1)`);
  const tf = tfParts.join(' ') || undefined;

  const door = getDoorXY(geo.walls, doorWall, doorPos);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col" style={{ width: 580 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Şekil Seçin</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas */}
        <div className="relative mx-4 mt-4 rounded-xl border border-gray-200 overflow-hidden" style={{ background: '#f8f9fb' }}>
          <svg width={CW} height={CH} className="block" style={{ background: '#f8f9fb' }}>
            <defs>
              <pattern id="sdots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#d1d5db" />
              </pattern>
            </defs>
            <rect width={CW} height={CH} fill="url(#sdots)" />

            {/* Guide lines */}
            {geo.guides.map((g, i) => (
              <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
                stroke="#3b82f6" strokeWidth={1} strokeDasharray="5,5" opacity={0.3} />
            ))}

            <g transform={tf}>
              {/* Shape fill */}
              <polygon points={geo.polygon} fill="white" stroke="none" />

              {/* Clickable walls */}
              {geo.walls.map(wall => {
                const hovered = hoveredWall === wall.id;
                const isDoor = wall.wall === doorWall;
                return (
                  <g key={wall.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredWall(wall.id)}
                    onMouseLeave={() => setHoveredWall(null)}
                    onClick={() => {
                      setDoorWall(wall.wall);
                      setDoorPos(0.5);
                    }}
                  >
                    {/* Thick invisible hit zone */}
                    <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
                      stroke="transparent" strokeWidth={24} />
                    {/* Visible wall line */}
                    <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
                      stroke={hovered ? '#2563eb' : isDoor ? '#1e40af' : '#1d4ed8'}
                      strokeWidth={hovered ? 5 : isDoor ? 3.5 : 2.5}
                      strokeLinecap="round"
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Midpoint grip pill */}
                    {(() => {
                      const mx = (wall.x1 + wall.x2) / 2;
                      const my = (wall.y1 + wall.y2) / 2;
                      return (
                        <g transform={`translate(${mx},${my})`} style={{ pointerEvents: 'none' }}>
                          {wall.horiz ? (
                            <>
                              <rect x={-16} y={-5} width={32} height={10} rx={5}
                                fill={hovered ? '#2563eb' : '#dbeafe'} stroke="#1d4ed8" strokeWidth={1} />
                              {[-6, 0, 6].map(dx => (
                                <line key={dx} x1={dx} y1={-3} x2={dx} y2={3}
                                  stroke={hovered ? 'white' : '#1d4ed8'} strokeWidth={1.3} />
                              ))}
                            </>
                          ) : (
                            <>
                              <rect x={-5} y={-16} width={10} height={32} rx={5}
                                fill={hovered ? '#2563eb' : '#dbeafe'} stroke="#1d4ed8" strokeWidth={1} />
                              {[-6, 0, 6].map(dy => (
                                <line key={dy} x1={-3} y1={dy} x2={3} y2={dy}
                                  stroke={hovered ? 'white' : '#1d4ed8'} strokeWidth={1.3} />
                              ))}
                            </>
                          )}
                        </g>
                      );
                    })()}
                    {/* Measurement label */}
                    <text
                      x={(wall.x1 + wall.x2) / 2 + wall.labelOX}
                      y={(wall.y1 + wall.y2) / 2 + wall.labelOY}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="10.5" fontWeight="700" fill={hovered ? '#1e3a8a' : '#1d4ed8'}
                      fontFamily="Inter, system-ui, sans-serif"
                      style={{ pointerEvents: 'none' }}
                    >
                      {wallLabel(wall, totalArea)}
                    </text>
                  </g>
                );
              })}

              {/* Living area label */}
              <text x={geo.cx} y={geo.cy - 9} textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fill="#6b7280" fontFamily="Inter, system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
                Yaşam alanı
              </text>
              <text x={geo.cx} y={geo.cy + 9} textAnchor="middle" dominantBaseline="middle"
                fontSize="14" fontWeight="700" fill="#1d4ed8" fontFamily="Inter, system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
                {totalArea} m²
              </text>

              {/* Door element */}
              {door && (
                <g style={{ pointerEvents: 'none' }}>
                  {door.horiz ? (
                    <>
                      <rect x={door.x - 15} y={door.y - 4} width={30} height={8} fill="#1e3a8a" rx={2} />
                      <path d={`M${door.x - 15},${door.y} a15,15 0 0,${door.y < CH / 2 ? '0' : '1'} 15,15`}
                        fill="none" stroke="#1e3a8a" strokeWidth={1.5} strokeDasharray="3,2" />
                    </>
                  ) : (
                    <>
                      <rect x={door.x - 4} y={door.y - 15} width={8} height={30} fill="#1e3a8a" rx={2} />
                      <path d={`M${door.x},${door.y - 15} a15,15 0 0,${door.x < CW / 2 ? '1' : '0'} 15,15`}
                        fill="none" stroke="#1e3a8a" strokeWidth={1.5} strokeDasharray="3,2" />
                    </>
                  )}
                  <text
                    x={door.horiz ? door.x : door.x + 22}
                    y={door.horiz ? door.y + 22 : door.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="9" fill="#1e3a8a" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
                    Ön kapı
                  </text>
                </g>
              )}

              {/* Hover tooltip */}
              {hoveredWall && (
                <g>
                  <rect x={CW / 2 - 95} y={CH - 26} width={190} height={20} rx={10} fill="#1e3a8a" opacity={0.9} />
                  <text x={CW / 2} y={CH - 14} textAnchor="middle" dominantBaseline="middle"
                    fontSize="9.5" fontWeight="500" fill="white" fontFamily="Inter, system-ui, sans-serif"
                    style={{ pointerEvents: 'none' }}>
                    Tıkla → Kapıyı bu duvara taşı
                  </text>
                </g>
              )}
            </g>
          </svg>

          {/* Right toolbar */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {[
              { icon: <RotateCw className="w-4 h-4" />, label: 'Döndür 90°', onClick: () => setRotation(r => ((r + 90) % 360) as 0|90|180|270), active: rotation !== 0 },
              { icon: <FlipHorizontal2 className="w-4 h-4" />, label: 'Yatay Aynala', onClick: () => setFlipH(v => !v), active: flipH },
              { icon: <FlipVertical2 className="w-4 h-4" />, label: 'Dikey Aynala', onClick: () => setFlipV(v => !v), active: flipV },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} title={btn.label}
                className={cn('w-9 h-9 rounded-full border bg-white flex items-center justify-center shadow-sm transition-all',
                  btn.active ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600')}>
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Door position slider + wall selector */}
        <div className="mx-4 mt-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-800">🚪 Ön Kapı Konumu</span>
            <div className="flex gap-1">
              {(['top','right','bottom','left'] as DoorWall[]).map(dw => (
                <button key={dw} onClick={() => { setDoorWall(dw); setDoorPos(0.5); }}
                  className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all border',
                    doorWall === dw ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50')}>
                  {dw === 'top' ? '↑ Üst' : dw === 'bottom' ? '↓ Alt' : dw === 'left' ? '← Sol' : '→ Sağ'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-blue-600 font-medium w-16">Sol / Üst</span>
            <input type="range" min={8} max={92} value={Math.round(doorPos * 100)}
              onChange={e => setDoorPos(Number(e.target.value) / 100)}
              className="flex-1 accent-blue-600 h-1.5" />
            <span className="text-[10px] text-blue-600 font-medium w-16 text-right">Sağ / Alt</span>
          </div>
          <p className="text-[10px] text-blue-500 mt-1.5">💡 Duvara tıklayarak kapıyı o duvara taşıyabilirsiniz</p>
        </div>

        {/* Shape gallery */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-8 gap-1.5">
            {SHAPES.map(s => (
              <button key={s.id} onClick={() => { setShape(s.id); setDoorPos(0.5); }} title={s.labelTr}
                className={cn('flex items-center justify-center p-2 rounded-xl border-2 transition-all',
                  shape === s.id ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50')}>
                <svg viewBox="0 0 40 32" width={34} height={26}>
                  <polygon points={ICON_PATHS[s.id]}
                    fill={shape === s.id ? '#1d4ed8' : '#ffffff'}
                    stroke={shape === s.id ? '#1d4ed8' : '#9ca3af'} strokeWidth={1.5} />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            İptal etmek
          </button>
          <button
            onClick={() => { onConfirm({ shape, rotation, flipH, flipV, doorWall, doorPosition: doorPos, totalArea }); onClose(); }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm">
            Bu şekli kullanın
          </button>
        </div>
      </div>
    </div>
  );
}
