export function drawPixelated(
  source: HTMLImageElement | HTMLCanvasElement,
  pixelSize: number
): HTMLCanvasElement {
  const srcWidth = source.width as number;
  const srcHeight = source.height as number;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context is not available");

  canvas.width = srcWidth;
  canvas.height = srcHeight;

  const smallW = Math.max(1, Math.floor(srcWidth / pixelSize));
  const smallH = Math.max(1, Math.floor(srcHeight / pixelSize));

  const temp = document.createElement("canvas");
  temp.width = smallW;
  temp.height = smallH;
  const tctx = temp.getContext("2d");
  if (!tctx) throw new Error("Canvas 2D context is not available");

  tctx.imageSmoothingEnabled = false;
  tctx.clearRect(0, 0, smallW, smallH);
  tctx.drawImage(source, 0, 0, smallW, smallH);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0, smallW, smallH, 0, 0, canvas.width, canvas.height);

  return canvas;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = hex.replace("#", "");
  const full =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  const bigint = parseInt(full, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export function quantizeToPalette(
  canvas: HTMLCanvasElement,
  paletteHex: string[]
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const palette = paletteHex.map(hexToRgb);

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let p = 0; p < palette.length; p++) {
      const pr = palette[p].r;
      const pg = palette[p].g;
      const pb = palette[p].b;
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = p;
      }
    }
    data[i] = palette[bestIdx].r;
    data[i + 1] = palette[bestIdx].g;
    data[i + 2] = palette[bestIdx].b;
  }

  ctx.putImageData(imageData, 0, 0);
}

export const STARDEW_LIKE_PALETTE: string[] = [
  "#1b1f23",
  "#3a2e2a",
  "#5a463e",
  "#8b6d5c",
  "#c9a27e",
  "#e7c9a9",
  "#6e3a2e",
  "#b4583c",
  "#e6904a",
  "#f6c25b",
  "#2d4a2b",
  "#3f6d3a",
  "#6ea34a",
  "#a9d36d",
  "#1f2e4a",
  "#2f4f6d",
  "#4f78a6",
  "#7db7e0",
  "#8a6bb8",
  "#c49be0",
  "#7b6b5a",
  "#a39483",
  "#e6e2d3",
  "#ffffff",
];
