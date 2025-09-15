import { drawPixelated } from "@/lib/image/pixelate";

export async function composeOnBackground(
  subject: HTMLImageElement | HTMLCanvasElement,
  options: {
    imageSrc?: string | null;
    color?: string | null;
    fit?: "contain" | "cover" | "stretch" | "center" | "tile";
    bgPixelSize?: number | null;
    transparent?: boolean;
  }
): Promise<HTMLCanvasElement> {
  const width = subject.width as number;
  const height = subject.height as number;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const {
    imageSrc,
    color,
    fit = "contain",
    bgPixelSize,
    transparent,
  } = options || {};

  // Base color fill (skip when transparent)
  if (!transparent) {
    ctx.fillStyle = color || "#ffffff";
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  if (imageSrc) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (e) => reject(e);
        image.crossOrigin = "anonymous";
        image.src = imageSrc;
      });

      ctx.imageSmoothingEnabled = false;

      if (fit === "stretch") {
        ctx.drawImage(img, 0, 0, width, height);
      } else if (fit === "center") {
        const drawW = img.width as number;
        const drawH = img.height as number;
        const dx = Math.floor((width - drawW) / 2);
        const dy = Math.floor((height - drawH) / 2);
        ctx.drawImage(img, dx, dy);
      } else if (fit === "tile") {
        const pattern = ctx.createPattern(img, "repeat");
        if (pattern) {
          ctx.fillStyle = pattern as any;
          ctx.fillRect(0, 0, width, height);
          if (!transparent) ctx.fillStyle = color || "#ffffff";
        }
      } else {
        const scale =
          fit === "cover"
            ? Math.max(
                width / (img.width as number),
                height / (img.height as number)
              )
            : Math.min(
                width / (img.width as number),
                height / (img.height as number)
              );
        const drawW = Math.floor((img.width as number) * scale);
        const drawH = Math.floor((img.height as number) * scale);
        const dx = Math.floor((width - drawW) / 2);
        const dy = Math.floor((height - drawH) / 2);
        ctx.drawImage(img, dx, dy, drawW, drawH);
      }
    } catch {}
  }

  // Optional mild pixelation to background only
  if (bgPixelSize && bgPixelSize > 1) {
    const pixelBg = drawPixelated(canvas, bgPixelSize);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(pixelBg, 0, 0);
  }

  // Draw subject (already processed as needed by caller)
  ctx.drawImage(subject, 0, 0);

  return canvas;
}
