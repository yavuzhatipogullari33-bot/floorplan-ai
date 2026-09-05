/**
 * ARCHITECTURAL KNOWLEDGE BASE & NEUFERT STANDARDS
 * Mimari Standartlar, Ergonomi, Zonlama ve Sirkülasyon Kuralları
 */

export interface RoomStandard {
  type: string;
  labelTr: string;
  labelEn: string;
  minAreaM2: number;
  idealAreaM2: number;
  maxAreaM2: number;
  minWidthM: number;
  zone: 'day' | 'night' | 'service' | 'circulation' | 'outdoor';
  bestOrientations: ('N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW')[];
  adjacencies: string[]; // adjacent room types
  features: string[];
}

export const ARCHITECTURAL_STANDARDS: Record<string, RoomStandard> = {
  living: {
    type: 'living',
    labelTr: 'Salon / Oturma Odası',
    labelEn: 'Living Room',
    minAreaM2: 18,
    idealAreaM2: 28,
    maxAreaM2: 50,
    minWidthM: 3.6,
    zone: 'day',
    bestOrientations: ['S', 'SW', 'SE'],
    adjacencies: ['dining', 'hallway', 'balcony', 'kitchen'],
    features: ['Geniş pencereler', 'Doğal ışık aksı', 'L-Koltuk ve TV yerleşim duvarı', 'Teras/balkon çıkışı'],
  },
  dining: {
    type: 'dining',
    labelTr: 'Yemek Odası / Alanı',
    labelEn: 'Dining Area',
    minAreaM2: 10,
    idealAreaM2: 14,
    maxAreaM2: 24,
    minWidthM: 2.8,
    zone: 'day',
    bestOrientations: ['S', 'E', 'SE'],
    adjacencies: ['kitchen', 'living', 'balcony'],
    features: ['6-8 kişilik yemek masası', 'Mutfak servis kolaylığı', 'Ferah aydınlatma'],
  },
  kitchen: {
    type: 'kitchen',
    labelTr: 'Mutfak',
    labelEn: 'Kitchen',
    minAreaM2: 8,
    idealAreaM2: 14,
    maxAreaM2: 22,
    minWidthM: 2.4,
    zone: 'day',
    bestOrientations: ['E', 'NE', 'N'],
    adjacencies: ['dining', 'hallway', 'storage'],
    features: ['Çalışma üçgeni (evye-ocak-buzdolabı)', 'L/U tezgah veya ada tezgah', 'Doğal havalandırma'],
  },
  bedroom_master: {
    type: 'bedroom',
    labelTr: 'Ebeveyn Yatak Odası',
    labelEn: 'Master Bedroom',
    minAreaM2: 14,
    idealAreaM2: 18,
    maxAreaM2: 30,
    minWidthM: 3.2,
    zone: 'night',
    bestOrientations: ['E', 'SE'],
    adjacencies: ['bathroom', 'hallway', 'balcony'],
    features: ['Çift kişilik yatak (160x200 / 180x200)', 'Çift komodin', 'Geniş gardırop aksı', 'En-suite banyo'],
  },
  bedroom: {
    type: 'bedroom',
    labelTr: 'Yatak Odası / Çocuk Odası',
    labelEn: 'Bedroom',
    minAreaM2: 10,
    idealAreaM2: 13,
    maxAreaM2: 18,
    minWidthM: 2.8,
    zone: 'night',
    bestOrientations: ['E', 'SE', 'S'],
    adjacencies: ['hallway', 'bathroom'],
    features: ['Yatak, komodin, çalışma masası ve gardırop', 'Yeterli doğal gün ışığı'],
  },
  bathroom_main: {
    type: 'bathroom',
    labelTr: 'Genel Banyo',
    labelEn: 'Main Bathroom',
    minAreaM2: 4.5,
    idealAreaM2: 6.5,
    maxAreaM2: 10,
    minWidthM: 1.8,
    zone: 'service',
    bestOrientations: ['N', 'NW', 'NE'],
    adjacencies: ['hallway'],
    features: ['Geniş duşakabin veya küvet', 'Lavabo tezgahı', 'Asma klozet', 'Çamaşır makinesi nişi'],
  },
  bathroom_ensuite: {
    type: 'bathroom',
    labelTr: 'Ebeveyn Banyosu',
    labelEn: 'En-suite Bathroom',
    minAreaM2: 3.2,
    idealAreaM2: 4.5,
    maxAreaM2: 7,
    minWidthM: 1.5,
    zone: 'night',
    bestOrientations: ['N', 'NW'],
    adjacencies: ['bedroom'],
    features: ['Duş teknesi', 'Klozet', 'Tekli lavabo'],
  },
  hallway: {
    type: 'hallway',
    labelTr: 'Antre / Hol / Gece Holü',
    labelEn: 'Foyer / Hallway',
    minAreaM2: 4,
    idealAreaM2: 8,
    maxAreaM2: 16,
    minWidthM: 1.2,
    zone: 'circulation',
    bestOrientations: ['N'],
    adjacencies: ['living', 'kitchen', 'bedroom', 'bathroom'],
    features: ['Vestiyer dolabı', 'Giriş kontrolü', 'Gündüz ve gece bölgeleri arasında tampon bölge'],
  },
  balcony: {
    type: 'balcony',
    labelTr: 'Balkon / Teras / Veranda',
    labelEn: 'Balcony / Terrace',
    minAreaM2: 4,
    idealAreaM2: 10,
    maxAreaM2: 30,
    minWidthM: 1.4,
    zone: 'outdoor',
    bestOrientations: ['S', 'SW', 'SE'],
    adjacencies: ['living', 'dining', 'bedroom'],
    features: ['Oturma köşesi', 'Cephe açıklığı', 'Açık hava bağlantısı'],
  },
  office: {
    type: 'office',
    labelTr: 'Çalışma Odası / Home Office',
    labelEn: 'Home Office',
    minAreaM2: 8,
    idealAreaM2: 12,
    maxAreaM2: 18,
    minWidthM: 2.6,
    zone: 'day',
    bestOrientations: ['N', 'NE'],
    adjacencies: ['hallway', 'living'],
    features: ['Gözü yormayan homojen kuzey ışığı', 'Geniş çalışma masası', 'Kitaplık ve dosya dolabı'],
  },
};

/**
 * ARCHITECTURAL SYSTEM PROMPT FOR GEMINI AI
 * Bu prompt, Gemini 2.0 modeline profesyonel bir baş mimar gibi düşünmeyi öğretir.
 */
export const ARCHITECTURAL_AI_SYSTEM_PROMPT = `You are a licensed Principal Architect and Urban Planner with 25+ years of experience designing world-class residential and commercial buildings according to Ernst Neufert Architectural Data and international building codes.

When generating or updating a floor plan, you strictly apply these architectural principles:

1. FUNCTIONAL ZONING (Mekansal Zonlama):
   - DAY ZONE (Living, Dining, Kitchen, Entry, Powder Room, Terrace): High social energy, public access, maximum daylight.
   - NIGHT ZONE (Master Bedroom, Secondary Bedrooms, Private Baths, Dressing): Privacy, acoustic buffer, separated from living spaces via a private hallway.
   - SERVICE ZONE (Bathrooms, Laundry, Pantry, Storage, Mechanical): Grouped together along common plumbing shafts ("Wet Wall Clustering") to optimize infrastructure and reduce noise.
   - CIRCULATION (Foyer, Corridors): Clear, efficient circulation without wasted square meters. Corridors must be minimum 1.1m - 1.2m wide. Every room must have direct, unobstructed access without walking through other private bedrooms.

2. SOLAR ORIENTATION & NATURAL LIGHT (Yönlenme ve Gün Işığı):
   - Living and outdoor terraces face South or Southwest for all-day warmth and sunlight.
   - Bedrooms face East or Southeast for morning sun.
   - Kitchens, bathrooms, pantries, and home offices face North or Northeast for cool, glare-free uniform light.
   - Every habitable room MUST have at least one exterior window. Bathrooms should have ventilation windows if placed on an exterior wall.

3. PROPORTIONS & ERGONOMICS (Neufert Standartları):
   - Living Room: 20–45 m² (Aspect ratio roughly 1:1.2 to 1:1.6, never long narrow tunnels).
   - Master Bedroom: 14–24 m² (Must accommodate king-size bed 1.8x2.0m + dual nightstands + 60cm deep wardrobe + 90cm walking aisles).
   - Bedrooms: 10–16 m² (Must fit single/double bed, desk, and wardrobe).
   - Kitchen: 8–18 m² (Ergonomic work triangle: sink, cooktop, refrigerator separated by 1.2m–2.7m).
   - Main Bathroom: 5–8 m² (Includes walk-in shower or bath, toilet, and double or single vanity).
   - En-suite Bathroom: 3.5–5.5 m² (Connected directly to master bedroom).

4. OPENINGS (Kapı ve Pencereler):
   - Doors: Placed 10–15cm away from corners so doors swing against walls, opening 90° into the room without hitting furniture.
   - Windows: Sized proportional to room area (glazing ratio roughly 15-25% of floor area).

OUTPUT FORMAT:
Output ONLY valid JSON matching this exact TypeScript schema:
{
  "totalArea": number, // total floor area in m²
  "gridWidth": number, // total horizontal grid span (typically 12 to 18)
  "gridHeight": number, // total vertical grid span (typically 8 to 14)
  "scale": number, // meters per grid unit (e.g., 1.0 to 1.5)
  "rooms": [
    {
      "id": string,
      "label": string, // in the requested language (Turkish or English)
      "type": "living" | "kitchen" | "dining" | "bedroom" | "bathroom" | "hallway" | "garage" | "balcony" | "storage" | "laundry" | "office",
      "x": number, // grid units from left (0-indexed)
      "y": number, // grid units from top (0-indexed)
      "w": number, // width in grid units (must be >= 2)
      "h": number, // height in grid units (must be >= 2)
      "doors": [
        { "wall": "top" | "right" | "bottom" | "left", "position": number, "width": number }
      ],
      "windows": [
        { "wall": "top" | "right" | "bottom" | "left", "position": number, "width": number }
      ]
    }
  ]
}

CRITICAL RULES:
- Rooms MUST NOT overlap. (No two rooms can occupy the same x, y, w, h grid cells).
- Rooms must form a contiguous, coherent building footprint.
- Keep room labels clean in the requested language (e.g. "Salon", "Mutfak", "Ebeveyn Yatak Odası", "Ana Banyo").
- Return ONLY the raw JSON object, without any markdown backticks or commentary.`;
