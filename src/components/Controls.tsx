"use client";

import React from "react";

type Props = {
  pixelSize: number;
  setPixelSize: (v: number) => void;
  loading: boolean;
  disabled?: boolean;
};

export function Controls({
  pixelSize,
  setPixelSize,
  loading,
  disabled,
}: Props) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
      aria-busy={loading}
    >
      <label
        htmlFor="pixelSize"
        className="text-sm font-medium whitespace-nowrap"
      >
        Pixel size
      </label>
      <div className="flex items-center gap-3 flex-1">
        <input
          id="pixelSize"
          type="range"
          min={4}
          max={15}
          step={1}
          value={pixelSize}
          onChange={(e) => setPixelSize(Number(e.target.value))}
          className="flex-1 min-w-0"
          disabled={!!disabled}
        />
        <span className="w-8 text-center text-sm tabular-nums">
          {pixelSize}
        </span>
      </div>
      {!disabled && (
        <span className="text-xs text-foreground/60 hidden sm:inline">
          applies instantly
        </span>
      )}
    </div>
  );
}

export default Controls;
