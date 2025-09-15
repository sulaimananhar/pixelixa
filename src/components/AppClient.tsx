"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import Uploader from "./Uploader";
import Controls from "./Controls";
import BackgroundGallery, { BackgroundItem } from "./BackgroundGallery";
import Preview from "./Preview";
import {
  drawPixelated,
  quantizeToPalette,
  STARDEW_LIKE_PALETTE,
} from "@/lib/image/pixelate";
import { composeOnBackground } from "@/lib/image/background";

type PipelineResult = {
  originalUrl: string;
  noBgUrl: string;
  pixelatedUrl: string;
};

export default function AppClient() {
  const [pixelSize, setPixelSize] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [bgItems, setBgItems] = useState<BackgroundItem[]>([]);
  const [selectedBg, setSelectedBg] = useState<BackgroundItem | null>(null);
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [fit, setFit] = useState<
    "contain" | "cover" | "stretch" | "center" | "tile"
  >("cover");
  const [bgMode, setBgMode] = useState<"none" | "images" | "color">("none");
  const [bgPixelSize, setBgPixelSize] = useState<number>(10);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const onFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file.");
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

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = (e) => reject(e);
          image.src = noBgUrl;
        });

        // Pixelate + quantize ONLY the subject
        const subjectPixel = drawPixelated(img, pixelSize);
        quantizeToPalette(subjectPixel, STARDEW_LIKE_PALETTE);

        // Compose subject over (optionally mild-pixelated) background
        const composed = await composeOnBackground(subjectPixel, {
          imageSrc: bgMode === "images" ? selectedBg?.src : null,
          color: bgMode === "color" ? bgColor : null,
          fit,
          bgPixelSize: bgMode === "images" ? bgPixelSize : null,
          transparent: bgMode === "none",
        });
        const pixelatedUrl = composed.toDataURL("image/png");
        setResult({ originalUrl, noBgUrl, pixelatedUrl });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    },
    [bgColor, fit, pixelSize, selectedBg, bgMode, bgPixelSize]
  );

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

  // Auto-pick first background when needed
  useEffect(() => {
    if (!result || bgMode !== "images") return;
    if (!selectedBg && bgItems.length > 0) {
      const first = bgItems[0];
      setSelectedBg(first);
      void rebuild({ imageSrc: first.src, transparent: false });
    }
  }, [bgItems, bgMode, selectedBg, result]);

  const rebuild = useCallback(
    async (overrides?: {
      imageSrc?: string | null;
      color?: string | null;
      fit?: "contain" | "cover" | "stretch" | "center" | "tile";
      transparent?: boolean;
    }) => {
      if (!result?.noBgUrl) return;
      setLoading(true);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = (e) => reject(e);
          image.src = result.noBgUrl;
        });

        // Pixelate + quantize ONLY the subject
        const subjectPixel = drawPixelated(img, pixelSize);
        quantizeToPalette(subjectPixel, STARDEW_LIKE_PALETTE);

        // Compose over background with optional pixelation, with overrides if provided
        const composed = await composeOnBackground(subjectPixel, {
          imageSrc:
            overrides?.imageSrc !== undefined
              ? overrides.imageSrc
              : selectedBg?.src,
          color: overrides?.color ?? bgColor,
          fit: overrides?.fit ?? fit,
          bgPixelSize: bgMode === "images" ? bgPixelSize : null,
          transparent: overrides?.transparent ?? bgMode === "none",
        });
        const data = composed.toDataURL("image/png");
        setResult((prev) => (prev ? { ...prev, pixelatedUrl: data } : prev));
      } finally {
        setLoading(false);
      }
    },
    [bgColor, fit, pixelSize, bgPixelSize, bgMode, result?.noBgUrl, selectedBg]
  );

  const download = useCallback(() => {
    if (!result?.pixelatedUrl) return;
    const link = document.createElement("a");
    link.href = result.pixelatedUrl;
    link.download = "pixelixa.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <Uploader onFiles={onFiles} />
      {result ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Controls
            pixelSize={pixelSize}
            setPixelSize={(v) => {
              setPixelSize(v);
              if (result) {
                void rebuild();
              }
            }}
            loading={loading}
            disabled={!result}
          />
          <div className="flex flex-wrap items-center gap-2 sm:gap-2">
            <button
              onClick={download}
              className="px-3 py-2 rounded-md bg-foreground text-background text-sm font-medium"
            >
              Download
            </button>
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFiles(e.target.files)}
            />
            <button
              onClick={async () => {
                setBgMode("none");
                setSelectedBg(null);
                setBgColor("#ffffff");
                setFit("cover");
                setBgPixelSize(10);
                if (result?.noBgUrl) {
                  await rebuild({
                    imageSrc: null,
                    color: null,
                    transparent: true,
                  });
                }
              }}
              className="px-3 py-2 rounded-md border border-foreground/20 text-sm hover:bg-foreground/10"
            >
              Reset
            </button>
            <button
              onClick={() => {
                setResult(null);
                replaceInputRef.current?.click();
              }}
              className="px-2 sm:px-3 py-2 rounded-md border border-foreground/20 text-sm hover:bg-foreground/10"
            >
              <span className="hidden sm:inline">Upload new image</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-foreground/20 rounded-lg p-4 text-sm text-foreground/70">
          Adjustments will appear here after you upload an image.
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-sm text-foreground/70 font-medium">
              Background
            </span>
            <div className="inline-flex items-center gap-1 border border-foreground/20 rounded-md p-0.5">
              <button
                onClick={async () => {
                  setBgMode("none");
                  setSelectedBg(null);
                  await rebuild({
                    imageSrc: null,
                    color: null,
                    transparent: true,
                  });
                }}
                className={
                  "px-2 py-1 text-xs sm:text-sm rounded " +
                  (bgMode === "none"
                    ? "bg-foreground text-background"
                    : "hover:bg-foreground/10")
                }
                aria-pressed={bgMode === "none"}
                title="Transparent background"
              >
                None
              </button>
              <button
                onClick={async () => {
                  setBgMode("images");
                  const target = selectedBg?.src ?? bgItems[0]?.src ?? null;
                  if (!selectedBg && bgItems[0]) setSelectedBg(bgItems[0]);
                  await rebuild({ imageSrc: target, transparent: false });
                }}
                className={
                  "px-2 py-1 text-xs sm:text-sm rounded " +
                  (bgMode === "images"
                    ? "bg-foreground text-background"
                    : "hover:bg-foreground/10")
                }
                aria-pressed={bgMode === "images"}
                title="Use a background image"
              >
                Images
              </button>
              <button
                onClick={async () => {
                  setBgMode("color");
                  setSelectedBg(null);
                  await rebuild({
                    imageSrc: null,
                    color: bgColor,
                    transparent: false,
                  });
                }}
                className={
                  "px-2 py-1 text-xs sm:text-sm rounded " +
                  (bgMode === "color"
                    ? "bg-foreground text-background"
                    : "hover:bg-foreground/10")
                }
                aria-pressed={bgMode === "color"}
                title="Use a solid color background"
              >
                Color
              </button>
            </div>

            {bgMode === "color" && (
              <input
                type="color"
                value={bgColor}
                onChange={async (e) => {
                  setSelectedBg(null);
                  setBgColor(e.target.value);
                  await rebuild({
                    imageSrc: null,
                    color: e.target.value,
                    transparent: false,
                  });
                }}
                aria-label="Background color"
                className="w-8 h-8 sm:w-9 sm:h-9 p-0 border border-foreground/20 rounded"
                title="Pick a background color"
              />
            )}
          </div>

          {bgMode === "images" && (
            <>
              <BackgroundGallery
                items={bgItems}
                selectedId={selectedBg?.id ?? null}
                onSelect={async (item) => {
                  // append custom item to gallery if missing
                  if (!bgItems.some((i) => i.id === item.id)) {
                    setBgItems((prev) => [...prev, item]);
                  }
                  setSelectedBg(item);
                  await rebuild({ imageSrc: item.src, transparent: false });
                }}
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <label className="text-sm text-foreground/70 whitespace-nowrap">
                    bg pixel
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={bgPixelSize}
                    onChange={async (e) => {
                      const v = Number(e.target.value);
                      setBgPixelSize(v);
                      await rebuild();
                    }}
                    className="w-20 sm:w-24"
                  />
                  <span className="text-sm text-foreground/70 w-6 text-center">
                    {bgPixelSize}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm text-foreground/70 whitespace-nowrap">
                    fit
                  </span>
                  <div className="inline-flex items-center gap-1 border border-foreground/20 rounded-md p-0.5">
                    {(
                      ["cover", "stretch", "center", "tile", "contain"] as const
                    ).map((k) => (
                      <button
                        key={k}
                        onClick={async () => {
                          setFit(k);
                          await rebuild({ fit: k });
                        }}
                        className={
                          "px-1.5 sm:px-2 py-1 text-xs sm:text-sm rounded capitalize " +
                          (fit === k
                            ? "bg-foreground text-background"
                            : "hover:bg-foreground/10")
                        }
                        aria-pressed={fit === k}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div
          className="text-sm flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
          <span>Processing...</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 items-start">
        <Preview url={result?.pixelatedUrl} onDownload={download} />
      </div>
    </div>
  );
}
