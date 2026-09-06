import { create } from 'zustand';

export type BuildingStyle = 'modern' | 'courtyard' | 'pavilion';

export interface WizardRoomItem {
  id: string;
  type: string;
  label: string;
  targetArea?: number;
}

export interface FloorProgram {
  level: number; // 0: Zemin, 1: 1. Kat, 2: 2. Kat, -1: Bodrum, 99: Çatı
  name: string;
  elevation: number;
  rooms: WizardRoomItem[];
}

export interface WizardState {
  isOpen: boolean;
  step: number; // 1, 2, 3, 4

  // Step 1: Arsa & Temel Parametreler
  lotWidth: number; // meters (e.g. 20)
  lotDepth: number; // meters (e.g. 25)
  northOrientation: number; // degrees (0-360)
  targetArea: number; // total square meters (e.g. 200)

  // Step 2: Kat Sayısı ve Tipoloji
  floorsCount: 1 | 2 | 3; // 1: Tek Katlı, 2: Dubleks, 3: Tripleks
  hasBasement: boolean;
  hasAttic: boolean;
  buildingStyle: BuildingStyle;

  // Step 3: İhtiyaç Programı (Kat Bazlı Zonlama)
  floorPrograms: FloorProgram[];

  // Step 4: Durum
  isGenerating: boolean;
  generatedFloorPlan: any | null;
  error: string | null;

  // Actions
  openWizard: () => void;
  closeWizard: () => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setLotParams: (params: {
    lotWidth?: number;
    lotDepth?: number;
    northOrientation?: number;
    targetArea?: number;
  }) => void;

  setTypology: (params: {
    floorsCount?: 1 | 2 | 3;
    hasBasement?: boolean;
    hasAttic?: boolean;
    buildingStyle?: BuildingStyle;
  }) => void;

  setFloorPrograms: (programs: FloorProgram[]) => void;
  addRoomToFloor: (level: number, room: Omit<WizardRoomItem, 'id'>) => void;
  removeRoomFromFloor: (level: number, roomId: string) => void;
  applyPresetProgram: (floorsCount: 1 | 2 | 3, hasBasement: boolean, hasAttic: boolean) => void;

  setIsGenerating: (loading: boolean) => void;
  setGeneratedResult: (result: any) => void;
  setError: (err: string | null) => void;
  resetWizard: () => void;
}

export function getDefaultPrograms(
  floorsCount: 1 | 2 | 3,
  hasBasement: boolean,
  hasAttic: boolean
): FloorProgram[] {
  const programs: FloorProgram[] = [];

  // Bodrum kat opsiyonu
  if (hasBasement) {
    programs.push({
      level: -1,
      name: 'Bodrum Kat',
      elevation: -2.8,
      rooms: [
        { id: 'b-stair', type: 'staircase', label: 'Merdiven Kovası', targetArea: 10 },
        { id: 'b-tech', type: 'shaft', label: 'Mekanik & Tesisat Odası', targetArea: 16 },
        { id: 'b-store', type: 'storage', label: 'Depo & Kiler', targetArea: 18 },
        { id: 'b-hobby', type: 'living', label: 'Hobi / Sinema Odası', targetArea: 28 },
      ],
    });
  }

  // Zemin Kat
  if (floorsCount === 1) {
    programs.push({
      level: 0,
      name: 'Zemin Kat',
      elevation: 0.0,
      rooms: [
        { id: 'z-hall', type: 'hallway', label: 'Giriş Holü & Vestiyer', targetArea: 12 },
        { id: 'z-living', type: 'living', label: 'Geniş Salon & Şömine', targetArea: 42 },
        { id: 'z-kitchen', type: 'kitchen', label: 'Ada Mutfak & Kiler', targetArea: 20 },
        { id: 'z-dining', type: 'dining', label: 'Yemek Alanı', targetArea: 16 },
        { id: 'z-master', type: 'bedroom', label: 'Ebeveyn Yatak Odası', targetArea: 22 },
        { id: 'z-bath1', type: 'bathroom', label: 'Ebeveyn Banyosu', targetArea: 6 },
        { id: 'z-bed2', type: 'bedroom', label: 'Yatak Odası 2', targetArea: 15 },
        { id: 'z-bath2', type: 'bathroom', label: 'Genel Banyo & WC', targetArea: 7 },
        { id: 'z-terrace', type: 'balcony', label: 'Bahçe Verandası', targetArea: 24 },
      ],
    });
  } else {
    // Çok katlı için Zemin Kat: Yaşam & Sirkülasyon
    programs.push({
      level: 0,
      name: 'Zemin Kat',
      elevation: 0.0,
      rooms: [
        { id: 'z-hall', type: 'hallway', label: 'Giriş Holü & Vestiyer', targetArea: 14 },
        { id: 'z-stair', type: 'staircase', label: 'Ana Merdiven Kovası', targetArea: 12 },
        { id: 'z-living', type: 'living', label: 'Galeri Tavanlı Salon', targetArea: 48 },
        { id: 'z-kitchen', type: 'kitchen', label: 'Ada Tezgâhlı Mutfak', targetArea: 22 },
        { id: 'z-dining', type: 'dining', label: 'Yemek Salonu', targetArea: 18 },
        { id: 'z-wc', type: 'bathroom', label: 'Misafir WC & Lavabo', targetArea: 4 },
        { id: 'z-shaft', type: 'shaft', label: 'Tesisat Şaftı', targetArea: 3 },
        { id: 'z-terrace', type: 'balcony', label: 'Bahçe Verandası & Teras', targetArea: 25 },
      ],
    });

    // 1. Kat: Gece Alanları & Galeri Boşluğu
    programs.push({
      level: 1,
      name: '1. Kat',
      elevation: 3.0,
      rooms: [
        { id: 'f1-hall', type: 'hallway', label: 'Üst Kat Galeri Holü', targetArea: 12 },
        { id: 'f1-stair', type: 'staircase', label: 'Merdiven Kovası', targetArea: 12 },
        { id: 'f1-void', type: 'void', label: 'Salon Üzeri Galeri Boşluğu', targetArea: 20 },
        { id: 'f1-master', type: 'bedroom', label: 'Ebeveyn Süiti', targetArea: 26 },
        { id: 'f1-mbath', type: 'bathroom', label: 'Ebeveyn Banyosu', targetArea: 8 },
        { id: 'f1-bed2', type: 'bedroom', label: 'Yatak Odası 2', targetArea: 16 },
        { id: 'f1-bed3', type: 'bedroom', label: 'Yatak Odası 3', targetArea: 15 },
        { id: 'f1-bath', type: 'bathroom', label: 'Ortak Aile Banyosu', targetArea: 7 },
        { id: 'f1-laundry', type: 'laundry', label: 'Çamaşır Odası & Şaft', targetArea: 6 },
        { id: 'f1-shaft', type: 'shaft', label: 'Tesisat Şaftı', targetArea: 3 },
        { id: 'f1-balcony', type: 'balcony', label: 'Yatak Odası Balkonu', targetArea: 8 },
      ],
    });

    // 2. Kat (Tripleks ise)
    if (floorsCount >= 3) {
      programs.push({
        level: 2,
        name: '2. Kat',
        elevation: 6.0,
        rooms: [
          { id: 'f2-hall', type: 'hallway', label: 'Çalışma & Lounge Holü', targetArea: 14 },
          { id: 'f2-stair', type: 'staircase', label: 'Merdiven Kovası', targetArea: 12 },
          { id: 'f2-office', type: 'office', label: 'Çalışma Ofisi / Kütüphane', targetArea: 22 },
          { id: 'f2-guest', type: 'bedroom', label: 'Misafir Süiti', targetArea: 18 },
          { id: 'f2-bath', type: 'bathroom', label: 'Misafir Banyosu', targetArea: 6 },
          { id: 'f2-shaft', type: 'shaft', label: 'Tesisat Şaftı', targetArea: 3 },
          { id: 'f2-roof-terrace', type: 'balcony', label: 'Geniş Çatı Terası', targetArea: 35 },
        ],
      });
    }
  }

  // Çatı Katı opsiyonu
  if (hasAttic) {
    programs.push({
      level: 99,
      name: 'Çatı Katı / Teras',
      elevation: floorsCount * 3.0,
      rooms: [
        { id: 'attic-stair', type: 'staircase', label: 'Merdiven Çıkışı', targetArea: 10 },
        { id: 'attic-lounge', type: 'living', label: 'Çatı Lounge & Bar', targetArea: 30 },
        { id: 'attic-terrace', type: 'balcony', label: 'Panoramik Güneşlenme Terası', targetArea: 40 },
      ],
    });
  }

  return programs;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  isOpen: false,
  step: 1,

  // Defaults
  lotWidth: 22,
  lotDepth: 28,
  northOrientation: 0,
  targetArea: 220,

  floorsCount: 2,
  hasBasement: false,
  hasAttic: false,
  buildingStyle: 'modern',

  floorPrograms: getDefaultPrograms(2, false, false),

  isGenerating: false,
  generatedFloorPlan: null,
  error: null,

  openWizard: () => set({ isOpen: true, step: 1, error: null }),
  closeWizard: () => set({ isOpen: false }),
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(4, state.step + 1) })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),

  setLotParams: (params) =>
    set((state) => ({
      ...state,
      ...params,
    })),

  setTypology: (params) => {
    set((state) => {
      const newFloorsCount = params.floorsCount ?? state.floorsCount;
      const newHasBasement = params.hasBasement ?? state.hasBasement;
      const newHasAttic = params.hasAttic ?? state.hasAttic;
      const newBuildingStyle = params.buildingStyle ?? state.buildingStyle;

      const shouldRebuild =
        params.floorsCount !== undefined ||
        params.hasBasement !== undefined ||
        params.hasAttic !== undefined;

      const floorPrograms = shouldRebuild
        ? getDefaultPrograms(newFloorsCount, newHasBasement, newHasAttic)
        : state.floorPrograms;

      return {
        ...state,
        floorsCount: newFloorsCount,
        hasBasement: newHasBasement,
        hasAttic: newHasAttic,
        buildingStyle: newBuildingStyle,
        floorPrograms,
      };
    });
  },

  setFloorPrograms: (programs) => set({ floorPrograms: programs }),

  addRoomToFloor: (level, room) => {
    set((state) => {
      const updated = state.floorPrograms.map((fp) => {
        if (fp.level !== level) return fp;
        const newId = `${room.type}-${Date.now()}`;
        return {
          ...fp,
          rooms: [...fp.rooms, { ...room, id: newId }],
        };
      });
      return { floorPrograms: updated };
    });
  },

  removeRoomFromFloor: (level, roomId) => {
    set((state) => {
      const updated = state.floorPrograms.map((fp) => {
        if (fp.level !== level) return fp;
        return {
          ...fp,
          rooms: fp.rooms.filter((r) => r.id !== roomId),
        };
      });
      return { floorPrograms: updated };
    });
  },

  applyPresetProgram: (floorsCount, hasBasement, hasAttic) => {
    set({
      floorPrograms: getDefaultPrograms(floorsCount, hasBasement, hasAttic),
    });
  },

  setIsGenerating: (loading) => set({ isGenerating: loading }),
  setGeneratedResult: (result) => set({ generatedFloorPlan: result }),
  setError: (err) => set({ error: err }),

  resetWizard: () =>
    set({
      step: 1,
      lotWidth: 22,
      lotDepth: 28,
      northOrientation: 0,
      targetArea: 220,
      floorsCount: 2,
      hasBasement: false,
      hasAttic: false,
      buildingStyle: 'modern',
      floorPrograms: getDefaultPrograms(2, false, false),
      isGenerating: false,
      generatedFloorPlan: null,
      error: null,
    }),
}));
