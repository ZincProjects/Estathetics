/**
 * Procedural room illustrations used in mock mode and demo seeds. The geometry
 * (walls, window, door, camera) is fixed per `layout`; only the palette and
 * furniture styling change, mimicking a structure-preserving redesign.
 */
export type RoomPalette = {
  wall: string;
  sideWall: string;
  floor: string;
  ceiling: string;
  sofa: string;
  accent: string;
  rug: string;
  wood: string;
  plant: string;
};

export const BARE_PALETTE: RoomPalette = {
  wall: "#e9e4dc",
  sideWall: "#d9d3c9",
  floor: "#bfb4a3",
  ceiling: "#f4f1ec",
  sofa: "#9a948b",
  accent: "#8a857d",
  rug: "#cfc8bc",
  wood: "#a08f7a",
  plant: "#7d8a72",
};

export type RoomLayout = "living" | "bedroom" | "kitchen";

export function roomSvg(layout: RoomLayout, p: RoomPalette, opts: { furnished?: boolean; width?: number } = {}) {
  const furnished = opts.furnished ?? true;
  const w = opts.width ?? 1200;
  const h = Math.round((w * 3) / 4);
  const s = w / 1200;

  const shell = `
    <rect width="1200" height="900" fill="${p.ceiling}"/>
    <polygon points="0,0 260,170 260,640 0,900" fill="${p.sideWall}"/>
    <polygon points="1200,0 940,170 940,640 1200,900" fill="${p.sideWall}"/>
    <rect x="260" y="170" width="680" height="470" fill="${p.wall}"/>
    <polygon points="0,900 260,640 940,640 1200,900" fill="${p.floor}"/>
    <line x1="260" y1="640" x2="940" y2="640" stroke="#00000022" stroke-width="3"/>
    <!-- beam -->
    <polygon points="260,170 940,170 960,150 240,150" fill="#00000010"/>
    <!-- window (structure) -->
    <rect x="${layout === "kitchen" ? 620 : 520}" y="230" width="260" height="220" fill="#cfe3ef" stroke="#ffffff" stroke-width="14"/>
    <line x1="${layout === "kitchen" ? 750 : 650}" y1="230" x2="${layout === "kitchen" ? 750 : 650}" y2="450" stroke="#ffffff" stroke-width="8"/>
    <!-- door on left wall (structure) -->
    <polygon points="70,250 180,190 180,600 70,700" fill="${p.wood}" opacity="0.9"/>
    <circle cx="160" cy="420" r="7" fill="#00000055"/>
    <!-- DB box / aircon trunking -->
    <rect x="300" y="200" width="70" height="90" fill="#f7f7f7" stroke="#0000001a" stroke-width="3"/>
    <rect x="270" y="180" width="660" height="18" fill="#f2f2f2" opacity="0.8"/>`;

  let furniture = "";
  if (furnished && layout === "living") {
    furniture = `
      <ellipse cx="600" cy="760" rx="330" ry="70" fill="${p.rug}"/>
      <rect x="380" y="520" width="440" height="120" rx="26" fill="${p.sofa}"/>
      <rect x="360" y="560" width="480" height="110" rx="30" fill="${p.sofa}" />
      <rect x="380" y="575" width="440" height="20" rx="10" fill="#ffffff22"/>
      <rect x="420" y="530" width="90" height="70" rx="16" fill="${p.accent}"/>
      <rect x="690" y="530" width="90" height="70" rx="16" fill="${p.accent}"/>
      <rect x="500" y="700" width="200" height="22" rx="10" fill="${p.wood}"/>
      <rect x="520" y="720" width="12" height="50" fill="${p.wood}"/><rect x="668" y="720" width="12" height="50" fill="${p.wood}"/>
      <circle cx="600" cy="690" r="18" fill="${p.accent}"/>
      <rect x="870" y="520" width="34" height="120" fill="${p.wood}"/>
      <circle cx="887" cy="480" r="55" fill="${p.plant}"/>
      <line x1="300" y1="300" x2="300" y2="520" stroke="${p.accent}" stroke-width="6"/>
      <ellipse cx="300" cy="300" rx="40" ry="22" fill="${p.accent}"/>`;
  } else if (furnished && layout === "bedroom") {
    furniture = `
      <rect x="380" y="430" width="440" height="120" rx="14" fill="${p.wood}"/>
      <rect x="350" y="540" width="500" height="170" rx="20" fill="${p.sofa}"/>
      <rect x="350" y="600" width="500" height="110" rx="20" fill="${p.accent}"/>
      <rect x="400" y="510" width="140" height="60" rx="20" fill="#ffffffcc"/>
      <rect x="660" y="510" width="140" height="60" rx="20" fill="#ffffffcc"/>
      <rect x="250" y="560" width="90" height="90" rx="8" fill="${p.wood}"/>
      <rect x="860" y="560" width="90" height="90" rx="8" fill="${p.wood}"/>
      <ellipse cx="600" cy="800" rx="300" ry="55" fill="${p.rug}"/>
      <circle cx="905" cy="520" r="34" fill="${p.plant}"/>`;
  } else if (furnished && layout === "kitchen") {
    furniture = `
      <rect x="260" y="470" width="680" height="170" fill="${p.wood}"/>
      <rect x="260" y="455" width="680" height="22" fill="${p.accent}"/>
      <rect x="280" y="250" width="300" height="150" fill="${p.wood}" opacity="0.85"/>
      <rect x="430" y="640" width="340" height="140" fill="${p.sofa}"/>
      <rect x="415" y="625" width="370" height="24" fill="${p.accent}"/>
      ${[0, 1, 2].map((i) => `<circle cx="${480 + i * 120}" cy="290" r="16" fill="#fff6d9"/><line x1="${480 + i * 120}" y1="0" x2="${480 + i * 120}" y2="275" stroke="#0000004d" stroke-width="3"/>`).join("")}
      <circle cx="880" cy="420" r="30" fill="${p.plant}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1200 900">
    <g transform="scale(1)">${shell}${furniture}</g>
    <rect width="1200" height="900" fill="url(#light)"/>
    <defs><linearGradient id="light" x1="0.6" y1="0" x2="0.2" y2="1">
      <stop offset="0" stop-color="#fff8e6" stop-opacity="0.25"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/>
    </linearGradient></defs>
  </svg>`.replace(/scale\(1\)/, `scale(${s / s})`);
}
