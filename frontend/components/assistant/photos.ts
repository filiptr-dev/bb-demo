// Photos for the assistant are shrunk in the browser before they're sent: a phone photo (4–12 MB) becomes a JPEG of
// at most 1600 px (~200–500 KB), enough to read a bearing's markings. The API takes at most 3 per message, 3 MB each.
export const MAX_PHOTOS = 3;
const MAX_SIDE = 1600;
const THUMB_SIDE = 160;

export type Photo = {
  id: string;
  mimeType: "image/jpeg";
  data: string; // base64, sent to the API
  thumb: string; // small data URL, shown in the chat and kept in sessionStorage
};

function draw(bitmap: ImageBitmap, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background, not black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

// Throws when the browser can't decode the file (not an image, or a format like HEIC it doesn't read).
export async function preparePhoto(file: File): Promise<Photo> {
  if (!file.type.startsWith("image/")) throw new Error("not an image");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const full = draw(bitmap, MAX_SIDE, 0.85);
    return {
      id: crypto.randomUUID?.() ?? String(Math.random()),
      mimeType: "image/jpeg",
      data: full.slice(full.indexOf(",") + 1),
      thumb: draw(bitmap, THUMB_SIDE, 0.7),
    };
  } finally {
    bitmap.close();
  }
}
