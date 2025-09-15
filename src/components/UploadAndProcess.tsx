"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { removeBackground } from "@imgly/background-removal";

type Props = {
  className?: string;
};

type PipelineResult = {
  originalUrl: string;
  noBgUrl: string;
  pixelatedUrl: string;
};

type BackgroundItem = {
  id: string;
  name: string;
  src: string;
};

function drawPixelated(
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

  // Draw small
  tctx.imageSmoothingEnabled = false;
  tctx.clearRect(0, 0, smallW, smallH);
  tctx.drawImage(source, 0, 0, smallW, smallH);

  // Scale up without smoothing
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0, smallW, smallH, 0, 0, canvas.width, canvas.height);

  return canvas;
}

// Simple RGB distance based quantization to a curated palette
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = hex.replace("#", "");
  const bigint = parseInt(
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v,
    16
  );
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function quantizeToPalette(canvas: HTMLCanvasElement, paletteHex: string[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const palette = paletteHex.map(hexToRgb);

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue; // keep transparency
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

// A compact palette inspired by cozy farming RPG aesthetics
const STARDEW_LIKE_PALETTE: string[] = [
  "#1b1f23",
  "#3a2e2a",
  "#5a463e",
  "#8b6d5c", // browns/shadows
  "#c9a27e",
  "#e7c9a9", // light skin tones
  "#6e3a2e",
  "#b4583c", // warm reds/orange
  "#e6904a",
  "#f6c25b", // golden highlights
  "#2d4a2b",
  "#3f6d3a",
  "#6ea34a",
  "#a9d36d", // greens
  "#1f2e4a",
  "#2f4f6d",
  "#4f78a6",
  "#7db7e0", // blues
  "#8a6bb8",
  "#c49be0", // violets
  "#7b6b5a",
  "#a39483", // neutrals
  "#e6e2d3",
  "#ffffff", // lights
];

// Procedural background generators (pixel-art friendly)
function generateBackgroundCanvas(
  id: string,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // helpers
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  switch (id) {
    case "pastel-sky": {
      // horizontal bands
      const bands = ["#b3e5fc", "#c5e1f5", "#d7ccf0", "#f8cdd6"];
      const bandH = Math.ceil(height / bands.length);
      bands.forEach((c, i) => rect(0, i * bandH, width, bandH, c));
      // clouds (blocky)
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 6; i++) {
        const cw = 20 + ((i * 7) % 30);
        const ch = 10 + ((i * 5) % 20);
        const cx = Math.floor((i * 47) % (width - cw));
        const cy = Math.floor((i * 23) % Math.floor(height * 0.6));
        for (let y = 0; y < ch; y += 4) {
          for (let x = 0; x < cw; x += 4) {
            if (Math.random() > 0.2) rect(cx + x, cy + y, 4, 4, "#ffffff");
          }
        }
      }
      break;
    }
    case "meadow": {
      rect(0, 0, width, height, "#b8e986");
      // darker grass tiles
      for (let y = 0; y < height; y += 6) {
        for (let x = 0; x < width; x += 6) {
          if (((x + y) / 6) % 2 === 0) rect(x, y, 6, 6, "#a9d36d");
        }
      }
      // flowers
      const colors = ["#ff8a80", "#ffd180", "#ffff8d", "#82b1ff"];
      for (let i = 0; i < 80; i++) {
        const fx = Math.floor(Math.random() * width);
        const fy = Math.floor(height * 0.4 + Math.random() * height * 0.6);
        rect(fx, fy, 2, 2, colors[i % colors.length]);
      }
      break;
    }
    case "beach": {
      // sky
      rect(0, 0, width, Math.floor(height * 0.5), "#a7d8ff");
      // sea
      rect(
        0,
        Math.floor(height * 0.5),
        width,
        Math.floor(height * 0.25),
        "#4f78a6"
      );
      for (
        let y = Math.floor(height * 0.5);
        y < Math.floor(height * 0.75);
        y += 4
      ) {
        for (let x = 0; x < width; x += 8) rect(x, y, 6, 2, "#7db7e0");
      }
      // sand
      rect(
        0,
        Math.floor(height * 0.75),
        width,
        Math.floor(height * 0.25),
        "#e6c690"
      );
      for (let i = 0; i < 200; i++) {
        rect(
          Math.floor(Math.random() * width),
          Math.floor(height * 0.75 + Math.random() * height * 0.25),
          2,
          2,
          "#d1b27d"
        );
      }
      break;
    }
    case "night-city": {
      rect(0, 0, width, height, "#1b1f23");
      // buildings blocks
      for (let i = 0; i < 10; i++) {
        const bw = 20 + ((i * 13) % 30);
        const bh = 30 + ((i * 17) % Math.floor(height * 0.6));
        const bx = Math.floor((i * 37) % (width - bw));
        const by = height - bh;
        rect(bx, by, bw, bh, i % 2 ? "#2f4f6d" : "#3a2e2a");
        // windows
        for (let y = by + 4; y < by + bh - 2; y += 6) {
          for (let x = bx + 3; x < bx + bw - 3; x += 6) {
            if (Math.random() > 0.6) rect(x, y, 2, 2, "#f6c25b");
          }
        }
      }
      break;
    }
    default: {
      // transparent
      rect(0, 0, width, height, "rgba(0,0,0,0)");
    }
  }

  return canvas;
}

async function composeOnBackground(
  subject: HTMLImageElement | HTMLCanvasElement,
  bgId: string,
  imageSrc?: string | null
): Promise<HTMLCanvasElement> {
  const width = subject.width as number;
  const height = subject.height as number;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  let bg: HTMLCanvasElement | HTMLImageElement = generateBackgroundCanvas(
    bgId,
    width,
    height
  );
  if (imageSrc) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (e) => reject(e);
        image.crossOrigin = "anonymous";
        image.src = imageSrc;
      });
      bg = img;
    } catch {}
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bg, 0, 0);
  ctx.drawImage(subject, 0, 0);

  return canvas;
}

export function UploadAndProcess({ className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pixelSize, setPixelSize] = useState<number>(12);
  const BACKGROUNDS = useMemo(
    () => [
      { id: "none", name: "Şeffaf" },
      { id: "pastel-sky", name: "Pastel Gökyüzü" },
      { id: "meadow", name: "Çayır" },
      { id: "beach", name: "Sahil" },
      { id: "night-city", name: "Gece Şehir" },
    ],
    []
  );
  const [bgId, setBgId] = useState<string>("pastel-sky");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [bgItems, setBgItems] = useState<BackgroundItem[]>([]);
  const [selectedBg, setSelectedBg] = useState<BackgroundItem | null>(null);

  const onFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setError("Lütfen bir görsel dosyası yükleyin.");
        return;
      }
      setError(null);
      setLoading(true);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const inputBlob = new Blob([new Uint8Array(arrayBuffer)], {
          type: file.type,
        });

        const originalUrl = URL.createObjectURL(file);
        const removed = await removeBackground(inputBlob, {
          progress: () => {},
        });

        const noBgUrl = URL.createObjectURL(removed);

        // Create image from no-bg blob
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = (e) => reject(e);
          image.src = noBgUrl;
        });

        // Compose subject on selected background before pixelating
        const composed = await composeOnBackground(img, bgId, selectedBg?.src);
        const pixelatedCanvas = drawPixelated(composed, pixelSize);
        quantizeToPalette(pixelatedCanvas, STARDEW_LIKE_PALETTE);
        const pixelatedUrl = pixelatedCanvas.toDataURL("image/png");

        setResult({ originalUrl, noBgUrl, pixelatedUrl });
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "İşlem sırasında bir hata oluştu."
        );
      } finally {
        setLoading(false);
      }
    },
    [pixelSize]
  );

  useEffect(() => {
    if (!dropRef.current) return;
    const node = dropRef.current;

    const prevent = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const handleDragOver = (e: DragEvent) => {
      prevent(e);
      setDragActive(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      prevent(e);
      setDragActive(false);
    };
    const handleDrop = (e: DragEvent) => {
      prevent(e);
      setDragActive(false);
      const dt = e.dataTransfer;
      onFiles(dt?.files ?? null);
    };

    node.addEventListener("dragover", handleDragOver as any);
    node.addEventListener("dragleave", handleDragLeave as any);
    node.addEventListener("drop", handleDrop as any);
    node.addEventListener("dragenter", handleDragOver as any);

    return () => {
      node.removeEventListener("dragover", handleDragOver as any);
      node.removeEventListener("dragleave", handleDragLeave as any);
      node.removeEventListener("drop", handleDrop as any);
      node.removeEventListener("dragenter", handleDragOver as any);
    };
  }, [onFiles]);

  // Load gallery backgrounds from manifest (optional)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/backgrounds/manifest.json", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as BackgroundItem[];
        if (!cancelled) setBgItems(json);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiles(e.target.files);
    },
    [onFiles]
  );

  const handleDownload = useCallback(() => {
    if (!result?.pixelatedUrl) return;
    const link = document.createElement("a");
    link.href = result.pixelatedUrl;
    link.download = "pixelixa.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  const dropClasses = useMemo(
    () =>
      "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 text-center transition-colors " +
      (dragActive
        ? "border-blue-500 bg-blue-500/5"
        : "border-foreground/20 hover:border-foreground/40"),
    [dragActive]
  );

  return (
    <div className={className}>
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        <div
          ref={dropRef}
          className={dropClasses}
          role="button"
          aria-label="Görsel yükleme alanı"
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-base font-medium">
            Görseli buraya sürükleyip bırakın
          </p>
          <p className="text-sm text-foreground/70">
            veya tıklayarak dosya seçin
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="sr-only"
          />
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="pixelSize" className="text-sm">
            Pixel boyutu
          </label>
          <input
            id="pixelSize"
            type="range"
            min={4}
            max={40}
            step={1}
            value={pixelSize}
            onChange={(e) => setPixelSize(Number(e.target.value))}
            className="w-full"
          />
          <span className="w-10 text-right text-sm tabular-nums">
            {pixelSize}
          </span>
          <button
            disabled={loading || !result?.noBgUrl}
            onClick={async () => {
              if (!result?.noBgUrl) return;
              setLoading(true);
              try {
                const img = await new Promise<HTMLImageElement>(
                  (resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = (e) => reject(e);
                    image.src = result.noBgUrl;
                  }
                );
                const composed = await composeOnBackground(
                  img,
                  bgId,
                  selectedBg?.src
                );
                const canvas = drawPixelated(composed, pixelSize);
                quantizeToPalette(canvas, STARDEW_LIKE_PALETTE);
                const data = canvas.toDataURL("image/png");
                setResult((prev) =>
                  prev ? { ...prev, pixelatedUrl: data } : prev
                );
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 rounded-md bg-foreground text-background text-sm disabled:opacity-50"
          >
            Yeniden oluştur
          </button>
        </div>

        {/* Background selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground/70 mr-1">Arka plan:</span>
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={async () => {
                setBgId(bg.id);
                if (!result?.noBgUrl) return;
                setLoading(true);
                try {
                  const img = await new Promise<HTMLImageElement>(
                    (resolve, reject) => {
                      const image = new Image();
                      image.onload = () => resolve(image);
                      image.onerror = (e) => reject(e);
                      image.src = result.noBgUrl;
                    }
                  );
                  const composed = await composeOnBackground(img, bg.id);
                  const canvas = drawPixelated(composed, pixelSize);
                  quantizeToPalette(canvas, STARDEW_LIKE_PALETTE);
                  const data = canvas.toDataURL("image/png");
                  setResult((prev) =>
                    prev ? { ...prev, pixelatedUrl: data } : prev
                  );
                } finally {
                  setLoading(false);
                }
              }}
              className={
                "px-2 py-1 rounded-md text-sm border " +
                (bgId === bg.id
                  ? "bg-foreground text-background border-transparent"
                  : "border-foreground/20 hover:border-foreground/40")
              }
            >
              {bg.name}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-red-600 text-sm" role="alert">
            {error}
          </div>
        )}

        {loading && <div className="text-sm">İşleniyor...</div>}

        {result && (
          <div className="grid grid-cols-1 gap-4 items-start">
            <figure className="flex flex-col gap-2">
              <figcaption className="text-sm font-medium">Pixel art</figcaption>
              <img
                src={result.pixelatedUrl}
                alt="Pixel art görsel"
                className="rounded-lg border border-foreground/10 image-render-pixelated"
              />
              <button
                onClick={handleDownload}
                className="self-start mt-1 px-3 py-1.5 rounded-md bg-foreground text-background text-sm"
              >
                İndir
              </button>
            </figure>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadAndProcess;
