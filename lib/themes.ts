import type { RoomPalette } from "@/lib/images/mock-room";

export type ThemeDefinition = {
  slug: string;
  name: string;
  description: string;
  palette: string[]; // hex swatches, dominant first
  materials: string[];
  mood: string[];
  /** Mapped colours for mock-mode room renders. */
  render: RoomPalette;
};

export const PRESET_THEMES: ThemeDefinition[] = [
  {
    slug: "tech-smart-home",
    name: "Tech / Smart Home",
    description: "Clean lines, concealed cabling, ambient LED cove lighting and integrated smart controls.",
    palette: ["#e8eaed", "#2b2f36", "#4f8cff", "#9aa3ad", "#ffffff"],
    materials: ["matte lacquer", "brushed aluminium", "tempered glass", "acoustic fabric panels"],
    mood: ["sleek", "connected", "efficient", "ambient"],
    render: { wall: "#e6e8eb", sideWall: "#d3d7dc", floor: "#8d939b", ceiling: "#f5f6f8", sofa: "#3a3f47", accent: "#4f8cff", rug: "#b8bec6", wood: "#5a5f66", plant: "#6f8f7a" },
  },
  {
    slug: "minimalist",
    name: "Minimalist",
    description: "Less, but better. A pared-back palette, hidden storage and generous negative space.",
    palette: ["#f5f3ef", "#d9d4cc", "#1f1f1f", "#b5ada1", "#ffffff"],
    materials: ["white oak", "microcement", "linen", "matte white laminate"],
    mood: ["calm", "uncluttered", "airy", "intentional"],
    render: { wall: "#f4f2ee", sideWall: "#e6e2db", floor: "#d6cdbf", ceiling: "#fbfaf8", sofa: "#e2ddd5", accent: "#2a2a2a", rug: "#ece7df", wood: "#cdbb9f", plant: "#8a9a7e" },
  },
  {
    slug: "cozy-warmth",
    name: "Cozy Warmth",
    description: "Layered textiles, warm 2700K lighting and earthy tones that invite you to stay in.",
    palette: ["#e9d8c4", "#b5653a", "#7a4b2a", "#f3e9dc", "#a3826a"],
    materials: ["boucle", "walnut", "terracotta", "wool throws"],
    mood: ["inviting", "snug", "warm", "layered"],
    render: { wall: "#ecdcc8", sideWall: "#dcc6ad", floor: "#9c6f4c", ceiling: "#f6ece0", sofa: "#c98a5b", accent: "#b5653a", rug: "#e3c9a8", wood: "#7a4b2a", plant: "#6f7f4f" },
  },
  {
    slug: "comfy",
    name: "Comfy",
    description: "Deep-seated sofas, soft rounded edges and family-friendly, washable fabrics.",
    palette: ["#efe6da", "#8fa39a", "#d8c3a5", "#5f6b66", "#fff9f0"],
    materials: ["performance fabric", "rattan", "ash wood", "cotton"],
    mood: ["relaxed", "soft", "family", "lived-in"],
    render: { wall: "#efe6da", sideWall: "#e0d4c3", floor: "#c4ab8a", ceiling: "#fbf6ee", sofa: "#8fa39a", accent: "#d8c3a5", rug: "#e9dccb", wood: "#b08d63", plant: "#6d8a6a" },
  },
  {
    slug: "classy-luxe",
    name: "Classy / Luxe",
    description: "Marble, brass accents, velvet and statement lighting for an elevated, hotel-like feel.",
    palette: ["#1f2a2e", "#c9a96e", "#efe9e1", "#5b2333", "#8c8c8c"],
    materials: ["Calacatta marble", "brushed brass", "velvet", "fluted panels"],
    mood: ["elegant", "refined", "dramatic", "polished"],
    render: { wall: "#e9e2d8", sideWall: "#2b3a3f", floor: "#efe9e1", ceiling: "#f7f3ee", sofa: "#1f2a2e", accent: "#c9a96e", rug: "#5b2333", wood: "#3b2f2a", plant: "#4f6b55" },
  },
  {
    slug: "japandi",
    name: "Japandi",
    description: "Japanese restraint meets Scandinavian warmth: low furniture, natural textures, muted tones.",
    palette: ["#ece6dc", "#a68a64", "#4a4239", "#c8bfb0", "#7d8471"],
    materials: ["light oak", "washi paper", "linen", "stone"],
    mood: ["serene", "grounded", "natural", "balanced"],
    render: { wall: "#ece6dc", sideWall: "#ddd4c6", floor: "#b99d76", ceiling: "#f6f2ec", sofa: "#c8bfb0", accent: "#4a4239", rug: "#e2d9ca", wood: "#a68a64", plant: "#7d8471" },
  },
  {
    slug: "scandinavian",
    name: "Scandinavian",
    description: "Bright, functional and cosy: pale woods, white walls and soft pastel accents.",
    palette: ["#ffffff", "#e3ddd3", "#b8c4cc", "#d9b99b", "#3c3c3c"],
    materials: ["birch", "wool", "white-washed pine", "ceramic"],
    mood: ["bright", "hygge", "functional", "fresh"],
    render: { wall: "#fbfbfa", sideWall: "#eceae6", floor: "#e0cfb5", ceiling: "#ffffff", sofa: "#b8c4cc", accent: "#d9b99b", rug: "#efebe5", wood: "#d6bf9b", plant: "#7f9a80" },
  },
  {
    slug: "industrial",
    name: "Industrial",
    description: "Raw concrete, black steel, exposed brick and Edison bulbs for a loft-inspired edge.",
    palette: ["#6e6a65", "#2b2927", "#a0522d", "#c2bbb1", "#3f4a4f"],
    materials: ["concrete screed", "black steel", "reclaimed wood", "leather"],
    mood: ["urban", "raw", "bold", "loft"],
    render: { wall: "#8e8a85", sideWall: "#9a5a3c", floor: "#6e6a65", ceiling: "#b9b5ae", sofa: "#6b4a33", accent: "#2b2927", rug: "#5a5651", wood: "#4b3a2c", plant: "#5f7360" },
  },
  {
    slug: "modern-tropical",
    name: "Modern Tropical",
    description: "Built for the equator: breezy layouts, rattan, lush greens and humidity-friendly finishes.",
    palette: ["#f2ede3", "#2f5d50", "#c79a5b", "#88a47c", "#ffffff"],
    materials: ["rattan", "teak", "terrazzo", "linen"],
    mood: ["breezy", "lush", "resort", "relaxed"],
    render: { wall: "#f2ede3", sideWall: "#e2dacb", floor: "#c9b28c", ceiling: "#faf7f1", sofa: "#e9dfcc", accent: "#2f5d50", rug: "#d8c7a4", wood: "#a9773f", plant: "#3f7a52" },
  },
  {
    slug: "peranakan-modern",
    name: "Peranakan Modern",
    description: "A contemporary nod to Straits Chinese heritage: pastel tiles, carved wood and jewel tones.",
    palette: ["#f4e9e1", "#2e8b8b", "#e8a0a8", "#1d3557", "#d4a017"],
    materials: ["encaustic tiles", "carved teak", "lacquer", "porcelain"],
    mood: ["heritage", "vibrant", "playful", "crafted"],
    render: { wall: "#f4e9e1", sideWall: "#9fd3cf", floor: "#d9b8a5", ceiling: "#fbf6f2", sofa: "#2e8b8b", accent: "#e8a0a8", rug: "#1d3557", wood: "#6b3f2a", plant: "#4f8a5b" },
  },
];

export function getPresetTheme(slug: string) {
  return PRESET_THEMES.find((t) => t.slug === slug);
}

/** Derive a render palette for a custom theme from its swatches. */
export function paletteToRender(palette: string[]): RoomPalette {
  const at = (i: number, fallback: string) => palette[i % Math.max(palette.length, 1)] ?? fallback;
  return {
    wall: at(0, "#eeeeee"),
    sideWall: at(3, "#dddddd"),
    floor: at(1, "#bbbbbb"),
    ceiling: "#f8f6f2",
    sofa: at(2, "#999999"),
    accent: at(4, "#777777"),
    rug: at(3, "#cccccc"),
    wood: at(1, "#a08f7a"),
    plant: "#6f8a6a",
  };
}
