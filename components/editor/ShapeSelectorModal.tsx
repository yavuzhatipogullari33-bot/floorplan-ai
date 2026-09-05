'use client';

import { useState, useCallback } from 'react';
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
  totalArea: number;
}

interface ShapeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: ShapeSelection) => void;
  totalArea: number;
}

// ─── Shape Gallery ──────────────────────────────────────────────────────────

interface ShapeInfo {
  id: FootprintShape;
  labelTr: string;
}

const SHAPES: ShapeInfo[] = [
  { id: 'rectangle', labelTr: 'Dikdörtgen' },
  { id: 'l-shape',   labelTr: 'L-Şekli' },
  { id: 'u-shape',   labelTr: 'U-Şekli' },
  { id: 't-shape',   labelTr: 'T-Şekli' },
  { id: 'h-shape',   labelTr: 'H-Şekli' },
  { id: 'cross',     labelTr: 'Artı' },
  { id: 'l-indented',labelTr: 'Girintili L' },
  { id: 'stepped',   labelTr: 'Kademeli' },
];

// ─── Geometry ─────────────────────────────────────────────────────────────────

const CANVAS_W = 440;
const CANVAS_H = 340;
const PAD = 50;

interface ShapeGeometry {
  polygon: string;
  labels: Array<{ x: number; y: number; text: string }>;
  guideLines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  doorX: number;
  doorY: number;
  doorIsHoriz: boolean;
  centerX: number;
  centerY: number;
}

function makeGeo(shape: FootprintShape, totalArea: number): ShapeGeometry {
  const W = CANVAS_W - PAD * 2;
  const H = CANVAS_H - PAD * 2;
  const ox = PAD, oy = PAD;
  const x = (f: number) => ox + f * W;
  const y = (f: number) => oy + f * H;

  // Estimate actual side lengths for labels
  const sqrtA = Math.sqrt(totalArea);
  const mH = (f: number) => `${(f * sqrtA * 1.3).toFixed(2)} m`;
  const mV = (f: number) => `${(f * sqrtA * 0.9).toFixed(2)} m`;

  switch (shape) {
    case 'rectangle':
      return {
        polygon: `${x(0)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        labels: [
          { x: x(0.5), y: y(0)-13, text: mH(1) },
          { x: x(1)+22, y: y(0.5), text: mV(1) },
          { x: x(0.5), y: y(1)+13, text: mH(1) },
          { x: x(0)-22, y: y(0.5), text: mV(1) },
        ],
        guideLines: [{ x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H }],
        doorX: x(0.5), doorY: y(1), doorIsHoriz: true,
        centerX: x(0.5), centerY: y(0.5),
      };

    case 'l-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(0.5)},${y(0)} ${x(0.5)},${y(0.45)} ${x(1)},${y(0.45)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        labels: [
          { x: x(0.25), y: y(0)-13, text: mH(0.5) },
          { x: x(0.5)+16, y: y(0.22), text: mV(0.45) },
          { x: x(0.75), y: y(0.45)-13, text: mH(0.5) },
          { x: x(1)+22, y: y(0.72), text: mV(0.55) },
          { x: x(0.5), y: y(1)+13, text: mH(1) },
          { x: x(0)-22, y: y(0.5), text: mV(1) },
        ],
        guideLines: [{ x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H }],
        doorX: x(0.75), doorY: y(1), doorIsHoriz: true,
        centerX: x(0.3), centerY: y(0.72),
      };

    case 'u-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(0.32)},${y(0)} ${x(0.32)},${y(0.5)} ${x(0.68)},${y(0.5)} ${x(0.68)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        labels: [
          { x: x(0.16), y: y(0)-13, text: mH(0.32) },
          { x: x(0.32)+16, y: y(0.25), text: mV(0.5) },
          { x: x(0.5), y: y(0.5)+14, text: mH(0.36) },
          { x: x(0.68)+16, y: y(0.25), text: mV(0.5) },
          { x: x(0.84), y: y(0)-13, text: mH(0.32) },
          { x: x(1)+22, y: y(0.5), text: mV(1) },
          { x: x(0.5), y: y(1)+13, text: mH(1) },
          { x: x(0)-22, y: y(0.5), text: mV(1) },
        ],
        guideLines: [{ x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H }],
        doorX: x(0.5), doorY: y(1), doorIsHoriz: true,
        centerX: x(0.5), centerY: y(0.78),
      };

    case 't-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(0.38)} ${x(0.65)},${y(0.38)} ${x(0.65)},${y(1)} ${x(0.35)},${y(1)} ${x(0.35)},${y(0.38)} ${x(0)},${y(0.38)}`,
        labels: [
          { x: x(0.5), y: y(0)-13, text: mH(1) },
          { x: x(1)+22, y: y(0.19), text: mV(0.38) },
          { x: x(0.65)+16, y: y(0.69), text: mV(0.62) },
          { x: x(0.5), y: y(1)+13, text: mH(0.3) },
          { x: x(0.35)-16, y: y(0.69), text: mV(0.62) },
          { x: x(0)-22, y: y(0.19), text: mV(0.38) },
        ],
        guideLines: [{ x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H }],
        doorX: x(0.5), doorY: y(1), doorIsHoriz: true,
        centerX: x(0.5), centerY: y(0.18),
      };

    case 'h-shape':
      return {
        polygon: `${x(0)},${y(0)} ${x(0.35)},${y(0)} ${x(0.35)},${y(0.36)} ${x(0.65)},${y(0.36)} ${x(0.65)},${y(0)} ${x(1)},${y(0)} ${x(1)},${y(1)} ${x(0.65)},${y(1)} ${x(0.65)},${y(0.64)} ${x(0.35)},${y(0.64)} ${x(0.35)},${y(1)} ${x(0)},${y(1)}`,
        labels: [
          { x: x(0.175), y: y(0)-13, text: mH(0.35) },
          { x: x(0.825), y: y(0)-13, text: mH(0.35) },
          { x: x(1)+22, y: y(0.5), text: mV(1) },
          { x: x(0.825), y: y(1)+13, text: mH(0.35) },
          { x: x(0.175), y: y(1)+13, text: mH(0.35) },
          { x: x(0)-22, y: y(0.5), text: mV(1) },
          { x: x(0.5), y: y(0.5), text: mH(0.3) },
        ],
        guideLines: [
          { x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H },
          { x1: 0, y1: y(0.5), x2: CANVAS_W, y2: y(0.5) },
        ],
        doorX: x(0.83), doorY: y(1), doorIsHoriz: true,
        centerX: x(0.175), centerY: y(0.5),
      };

    case 'cross':
      return {
        polygon: `${x(0.32)},${y(0)} ${x(0.68)},${y(0)} ${x(0.68)},${y(0.32)} ${x(1)},${y(0.32)} ${x(1)},${y(0.68)} ${x(0.68)},${y(0.68)} ${x(0.68)},${y(1)} ${x(0.32)},${y(1)} ${x(0.32)},${y(0.68)} ${x(0)},${y(0.68)} ${x(0)},${y(0.32)} ${x(0.32)},${y(0.32)}`,
        labels: [
          { x: x(0.5), y: y(0)-13, text: mH(0.36) },
          { x: x(1)+22, y: y(0.5), text: mV(0.36) },
          { x: x(0.5), y: y(1)+13, text: mH(0.36) },
          { x: x(0)-22, y: y(0.5), text: mV(0.36) },
          { x: x(0.84), y: y(0.32)-13, text: mH(0.32) },
          { x: x(0.16), y: y(0.68)+13, text: mH(0.32) },
        ],
        guideLines: [
          { x1: x(0.5), y1: 0, x2: x(0.5), y2: CANVAS_H },
          { x1: 0, y1: y(0.5), x2: CANVAS_W, y2: y(0.5) },
        ],
        doorX: x(0.5), doorY: y(1), doorIsHoriz: true,
        centerX: x(0.5), centerY: y(0.5),
      };

    case 'l-indented':
      return {
        polygon: `${x(0)},${y(0)} ${x(0.62)},${y(0)} ${x(0.62)},${y(0.38)} ${x(1)},${y(0.38)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        labels: [
          { x: x(0.31), y: y(0)-13, text: mH(0.62) },
          { x: x(0.62)+16, y: y(0.19), text: mV(0.38) },
          { x: x(0.81), y: y(0.38)-13, text: mH(0.38) },
          { x: x(1)+22, y: y(0.69), text: mV(0.62) },
          { x: x(0.5), y: y(1)+13, text: mH(1) },
          { x: x(0)-22, y: y(0.5), text: mV(1) },
        ],
        guideLines: [{ x1: x(0.62), y1: 0, x2: x(0.62), y2: CANVAS_H }],
        doorX: x(0.8), doorY: y(1), doorIsHoriz: true,
        centerX: x(0.38), centerY: y(0.68),
      };

    case 'stepped':
      return {
        polygon: `${x(0)},${y(0.33)} ${x(0.33)},${y(0.33)} ${x(0.33)},${y(0)} ${x(0.66)},${y(0)} ${x(0.66)},${y(0.33)} ${x(1)},${y(0.33)} ${x(1)},${y(1)} ${x(0)},${y(1)}`,
        labels: [
          { x: x(0.495), y: y(0)-13, text: mH(0.33) },
          { x: x(0.66)+16, y: y(0.165), text: mV(0.33) },
          { x: x(0.83), y: y(0.33)-13, text: mH(0.34) },
          { x: x(1)+22, y: y(0.665), text: mV(0.67) },
          { x: x(0.5), y: y(1)+13, text: mH(1) },
          { x: x(0)-22, y: y(0.665), text: mV(0.67) },
          { x: x(0.165), y: y(0.33)-13, text: mH(0.33) },
          { x: x(0.33)-16, y: y(0.165), text: mV(0.33) },
        ],
        guideLines: [
          { x1: x(0.33), y1: 0, x2: x(0.33), y2: CANVAS_H },
          { x1: x(0.66), y1: 0, x2: x(0.66), y2: CANVAS_H },
        ],
        doorX: x(0.5), doorY: y(1), doorIsHoriz: true,
        centerX: x(0.55), centerY: y(0.7),
      };

    default:
      return makeGeo('rectangle', totalArea);
  }
}

// ─── Mini Icon SVGs ──────────────────────────────────────────────────────────

const ICON_PATHS: Record<FootprintShape, string> = {
  'rectangle': '2,2 38,2 38,30 2,30',
  'l-shape':   '2,2 20,2 20,14 38,14 38,30 2,30',
  'u-shape':   '2,2 14,2 14,16 26,16 26,2 38,2 38,30 2,30',
  't-shape':   '2,2 38,2 38,12 26,12 26,30 14,30 14,12 2,12',
  'h-shape':   '2,2 14,2 14,12 26,12 26,2 38,2 38,30 26,30 26,20 14,20 14,30 2,30',
  'cross':     '14,2 26,2 26,12 38,12 38,20 26,20 26,30 14,30 14,20 2,20 2,12 14,12',
  'l-indented':'2,2 26,2 26,12 38,12 38,30 2,30',
  'stepped':   '14,2 26,2 26,10 38,10 38,30 2,30 2,20 14,20',
};

function ShapeIcon({ shape, selected }: { shape: FootprintShape; selected: boolean }) {
  return (
    <svg viewBox="0 0 40 32" width={36} height={28} className="block">
      <polygon
        points={ICON_PATHS[shape]}
        fill={selected ? '#1d4ed8' : '#ffffff'}
        stroke={selected ? '#1d4ed8' : '#9ca3af'}
        strokeWidth={1.5}
      />
    </svg>
  );
}

// ─── Modal Component ──────────────────────────────────────────────────────────

export default function ShapeSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  totalArea,
}: ShapeSelectorModalProps) {
  const [selectedShape, setSelectedShape] = useState<FootprintShape>('h-shape');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [doorWall, setDoorWall] = useState<DoorWall>('bottom');

  const handleRotate = useCallback(() => {
    setRotation((r) => ((r + 90) % 360) as 0 | 90 | 180 | 270);
  }, []);

  const geo = makeGeo(selectedShape, totalArea);

  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  let svgTransform = '';
  const parts: string[] = [];
  if (rotation !== 0) parts.push(`rotate(${rotation} ${cx} ${cy})`);
  if (flipH) parts.push(`translate(${CANVAS_W} 0) scale(-1 1)`);
  if (flipV) parts.push(`translate(0 ${CANVAS_H}) scale(1 -1)`);
  svgTransform = parts.join(' ');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 580, maxHeight: '96vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Şekil Seçin</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas */}
        <div className="relative flex-shrink-0 mx-4 mt-4 rounded-xl border border-gray-200 overflow-hidden" style={{ background: '#f8f9fb' }}>
          <svg width={CANVAS_W} height={CANVAS_H} className="block" style={{ background: '#f8f9fb' }}>
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

            {/* Shape + labels group with transform */}
            <g transform={svgTransform || undefined}>
              {/* Shape polygon */}
              <polygon
                points={geo.polygon}
                fill="white"
                stroke="#1d4ed8"
                strokeWidth={2.5}
              />

              {/* Measurement labels */}
              {geo.labels.map((lbl, i) => (
                <text key={i} x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fontWeight="600" fill="#1d4ed8" fontFamily="Inter, system-ui, sans-serif">
                  {lbl.text}
                </text>
              ))}

              {/* Living area badge */}
              <text x={geo.centerX} y={geo.centerY - 8} textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fill="#6b7280" fontFamily="Inter, system-ui, sans-serif">
                Yaşam alanı
              </text>
              <text x={geo.centerX} y={geo.centerY + 9} textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontWeight="700" fill="#1d4ed8" fontFamily="Inter, system-ui, sans-serif">
                {totalArea} m²
              </text>

              {/* Front door */}
              <rect
                x={geo.doorX - (geo.doorIsHoriz ? 12 : 4)}
                y={geo.doorY - (geo.doorIsHoriz ? 3 : 12)}
                width={geo.doorIsHoriz ? 24 : 8}
                height={geo.doorIsHoriz ? 7 : 24}
                fill="#1e3a8a" rx={1}
              />
              <text x={geo.doorX} y={geo.doorY + (geo.doorIsHoriz ? 16 : 0) + 6}
                textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#374151"
                fontFamily="Inter, system-ui, sans-serif">
                Front door
              </text>
            </g>
          </svg>

          {/* Right toolbar */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {[
              { icon: <RotateCw className="w-4 h-4" />, label: 'Döndür', onClick: handleRotate, active: rotation !== 0 },
              { icon: <FlipHorizontal2 className="w-4 h-4" />, label: 'Yatay Aynala', onClick: () => setFlipH(v => !v), active: flipH },
              { icon: <FlipVertical2 className="w-4 h-4" />, label: 'Dikey Aynala', onClick: () => setFlipV(v => !v), active: flipV },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} title={btn.label}
                className={cn(
                  'w-9 h-9 rounded-full border bg-white flex items-center justify-center shadow-sm transition-all hover:border-blue-400 hover:text-blue-600',
                  btn.active ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500'
                )}>
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Location row */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 mx-4 mt-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Yer:</span>
            <button
              onClick={() => setDoorWall('bottom')}
              className={cn(
                'font-medium transition-colors',
                doorWall === 'bottom' ? 'text-blue-700 underline underline-offset-2' : 'text-blue-500 hover:text-blue-700'
              )}>
              Ön kapı
            </button>
            <select
              value={doorWall}
              onChange={e => setDoorWall(e.target.value as DoorWall)}
              className="border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-600 bg-white">
              <option value="bottom">Garaj (Alt)</option>
              <option value="top">Arka (Üst)</option>
              <option value="left">Dış mekan Sol</option>
              <option value="right">Dış mekan Sağ</option>
            </select>
          </div>
          <span className="text-xs text-gray-500 font-medium">Patlatmak: 6&ldquo;</span>
        </div>

        {/* Shape gallery */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-8 gap-1.5">
            {SHAPES.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedShape(s.id)}
                title={s.labelTr}
                className={cn(
                  'flex items-center justify-center p-2 rounded-xl border-2 transition-all',
                  selectedShape === s.id
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                )}>
                <ShapeIcon shape={s.id} selected={selectedShape === s.id} />
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            İptal etmek
          </button>
          <button
            onClick={() => { onConfirm({ shape: selectedShape, rotation, flipH, flipV, doorWall, totalArea }); onClose(); }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            Bu şekli kullanın
          </button>
        </div>
      </div>
    </div>
  );
}
