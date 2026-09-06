'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Home,
  Trash2,
  Maximize2,
  DoorOpen,
  AppWindow,
  RotateCw,
  Lock,
  Unlock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  FloorPlanLayout,
  FloorLevel,
  RoomLayout,
  DoorPlacement,
  WindowPlacement,
  generateSVG,
  getCleanRoomLabel,
  calculateRoomArea,
  getActiveFloor,
  setActiveFloor,
  updateFloorRooms,
  ROOM_COLORS,
  CELL_SIZE,
  PADDING,
  WALL_THICKNESS,
  DEFAULT_DOOR_SIZE,
  DEFAULT_WINDOW_SIZE,
} from '@/lib/svg-generator';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface FloorPlanCanvasProps {
  svgData: string | null;
  layout: FloorPlanLayout | null;
  isGenerating: boolean;
  onLayoutChange?: (newLayout: FloorPlanLayout, newSvg: string) => void;
}

type DragMode =
  | 'pan'
  | 'move-room'
  | 'resize-wall'
  | 'drag-door'
  | 'resize-door'
  | 'drag-window'
  | 'resize-window';

interface DragState {
  mode: DragMode;
  roomId: string;
  wall?: 'top' | 'right' | 'bottom' | 'left' | 'nw' | 'ne' | 'se' | 'sw';
  itemIndex?: number;
  startX: number;
  startY: number;
  initialRoom: RoomLayout;
  initialAllRooms: RoomLayout[];
  initialDoor?: DoorPlacement;
  initialWindow?: WindowPlacement;
}

export interface DragFeedback {
  active: boolean;
  wall?: string;
  currentLengthM: string;
  currentLengthCm?: string;
  deltaM: string;
  deltaCm?: string;
  roomLabel: string;
  roomAreaM2: string;
  neighborLabel?: string;
  neighborAreaM2?: string;
  isShared: boolean;
  hudX: number;
  hudY: number;
  guideline?: {
    orientation: 'vertical' | 'horizontal';
    val: number;
  };
  laserRay?: {
    angle: number;
    label: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  nodeMerged?: boolean;
  nodeMergePos?: {
    x: number;
    y: number;
    label: string;
  };
  dimensionLine?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label: string;
    w1: [number, number, number, number];
    w2: [number, number, number, number];
  };
}

/**
 * Shared wall detection between rooms.
 * Identifies any rooms sharing a specific wall boundary with a target room.
 */
export function findSharedWallNeighbors(
  target: RoomLayout,
  wall: 'top' | 'right' | 'bottom' | 'left',
  allRooms: RoomLayout[],
  epsilon = 0.35
): RoomLayout[] {
  const tLeft = target.x;
  const tRight = target.x + target.w;
  const tTop = target.y;
  const tBottom = target.y + target.h;

  const intervalsOverlap = (a1: number, a2: number, b1: number, b2: number) => {
    return Math.max(a1, b1) < Math.min(a2, b2) - 0.05;
  };

  return allRooms.filter((r) => {
    if (r.id === target.id) return false;
    const rLeft = r.x;
    const rRight = r.x + r.w;
    const rTop = r.y;
    const rBottom = r.y + r.h;

    if (wall === 'right') {
      return Math.abs(rLeft - tRight) < epsilon && intervalsOverlap(tTop, tBottom, rTop, rBottom);
    }
    if (wall === 'left') {
      return Math.abs(rRight - tLeft) < epsilon && intervalsOverlap(tTop, tBottom, rTop, rBottom);
    }
    if (wall === 'bottom') {
      return Math.abs(rTop - tBottom) < epsilon && intervalsOverlap(tLeft, tRight, rLeft, rRight);
    }
    if (wall === 'top') {
      return Math.abs(rBottom - tTop) < epsilon && intervalsOverlap(tLeft, tRight, rLeft, rRight);
    }
    return false;
  });
}

// Pure React JSX Renderers
function RenderDoorVisual({
  rx,
  ry,
  rw,
  rh,
  door,
}: {
  rx: number;
  ry: number;
  rw: number;
  rh: number;
  door: DoorPlacement;
}) {
  const dSize = door.width || DEFAULT_DOOR_SIZE;
  let x1 = 0,
    y1 = 0,
    x2 = 0,
    y2 = 0,
    pathD = '',
    lineD = { x1: 0, y1: 0, x2: 0, y2: 0 };

  switch (door.wall) {
    case 'top':
      x1 = rx + door.position * rw - dSize / 2;
      y1 = ry;
      x2 = x1 + dSize;
      y2 = ry;
      pathD = `M${x1},${ry} A${dSize},${dSize} 0 0,1 ${x1},${ry + dSize}`;
      lineD = { x1: x1, y1: ry, x2: x1, y2: ry + dSize };
      break;
    case 'bottom':
      x1 = rx + door.position * rw - dSize / 2;
      y1 = ry + rh;
      x2 = x1 + dSize;
      y2 = ry + rh;
      pathD = `M${x1},${ry + rh} A${dSize},${dSize} 0 0,0 ${x1},${ry + rh - dSize}`;
      lineD = { x1: x1, y1: ry + rh, x2: x1, y2: ry + rh - dSize };
      break;
    case 'left':
      x1 = rx;
      y1 = ry + door.position * rh - dSize / 2;
      x2 = rx;
      y2 = y1 + dSize;
      pathD = `M${rx},${y1} A${dSize},${dSize} 0 0,1 ${rx + dSize},${y1}`;
      lineD = { x1: rx, y1: y1, x2: rx + dSize, y2: y1 };
      break;
    case 'right':
      x1 = rx + rw;
      y1 = ry + door.position * rh - dSize / 2;
      x2 = rx + rw;
      y2 = y1 + dSize;
      pathD = `M${rx + rw},${y1} A${dSize},${dSize} 0 0,0 ${rx + rw - dSize},${y1}`;
      lineD = { x1: rx + rw, y1: y1, x2: rx + rw - dSize, y2: y1 };
      break;
  }

  return (
    <g className="pointer-events-none">
      {/* Cut wall gap */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFFFFF" strokeWidth={WALL_THICKNESS + 3} />
      {/* Swing arc */}
      <path d={pathD} stroke="#10B981" strokeWidth={1.5} fill="none" strokeDasharray="3,3" />
      {/* Door panel */}
      <line
        x1={lineD.x1}
        y1={lineD.y1}
        x2={lineD.x2}
        y2={lineD.y2}
        stroke="#047857"
        strokeWidth={2.5}
      />
    </g>
  );
}

function RenderWindowVisual({
  rx,
  ry,
  rw,
  rh,
  win,
}: {
  rx: number;
  ry: number;
  rw: number;
  rh: number;
  win: WindowPlacement;
}) {
  const wSize = win.width || DEFAULT_WINDOW_SIZE;
  let wx = 0,
    wy = 0,
    ww = 0,
    wh = 0;

  switch (win.wall) {
    case 'top':
      wx = rx + win.position * rw - wSize / 2;
      wy = ry - 4;
      ww = wSize;
      wh = 8;
      break;
    case 'bottom':
      wx = rx + win.position * rw - wSize / 2;
      wy = ry + rh - 4;
      ww = wSize;
      wh = 8;
      break;
    case 'left':
      wx = rx - 4;
      wy = ry + win.position * rh - wSize / 2;
      ww = 8;
      wh = wSize;
      break;
    case 'right':
      wx = rx + rw - 4;
      wy = ry + win.position * rh - wSize / 2;
      ww = 8;
      wh = wSize;
      break;
  }

  return (
    <g className="pointer-events-none">
      <rect
        x={wx}
        y={wy}
        width={ww}
        height={wh}
        fill="#E0F2FE"
        stroke="#0284C7"
        strokeWidth={1.8}
        rx={1.5}
      />
      {/* Glass line reflection */}
      <line
        x1={ww > wh ? wx + 2 : wx + ww / 2}
        y1={ww > wh ? wy + wh / 2 : wy + 2}
        x2={ww > wh ? wx + ww - 2 : wx + ww / 2}
        y2={ww > wh ? wy + wh / 2 : wy + wh - 2}
        stroke="#0284C7"
        strokeWidth={1}
      />
    </g>
  );
}

export default function FloorPlanCanvas({
  svgData,
  layout,
  isGenerating,
  onLayoutChange,
}: FloorPlanCanvasProps) {
  const { t, language } = useLanguage();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Ultra-fluid local rooms state during dragging for 60fps responsiveness
  const [localRooms, setLocalRooms] = useState<RoomLayout[]>(layout?.rooms || []);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragFeedback, setDragFeedback] = useState<DragFeedback | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Sync localRooms when parent layout changes (if not dragging)
  useEffect(() => {
    if (!dragStateRef.current && layout?.rooms) {
      setLocalRooms(layout.rooms);
    }
  }, [layout]);

  // Keep selectedRoomId valid
  useEffect(() => {
    if (selectedRoomId && !localRooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(null);
    }
  }, [localRooms, selectedRoomId]);

  const selectedRoom = localRooms.find((r) => r.id === selectedRoomId) || null;

  // AI Refinement State
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState<string | null>(null);

  function toggleLockSelectedRoom() {
    if (!selectedRoom) return;
    const updated = localRooms.map((r) =>
      r.id === selectedRoom.id ? { ...r, locked: !r.locked } : r
    );
    setLocalRooms(updated);
    commitLayoutChange(updated);
  }

  async function handleQuickRefine(promptText?: string) {
    const text = promptText || refinePrompt.trim();
    if (!text || isRefining || !layout) return;

    setIsRefining(true);
    setRefineFeedback(null);

    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: text,
          currentLayout: { ...layout, rooms: localRooms },
          projectId: layout && 'id' in layout ? (layout as any).id : undefined,
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Refine failed');
      }

      if (data.layout) {
        setLocalRooms(data.layout.rooms);
        if (onLayoutChange) {
          onLayoutChange(data.layout, data.svg);
        }
        setRefineFeedback(data.reply || (language === 'tr' ? 'Plan başarıyla güncellendi.' : 'Plan refined.'));
        setRefinePrompt('');
        setTimeout(() => setRefineFeedback(null), 5000);
      }
    } catch (err) {
      setRefineFeedback(language === 'tr' ? 'İyileştirme uygulanamadı.' : 'Refinement could not be applied.');
      setTimeout(() => setRefineFeedback(null), 4000);
    } finally {
      setIsRefining(false);
    }
  }

  // Zoom / Pan helpers
  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(3, Math.max(0.3, z * delta)));
  }

  // Multi-floor Ghost Trace State
  const [showGhostTrace, setShowGhostTrace] = useState(true);

  function handleSwitchFloor(targetLevel: number) {
    if (!layout) return;
    const currentFloors = layout.floors || [
      {
        level: 0,
        name: 'Zemin Kat',
        elevation: 0.0,
        rooms: layout.rooms || [],
        totalArea: layout.totalArea,
      },
    ];
    const targetFloor = currentFloors.find((f) => f.level === targetLevel) || currentFloors[0];

    const updatedLayout: FloorPlanLayout = {
      ...layout,
      activeLevel: targetLevel,
      rooms: targetFloor.rooms,
      totalArea: targetFloor.totalArea || layout.totalArea,
      floors: currentFloors,
    };

    const lowerFloor = currentFloors.find((f) => f.level === targetLevel - 1);
    const newSvg = generateSVG(updatedLayout, language, {
      ghostRooms: lowerFloor?.rooms,
      showGhostTrace,
      activeLevel: targetLevel,
      floorName: targetFloor.name,
      elevation: targetFloor.elevation,
    });

    setLocalRooms(targetFloor.rooms);
    setSelectedRoomId(null);
    if (onLayoutChange) {
      onLayoutChange(updatedLayout, newSvg);
    }
  }

  // Calculate & commit final layout to parent
  const commitLayoutChange = useCallback(
    (roomsToCommit: RoomLayout[]) => {
      if (!layout) return;

      let maxGridX = 10;
      let maxGridY = 8;
      for (const r of roomsToCommit) {
        if (r.x + r.w > maxGridX) maxGridX = r.x + r.w;
        if (r.y + r.h > maxGridY) maxGridY = r.y + r.h;
      }

      const scale = layout.scale || 1.2;
      const totalArea = Math.round(
        roomsToCommit.reduce((acc, r) => acc + r.w * r.h * scale * scale, 0)
      );

      const activeLvl = layout.activeLevel ?? 0;
      const updatedWithFloors = updateFloorRooms(
        {
          ...layout,
          gridWidth: Math.max(layout.gridWidth, maxGridX),
          gridHeight: Math.max(layout.gridHeight, maxGridY),
          totalArea,
        },
        activeLvl,
        roomsToCommit
      );

      const lowerFloor = updatedWithFloors.floors?.find((f) => f.level === activeLvl - 1);
      const newSvg = generateSVG(updatedWithFloors, language, {
        ghostRooms: lowerFloor?.rooms,
        showGhostTrace,
        activeLevel: activeLvl,
      });

      if (onLayoutChange) {
        onLayoutChange(updatedWithFloors, newSvg);
      }
    },
    [layout, onLayoutChange, language, showGhostTrace]
  );

  // Global Pointer Events for seamless 60FPS drag
  useEffect(() => {
    function handleGlobalPointerMove(e: PointerEvent) {
      const state = dragStateRef.current;
      if (!state) return;

      const deltaPixelX = (e.clientX - state.startX) / zoom;
      const deltaPixelY = (e.clientY - state.startY) / zoom;
      const deltaGridX = deltaPixelX / CELL_SIZE; // continuous smooth float
      const deltaGridY = deltaPixelY / CELL_SIZE;

      // 1. PAN CANVAS (via middle click or background drag)
      if (state.mode === 'pan') {
        setPan({
          x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
          y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
        });
        return;
      }

      const initial = state.initialRoom;
      if (!initial || !state.initialAllRooms) return;

      const scale = layout?.scale || 1.2;
      const SNAP_15CM = 0.15 / scale; // 15 cm magnetic node snapping threshold

      // --- LASER / ORTHO SNAP CALCULATION (0°, 45°, 90°) ---
      let effDeltaGridX = deltaGridX;
      let effDeltaGridY = deltaGridY;
      let laserGuide: DragFeedback['laserRay'] = undefined;

      const deltaAbsX = Math.abs(deltaGridX);
      const deltaAbsY = Math.abs(deltaGridY);
      if (deltaAbsX > 0.15 || deltaAbsY > 0.15) {
        const rad = Math.atan2(deltaAbsY, deltaAbsX);
        const deg = rad * (180 / Math.PI); // 0 to 90 degrees
        const ANGLE_SNAP_TOLERANCE = 8.0;

        if (deg <= ANGLE_SNAP_TOLERANCE) {
          // 0° ORTHO (Horizontal Lock)
          effDeltaGridY = 0;
          const py = initial.y * CELL_SIZE + PADDING + (initial.h * CELL_SIZE) / 2;
          laserGuide = {
            angle: 0,
            label: '0° ORTHO',
            x1: 0,
            y1: py,
            x2: svgWidth,
            y2: py,
          };
        } else if (deg >= 90 - ANGLE_SNAP_TOLERANCE) {
          // 90° ORTHO (Vertical Lock)
          effDeltaGridX = 0;
          const px = initial.x * CELL_SIZE + PADDING + (initial.w * CELL_SIZE) / 2;
          laserGuide = {
            angle: 90,
            label: '90° ORTHO',
            x1: px,
            y1: 0,
            x2: px,
            y2: svgHeight,
          };
        } else if (Math.abs(deg - 45) <= 6.0) {
          // 45° BISECTOR (Diagonal Lock)
          const signX = Math.sign(effDeltaGridX) || 1;
          const signY = Math.sign(effDeltaGridY) || 1;
          const avg = (deltaAbsX + deltaAbsY) / 2;
          effDeltaGridX = signX * avg;
          effDeltaGridY = signY * avg;
          const cx = (initial.x + initial.w / 2) * CELL_SIZE + PADDING;
          const cy = (initial.y + initial.h / 2) * CELL_SIZE + PADDING;
          laserGuide = {
            angle: 45,
            label: '45° BISECTOR',
            x1: cx - 400 * signX,
            y1: cy - 400 * signY,
            x2: cx + 400 * signX,
            y2: cy + 400 * signY,
          };
        }
      }

      // 2. MOVE ROOM (smooth continuous movement with magnetic docking & 15cm node merging)
      if (state.mode === 'move-room') {
        let newX = Math.max(0, Number((initial.x + effDeltaGridX).toFixed(2)));
        let newY = Math.max(0, Number((initial.y + effDeltaGridY).toFixed(2)));

        let isNodeMerged = false;
        let nodeMergePos: DragFeedback['nodeMergePos'] = undefined;

        // 15cm Node Merging Check against other room corners
        const myCorners = [
          { x: newX, y: newY },
          { x: newX + initial.w, y: newY },
          { x: newX, y: newY + initial.h },
          { x: newX + initial.w, y: newY + initial.h },
        ];

        for (const other of state.initialAllRooms) {
          if (other.id === state.roomId) continue;
          const otherCorners = [
            { x: other.x, y: other.y },
            { x: other.x + other.w, y: other.y },
            { x: other.x, y: other.y + other.h },
            { x: other.x + other.w, y: other.y + other.h },
          ];

          for (const mc of myCorners) {
            for (const oc of otherCorners) {
              const d = Math.hypot(mc.x - oc.x, mc.y - oc.y);
              if (d <= SNAP_15CM) {
                newX = Number((newX + (oc.x - mc.x)).toFixed(2));
                newY = Number((newY + (oc.y - mc.y)).toFixed(2));
                isNodeMerged = true;
                nodeMergePos = {
                  x: oc.x * CELL_SIZE + PADDING,
                  y: oc.y * CELL_SIZE + PADDING,
                  label: '15 cm Düğüm Birleşti (L-Köşe)',
                };
                break;
              }
            }
            if (isNodeMerged) break;
          }
          if (isNodeMerged) break;
        }

        // Magnetic docking snap to other rooms (if not corner merged)
        const SNAP_DIST = 0.28;
        let guidelineV: number | undefined = undefined;
        let guidelineH: number | undefined = undefined;

        if (!isNodeMerged) {
          for (const other of state.initialAllRooms) {
            if (other.id === state.roomId) continue;

            // Horizontal docking (flush to left, right, or collinear)
            if (Math.abs(newX - (other.x + other.w)) < SNAP_DIST) {
              newX = Number((other.x + other.w).toFixed(2));
              guidelineV = newX * CELL_SIZE + PADDING;
            } else if (Math.abs((newX + initial.w) - other.x) < SNAP_DIST) {
              newX = Number((other.x - initial.w).toFixed(2));
              guidelineV = other.x * CELL_SIZE + PADDING;
            } else if (Math.abs(newX - other.x) < SNAP_DIST) {
              newX = other.x;
              guidelineV = other.x * CELL_SIZE + PADDING;
            }

            // Vertical docking (flush to top, bottom, or collinear)
            if (Math.abs(newY - (other.y + other.h)) < SNAP_DIST) {
              newY = Number((other.y + other.h).toFixed(2));
              guidelineH = newY * CELL_SIZE + PADDING;
            } else if (Math.abs((newY + initial.h) - other.y) < SNAP_DIST) {
              newY = Number((other.y - initial.h).toFixed(2));
              guidelineH = other.y * CELL_SIZE + PADDING;
            } else if (Math.abs(newY - other.y) < SNAP_DIST) {
              newY = other.y;
              guidelineH = other.y * CELL_SIZE + PADDING;
            }
          }
        }

        setLocalRooms((prev) =>
          prev.map((r) => (r.id === state.roomId ? { ...r, x: newX, y: newY } : r))
        );

        const deltaLenM = ((newX - initial.x) * scale).toFixed(2);
        const deltaHeightM = ((newY - initial.y) * scale).toFixed(2);
        const deltaCm = `Δ (${Math.round((newX - initial.x) * scale * 100)}cm, ${Math.round((newY - initial.y) * scale * 100)}cm)`;

        setDragFeedback({
          active: true,
          roomLabel: getCleanRoomLabel(initial, language),
          currentLengthM: `${(initial.w * scale).toFixed(1)}×${(initial.h * scale).toFixed(1)}m`,
          currentLengthCm: `${Math.round(initial.w * scale * 100)}×${Math.round(initial.h * scale * 100)} cm`,
          deltaM: `Δ (${deltaLenM}m, ${deltaHeightM}m)`,
          deltaCm,
          roomAreaM2: (initial.w * initial.h * scale * scale).toFixed(1),
          isShared: false,
          hudX: newX * CELL_SIZE + PADDING + (initial.w * CELL_SIZE) / 2,
          hudY: newY * CELL_SIZE + PADDING - 10,
          guideline: guidelineV
            ? { orientation: 'vertical', val: guidelineV }
            : guidelineH
            ? { orientation: 'horizontal', val: guidelineH }
            : undefined,
          laserRay: laserGuide,
          nodeMerged: isNodeMerged,
          nodeMergePos,
        });
        return;
      }

      // 3. RESIZE ROOM WALLS & SYNCHRONIZED SHARED WALL TOPOLOGY SOLVER
      if (state.mode === 'resize-wall' && state.wall) {
        const wall = state.wall;
        const EPSILON = 0.35; // Proximity threshold to detect shared walls
        const MIN_SIZE = 1.0; // Minimum room span in grid units
        let isNodeMerged = false;
        let nodeMergePos: DragFeedback['nodeMergePos'] = undefined;

        const initLeft = initial.x;
        const initRight = initial.x + initial.w;
        const initTop = initial.y;
        const initBottom = initial.y + initial.h;

        let newX = initial.x;
        let newY = initial.y;
        let newW = initial.w;
        let newH = initial.h;

        let snapGuideline: { orientation: 'vertical' | 'horizontal'; val: number } | undefined = undefined;

        // Interval overlap along an axis
        const intervalsOverlap = (a1: number, a2: number, b1: number, b2: number) => {
          return Math.max(a1, b1) < Math.min(a2, b2) - 0.05;
        };

        // Detect all neighbors sharing this specific boundary
        const rightNeighbors = (wall === 'right' || wall === 'ne' || wall === 'se')
          ? state.initialAllRooms.filter(
              (r) => r.id !== initial.id && Math.abs(r.x - initRight) < EPSILON && intervalsOverlap(initTop, initBottom, r.y, r.y + r.h)
            )
          : [];

        const leftNeighbors = (wall === 'left' || wall === 'nw' || wall === 'sw')
          ? state.initialAllRooms.filter(
              (r) => r.id !== initial.id && Math.abs((r.x + r.w) - initLeft) < EPSILON && intervalsOverlap(initTop, initBottom, r.y, r.y + r.h)
            )
          : [];

        const bottomNeighbors = (wall === 'bottom' || wall === 'se' || wall === 'sw')
          ? state.initialAllRooms.filter(
              (r) => r.id !== initial.id && Math.abs(r.y - initBottom) < EPSILON && intervalsOverlap(initLeft, initRight, r.x, r.x + r.w)
            )
          : [];

        const topNeighbors = (wall === 'top' || wall === 'nw' || wall === 'ne')
          ? state.initialAllRooms.filter(
              (r) => r.id !== initial.id && Math.abs((r.y + r.h) - initTop) < EPSILON && intervalsOverlap(initLeft, initRight, r.x, r.x + r.w)
            )
          : [];

        // 1. Right wall moved (expands/contracts horizontally to the right)
        if (wall === 'right' || wall === 'ne' || wall === 'se') {
          let targetRight = initial.x + Math.max(MIN_SIZE, initial.w + effDeltaGridX);

          // Clamped by sharing neighbors so neighbors don't shrink below MIN_SIZE
          if (rightNeighbors.length > 0) {
            const maxRight = Math.min(...rightNeighbors.map((n) => n.x + n.w - MIN_SIZE));
            targetRight = Math.min(targetRight, maxRight);
          }

          // Alignment snap & 15cm Node Merging against other room edges
          for (const other of state.initialAllRooms) {
            if (other.id === initial.id || rightNeighbors.some((n) => n.id === other.id)) continue;
            const edges = [other.x, other.x + other.w];
            for (const edge of edges) {
              if (Math.abs(targetRight - edge) < SNAP_15CM) {
                targetRight = edge;
                isNodeMerged = true;
                nodeMergePos = { x: edge * CELL_SIZE + PADDING, y: initTop * CELL_SIZE + PADDING, label: '15 cm Düğüm Birleşti (T/L-Snap)' };
                snapGuideline = { orientation: 'vertical', val: edge * CELL_SIZE + PADDING };
                break;
              }
            }
            if (snapGuideline) break;
          }

          newW = Math.max(MIN_SIZE, Number((targetRight - newX).toFixed(2)));
        }

        // 2. Left wall moved (expands/contracts horizontally to the left)
        if (wall === 'left' || wall === 'nw' || wall === 'sw') {
          let targetLeft = initial.x + effDeltaGridX;
          targetLeft = Math.min(targetLeft, initial.x + initial.w - MIN_SIZE);
          targetLeft = Math.max(0, targetLeft);

          // Clamped by sharing neighbors
          if (leftNeighbors.length > 0) {
            const minLeft = Math.max(...leftNeighbors.map((n) => n.x + MIN_SIZE));
            targetLeft = Math.max(targetLeft, minLeft);
          }

          // Alignment snap & 15cm Node Merging
          for (const other of state.initialAllRooms) {
            if (other.id === initial.id || leftNeighbors.some((n) => n.id === other.id)) continue;
            const edges = [other.x, other.x + other.w];
            for (const edge of edges) {
              if (Math.abs(targetLeft - edge) < SNAP_15CM) {
                targetLeft = edge;
                isNodeMerged = true;
                nodeMergePos = { x: edge * CELL_SIZE + PADDING, y: initTop * CELL_SIZE + PADDING, label: '15 cm Düğüm Birleşti (T/L-Snap)' };
                snapGuideline = { orientation: 'vertical', val: edge * CELL_SIZE + PADDING };
                break;
              }
            }
            if (snapGuideline) break;
          }

          const diffX = initial.x - targetLeft;
          newX = Number(targetLeft.toFixed(2));
          newW = Number((initial.w + diffX).toFixed(2));
        }

        // 3. Bottom wall moved (expands/contracts vertically downwards)
        if (wall === 'bottom' || wall === 'se' || wall === 'sw') {
          let targetBottom = initial.y + Math.max(MIN_SIZE, initial.h + effDeltaGridY);

          // Clamped by sharing neighbors
          if (bottomNeighbors.length > 0) {
            const maxBottom = Math.min(...bottomNeighbors.map((n) => n.y + n.h - MIN_SIZE));
            targetBottom = Math.min(targetBottom, maxBottom);
          }

          // Alignment snap & 15cm Node Merging
          for (const other of state.initialAllRooms) {
            if (other.id === initial.id || bottomNeighbors.some((n) => n.id === other.id)) continue;
            const edges = [other.y, other.y + other.h];
            for (const edge of edges) {
              if (Math.abs(targetBottom - edge) < SNAP_15CM) {
                targetBottom = edge;
                isNodeMerged = true;
                nodeMergePos = { x: initLeft * CELL_SIZE + PADDING, y: edge * CELL_SIZE + PADDING, label: '15 cm Düğüm Birleşti (T/L-Snap)' };
                snapGuideline = { orientation: 'horizontal', val: edge * CELL_SIZE + PADDING };
                break;
              }
            }
            if (snapGuideline) break;
          }

          newH = Math.max(MIN_SIZE, Number((targetBottom - newY).toFixed(2)));
        }

        // 4. Top wall moved (expands/contracts vertically upwards)
        if (wall === 'top' || wall === 'nw' || wall === 'ne') {
          let targetTop = initial.y + effDeltaGridY;
          targetTop = Math.min(targetTop, initial.y + initial.h - MIN_SIZE);
          targetTop = Math.max(0, targetTop);

          // Clamped by sharing neighbors
          if (topNeighbors.length > 0) {
            const minTop = Math.max(...topNeighbors.map((n) => n.y + MIN_SIZE));
            targetTop = Math.max(targetTop, minTop);
          }

          // Alignment snap & 15cm Node Merging
          for (const other of state.initialAllRooms) {
            if (other.id === initial.id || topNeighbors.some((n) => n.id === other.id)) continue;
            const edges = [other.y, other.y + other.h];
            for (const edge of edges) {
              if (Math.abs(targetTop - edge) < SNAP_15CM) {
                targetTop = edge;
                isNodeMerged = true;
                nodeMergePos = { x: initLeft * CELL_SIZE + PADDING, y: edge * CELL_SIZE + PADDING, label: '15 cm Düğüm Birleşti (T/L-Snap)' };
                snapGuideline = { orientation: 'horizontal', val: edge * CELL_SIZE + PADDING };
                break;
              }
            }
            if (snapGuideline) break;
          }

          const diffY = initial.y - targetTop;
          newY = Number(targetTop.toFixed(2));
          newH = Number((initial.h + diffY).toFixed(2));
        }

        const currLeft = newX;
        const currRight = newX + newW;
        const currTop = newY;
        const currBottom = newY + newH;

        // Synchronously propagate boundary changes to sharing neighbors
        const updatedRooms = state.initialAllRooms.map((r) => {
          if (r.id === state.roomId) {
            return { ...r, x: newX, y: newY, w: newW, h: newH };
          }

          let rx = r.x;
          let ry = r.y;
          let rw = r.w;
          let rh = r.h;

          // Right neighbor: its left wall moves with currRight
          if (rightNeighbors.some((n) => n.id === r.id)) {
            const newNeighborW = Math.max(MIN_SIZE, (r.x + r.w) - currRight);
            rx = Number(currRight.toFixed(2));
            rw = Number(newNeighborW.toFixed(2));
          }

          // Left neighbor: its right wall moves with currLeft
          if (leftNeighbors.some((n) => n.id === r.id)) {
            const newNeighborW = Math.max(MIN_SIZE, currLeft - r.x);
            rw = Number(newNeighborW.toFixed(2));
          }

          // Bottom neighbor: its top wall moves with currBottom
          if (bottomNeighbors.some((n) => n.id === r.id)) {
            const newNeighborH = Math.max(MIN_SIZE, (r.y + r.h) - currBottom);
            ry = Number(currBottom.toFixed(2));
            rh = Number(newNeighborH.toFixed(2));
          }

          // Top neighbor: its bottom wall moves with currTop
          if (topNeighbors.some((n) => n.id === r.id)) {
            const newNeighborH = Math.max(MIN_SIZE, currTop - r.y);
            rh = Number(newNeighborH.toFixed(2));
          }

          return { ...r, x: rx, y: ry, w: rw, h: rh };
        });

        setLocalRooms(updatedRooms);

        // Calculate live CAD measurement HUD feedback
        const allNeighbors = [...rightNeighbors, ...leftNeighbors, ...bottomNeighbors, ...topNeighbors];
        const isHoriz = wall === 'top' || wall === 'bottom';
        const currentLenM = ((isHoriz ? newW : newH) * scale).toFixed(2);
        const currentLenCm = `${Math.round(Number(currentLenM) * 100)} cm`;
        const initLenM = ((isHoriz ? initial.w : initial.h) * scale);
        const deltaVal = Number(currentLenM) - initLenM;
        const deltaStr = deltaVal >= 0 ? `+${deltaVal.toFixed(2)}` : deltaVal.toFixed(2);
        const deltaCm = `${deltaVal >= 0 ? '+' : ''}${Math.round(deltaVal * 100)} cm`;

        const primaryNeighbor = allNeighbors[0];
        const primaryNeighborUpdated = primaryNeighbor ? updatedRooms.find((r) => r.id === primaryNeighbor.id) : undefined;

        // Dynamic parallel CAD dimension line
        const DIM_OFFSET = 26;
        let dimLine: DragFeedback['dimensionLine'] = undefined;
        const pxLeft = currLeft * CELL_SIZE + PADDING;
        const pxRight = (currLeft + newW) * CELL_SIZE + PADDING;
        const pxTop = currTop * CELL_SIZE + PADDING;
        const pxBottom = (currTop + newH) * CELL_SIZE + PADDING;

        if (wall === 'top') {
          dimLine = {
            x1: pxLeft,
            y1: pxTop - DIM_OFFSET,
            x2: pxRight,
            y2: pxTop - DIM_OFFSET,
            label: currentLenCm,
            w1: [pxLeft, pxTop - DIM_OFFSET - 4, pxLeft, pxTop],
            w2: [pxRight, pxTop - DIM_OFFSET - 4, pxRight, pxTop],
          };
        } else if (wall === 'bottom') {
          dimLine = {
            x1: pxLeft,
            y1: pxBottom + DIM_OFFSET,
            x2: pxRight,
            y2: pxBottom + DIM_OFFSET,
            label: currentLenCm,
            w1: [pxLeft, pxBottom, pxLeft, pxBottom + DIM_OFFSET + 4],
            w2: [pxRight, pxBottom, pxRight, pxBottom + DIM_OFFSET + 4],
          };
        } else if (wall === 'left') {
          dimLine = {
            x1: pxLeft - DIM_OFFSET,
            y1: pxTop,
            x2: pxLeft - DIM_OFFSET,
            y2: pxBottom,
            label: currentLenCm,
            w1: [pxLeft - DIM_OFFSET - 4, pxTop, pxLeft, pxTop],
            w2: [pxLeft - DIM_OFFSET - 4, pxBottom, pxLeft, pxBottom],
          };
        } else if (wall === 'right') {
          dimLine = {
            x1: pxRight + DIM_OFFSET,
            y1: pxTop,
            x2: pxRight + DIM_OFFSET,
            y2: pxBottom,
            label: currentLenCm,
            w1: [pxRight, pxTop, pxRight + DIM_OFFSET + 4, pxTop],
            w2: [pxRight, pxBottom, pxRight + DIM_OFFSET + 4, pxBottom],
          };
        }

        setDragFeedback({
          active: true,
          wall,
          roomLabel: getCleanRoomLabel(initial, language),
          currentLengthM: currentLenM,
          currentLengthCm: currentLenCm,
          deltaM: deltaStr,
          deltaCm,
          roomAreaM2: (newW * newH * scale * scale).toFixed(1),
          neighborLabel: primaryNeighbor ? getCleanRoomLabel(primaryNeighbor, language) : undefined,
          neighborAreaM2: primaryNeighborUpdated
            ? (primaryNeighborUpdated.w * primaryNeighborUpdated.h * scale * scale).toFixed(1)
            : undefined,
          isShared: allNeighbors.length > 0,
          hudX: (currLeft + newW / 2) * CELL_SIZE + PADDING,
          hudY: wall === 'top'
            ? currTop * CELL_SIZE + PADDING - 24
            : wall === 'bottom'
            ? currBottom * CELL_SIZE + PADDING + 32
            : (currTop + newH / 2) * CELL_SIZE + PADDING,
          guideline: snapGuideline,
          dimensionLine: dimLine,
          nodeMerged: isNodeMerged,
          nodeMergePos: isNodeMerged ? nodeMergePos : undefined,
          laserRay: laserGuide,
        });
        return;
      }

      // 4. DRAG DOOR ALONG WALL
      if (state.mode === 'drag-door' && state.itemIndex !== undefined && state.initialDoor) {
        const door = state.initialDoor;
        const isHorizontal = door.wall === 'top' || door.wall === 'bottom';
        const wallPixelLength = (isHorizontal ? initial.w : initial.h) * CELL_SIZE;
        const deltaAlong = isHorizontal ? deltaPixelX : deltaPixelY;
        const newPos = Math.min(0.92, Math.max(0.08, door.position + deltaAlong / wallPixelLength));

        setLocalRooms((prev) =>
          prev.map((r) => {
            if (r.id === state.roomId && r.doors) {
              const newDoors = [...r.doors];
              newDoors[state.itemIndex!] = {
                ...newDoors[state.itemIndex!],
                position: Number(newPos.toFixed(3)),
              };
              return { ...r, doors: newDoors };
            }
            return r;
          })
        );
        return;
      }

      // 5. RESIZE DOOR WIDTH
      if (state.mode === 'resize-door' && state.itemIndex !== undefined && state.initialDoor) {
        const initialWidth = state.initialDoor.width || DEFAULT_DOOR_SIZE;
        const delta = Math.abs(deltaPixelX) > Math.abs(deltaPixelY) ? deltaPixelX : deltaPixelY;
        const newWidth = Math.min(54, Math.max(16, Math.round(initialWidth + delta * 0.7)));

        setLocalRooms((prev) =>
          prev.map((r) => {
            if (r.id === state.roomId && r.doors) {
              const newDoors = [...r.doors];
              newDoors[state.itemIndex!] = {
                ...newDoors[state.itemIndex!],
                width: newWidth,
              };
              return { ...r, doors: newDoors };
            }
            return r;
          })
        );
        return;
      }

      // 6. DRAG WINDOW ALONG WALL
      if (state.mode === 'drag-window' && state.itemIndex !== undefined && state.initialWindow) {
        const win = state.initialWindow;
        const isHorizontal = win.wall === 'top' || win.wall === 'bottom';
        const wallPixelLength = (isHorizontal ? initial.w : initial.h) * CELL_SIZE;
        const deltaAlong = isHorizontal ? deltaPixelX : deltaPixelY;
        const newPos = Math.min(0.92, Math.max(0.08, win.position + deltaAlong / wallPixelLength));

        setLocalRooms((prev) =>
          prev.map((r) => {
            if (r.id === state.roomId && r.windows) {
              const newWindows = [...r.windows];
              newWindows[state.itemIndex!] = {
                ...newWindows[state.itemIndex!],
                position: Number(newPos.toFixed(3)),
              };
              return { ...r, windows: newWindows };
            }
            return r;
          })
        );
        return;
      }

      // 7. RESIZE WINDOW WIDTH
      if (state.mode === 'resize-window' && state.itemIndex !== undefined && state.initialWindow) {
        const initialWidth = state.initialWindow.width || DEFAULT_WINDOW_SIZE;
        const delta = Math.abs(deltaPixelX) > Math.abs(deltaPixelY) ? deltaPixelX : deltaPixelY;
        const newWidth = Math.min(80, Math.max(16, Math.round(initialWidth + delta * 0.9)));

        setLocalRooms((prev) =>
          prev.map((r) => {
            if (r.id === state.roomId && r.windows) {
              const newWindows = [...r.windows];
              newWindows[state.itemIndex!] = {
                ...newWindows[state.itemIndex!],
                width: newWidth,
              };
              return { ...r, windows: newWindows };
            }
            return r;
          })
        );
        return;
      }
    }

    function handleGlobalPointerUp() {
      if (dragStateRef.current) {
        const wasPan = dragStateRef.current.mode === 'pan';
        dragStateRef.current = null;
        setIsDraggingActive(false);
        setIsPanning(false);
        setDragFeedback(null);

        if (!wasPan) {
          // Commit final layout to parent
          setLocalRooms((latest) => {
            commitLayoutChange(latest);
            return latest;
          });
        }
      }
    }

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [zoom, commitLayoutChange]);

  // Start Pan / Drag Operations
  function startDragging(state: Omit<DragState, 'initialAllRooms'>) {
    const fullState: DragState = {
      ...state,
      initialAllRooms: JSON.parse(JSON.stringify(localRooms)),
    };
    dragStateRef.current = fullState;
    setIsDraggingActive(true);
    if (state.mode === 'pan') {
      setIsPanning(true);
    }
  }

  // Handle Mouse Down (Left click on background OR Middle click anywhere)
  function handleMouseDownOnCanvas(e: React.MouseEvent) {
    // 1. Middle Click (Wheel button / button === 1) anywhere to PAN
    if (e.button === 1) {
      e.preventDefault();
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      startDragging({
        mode: 'pan',
        roomId: '',
        startX: e.clientX,
        startY: e.clientY,
        initialRoom: localRooms[0] || ({} as RoomLayout),
      });
      return;
    }

    // 2. Left click on background to Pan & Deselect
    if (
      e.button === 0 &&
      (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg')
    ) {
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      startDragging({
        mode: 'pan',
        roomId: '',
        startX: e.clientX,
        startY: e.clientY,
        initialRoom: localRooms[0] || ({} as RoomLayout),
      });
      setSelectedRoomId(null);
    }
  }

  function handleMouseDownOnRoom(roomId: string, e: React.MouseEvent) {
    // If middle click on room, prioritize Pan
    if (e.button === 1) {
      handleMouseDownOnCanvas(e);
      return;
    }

    if (e.button !== 0) return;
    e.stopPropagation();

    setSelectedRoomId(roomId);
    const room = localRooms.find((r) => r.id === roomId);
    if (!room || room.locked) return;

    startDragging({
      mode: 'move-room',
      roomId,
      startX: e.clientX,
      startY: e.clientY,
      initialRoom: { ...room },
    });
  }

  function handleMouseDownOnWall(
    roomId: string,
    wall: 'top' | 'right' | 'bottom' | 'left' | 'nw' | 'ne' | 'se' | 'sw',
    e: React.MouseEvent
  ) {
    if (e.button === 1) {
      handleMouseDownOnCanvas(e);
      return;
    }
    if (e.button !== 0) return;
    e.stopPropagation();

    const room = localRooms.find((r) => r.id === roomId);
    if (!room || room.locked) return;

    setSelectedRoomId(roomId);
    startDragging({
      mode: 'resize-wall',
      roomId,
      wall,
      startX: e.clientX,
      startY: e.clientY,
      initialRoom: { ...room },
    });
  }

  function handleMouseDownOnDoorHandle(
    roomId: string,
    doorIndex: number,
    mode: 'drag-door' | 'resize-door',
    e: React.MouseEvent
  ) {
    if (e.button === 1) {
      handleMouseDownOnCanvas(e);
      return;
    }
    if (e.button !== 0) return;
    e.stopPropagation();

    const room = localRooms.find((r) => r.id === roomId);
    if (!room || !room.doors?.[doorIndex]) return;

    setSelectedRoomId(roomId);
    startDragging({
      mode,
      roomId,
      itemIndex: doorIndex,
      startX: e.clientX,
      startY: e.clientY,
      initialRoom: { ...room },
      initialDoor: { ...room.doors[doorIndex] },
    });
  }

  function handleMouseDownOnWindowHandle(
    roomId: string,
    winIndex: number,
    mode: 'drag-window' | 'resize-window',
    e: React.MouseEvent
  ) {
    if (e.button === 1) {
      handleMouseDownOnCanvas(e);
      return;
    }
    if (e.button !== 0) return;
    e.stopPropagation();

    const room = localRooms.find((r) => r.id === roomId);
    if (!room || !room.windows?.[winIndex]) return;

    setSelectedRoomId(roomId);
    startDragging({
      mode,
      roomId,
      itemIndex: winIndex,
      startX: e.clientX,
      startY: e.clientY,
      initialRoom: { ...room },
      initialWindow: { ...room.windows[winIndex] },
    });
  }

  // Room Quick Actions
  function addDoorToSelectedRoom(wall: 'top' | 'right' | 'bottom' | 'left' = 'bottom') {
    if (!selectedRoom) return;
    const currentDoors = selectedRoom.doors || [];
    const newDoor: DoorPlacement = {
      wall,
      position: 0.5,
      width: DEFAULT_DOOR_SIZE,
    };
    const updated = localRooms.map((r) =>
      r.id === selectedRoom.id ? { ...r, doors: [...currentDoors, newDoor] } : r
    );
    setLocalRooms(updated);
    commitLayoutChange(updated);
  }

  function addWindowToSelectedRoom(wall: 'top' | 'right' | 'bottom' | 'left' = 'top') {
    if (!selectedRoom) return;
    const currentWindows = selectedRoom.windows || [];
    const newWin: WindowPlacement = {
      wall,
      position: 0.5,
      width: DEFAULT_WINDOW_SIZE,
    };
    const updated = localRooms.map((r) =>
      r.id === selectedRoom.id ? { ...r, windows: [...currentWindows, newWin] } : r
    );
    setLocalRooms(updated);
    commitLayoutChange(updated);
  }

  function rotateSelectedRoom() {
    if (!selectedRoom || selectedRoom.locked) return;
    const updated = localRooms.map((r) => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          w: r.h,
          h: r.w,
        };
      }
      return r;
    });
    setLocalRooms(updated);
    commitLayoutChange(updated);
  }

  function deleteSelectedRoom() {
    if (!selectedRoom || selectedRoom.locked) return;
    const updated = localRooms.filter((r) => r.id !== selectedRoom.id);
    setSelectedRoomId(null);
    setLocalRooms(updated);
    commitLayoutChange(updated);
  }

  // Export functions
  function downloadSVG() {
    if (!svgData) return;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplan.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPNG() {
    if (!svgData) return;
    const canvas = document.createElement('canvas');
    const scale = 2;
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'floorplan.png';
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  const gridW = layout ? layout.gridWidth : 10;
  const gridH = layout ? layout.gridHeight : 8;
  const svgWidth = Math.max(gridW * CELL_SIZE + PADDING * 2, 600);
  const svgHeight = Math.max(gridH * CELL_SIZE + PADDING * 2, 450);

  return (
    <div className="h-full flex flex-col bg-gray-50 select-none overflow-hidden font-sans">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shadow-sm z-10 flex-shrink-0">
        {/* Left tools: Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title={t.editor.zoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title={t.editor.zoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 px-2 font-mono font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title={t.editor.resetView}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Live Dimensions Bar & Multi-Floor Switcher */}
        {layout && (
          <div className="flex items-center gap-2">
            {/* Multi-floor Switcher */}
            {layout.floors && layout.floors.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {layout.floors.map((fl) => {
                  const isActive = (layout.activeLevel ?? 0) === fl.level;
                  return (
                    <button
                      key={fl.level}
                      onClick={() => handleSwitchFloor(fl.level)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      )}
                      title={`${fl.name} (${fl.elevation >= 0 ? `+${fl.elevation.toFixed(1)}` : fl.elevation.toFixed(1)}m)`}
                    >
                      <span>{fl.level === 0 ? '🏠' : fl.level === 1 ? '🛏️' : fl.level === -1 ? '📦' : '🏛️'}</span>
                      <span>{fl.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        ({fl.elevation >= 0 ? `+${fl.elevation.toFixed(1)}` : fl.elevation.toFixed(1)}m)
                      </span>
                    </button>
                  );
                })}

                {/* Ghost Trace Toggle Button (on upper floors) */}
                {(layout.activeLevel ?? 0) > 0 && (
                  <button
                    onClick={() => setShowGhostTrace(!showGhostTrace)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ml-1',
                      showGhostTrace
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-400'
                    )}
                    title={language === 'tr' ? 'Alt kat taşıyıcı duvarlarını %20 saydam referans olarak göster' : 'Show lower floor structural walls at 20% opacity'}
                  >
                    <span>👁️</span>
                    <span className="hidden lg:inline">{language === 'tr' ? 'Hayalet İz:' : 'Ghost:'} {showGhostTrace ? (language === 'tr' ? 'Açık' : 'On') : (language === 'tr' ? 'Kapalı' : 'Off')}</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-600 hidden md:flex font-medium bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t.editor.roomsCount(localRooms.length)}
              </span>
              <span>·</span>
              <span className="font-semibold text-emerald-700">{layout.totalArea} m²</span>
              {selectedRoom && (
                <>
                  <span>·</span>
                  <span className="text-gray-900 font-bold bg-white px-2 py-0.5 rounded shadow-xs border border-gray-200">
                    {getCleanRoomLabel(selectedRoom, language)}: {selectedRoom.w}m × {selectedRoom.h}m (
                    {(
                      selectedRoom.w *
                      selectedRoom.h *
                      (layout.scale || 1.2) *
                      (layout.scale || 1.2)
                    ).toFixed(1)}{' '}
                    m²)
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Right: Export Downloads */}
        {svgData && (
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSVG}
              className="btn-secondary text-xs py-1.5 px-3 font-medium shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              {t.editor.downloadSvg}
            </button>
            <button
              onClick={downloadPNG}
              className="btn-primary text-xs py-1.5 px-3 font-medium shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              {t.editor.downloadPng}
            </button>
          </div>
        )}
      </div>

      {/* Interactive Canvas Viewport */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 relative overflow-hidden bg-[#F1F5F9]',
          isPanning ? 'cursor-grabbing' : 'cursor-default'
        )}
        onMouseDown={handleMouseDownOnCanvas}
        onWheel={handleWheel}
      >
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/90 z-20">
            <div className="relative w-64 h-48 rounded-xl border-2 border-emerald-200 bg-emerald-50 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
              <div className="absolute top-3 left-3 right-16 h-20 rounded-lg bg-emerald-100 border border-emerald-200 opacity-60" />
              <div className="absolute top-3 right-3 w-12 h-20 rounded-lg bg-blue-100 border border-blue-200 opacity-60" />
              <div className="absolute bottom-3 left-3 w-24 h-16 rounded-lg bg-amber-100 border border-amber-200 opacity-60" />
              <div className="absolute bottom-3 right-3 w-28 h-16 rounded-lg bg-blue-100 border border-blue-200 opacity-60" />
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              {t.editor.generatingCanvasText}
            </div>
          </div>
        ) : localRooms.length > 0 ? (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center',
              transition: isDraggingActive ? 'none' : 'transform 0.08s ease-out',
            }}
            className="absolute inset-0 flex items-center justify-center p-16 pointer-events-auto"
          >
            {/* Live Interactive SVG */}
            <svg
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="bg-white shadow-2xl rounded-2xl border border-gray-300"
              style={{ overflow: 'visible' }}
            >
              {/* Background Precision Grid Lines */}
              {Array.from({ length: gridW + 1 }, (_, gx) => (
                <line
                  key={`gx-${gx}`}
                  x1={gx * CELL_SIZE + PADDING}
                  y1={PADDING}
                  x2={gx * CELL_SIZE + PADDING}
                  y2={gridH * CELL_SIZE + PADDING}
                  stroke="#CBD5E1"
                  strokeWidth="0.6"
                  strokeDasharray="2,3"
                />
              ))}
              {Array.from({ length: gridH + 1 }, (_, gy) => (
                <line
                  key={`gy-${gy}`}
                  x1={PADDING}
                  y1={gy * CELL_SIZE + PADDING}
                  x2={gridW * CELL_SIZE + PADDING}
                  y2={gy * CELL_SIZE + PADDING}
                  stroke="#CBD5E1"
                  strokeWidth="0.6"
                  strokeDasharray="2,3"
                />
              ))}

              {/* Ghost Trace Reference from Floor Below (%20 Opacity CAD Overlay) */}
              {showGhostTrace &&
                (layout?.activeLevel ?? 0) > 0 &&
                (() => {
                  const currentFloors = layout?.floors || [];
                  const lowerFloor = currentFloors.find(
                    (f) => f.level === (layout!.activeLevel! - 1)
                  );
                  if (!lowerFloor || !lowerFloor.rooms || lowerFloor.rooms.length === 0) return null;

                  return (
                    <g className="ghost-trace-overlay pointer-events-none" opacity={0.22}>
                      {lowerFloor.rooms.map((gr) => {
                        const gx = gr.x * CELL_SIZE + PADDING;
                        const gy = gr.y * CELL_SIZE + PADDING;
                        const gw = gr.w * CELL_SIZE;
                        const gh = gr.h * CELL_SIZE;
                        const gPoly = gr.polygon && gr.polygon.length >= 3;

                        if (gPoly) {
                          const pts = gr
                            .polygon!.map(
                              ([px, py]) =>
                                `${px * CELL_SIZE + PADDING},${py * CELL_SIZE + PADDING}`
                            )
                            .join(' ');
                          return (
                            <polygon
                              key={`ghost-${gr.id}`}
                              points={pts}
                              fill="#64748B"
                              fillOpacity={0.15}
                              stroke="#334155"
                              strokeWidth={2}
                              strokeDasharray="4,4"
                            />
                          );
                        }

                        return (
                          <g key={`ghost-${gr.id}`}>
                            <rect
                              x={gx}
                              y={gy}
                              width={gw}
                              height={gh}
                              fill="#64748B"
                              fillOpacity={0.12}
                              stroke="#334155"
                              strokeWidth={2}
                              strokeDasharray="4,4"
                              rx={2}
                            />
                            <text
                              x={gx + gw / 2}
                              y={gy + 14}
                              textAnchor="middle"
                              fontFamily="Inter, system-ui, sans-serif"
                              fontSize="8.5"
                              fontWeight="bold"
                              fill="#475569"
                            >
                              ↓ {getCleanRoomLabel(gr, language)}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}

              {/* Render Each Room */}
              {localRooms.map((room) => {
                const rx = room.x * CELL_SIZE + PADDING;
                const ry = room.y * CELL_SIZE + PADDING;
                const rw = room.w * CELL_SIZE;
                const rh = room.h * CELL_SIZE;
                const colors = ROOM_COLORS[room.type] ?? ROOM_COLORS.hallway;
                const isSelected = room.id === selectedRoomId;
                const scale = layout?.scale || 1.2;
                const areaM2 = calculateRoomArea(room, scale).toFixed(1);
                const hasPolygon = Boolean(room.polygon && room.polygon.length >= 3);
                const polyPoints = hasPolygon
                  ? room.polygon!.map(([px, py]) => `${px * CELL_SIZE + PADDING},${py * CELL_SIZE + PADDING}`).join(' ')
                  : '';

                return (
                  <g key={room.id} className="cursor-pointer">
                    {/* Room Background Rect or Polygon */}
                    {hasPolygon ? (
                      <polygon
                        points={polyPoints}
                        fill={colors.fill}
                        stroke={isSelected ? '#059669' : colors.stroke}
                        strokeWidth={isSelected ? WALL_THICKNESS + 2 : WALL_THICKNESS}
                        strokeLinejoin="round"
                        onMouseDown={(e) => handleMouseDownOnRoom(room.id, e)}
                        className={cn(
                          'transition-all duration-75',
                          isSelected ? 'filter drop-shadow-lg' : 'hover:opacity-95'
                        )}
                      />
                    ) : (
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill={colors.fill}
                        stroke={isSelected ? '#059669' : colors.stroke}
                        strokeWidth={isSelected ? WALL_THICKNESS + 2 : WALL_THICKNESS}
                        rx="3"
                        onMouseDown={(e) => handleMouseDownOnRoom(room.id, e)}
                        className={cn(
                          'transition-all duration-75',
                          isSelected ? 'filter drop-shadow-lg' : 'hover:opacity-95'
                        )}
                      />
                    )}

                    {/* Room Labels */}
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 - 8}
                      textAnchor="middle"
                      fontFamily="Inter, system-ui, sans-serif"
                      fontSize="11.5"
                      fontWeight="700"
                      fill={colors.stroke}
                      className="pointer-events-none select-none"
                    >
                      {getCleanRoomLabel(room, language)}
                    </text>
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 + 8}
                      textAnchor="middle"
                      fontFamily="Inter, system-ui, sans-serif"
                      fontSize="9.5"
                      fill="#475569"
                      className="pointer-events-none select-none font-semibold"
                    >
                      {areaM2} m²
                    </text>

                    {/* Room Lock Badge */}
                    {room.locked && (
                      <g
                        transform={`translate(${rx + rw - 20}, ${ry + 5})`}
                        className="cursor-pointer pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoomId(room.id);
                          toggleLockSelectedRoom();
                        }}
                      >
                        <rect width="16" height="16" rx="4" fill="#F59E0B" fillOpacity="0.95" />
                        <path
                          d="M5 7V5.5a3 3 0 0 1 6 0V7m-4.5 0h7a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    )}

                    {/* Doors - Pure JSX Render & Smooth Drag Handles */}
                    {room.doors?.map((door, dIdx) => {
                      const dSize = door.width || DEFAULT_DOOR_SIZE;
                      const isHoriz = door.wall === 'top' || door.wall === 'bottom';
                      const doorCenterX =
                        door.wall === 'left'
                          ? rx
                          : door.wall === 'right'
                          ? rx + rw
                          : rx + door.position * rw;
                      const doorCenterY =
                        door.wall === 'top'
                          ? ry
                          : door.wall === 'bottom'
                          ? ry + rh
                          : ry + door.position * rh;

                      return (
                        <g key={`door-${room.id}-${dIdx}`}>
                          {/* Visual JSX Door */}
                          <RenderDoorVisual rx={rx} ry={ry} rw={rw} rh={rh} door={door} />

                          {/* Interactive Fluid Door Handles */}
                          {isSelected && (
                            <g>
                              {/* Large invisible hitbox for effortless grasping */}
                              <circle
                                cx={doorCenterX}
                                cy={doorCenterY}
                                r={14}
                                fill="transparent"
                                className="cursor-move"
                                onMouseDown={(e) =>
                                  handleMouseDownOnDoorHandle(room.id, dIdx, 'drag-door', e)
                                }
                              />
                              {/* Main Center Door Position Handle */}
                              <circle
                                cx={doorCenterX}
                                cy={doorCenterY}
                                r={7.5}
                                fill="#059669"
                                stroke="#FFFFFF"
                                strokeWidth={2.5}
                                className="cursor-move filter drop-shadow hover:scale-130 transition-transform"
                                onMouseDown={(e) =>
                                  handleMouseDownOnDoorHandle(room.id, dIdx, 'drag-door', e)
                                }
                              />
                              {/* Door Resize Width Handle */}
                              <rect
                                x={isHoriz ? doorCenterX + dSize / 2 - 4 : doorCenterX - 4}
                                y={isHoriz ? doorCenterY - 4 : doorCenterY + dSize / 2 - 4}
                                width={9}
                                height={9}
                                fill="#2563EB"
                                stroke="#FFFFFF"
                                strokeWidth={2}
                                rx={2}
                                className={cn(
                                  'filter drop-shadow hover:scale-130 transition-transform',
                                  isHoriz ? 'cursor-ew-resize' : 'cursor-ns-resize'
                                )}
                                onMouseDown={(e) =>
                                  handleMouseDownOnDoorHandle(room.id, dIdx, 'resize-door', e)
                                }
                              />
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Windows - Pure JSX Render & Smooth Drag Handles */}
                    {room.windows?.map((win, wIdx) => {
                      const wSize = win.width || DEFAULT_WINDOW_SIZE;
                      const isHoriz = win.wall === 'top' || win.wall === 'bottom';
                      const winCenterX =
                        win.wall === 'left'
                          ? rx
                          : win.wall === 'right'
                          ? rx + rw
                          : rx + win.position * rw;
                      const winCenterY =
                        win.wall === 'top'
                          ? ry
                          : win.wall === 'bottom'
                          ? ry + rh
                          : ry + win.position * rh;

                      return (
                        <g key={`win-${room.id}-${wIdx}`}>
                          {/* Visual JSX Window */}
                          <RenderWindowVisual rx={rx} ry={ry} rw={rw} rh={rh} win={win} />

                          {/* Interactive Fluid Window Handles */}
                          {isSelected && (
                            <g>
                              {/* Invisible hitbox */}
                              <circle
                                cx={winCenterX}
                                cy={winCenterY}
                                r={14}
                                fill="transparent"
                                className="cursor-move"
                                onMouseDown={(e) =>
                                  handleMouseDownOnWindowHandle(room.id, wIdx, 'drag-window', e)
                                }
                              />
                              {/* Window Drag Handle */}
                              <circle
                                cx={winCenterX}
                                cy={winCenterY}
                                r={7}
                                fill="#0284C7"
                                stroke="#FFFFFF"
                                strokeWidth={2.5}
                                className="cursor-move filter drop-shadow hover:scale-130 transition-transform"
                                onMouseDown={(e) =>
                                  handleMouseDownOnWindowHandle(room.id, wIdx, 'drag-window', e)
                                }
                              />
                              {/* Window Resize Width Handle */}
                              <circle
                                cx={isHoriz ? winCenterX + wSize / 2 : winCenterX}
                                cy={isHoriz ? winCenterY : winCenterY + wSize / 2}
                                r={5.5}
                                fill="#38BDF8"
                                stroke="#FFFFFF"
                                strokeWidth={2}
                                className={cn(
                                  'filter drop-shadow hover:scale-130 transition-transform',
                                  isHoriz ? 'cursor-ew-resize' : 'cursor-ns-resize'
                                )}
                                onMouseDown={(e) =>
                                  handleMouseDownOnWindowHandle(room.id, wIdx, 'resize-window', e)
                                }
                              />
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Selected Room - Direct Wall Line, Tactile Midpoint Grips & Corner Handles */}
                    {isSelected && (() => {
                      const topNeighbors = findSharedWallNeighbors(room, 'top', localRooms);
                      const bottomNeighbors = findSharedWallNeighbors(room, 'bottom', localRooms);
                      const leftNeighbors = findSharedWallNeighbors(room, 'left', localRooms);
                      const rightNeighbors = findSharedWallNeighbors(room, 'right', localRooms);

                      const isTopShared = topNeighbors.length > 0;
                      const isBottomShared = bottomNeighbors.length > 0;
                      const isLeftShared = leftNeighbors.length > 0;
                      const isRightShared = rightNeighbors.length > 0;

                      return (
                        <g>
                          {/* Top Wall: Line & Tactile Midpoint Grip Pill */}
                          <line
                            x1={rx}
                            y1={ry}
                            x2={rx + rw}
                            y2={ry}
                            stroke="transparent"
                            strokeWidth={18}
                            className="cursor-ns-resize"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'top', e)}
                          />
                          <line
                            x1={rx}
                            y1={ry}
                            x2={rx + rw}
                            y2={ry}
                            stroke={isTopShared ? '#4F46E5' : '#059669'}
                            strokeWidth={2.5}
                            strokeDasharray={isTopShared ? '5,3' : '4,3'}
                            className="pointer-events-none"
                          />
                          {/* Top Midpoint Grip Pill */}
                          <g
                            transform={`translate(${rx + rw / 2}, ${ry})`}
                            className="cursor-ns-resize filter drop-shadow hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'top', e)}
                          >
                            <rect
                              x={-22}
                              y={-6.5}
                              width={44}
                              height={13}
                              rx={6.5}
                              fill={isTopShared ? '#EEF2FF' : '#ECFDF5'}
                              stroke={isTopShared ? '#4F46E5' : '#059669'}
                              strokeWidth={1.8}
                            />
                            {/* Grip Ribs */}
                            <line x1={-6} y1={-3.5} x2={-6} y2={3.5} stroke={isTopShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            <line x1={0} y1={-3.5} x2={0} y2={3.5} stroke={isTopShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            <line x1={6} y1={-3.5} x2={6} y2={3.5} stroke={isTopShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            {isTopShared && (
                              <circle cx={-15} cy={0} r={2} fill="#4F46E5" className="pointer-events-none" />
                            )}
                            {isTopShared && (
                              <circle cx={15} cy={0} r={2} fill="#4F46E5" className="pointer-events-none" />
                            )}
                            <title>{isTopShared ? 'Ortak Duvar (Senkronize Boyutlandırma)' : 'Dış Duvar'}</title>
                          </g>

                          {/* Bottom Wall: Line & Tactile Midpoint Grip Pill */}
                          <line
                            x1={rx}
                            y1={ry + rh}
                            x2={rx + rw}
                            y2={ry + rh}
                            stroke="transparent"
                            strokeWidth={18}
                            className="cursor-ns-resize"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'bottom', e)}
                          />
                          <line
                            x1={rx}
                            y1={ry + rh}
                            x2={rx + rw}
                            y2={ry + rh}
                            stroke={isBottomShared ? '#4F46E5' : '#059669'}
                            strokeWidth={2.5}
                            strokeDasharray={isBottomShared ? '5,3' : '4,3'}
                            className="pointer-events-none"
                          />
                          {/* Bottom Midpoint Grip Pill */}
                          <g
                            transform={`translate(${rx + rw / 2}, ${ry + rh})`}
                            className="cursor-ns-resize filter drop-shadow hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'bottom', e)}
                          >
                            <rect
                              x={-22}
                              y={-6.5}
                              width={44}
                              height={13}
                              rx={6.5}
                              fill={isBottomShared ? '#EEF2FF' : '#ECFDF5'}
                              stroke={isBottomShared ? '#4F46E5' : '#059669'}
                              strokeWidth={1.8}
                            />
                            {/* Grip Ribs */}
                            <line x1={-6} y1={-3.5} x2={-6} y2={3.5} stroke={isBottomShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            <line x1={0} y1={-3.5} x2={0} y2={3.5} stroke={isBottomShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            <line x1={6} y1={-3.5} x2={6} y2={3.5} stroke={isBottomShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            {isBottomShared && (
                              <circle cx={-15} cy={0} r={2} fill="#4F46E5" className="pointer-events-none" />
                            )}
                            {isBottomShared && (
                              <circle cx={15} cy={0} r={2} fill="#4F46E5" className="pointer-events-none" />
                            )}
                            <title>{isBottomShared ? 'Ortak Duvar (Senkronize Boyutlandırma)' : 'Dış Duvar'}</title>
                          </g>

                          {/* Left Wall: Line & Tactile Midpoint Grip Pill */}
                          <line
                            x1={rx}
                            y1={ry}
                            x2={rx}
                            y2={ry + rh}
                            stroke="transparent"
                            strokeWidth={18}
                            className="cursor-ew-resize"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'left', e)}
                          />
                          <line
                            x1={rx}
                            y1={ry}
                            x2={rx}
                            y2={ry + rh}
                            stroke={isLeftShared ? '#4F46E5' : '#059669'}
                            strokeWidth={2.5}
                            strokeDasharray={isLeftShared ? '5,3' : '4,3'}
                            className="pointer-events-none"
                          />
                          {/* Left Midpoint Grip Pill */}
                          <g
                            transform={`translate(${rx}, ${ry + rh / 2})`}
                            className="cursor-ew-resize filter drop-shadow hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'left', e)}
                          >
                            <rect
                              x={-6.5}
                              y={-22}
                              width={13}
                              height={44}
                              rx={6.5}
                              fill={isLeftShared ? '#EEF2FF' : '#ECFDF5'}
                              stroke={isLeftShared ? '#4F46E5' : '#059669'}
                              strokeWidth={1.8}
                            />
                            {/* Grip Ribs */}
                            <line x1={-3.5} y1={-6} x2={3.5} y2={-6} stroke={isLeftShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            <line x1={-3.5} y1={0} x2={3.5} y2={0} stroke={isLeftShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            <line x1={-3.5} y1={6} x2={3.5} y2={6} stroke={isLeftShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            {isLeftShared && (
                              <circle cx={0} cy={-15} r={2} fill="#4F46E5" className="pointer-events-none" />
                            )}
                            {isLeftShared && (
                              <circle cx={0} cy={15} r={2} fill="#4F46E5" className="pointer-events-none" />
                            )}
                            <title>{isLeftShared ? 'Ortak Duvar (Senkronize Boyutlandırma)' : 'Dış Duvar'}</title>
                          </g>

                          {/* Right Wall: Line & Tactile Midpoint Grip Pill */}
                          <line
                            x1={rx + rw}
                            y1={ry}
                            x2={rx + rw}
                            y2={ry + rh}
                            stroke="transparent"
                            strokeWidth={18}
                            className="cursor-ew-resize"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'right', e)}
                          />
                          <line
                            x1={rx + rw}
                            y1={ry}
                            x2={rx + rw}
                            y2={ry + rh}
                            stroke={isRightShared ? '#4F46E5' : '#059669'}
                            strokeWidth={2.5}
                            strokeDasharray={isRightShared ? '5,3' : '4,3'}
                            className="pointer-events-none"
                          />
                          {/* Right Midpoint Grip Pill */}
                          <g
                            transform={`translate(${rx + rw}, ${ry + rh / 2})`}
                            className="cursor-ew-resize filter drop-shadow hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'right', e)}
                          >
                            <rect
                              x={-6.5}
                              y={-22}
                              width={13}
                              height={44}
                              rx={6.5}
                              fill={isRightShared ? '#EEF2FF' : '#ECFDF5'}
                              stroke={isRightShared ? '#4F46E5' : '#059669'}
                              strokeWidth={1.8}
                            />
                            {/* Grip Ribs */}
                            <line x1={-3.5} y1={-6} x2={3.5} y2={-6} stroke={isRightShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            <line x1={-3.5} y1={0} x2={3.5} y2={0} stroke={isRightShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            <line x1={-3.5} y1={6} x2={3.5} y2={6} stroke={isRightShared ? '#4F46E5' : '#059669'} strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                            {isRightShared && (
                              <circle cx={0} cy={-15} r={2} fill="#4F46E5" className="pointer-events-none" />
                            )}
                            {isRightShared && (
                              <circle cx={0} cy={15} r={2} fill="#4F46E5" className="pointer-events-none" />
                            )}
                            <title>{isRightShared ? 'Ortak Duvar (Senkronize Boyutlandırma)' : 'Dış Duvar'}</title>
                          </g>

                          {/* 4 Precision Dual-Concentric Corner Handles */}
                          {/* NW */}
                          <g
                            className="cursor-nwse-resize filter drop-shadow hover:scale-130 transition-transform"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'nw', e)}
                          >
                            <circle cx={rx} cy={ry} r={8} fill="#FFFFFF" stroke="#059669" strokeWidth={2.5} />
                            <circle cx={rx} cy={ry} r={3} fill="#059669" />
                          </g>
                          {/* NE */}
                          <g
                            className="cursor-nesw-resize filter drop-shadow hover:scale-130 transition-transform"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'ne', e)}
                          >
                            <circle cx={rx + rw} cy={ry} r={8} fill="#FFFFFF" stroke="#059669" strokeWidth={2.5} />
                            <circle cx={rx + rw} cy={ry} r={3} fill="#059669" />
                          </g>
                          {/* SE */}
                          <g
                            className="cursor-nwse-resize filter drop-shadow hover:scale-130 transition-transform"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'se', e)}
                          >
                            <circle cx={rx + rw} cy={ry + rh} r={8} fill="#FFFFFF" stroke="#059669" strokeWidth={2.5} />
                            <circle cx={rx + rw} cy={ry + rh} r={3} fill="#059669" />
                          </g>
                          {/* SW */}
                          <g
                            className="cursor-nesw-resize filter drop-shadow hover:scale-130 transition-transform"
                            onMouseDown={(e) => handleMouseDownOnWall(room.id, 'sw', e)}
                          >
                            <circle cx={rx} cy={ry + rh} r={8} fill="#FFFFFF" stroke="#059669" strokeWidth={2.5} />
                            <circle cx={rx} cy={ry + rh} r={3} fill="#059669" />
                          </g>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              {/* Laser Alignment Guideline (Cyan CAD Laser) */}
              {dragFeedback?.guideline && (
                <g className="pointer-events-none">
                  {dragFeedback.guideline.orientation === 'vertical' ? (
                    <>
                      <line
                        x1={dragFeedback.guideline.val}
                        y1={0}
                        x2={dragFeedback.guideline.val}
                        y2={svgHeight}
                        stroke="#06B6D4"
                        strokeWidth={1.8}
                        strokeDasharray="6,4"
                      />
                      <rect
                        x={dragFeedback.guideline.val - 22}
                        y={PADDING - 20}
                        width={44}
                        height={16}
                        rx={4}
                        fill="#06B6D4"
                      />
                      <text
                        x={dragFeedback.guideline.val}
                        y={PADDING - 8}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        SNAP
                      </text>
                    </>
                  ) : (
                    <>
                      <line
                        x1={0}
                        y1={dragFeedback.guideline.val}
                        x2={svgWidth}
                        y2={dragFeedback.guideline.val}
                        stroke="#06B6D4"
                        strokeWidth={1.8}
                        strokeDasharray="6,4"
                      />
                      <rect
                        x={PADDING - 28}
                        y={dragFeedback.guideline.val - 8}
                        width={44}
                        height={16}
                        rx={4}
                        fill="#06B6D4"
                      />
                      <text
                        x={PADDING - 6}
                        y={dragFeedback.guideline.val + 4}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        SNAP
                      </text>
                    </>
                  )}
                </g>
              )}

              {/* Synchronized Neighbor Highlight Glow */}
              {dragFeedback?.active && dragFeedback.isShared && dragFeedback.neighborLabel && (() => {
                const neighborRoom = localRooms.find((r) => getCleanRoomLabel(r, language) === dragFeedback.neighborLabel);
                if (!neighborRoom) return null;
                const nrx = neighborRoom.x * CELL_SIZE + PADDING;
                const nry = neighborRoom.y * CELL_SIZE + PADDING;
                const nrw = neighborRoom.w * CELL_SIZE;
                const nrh = neighborRoom.h * CELL_SIZE;
                return (
                  <g className="pointer-events-none animate-pulse">
                    <rect
                      x={nrx - 3}
                      y={nry - 3}
                      width={nrw + 6}
                      height={nrh + 6}
                      fill="#6366F1"
                      fillOpacity={0.08}
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      strokeDasharray="6,4"
                      rx={6}
                    />
                    <g transform={`translate(${nrx + nrw / 2}, ${nry + nrh / 2})`}>
                      <rect
                        x={-56}
                        y={-12}
                        width={112}
                        height={24}
                        rx={12}
                        fill="#4F46E5"
                        fillOpacity={0.92}
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="Inter, system-ui"
                      >
                        🔗 Senkronize
                      </text>
                    </g>
                  </g>
                );
              })()}

              {/* Laser / Ortho Guideline Ray (0°, 45°, 90°) */}
              {dragFeedback?.laserRay && (
                <g className="laser-guideline-ray pointer-events-none">
                  <line
                    x1={dragFeedback.laserRay.x1}
                    y1={dragFeedback.laserRay.y1}
                    x2={dragFeedback.laserRay.x2}
                    y2={dragFeedback.laserRay.y2}
                    stroke="#06B6D4"
                    strokeWidth={1.8}
                    strokeDasharray="6,4"
                  />
                  <g
                    transform={`translate(${(dragFeedback.laserRay.x1 + dragFeedback.laserRay.x2) / 2}, ${(dragFeedback.laserRay.y1 + dragFeedback.laserRay.y2) / 2})`}
                  >
                    <rect x="-48" y="-18" width="96" height="18" rx="4" fill="#0891B2" />
                    <text
                      x="0"
                      y="-5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="Inter, system-ui, sans-serif"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ⚡ {dragFeedback.laserRay.label}
                    </text>
                  </g>
                </g>
              )}

              {/* Dynamic Parallel CAD Dimension Line with Oblique Ticks (cm) */}
              {dragFeedback?.dimensionLine && (
                <g className="cad-parallel-dimension pointer-events-none">
                  {/* Witness Extension Lines */}
                  <line
                    x1={dragFeedback.dimensionLine.w1[0]}
                    y1={dragFeedback.dimensionLine.w1[1]}
                    x2={dragFeedback.dimensionLine.w1[2]}
                    y2={dragFeedback.dimensionLine.w1[3]}
                    stroke="#0284C7"
                    strokeWidth={1.2}
                    strokeDasharray="2,2"
                  />
                  <line
                    x1={dragFeedback.dimensionLine.w2[0]}
                    y1={dragFeedback.dimensionLine.w2[1]}
                    x2={dragFeedback.dimensionLine.w2[2]}
                    y2={dragFeedback.dimensionLine.w2[3]}
                    stroke="#0284C7"
                    strokeWidth={1.2}
                    strokeDasharray="2,2"
                  />
                  {/* Main Parallel Dimension Line */}
                  <line
                    x1={dragFeedback.dimensionLine.x1}
                    y1={dragFeedback.dimensionLine.y1}
                    x2={dragFeedback.dimensionLine.x2}
                    y2={dragFeedback.dimensionLine.y2}
                    stroke="#0284C7"
                    strokeWidth={1.8}
                  />
                  {/* 45° Architectural Ticks */}
                  <line
                    x1={dragFeedback.dimensionLine.x1 - 4}
                    y1={dragFeedback.dimensionLine.y1 + 4}
                    x2={dragFeedback.dimensionLine.x1 + 4}
                    y2={dragFeedback.dimensionLine.y1 - 4}
                    stroke="#0284C7"
                    strokeWidth={2.5}
                  />
                  <line
                    x1={dragFeedback.dimensionLine.x2 - 4}
                    y1={dragFeedback.dimensionLine.y2 + 4}
                    x2={dragFeedback.dimensionLine.x2 + 4}
                    y2={dragFeedback.dimensionLine.y2 - 4}
                    stroke="#0284C7"
                    strokeWidth={2.5}
                  />
                  {/* Centered Dimension Label in cm */}
                  <g
                    transform={`translate(${(dragFeedback.dimensionLine.x1 + dragFeedback.dimensionLine.x2) / 2}, ${(dragFeedback.dimensionLine.y1 + dragFeedback.dimensionLine.y2) / 2})`}
                  >
                    <rect x="-34" y="-10" width="68" height="20" rx="4" fill="#0284C7" />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="JetBrains Mono, monospace, sans-serif"
                      fontSize="10"
                      fontWeight="800"
                    >
                      {dragFeedback.dimensionLine.label}
                    </text>
                  </g>
                </g>
              )}

              {/* 15 cm Node Merging Magnet Indicator Dot */}
              {dragFeedback?.nodeMergePos && (
                <g
                  transform={`translate(${dragFeedback.nodeMergePos.x}, ${dragFeedback.nodeMergePos.y})`}
                  className="pointer-events-none animate-pulse"
                >
                  <circle r="10" fill="#10B981" fillOpacity="0.3" />
                  <circle r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                  <rect x="-65" y="-24" width="130" height="18" rx="4" fill="#065F46" fillOpacity="0.95" />
                  <text
                    x="0"
                    y="-12"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="Inter, system-ui"
                  >
                    🟢 {dragFeedback.nodeMergePos.label}
                  </text>
                </g>
              )}

              {/* Floating Live CAD Measurement HUD Badge */}
              {dragFeedback?.active && (
                <g
                  className="pointer-events-none filter drop-shadow-xl"
                  transform={`translate(${Math.max(120, Math.min(svgWidth - 120, dragFeedback.hudX))}, ${Math.max(45, Math.min(svgHeight - 45, dragFeedback.hudY))})`}
                >
                  <rect
                    x={-120}
                    y={dragFeedback.isShared ? -42 : -32}
                    width={240}
                    height={dragFeedback.isShared ? 84 : 64}
                    rx={10}
                    fill="#0F172A"
                    fillOpacity={0.94}
                    stroke={dragFeedback.isShared ? '#818CF8' : '#38BDF8'}
                    strokeWidth={1.6}
                  />

                  {/* Header: Length & Delta */}
                  <text
                    x={0}
                    y={dragFeedback.isShared ? -22 : -13}
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    <tspan fill={dragFeedback.isShared ? '#A5B4FC' : '#38BDF8'}>
                      {dragFeedback.currentLengthCm ? `${dragFeedback.currentLengthCm} (${dragFeedback.currentLengthM}m)` : `${dragFeedback.currentLengthM}m`}
                    </tspan>
                    <tspan fill="#94A3B8" fontSize="11"> | </tspan>
                    <tspan fill={dragFeedback.deltaM.startsWith('+') ? '#34D399' : '#FBBF24'} fontSize="11" fontWeight="600">
                      {dragFeedback.deltaCm || dragFeedback.deltaM}
                    </tspan>
                  </text>

                  {/* Primary Room Area */}
                  <text
                    x={0}
                    y={dragFeedback.isShared ? -4 : 4}
                    textAnchor="middle"
                    fill="#CBD5E1"
                    fontSize="11"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    <tspan fontWeight="bold" fill="#F1F5F9">{dragFeedback.roomLabel}: </tspan>
                    <tspan fill="#67E8F9" fontWeight="600">{dragFeedback.roomAreaM2} m²</tspan>
                  </text>

                  {/* Shared Synchronized Neighbor Row */}
                  {dragFeedback.isShared && dragFeedback.neighborLabel && (
                    <text
                      x={0}
                      y={16}
                      textAnchor="middle"
                      fill="#C7D2FE"
                      fontSize="10.5"
                      fontWeight="600"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      🔗 {dragFeedback.neighborLabel}: <tspan fill="#A5B4FC">{dragFeedback.neighborAreaM2} m²</tspan>
                    </text>
                  )}

                  {/* Status Footer */}
                  <text
                    x={0}
                    y={dragFeedback.isShared ? 32 : 20}
                    textAnchor="middle"
                    fill={dragFeedback.isShared ? '#818CF8' : '#64748B'}
                    fontSize="9"
                    fontWeight="bold"
                    letterSpacing="0.5"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {dragFeedback.isShared ? 'ORTAK DUVAR SENKRONİZASYONU' : 'CAD ÖLÇEK KİLİTLİ'}
                  </text>
                </g>
              )}

              {/* Compass */}
              <text
                x={svgWidth - PADDING}
                y={PADDING + 10}
                textAnchor="middle"
                fontFamily="Inter, system-ui"
                fontSize="12"
                fontWeight="bold"
                fill="#334155"
              >
                N
              </text>
              <line
                x1={svgWidth - PADDING}
                y1={PADDING + 14}
                x2={svgWidth - PADDING}
                y2={PADDING + 30}
                stroke="#334155"
                strokeWidth="1.5"
              />

              {/* Scale Bar */}
              <line
                x1={PADDING}
                y1={svgHeight - 15}
                x2={PADDING + CELL_SIZE}
                y2={svgHeight - 15}
                stroke="#64748B"
                strokeWidth="1.5"
              />
              <text
                x={PADDING + CELL_SIZE / 2}
                y={svgHeight - 20}
                textAnchor="middle"
                fontFamily="Inter, system-ui"
                fontSize="9"
                fontWeight="600"
                fill="#64748B"
              >
                {layout?.scale || 1.2}m
              </text>
            </svg>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-gray-200 flex items-center justify-center">
              <Home className="w-10 h-10 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">{t.editor.noPlanTitle}</p>
              <p className="text-xs text-gray-400 max-w-sm">{t.editor.noPlanSubtitle}</p>
            </div>
          </div>
        )}

        {/* Selected Room Floating Action Bar */}
        {selectedRoom && !isGenerating && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 z-30 animate-fade-in">
            <span className="text-xs font-bold text-gray-800 pr-2 border-r border-gray-200 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
              {getCleanRoomLabel(selectedRoom, language)}
            </span>

            {/* Add Door */}
            <button
              onClick={() => addDoorToSelectedRoom('bottom')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              title={t.editor.addDoor}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>+ {t.editor.addDoor}</span>
            </button>

            {/* Add Window */}
            <button
              onClick={() => addWindowToSelectedRoom('top')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              title={t.editor.addWindow}
            >
              <AppWindow className="w-3.5 h-3.5" />
              <span>+ {t.editor.addWindow}</span>
            </button>

            {/* Lock / Unlock Room */}
            <button
              onClick={toggleLockSelectedRoom}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95',
                selectedRoom.locked
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-gray-100 hover:bg-amber-50 text-gray-700 hover:text-amber-800'
              )}
              title={
                selectedRoom.locked
                  ? language === 'tr'
                    ? 'Kilidi Aç'
                    : 'Unlock Room'
                  : language === 'tr'
                  ? 'Odayı Kilitle (AI Değiştirmesin)'
                  : "Lock Room (AI Won't Touch)"
              }
            >
              {selectedRoom.locked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'tr' ? 'Kilitli' : 'Locked'}</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-gray-500" />
                  <span>{language === 'tr' ? 'Kilitle' : 'Lock'}</span>
                </>
              )}
            </button>

            {/* Rotate Room */}
            <button
              onClick={rotateSelectedRoom}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold transition-colors"
              title={t.editor.rotateRoom}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.editor.rotateRoom}</span>
            </button>

            {/* Delete Room */}
            <button
              onClick={deleteSelectedRoom}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-xl text-xs font-bold transition-colors ml-1 active:scale-95"
              title={t.editor.deleteRoom}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.editor.deleteRoom}</span>
            </button>
          </div>
        )}

        {/* AI Refinement & Correction Floating Toolbar */}
        {layout && !isGenerating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 max-w-xl w-[92%] sm:w-auto pointer-events-auto animate-fade-in">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuickRefine();
              }}
              className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl border border-indigo-100 w-full"
            >
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span className="hidden sm:inline">
                  {language === 'tr' ? 'Hızlı İyileştir:' : 'Quick Refine:'}
                </span>
              </div>
              <input
                type="text"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder={
                  selectedRoom
                    ? language === 'tr'
                      ? `${getCleanRoomLabel(selectedRoom, language)} için örn: Büyüt, sola al...`
                      : `e.g. Enlarge ${getCleanRoomLabel(selectedRoom, language)}...`
                    : language === 'tr'
                    ? 'Örn: Salonu büyüt, Girişi sağa al, Daha ferah yap...'
                    : 'e.g. Enlarge living room, Move entrance right...'
                }
                disabled={isRefining}
                className="flex-1 min-w-[150px] sm:min-w-[260px] text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white text-gray-800 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={isRefining || !refinePrompt.trim()}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {isRefining ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{language === 'tr' ? 'Uygula' : 'Apply'}</span>
              </button>
            </form>

            {/* Quick Presets & Room Lock Status */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {localRooms.some((r) => r.locked) && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold shadow-xs">
                  <Lock className="w-2.5 h-2.5 text-amber-600" />
                  {localRooms.filter((r) => r.locked).length}{' '}
                  {language === 'tr' ? 'oda kilitli (korunuyor)' : 'rooms locked (protected)'}
                </span>
              )}
              {[
                language === 'tr' ? 'Salonu büyüt' : 'Enlarge living room',
                language === 'tr' ? 'Girişi sağa al' : 'Move entrance right',
                language === 'tr' ? 'Daha ferah yap' : 'Make more spacious',
                language === 'tr' ? 'Ebeveyn odasını genişlet' : 'Expand master bedroom',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isRefining}
                  onClick={() => handleQuickRefine(preset)}
                  className="px-2 py-0.5 rounded-lg bg-white/95 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-gray-200 text-[10px] font-medium text-gray-600 shadow-xs transition-all backdrop-blur-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  ⚡ {preset}
                </button>
              ))}
            </div>

            {/* Notification Feedback Toast */}
            {refineFeedback && (
              <div className="px-3 py-1 rounded-xl bg-slate-900/90 text-white text-xs font-medium shadow-xl border border-slate-700 flex items-center gap-1.5 animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{refineFeedback}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
