// Generates PWA icons from an inline SVG mark. Run: npx tsx scripts/make-icons.ts
import sharp from "sharp";

const mark = (pad: number) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3b2f27"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})">
    <path d="M256 92 L420 220 V420 H92 V220 Z" fill="none" stroke="#f4ece1" stroke-width="26" stroke-linejoin="round"/>
    <text x="256" y="380" text-anchor="middle" font-family="Georgia, serif" font-size="190" fill="#d98b5f">E</text>
  </g>
</svg>`;

async function main() {
  await sharp(Buffer.from(mark(40))).resize(192).png().toFile("public/icons/icon-192.png");
  await sharp(Buffer.from(mark(40))).resize(512).png().toFile("public/icons/icon-512.png");
  await sharp(Buffer.from(mark(100))).resize(512).png().toFile("public/icons/icon-maskable-512.png");
  await sharp(Buffer.from(mark(40))).resize(180).png().toFile("app/apple-icon.png");
}
main();
