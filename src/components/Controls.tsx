"use client";

import React from "react";

type Props = {
  pixelSize: number;
  setPixelSize: (v: number) => void;
  loading: boolean;
  disabled?: boolean;
};

export function Controls({ pixelSize, setPixelSize, loading, disabled }: Props) {
  return (
    <div className="flex items-center gap-4" aria-busy={loading}>
      <label htmlFor="pixelSize" className="text-sm">
        Pixel size
      </label>
      <input
        id="pixelSize"
        type="range"
        min={6}
        max={18}
        step={1}
        value={pixelSize}
        onChange={(e) => setPixelSize(Number(e.target.value))}
        className="w-full"
        disabled={!!disabled}
      />
      <span className="w-10 text-right text-sm tabular-nums">{pixelSize}</span>
      {!disabled && (
        <span className="text-xs text-foreground/60">applies instantly</span>
      )}
    </div>
  );
}

export default Controls;
