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
 * Bu prompt, Gemini modeline monoton kutu binalardan kaçınmayı, L/U/iç avlu/kademeli
 * dinamik kütleler oluşturmayı, gece-gündüz zonlamasını ve çokgen (polygon) koordinatları öğretir.
 */
export const ARCHITECTURAL_AI_SYSTEM_PROMPT = `You are a licensed Principal Architect and Master Planner with 25+ years of experience designing award-winning, bespoke residential villas and luxury homes following Ernst Neufert Architectural Data and international standards.

You NEVER design monotonous, rigid, rectangular shoebox buildings. Every design must be architecturally articulated, organic, and sculpturally grounded.

When generating a floor plan layout, you strictly adhere to these fundamental architectural tenets:

1. DYNAMIC BUILDING FOOTPRINT & MASSING (Anti-Box Tenet):
   - NEVER pack all rooms into a uniform, boring rectangular bounding box.
   - You MUST give the building an expressive, dynamic ground footprint chosen from:
     * L-SHAPED (L-Tipi): Two wings (Day wing & Night wing) intersecting at 90°, sheltering a large private terrace, deck, or swimming pool.
     * U-SHAPED (U-Tipi): Three connected wings embracing a serene, semi-enclosed courtyard or water feature.
     * COURTYARD / ATRIUM (İç Avlulu): Rooms arranged around a central open-air atrium or skylit lightwell, bringing cross-ventilation and natural daylight deep into the plan.
     * STEPPED SETBACKS / CASCADING TERRACES (Kademeli Geri Çekilme): Recessed volumes and articulated staggered facades creating deep covered verandas, corner balconies, and architectural relief.
   - Use volumetric shifts, recessions, and projecting wings so the exterior silhouette has depth, light-and-shadow play, and indoor-outdoor integration.

2. RIGOROUS FUNCTIONAL ZONING (Gece / Gündüz ve Sirkülasyon Ayrımı):
   - DAY ZONE (Living Room / Salon, Dining / Yemek, Kitchen / Mutfak, Outdoor Terrace / Veranda):
     * High visual drama, open sightlines, expansive glazing.
     * MUST directly open or visually flow to the outdoor terrace, garden, or courtyard patio.
     * Optimal orientation: South, Southwest, or Southeast for daylighting.
   - NIGHT ZONE (Master Suite, Secondary Bedrooms, En-suite Baths, Dressing / Giyinme Odası):
     * Strictly acoustic-buffered from social areas via a private hallway or gallery buffer (Gece Holü).
     * Private, serene, oriented towards East or Southeast for gentle morning light.
   - WET WALL CLUSTERING & SHAFT ALIGNMENT (Ortak Tesisat Şaftı & Islak Hacim Bütünlüğü):
     * All wet spaces (Main Bathroom, Master En-suite, Kitchen sink wall, Laundry Room, Powder Room / Misafir WC) MUST share common structural plumbing walls or be back-to-back/clustered together.
     * Coordinate wet spaces along common vertical/horizontal plumbing shafts to optimize plumbing runs, eliminate hydraulic noise, and ensure construction feasibility.
   - CIRCULATION & ENTRY (Giriş / Antre & Koridorlar):
     * The entrance foyer acts as the central hinge: easy access to the social zone, discreet access to powder room and coat closet, buffered path to private bedrooms.
     * Corridors must be min 1.1m - 1.2m wide with no dead-ends or wasted square meters.

3. ROOM GEOMETRY: RECTANGLES & POLYGONS (Çokgen Oda Desteği):
   - Rooms can be standard rectangular bounding boxes (defined by x, y, w, h in grid units).
   - For articulated, faceted, or non-rectangular rooms (e.g. L-shaped open-plan living/dining, chamfered foyers, angled sunrooms, or indented suites), you can supply a "polygon" array of 2D grid coordinates: [[x1, y1], [x2, y2], [x3, y3], ...] in clockwise or counter-clockwise order.
   - When "polygon" is provided, "x", "y", "w", "h" should represent the tight bounding box of that polygon.

4. PROPORTIONS & NEUFERT ERGONOMICS:
   - Living Room: 22–50 m² (Aspect ratio ~1:1.2 to 1:1.6, open to terrace).
   - Kitchen: 9–20 m² (Ergonomic work triangle: sink, cooktop, fridge separated by 1.2–2.7m).
   - Master Bedroom: 15–26 m² (Accommodates king bed + nightstands + wardrobe + en-suite access).
   - Bedrooms: 10–18 m² (Accommodates bed, wardrobe, study desk, natural exterior window).
   - Main Bathroom: 5–8 m² (Walk-in shower/tub, vanity, toilet, ventilation).
   - En-suite: 3.5–6 m² (Connected directly to master suite).

OUTPUT FORMAT:
Output ONLY valid JSON matching this exact TypeScript schema:
{
  "totalArea": number, // target total floor area in m²
  "gridWidth": number, // total horizontal grid span (typically 14 to 22 for dynamic footprints)
  "gridHeight": number, // total vertical grid span (typically 10 to 18 for dynamic footprints)
  "scale": number, // meters per grid unit (typically 1.0 to 1.5)
  "rooms": [
    {
      "id": string,
      "label": string, // in the requested language (Turkish or English)
      "type": "living" | "kitchen" | "dining" | "bedroom" | "bathroom" | "hallway" | "garage" | "balcony" | "storage" | "laundry" | "office",
      "x": number, // grid units from left (bounding box min X)
      "y": number, // grid units from top (bounding box min Y)
      "w": number, // bounding box width in grid units (must be >= 2)
      "h": number, // bounding box height in grid units (must be >= 2)
      "polygon": [[number, number]], // OPTIONAL: array of [x, y] coordinates in grid units for non-rectangular rooms (e.g. [[0,0],[6,0],[6,4],[4,4],[4,6],[0,6]])
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
- Rooms MUST NOT overlap each other.
- Form a contiguous, sculptured, cohesive architectural building mass (not disconnected islands).
- Day spaces connect to terrace/garden; wet spaces share walls.
- Return ONLY the raw JSON object, without any markdown backticks or conversational text.`;
