/**
 * Browser-side resize to a JPEG whose long edge is at most `maxEdge`.
 * `createImageBitmap(…, { imageOrientation: "from-image" })` applies EXIF rotation,
 * so portrait phone photos come out upright. Also strips EXIF (including GPS) metadata.
 */
export async function resizeToJpeg(file: File, maxEdge: number, quality = 0.85) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image"))), "image/jpeg", quality),
  );
  return { blob, width, height };
}

/** Pure helper (unit-tested): target size for a given source size. */
export function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
