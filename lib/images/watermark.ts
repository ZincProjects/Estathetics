import "server-only";
import sharp from "sharp";
import { WATERMARK_ASPECT, WATERMARK_PNG_BASE64 } from "./assets/watermark";

const label = Buffer.from(WATERMARK_PNG_BASE64, "base64");

/**
 * Burns the "Virtually staged (AI-generated)" label into the bottom-left corner.
 * Every AI image goes through this before it is stored, so the label can't be skipped.
 */
export async function watermark(input: Buffer, opts: { maxEdge?: number } = {}) {
  const base = sharp(input).rotate();
  const resized = opts.maxEdge
    ? base.resize({ width: opts.maxEdge, height: opts.maxEdge, fit: "inside", withoutEnlargement: true })
    : base;
  const { data, info } = await resized.jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true });

  const labelWidth = Math.max(180, Math.round(info.width * 0.42));
  const labelHeight = Math.round(labelWidth / WATERMARK_ASPECT);
  const margin = Math.round(info.width * 0.025);
  const overlay = await sharp(label).resize(labelWidth, labelHeight).png().toBuffer();

  return sharp(data)
    .composite([{ input: overlay, left: margin, top: info.height - labelHeight - margin }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}
