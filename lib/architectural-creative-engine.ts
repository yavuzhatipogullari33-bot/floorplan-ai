import { FloorPlanLayout, RoomLayout, getCleanRoomLabel } from '@/lib/svg-generator';

export interface CreativeGenerateOptions {
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  totalArea?: number;
  style?: string;
  extras?: string[];
  lang?: 'tr' | 'en';
}

/**
 * PARSES USER NATURAL LANGUAGE PROMPT TO DETECT ARCHITECTURAL INTENT
 */
export function parseArchitecturalPrompt(description: string = '', style: string = '') {
  const rawText = `${description} ${style}`.toLowerCase();
  const text = rawText.replace(/[-_]/g, ' ');

  const isLShape =
    text.includes('l seklinde') ||
    text.includes('l şeklinde') ||
    text.includes('l tipi') ||
    text.includes('l shaped') ||
    text.includes('l plan');

  const isCourtyard =
    text.includes('avlu') ||
    text.includes('u şeklinde') ||
    text.includes('u tipi') ||
    text.includes('u-tipi') ||
    text.includes('courtyard') ||
    text.includes('atrium') ||
    text.includes('havuzlu') ||
    text.includes('patio');

  const isLoft =
    text.includes('loft') ||
    text.includes('stüdyo') ||
    text.includes('studio') ||
    text.includes('açık plan') ||
    text.includes('open plan') ||
    text.includes('endüstriyel') ||
    text.includes('industrial');

  const isTraditionalSofa =
    text.includes('sofa') ||
    text.includes('karnıyarık') ||
    text.includes('türk evi') ||
    text.includes('geleneksel') ||
    text.includes('konak') ||
    text.includes('yalı') ||
    text.includes('traditional');

  const isMediterranean =
    text.includes('akdeniz') ||
    text.includes('ege') ||
    text.includes('mediterranean') ||
    text.includes('yazlık') ||
    text.includes('taş ev') ||
    text.includes('veranda') ||
    text.includes('bodrum');

  const isPenthouse =
    text.includes('penthouse') ||
    text.includes('çatı katı') ||
    text.includes('rezidans') ||
    text.includes('panoramik') ||
    text.includes('lüks villa') ||
    text.includes('malikane');

  const hasOffice =
    text.includes('çalışma') ||
    text.includes('ofis') ||
    text.includes('office') ||
    text.includes('kütüphane') ||
    text.includes('study');

  const hasWalkInCloset =
    text.includes('giyinme') ||
    text.includes('closet') ||
    text.includes('gardırop odası') ||
    text.includes('dressing');

  const hasEnsuite =
    text.includes('ebeveyn banyo') ||
    text.includes('özel banyo') ||
    text.includes('en-suite') ||
    text.includes('ensuite');

  const hasTerrace =
    text.includes('teras') ||
    text.includes('balkon') ||
    text.includes('terrace') ||
    text.includes('balcony') ||
    text.includes('veranda');

  return {
    isLShape,
    isCourtyard,
    isLoft,
    isTraditionalSofa,
    isMediterranean,
    isPenthouse,
    hasOffice,
    hasWalkInCloset,
    hasEnsuite,
    hasTerrace,
  };
}

/**
 * Accurately calculates meters per grid unit so that the sum of all room areas
 * matches the user's requested totalArea precisely (Neufert precision).
 */
export function calculatePreciseScale(rooms: RoomLayout[], targetArea: number): number {
  const totalGridUnits = rooms.reduce((acc, r) => acc + (r.w * r.h), 0);
  if (totalGridUnits <= 0) return 1.0;
  return Math.sqrt(targetArea / totalGridUnits);
}

/**
 * 1. L-SHAPED VILLA PLAN (L-Tipi Manzara & Bahçe Villası)
 * Gündüz kanadı (Salon + Mutfak) ile gece kanadı (Yatak odaları) 90° L formunda birleşir.
 * İç köşede geniş bir peyzaj/havuz terası yer alır.
 */
export function generateLShapedPlan(opts: CreativeGenerateOptions): FloorPlanLayout {
  const { bedrooms = 3, totalArea = 120, lang = 'tr' } = opts;
  const rooms: RoomLayout[] = [];

  const gridW = 16;
  const gridH = 12;

  // Horizontal Wing (Top - Living & Entertaining)
  rooms.push({
    id: 'living',
    label: lang === 'tr' ? 'Manzara Salonu' : 'Panoramic Living',
    type: 'living',
    x: 0,
    y: 0,
    w: 7,
    h: 5,
    doors: [{ wall: 'right', position: 0.5, width: 28 }, { wall: 'bottom', position: 0.6, width: 28 }],
    windows: [{ wall: 'top', position: 0.5, width: 48 }, { wall: 'left', position: 0.5, width: 40 }],
  });

  rooms.push({
    id: 'dining',
    label: lang === 'tr' ? 'Yemek Alanı' : 'Dining Area',
    type: 'dining',
    x: 7,
    y: 0,
    w: 4,
    h: 4,
    doors: [{ wall: 'left', position: 0.5, width: 24 }, { wall: 'right', position: 0.5, width: 24 }],
    windows: [{ wall: 'top', position: 0.5, width: 34 }],
  });

  rooms.push({
    id: 'kitchen',
    label: lang === 'tr' ? 'Mutfak & Ada' : 'Kitchen & Island',
    type: 'kitchen',
    x: 11,
    y: 0,
    w: 5,
    h: 4,
    doors: [{ wall: 'left', position: 0.5, width: 24 }, { wall: 'bottom', position: 0.5, width: 26 }],
    windows: [{ wall: 'top', position: 0.5, width: 36 }, { wall: 'right', position: 0.5, width: 32 }],
  });

  // Central Entry & Gallery Foyer (Köşe Birleşim Aksı)
  rooms.push({
    id: 'foyer',
    label: lang === 'tr' ? 'Giriş Holü / Galeri' : 'Entry Foyer',
    type: 'hallway',
    x: 0,
    y: 5,
    w: 4,
    h: 2,
    doors: [{ wall: 'left', position: 0.5, width: 26 }, { wall: 'right', position: 0.5, width: 24 }, { wall: 'top', position: 0.5, width: 24 }],
  });

  // Vertical Wing (Left - Private Bedrooms)
  rooms.push({
    id: 'master-bed',
    label: lang === 'tr' ? 'Ebeveyn Süiti' : 'Master Suite',
    type: 'bedroom',
    x: 0,
    y: 7,
    w: 5,
    h: 5,
    doors: [{ wall: 'top', position: 0.5, width: 24 }],
    windows: [{ wall: 'left', position: 0.5, width: 40 }, { wall: 'bottom', position: 0.5, width: 40 }],
  });

  rooms.push({
    id: 'bath-ensuite',
    label: lang === 'tr' ? 'Ebeveyn Banyosu' : 'En-suite Bath',
    type: 'bathroom',
    x: 5,
    y: 7,
    w: 2.5,
    h: 2.5,
    doors: [{ wall: 'left', position: 0.5, width: 22 }],
    windows: [{ wall: 'right', position: 0.5, width: 18 }],
  });

  rooms.push({
    id: 'bath-main',
    label: lang === 'tr' ? 'Genel Banyo' : 'Main Bath',
    type: 'bathroom',
    x: 5,
    y: 9.5,
    w: 2.5,
    h: 2.5,
    doors: [{ wall: 'left', position: 0.5, width: 22 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 18 }],
  });

  if (bedrooms >= 2) {
    rooms.push({
      id: 'bed-2',
      label: lang === 'tr' ? 'Yatak Odası 2' : 'Bedroom 2',
      type: 'bedroom',
      x: 7.5,
      y: 7,
      w: 3.5,
      h: 5,
      doors: [{ wall: 'left', position: 0.3, width: 24 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 32 }],
    });
  }

  if (bedrooms >= 3) {
    rooms.push({
      id: 'bed-3',
      label: lang === 'tr' ? 'Misafir Yatak Odası' : 'Guest Bedroom',
      type: 'bedroom',
      x: 11,
      y: 7,
      w: 4,
      h: 5,
      doors: [{ wall: 'left', position: 0.5, width: 24 }],
      windows: [{ wall: 'bottom', position: 0.5, width: 32 }, { wall: 'right', position: 0.5, width: 32 }],
    });
  }

  // L-Shaped Inner Garden / Terrace (L'nin iç avlusu)
  rooms.push({
    id: 'patio-terrace',
    label: lang === 'tr' ? 'L-Veranda & Havuz Terası' : 'L-Patio & Pool Terrace',
    type: 'balcony',
    x: 4,
    y: 4,
    w: 11,
    h: 3,
    doors: [{ wall: 'top', position: 0.3, width: 28 }, { wall: 'left', position: 0.5, width: 24 }],
  });

  const scale = calculatePreciseScale(rooms, totalArea);

  return {
    rooms,
    totalArea,
    gridWidth: gridW,
    gridHeight: gridH,
    scale,
  };
}

/**
 * 2. U-SHAPED COURTYARD PLAN (İç Avlulu Rezidans / Malikane)
 * Ortasında korunaklı huzurlu bir iç avlu (atrium/havuz) ve çevresinde cam koridorlarla bağlı 3 kanat.
 */
export function generateCourtyardPlan(opts: CreativeGenerateOptions): FloorPlanLayout {
  const { bedrooms = 3, totalArea = 120, lang = 'tr' } = opts;
  const rooms: RoomLayout[] = [];

  const gridW = 16;
  const gridH = 11;

  // Left Wing: Social Living Wing
  rooms.push({
    id: 'living',
    label: lang === 'tr' ? 'Avlu Salonu' : 'Courtyard Living',
    type: 'living',
    x: 0,
    y: 0,
    w: 5,
    h: 6,
    doors: [{ wall: 'right', position: 0.5, width: 30 }, { wall: 'bottom', position: 0.5, width: 26 }],
    windows: [{ wall: 'left', position: 0.5, width: 44 }, { wall: 'top', position: 0.5, width: 36 }],
  });

  rooms.push({
    id: 'dining',
    label: lang === 'tr' ? 'Yemek Salonu' : 'Dining Room',
    type: 'dining',
    x: 0,
    y: 6,
    w: 5,
    h: 5,
    doors: [{ wall: 'top', position: 0.5, width: 26 }, { wall: 'right', position: 0.5, width: 26 }],
    windows: [{ wall: 'left', position: 0.5, width: 36 }, { wall: 'bottom', position: 0.5, width: 36 }],
  });

  // Center Top: Entrance Foyer & Glass Gallery
  rooms.push({
    id: 'foyer-gallery',
    label: lang === 'tr' ? 'Cam Giriş Galerisi' : 'Glazed Gallery Foyer',
    type: 'hallway',
    x: 5,
    y: 0,
    w: 6,
    h: 2.5,
    doors: [{ wall: 'top', position: 0.5, width: 30 }, { wall: 'left', position: 0.5, width: 26 }, { wall: 'right', position: 0.5, width: 26 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 40 }],
  });

  // Center: The Open Courtyard / Atrium (İç Avlu)
  rooms.push({
    id: 'courtyard',
    label: lang === 'tr' ? 'Huzur Avlusu & Havuz' : 'Central Courtyard & Pool',
    type: 'balcony',
    x: 5,
    y: 2.5,
    w: 6,
    h: 5.5,
    doors: [{ wall: 'top', position: 0.5, width: 26 }, { wall: 'left', position: 0.5, width: 26 }, { wall: 'right', position: 0.5, width: 26 }],
  });

  // Center Bottom: Open Chef Kitchen connected to Courtyard
  rooms.push({
    id: 'kitchen',
    label: lang === 'tr' ? 'Ada Mutfak & Bahçe Servisi' : 'Chef Island Kitchen',
    type: 'kitchen',
    x: 5,
    y: 8,
    w: 6,
    h: 3,
    doors: [{ wall: 'top', position: 0.5, width: 26 }, { wall: 'left', position: 0.5, width: 24 }, { wall: 'right', position: 0.5, width: 24 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 36 }],
  });

  // Right Wing: Private Retreat (Master Suite & Guest Rooms)
  rooms.push({
    id: 'master-bed',
    label: lang === 'tr' ? 'Ebeveyn Süiti' : 'Master Suite',
    type: 'bedroom',
    x: 11,
    y: 0,
    w: 5,
    h: 5.5,
    doors: [{ wall: 'left', position: 0.3, width: 24 }],
    windows: [{ wall: 'top', position: 0.5, width: 36 }, { wall: 'right', position: 0.5, width: 40 }],
  });

  rooms.push({
    id: 'bath-ensuite',
    label: lang === 'tr' ? 'Ebeveyn Banyosu' : 'En-suite Bath',
    type: 'bathroom',
    x: 11,
    y: 5.5,
    w: 2.5,
    h: 2.5,
    doors: [{ wall: 'top', position: 0.5, width: 22 }],
    windows: [{ wall: 'right', position: 0.5, width: 20 }],
  });

  rooms.push({
    id: 'bath-main',
    label: lang === 'tr' ? 'Genel Banyo' : 'Main Bath',
    type: 'bathroom',
    x: 13.5,
    y: 5.5,
    w: 2.5,
    h: 2.5,
    doors: [{ wall: 'bottom', position: 0.5, width: 22 }],
    windows: [{ wall: 'right', position: 0.5, width: 20 }],
  });

  rooms.push({
    id: 'bed-2',
    label: lang === 'tr' ? 'Konuk / Yatak Odası 2' : 'Bedroom 2',
    type: 'bedroom',
    x: 11,
    y: 8,
    w: 5,
    h: 3,
    doors: [{ wall: 'left', position: 0.5, width: 24 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 32 }, { wall: 'right', position: 0.5, width: 32 }],
  });

  const scale = calculatePreciseScale(rooms, totalArea);

  return {
    rooms,
    totalArea,
    gridWidth: gridW,
    gridHeight: gridH,
    scale,
  };
}

/**
 * 3. OPEN-CONCEPT INDUSTRIAL LOFT PLAN (Akıcı Açık Konsept Loft)
 * Bölme duvarların minimum olduğu, yüksek ferahlık, ada tezgah ve bütünleşik yaşam kurgusu.
 */
export function generateLoftPlan(opts: CreativeGenerateOptions): FloorPlanLayout {
  const { bedrooms = 1, totalArea = 120, lang = 'tr' } = opts;
  const rooms: RoomLayout[] = [];

  const gridW = 14;
  const gridH = 9;

  // Grand Open Great Room (Salon + Yemek + Galeri)
  rooms.push({
    id: 'living',
    label: lang === 'tr' ? 'Açık Loft Yaşam Alanı' : 'Open Loft Great Room',
    type: 'living',
    x: 0,
    y: 0,
    w: 8,
    h: 6,
    doors: [{ wall: 'bottom', position: 0.5, width: 28 }, { wall: 'right', position: 0.5, width: 28 }],
    windows: [{ wall: 'top', position: 0.3, width: 50 }, { wall: 'left', position: 0.5, width: 50 }],
  });

  // Sculptural Island Kitchen
  rooms.push({
    id: 'kitchen',
    label: lang === 'tr' ? 'Monolitik Ada Mutfak' : 'Island Kitchen',
    type: 'kitchen',
    x: 8,
    y: 0,
    w: 6,
    h: 3.5,
    doors: [{ wall: 'left', position: 0.5, width: 26 }],
    windows: [{ wall: 'top', position: 0.5, width: 44 }, { wall: 'right', position: 0.5, width: 30 }],
  });

  // Minimalist Dining
  rooms.push({
    id: 'dining',
    label: lang === 'tr' ? 'Yemek Bölümü' : 'Dining Nook',
    type: 'dining',
    x: 8,
    y: 3.5,
    w: 6,
    h: 2.5,
    doors: [{ wall: 'left', position: 0.5, width: 26 }, { wall: 'bottom', position: 0.5, width: 24 }],
    windows: [{ wall: 'right', position: 0.5, width: 30 }],
  });

  // Elevated Bedroom Suite
  rooms.push({
    id: 'master-bed',
    label: lang === 'tr' ? 'Loft Yatak Odası Süiti' : 'Master Bed Enclave',
    type: 'bedroom',
    x: 0,
    y: 6,
    w: 6,
    h: 3,
    doors: [{ wall: 'top', position: 0.5, width: 26 }, { wall: 'right', position: 0.5, width: 24 }],
    windows: [{ wall: 'left', position: 0.5, width: 36 }, { wall: 'bottom', position: 0.5, width: 36 }],
  });

  // Spa Bathroom
  rooms.push({
    id: 'bath-spa',
    label: lang === 'tr' ? 'Spa Banyo & Walk-in Duş' : 'Spa Bath & Walk-in Shower',
    type: 'bathroom',
    x: 6,
    y: 6,
    w: 4,
    h: 3,
    doors: [{ wall: 'left', position: 0.5, width: 22 }, { wall: 'top', position: 0.5, width: 22 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 24 }],
  });

  // Creative Office / Study Nook
  rooms.push({
    id: 'office',
    label: lang === 'tr' ? 'Çalışma & Sanat Köşesi' : 'Studio / Home Office',
    type: 'office',
    x: 10,
    y: 6,
    w: 4,
    h: 3,
    doors: [{ wall: 'top', position: 0.5, width: 24 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 28 }, { wall: 'right', position: 0.5, width: 28 }],
  });

  const scale = calculatePreciseScale(rooms, totalArea);

  return {
    rooms,
    totalArea,
    gridWidth: gridW,
    gridHeight: gridH,
    scale,
  };
}

/**
 * 4. TRADITIONAL OTTOMAN/TURKISH SOFALI PLAN (Karnıyarık / Orta Sofalı Konak)
 * Merkezde görkemli sofa (yaşam ve toplanma salonu), dört köşede bağımsız ferah köşk odalar.
 */
export function generateSofaliPlan(opts: CreativeGenerateOptions): FloorPlanLayout {
  const { bedrooms = 4, totalArea = 120, lang = 'tr' } = opts;
  const rooms: RoomLayout[] = [];

  const gridW = 15;
  const gridH = 11;

  // Top-Left: Baş Oda (Master Room)
  rooms.push({
    id: 'master-bed',
    label: lang === 'tr' ? 'Baş Oda (Ebeveyn Odası)' : 'Primary Chamber',
    type: 'bedroom',
    x: 0,
    y: 0,
    w: 5,
    h: 4.5,
    doors: [{ wall: 'right', position: 0.7, width: 24 }],
    windows: [{ wall: 'top', position: 0.5, width: 36 }, { wall: 'left', position: 0.5, width: 36 }],
  });

  // Top-Right: Konuk Odası / Selamlık
  rooms.push({
    id: 'bed-2',
    label: lang === 'tr' ? 'Köşk Odası (Misafir)' : 'Guest Chamber',
    type: 'bedroom',
    x: 10,
    y: 0,
    w: 5,
    h: 4.5,
    doors: [{ wall: 'left', position: 0.7, width: 24 }],
    windows: [{ wall: 'top', position: 0.5, width: 36 }, { wall: 'right', position: 0.5, width: 36 }],
  });

  // Center: The Grand Central Sofa (Orta Sofa / Karnıyarık Salonu)
  rooms.push({
    id: 'living',
    label: lang === 'tr' ? 'Orta Sofa (Merkez Salon)' : 'Central Grand Hall (Sofa)',
    type: 'living',
    x: 5,
    y: 0,
    w: 5,
    h: 11,
    doors: [
      { wall: 'left', position: 0.2, width: 24 },
      { wall: 'right', position: 0.2, width: 24 },
      { wall: 'left', position: 0.8, width: 24 },
      { wall: 'right', position: 0.8, width: 24 },
      { wall: 'bottom', position: 0.5, width: 30 }, // Cümle Kapısı (Giriş)
    ],
    windows: [{ wall: 'top', position: 0.5, width: 44 }], // Cihannüma / Eyvan penceresi
  });

  // Middle-Left: En-suite / Hamam Banyo
  rooms.push({
    id: 'bath-1',
    label: lang === 'tr' ? 'Geleneksel Banyo / Hamam' : 'Hamam / Bath',
    type: 'bathroom',
    x: 0,
    y: 4.5,
    w: 5,
    h: 2,
    doors: [{ wall: 'right', position: 0.5, width: 22 }],
    windows: [{ wall: 'left', position: 0.5, width: 20 }],
  });

  // Middle-Right: Kiler & Servis
  rooms.push({
    id: 'storage',
    label: lang === 'tr' ? 'Kiler & Hazırlık' : 'Pantry & Service',
    type: 'storage',
    x: 10,
    y: 4.5,
    w: 5,
    h: 2,
    doors: [{ wall: 'left', position: 0.5, width: 22 }],
    windows: [{ wall: 'right', position: 0.5, width: 20 }],
  });

  // Bottom-Left: Mutfak & Yemek
  rooms.push({
    id: 'kitchen',
    label: lang === 'tr' ? 'Aşevi / Mutfak' : 'Kitchen & Pantry',
    type: 'kitchen',
    x: 0,
    y: 6.5,
    w: 5,
    h: 4.5,
    doors: [{ wall: 'right', position: 0.3, width: 24 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 36 }, { wall: 'left', position: 0.5, width: 36 }],
  });

  // Bottom-Right: Yatak Odası 3 / Çalışma
  rooms.push({
    id: 'bed-3',
    label: lang === 'tr' ? 'Çalışma & Dinlenme Odası' : 'Study / Chamber 3',
    type: 'bedroom',
    x: 10,
    y: 6.5,
    w: 5,
    h: 4.5,
    doors: [{ wall: 'left', position: 0.3, width: 24 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 36 }, { wall: 'right', position: 0.5, width: 36 }],
  });

  const scale = calculatePreciseScale(rooms, totalArea);

  return {
    rooms,
    totalArea,
    gridWidth: gridW,
    gridHeight: gridH,
    scale,
  };
}

/**
 * 5. MEDITERRANEAN / AEGEAN STONE VILLA (Akdeniz & Ege Taş Villası)
 * Gölgeli geniş verandalar, açık hava mutfağı bağlantısı, ferah çapraz havalandırma.
 */
export function generateMediterraneanPlan(opts: CreativeGenerateOptions): FloorPlanLayout {
  const { bedrooms = 3, totalArea = 120, lang = 'tr' } = opts;
  const rooms: RoomLayout[] = [];

  const gridW = 15;
  const gridH = 10;

  // Salon - High ceiling stone fireplace living
  rooms.push({
    id: 'living',
    label: lang === 'tr' ? 'Akdeniz Salonu' : 'Mediterranean Salon',
    type: 'living',
    x: 0,
    y: 0,
    w: 6.5,
    h: 5.5,
    doors: [{ wall: 'bottom', position: 0.5, width: 32 }, { wall: 'right', position: 0.5, width: 28 }],
    windows: [{ wall: 'top', position: 0.5, width: 44 }, { wall: 'left', position: 0.5, width: 40 }],
  });

  // Open Kitchen with Outdoor Terrace pass-through
  rooms.push({
    id: 'kitchen',
    label: lang === 'tr' ? 'Ege Açık Mutfağı' : 'Aegean Open Kitchen',
    type: 'kitchen',
    x: 6.5,
    y: 0,
    w: 4.5,
    h: 4,
    doors: [{ wall: 'left', position: 0.5, width: 26 }, { wall: 'bottom', position: 0.5, width: 26 }],
    windows: [{ wall: 'top', position: 0.5, width: 34 }],
  });

  // Dining Pergola / Dining Room
  rooms.push({
    id: 'dining',
    label: lang === 'tr' ? 'Yemek Köşesi' : 'Dining Pergola',
    type: 'dining',
    x: 11,
    y: 0,
    w: 4,
    h: 4,
    doors: [{ wall: 'left', position: 0.5, width: 24 }],
    windows: [{ wall: 'top', position: 0.5, width: 30 }, { wall: 'right', position: 0.5, width: 30 }],
  });

  // Central Pergola Terrace (Geniş Asmalı Veranda)
  rooms.push({
    id: 'terrace',
    label: lang === 'tr' ? 'Geniş Asmalı Veranda' : 'Shaded Pergola Veranda',
    type: 'balcony',
    x: 0,
    y: 5.5,
    w: 7,
    h: 4.5,
    doors: [{ wall: 'top', position: 0.5, width: 30 }, { wall: 'right', position: 0.5, width: 26 }],
  });

  // Night Zone Corridor
  rooms.push({
    id: 'hallway',
    label: lang === 'tr' ? 'Taş Hol' : 'Stone Corridor',
    type: 'hallway',
    x: 7,
    y: 4,
    w: 8,
    h: 1.5,
    doors: [
      { wall: 'left', position: 0.5, width: 24 },
      { wall: 'top', position: 0.3, width: 24 },
      { wall: 'bottom', position: 0.3, width: 24 },
      { wall: 'bottom', position: 0.8, width: 24 },
    ],
  });

  // Master Suite with Private Stone Balcony
  rooms.push({
    id: 'master-bed',
    label: lang === 'tr' ? 'Ebeveyn Taş Odası' : 'Master Suite',
    type: 'bedroom',
    x: 7,
    y: 5.5,
    w: 4.5,
    h: 4.5,
    doors: [{ wall: 'top', position: 0.5, width: 24 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 32 }],
  });

  // En-suite Bath
  rooms.push({
    id: 'bath-ensuite',
    label: lang === 'tr' ? 'Ebeveyn Banyosu' : 'En-suite Bath',
    type: 'bathroom',
    x: 11.5,
    y: 4,
    w: 3.5,
    h: 2.5,
    doors: [{ wall: 'left', position: 0.5, width: 22 }],
    windows: [{ wall: 'right', position: 0.5, width: 20 }],
  });

  // Secondary Bedroom / Guest
  rooms.push({
    id: 'bed-2',
    label: lang === 'tr' ? 'Misafir Yatak Odası' : 'Guest Room',
    type: 'bedroom',
    x: 11.5,
    y: 6.5,
    w: 3.5,
    h: 3.5,
    doors: [{ wall: 'top', position: 0.5, width: 24 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 30 }, { wall: 'right', position: 0.5, width: 30 }],
  });

  const scale = calculatePreciseScale(rooms, totalArea);

  return {
    rooms,
    totalArea,
    gridWidth: gridW,
    gridHeight: gridH,
    scale,
  };
}

/**
 * 6. PENTHOUSE / PANORAMIC RESIDENCE (Çepeçevre Teraslı Çatı Dubleksi/Rezidans)
 */
export function generatePenthousePlan(opts: CreativeGenerateOptions): FloorPlanLayout {
  const { bedrooms = 3, totalArea = 120, lang = 'tr' } = opts;
  const rooms: RoomLayout[] = [];

  const gridW = 16;
  const gridH = 11;

  // Wraparound Top Terrace
  rooms.push({
    id: 'terrace-north',
    label: lang === 'tr' ? 'Panoramik Manzara Terası' : 'Panoramic Sky Terrace',
    type: 'balcony',
    x: 0,
    y: 0,
    w: 16,
    h: 1.8,
    doors: [{ wall: 'bottom', position: 0.25, width: 32 }, { wall: 'bottom', position: 0.75, width: 32 }],
  });

  // Grand Salon & Skylight Lounge
  rooms.push({
    id: 'living',
    label: lang === 'tr' ? 'Rezidans Salonu & Lounge' : 'Sky Lounge Salon',
    type: 'living',
    x: 0,
    y: 1.8,
    w: 8,
    h: 5.2,
    doors: [{ wall: 'top', position: 0.5, width: 30 }, { wall: 'right', position: 0.5, width: 28 }, { wall: 'bottom', position: 0.5, width: 26 }],
    windows: [{ wall: 'left', position: 0.5, width: 48 }],
  });

  // Designer Kitchen with Wine Bar
  rooms.push({
    id: 'kitchen',
    label: lang === 'tr' ? 'Gourmet Ada Mutfak' : 'Gourmet Island Kitchen',
    type: 'kitchen',
    x: 8,
    y: 1.8,
    w: 4.5,
    h: 5.2,
    doors: [{ wall: 'left', position: 0.5, width: 26 }, { wall: 'right', position: 0.5, width: 26 }],
    windows: [{ wall: 'top', position: 0.5, width: 32 }],
  });

  // Formal Dining with Glass Wall
  rooms.push({
    id: 'dining',
    label: lang === 'tr' ? 'Yemek Salonu' : 'Formal Dining',
    type: 'dining',
    x: 12.5,
    y: 1.8,
    w: 3.5,
    h: 5.2,
    doors: [{ wall: 'left', position: 0.5, width: 24 }],
    windows: [{ wall: 'top', position: 0.5, width: 30 }, { wall: 'right', position: 0.5, width: 36 }],
  });

  // Central Gallery Hallway
  rooms.push({
    id: 'hallway',
    label: lang === 'tr' ? 'Galeri Holü & Vestiyer' : 'Gallery Foyer',
    type: 'hallway',
    x: 4,
    y: 7,
    w: 8,
    h: 1.5,
    doors: [
      { wall: 'top', position: 0.25, width: 24 },
      { wall: 'bottom', position: 0.25, width: 24 },
      { wall: 'bottom', position: 0.75, width: 24 },
    ],
  });

  // Master Retreat with Walk-in Dressing
  rooms.push({
    id: 'master-bed',
    label: lang === 'tr' ? 'Ebeveyn Yatak Odası Süiti' : 'Master Retreat',
    type: 'bedroom',
    x: 0,
    y: 7,
    w: 4,
    h: 4,
    doors: [{ wall: 'top', position: 0.5, width: 24 }, { wall: 'right', position: 0.5, width: 24 }],
    windows: [{ wall: 'left', position: 0.5, width: 36 }, { wall: 'bottom', position: 0.5, width: 36 }],
  });

  // Walk-in Dressing Room (Giyinme Odası)
  rooms.push({
    id: 'dressing-room',
    label: lang === 'tr' ? 'Giyinme Odası' : 'Walk-in Closet',
    type: 'storage',
    x: 4,
    y: 8.5,
    w: 2.5,
    h: 2.5,
    doors: [{ wall: 'left', position: 0.5, width: 22 }],
  });

  // Luxury En-suite Bath with Jacuzzi/Tub
  rooms.push({
    id: 'bath-ensuite',
    label: lang === 'tr' ? 'Lüks Ebeveyn Banyosu' : 'Luxury Master Bath',
    type: 'bathroom',
    x: 6.5,
    y: 8.5,
    w: 2.5,
    h: 2.5,
    doors: [{ wall: 'top', position: 0.5, width: 22 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 20 }],
  });

  // Guest Suite / Bedroom 2
  rooms.push({
    id: 'bed-2',
    label: lang === 'tr' ? 'Misafir Süiti' : 'Guest Suite',
    type: 'bedroom',
    x: 9,
    y: 8.5,
    w: 3.5,
    h: 2.5,
    doors: [{ wall: 'top', position: 0.5, width: 24 }],
    windows: [{ wall: 'bottom', position: 0.5, width: 30 }],
  });

  // Main Bathroom
  rooms.push({
    id: 'bath-main',
    label: lang === 'tr' ? 'Genel Banyo' : 'Main Bath',
    type: 'bathroom',
    x: 12.5,
    y: 7,
    w: 3.5,
    h: 4,
    doors: [{ wall: 'left', position: 0.5, width: 22 }],
    windows: [{ wall: 'right', position: 0.5, width: 22 }, { wall: 'bottom', position: 0.5, width: 22 }],
  });

  const scale = calculatePreciseScale(rooms, totalArea);

  return {
    rooms,
    totalArea,
    gridWidth: gridW,
    gridHeight: gridH,
    scale,
  };
}

/**
 * MASTER CREATIVE ENGINE DISPATCHER
 * Kullanıcının yazdığı serbest açıklamayı (prompt) ve seçtiği stili derinlemesine analiz eder;
 * en uygun yaratıcı mimari formu seçer veya rastgele yaratıcı varyasyonlar üretir.
 */
export function generateCreativeFloorPlan(opts: CreativeGenerateOptions): FloorPlanLayout {
  const { description = '', style = '' } = opts;
  const analysis = parseArchitecturalPrompt(description, style);

  // 1. If user explicitly mentions L-shape
  if (analysis.isLShape) {
    return generateLShapedPlan(opts);
  }

  // 2. If user mentions Courtyard / U-Shape / Atrium / Pool
  if (analysis.isCourtyard) {
    return generateCourtyardPlan(opts);
  }

  // 3. If user mentions Loft / Open-plan / Industrial
  if (analysis.isLoft) {
    return generateLoftPlan(opts);
  }

  // 4. If user mentions Traditional / Ottoman / Sofa / Konak
  if (analysis.isTraditionalSofa) {
    return generateSofaliPlan(opts);
  }

  // 5. If user mentions Mediterranean / Aegean / Stone Villa
  if (analysis.isMediterranean) {
    return generateMediterraneanPlan(opts);
  }

  // 6. If user mentions Penthouse / Luxury Villa / Residence
  if (analysis.isPenthouse) {
    return generatePenthousePlan(opts);
  }

  // 7. Dynamic Variation Seed: If no specific shape mentioned, pick dynamically from rich typologies
  // so that consecutive clicks ALWAYS yield fresh, non-repetitive, creative designs!
  const variations = [
    generateLShapedPlan,
    generateCourtyardPlan,
    generateMediterraneanPlan,
    generateLoftPlan,
    generatePenthousePlan,
    generateSofaliPlan,
  ];

  // Use timestamp XOR random jitter to guarantee distinct variations on back-to-back clicks
  const seed = (Date.now() ^ Math.floor(Math.random() * 99991)) % variations.length;
  const randomChoice = variations[Math.abs(seed)];
  return randomChoice(opts);
}
