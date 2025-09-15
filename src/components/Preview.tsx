"use client";

import React from "react";

type Props = {
  url?: string | null;
  onDownload: () => void;
};

export function Preview({ url, onDownload }: Props) {
  if (!url) return null;
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium">Pixel art</figcaption>
      <img
        src={url}
        alt="Pixel art preview"
        className="rounded-lg border border-foreground/10 image-render-pixelated"
      />
    </figure>
  );
}

export default Preview;
