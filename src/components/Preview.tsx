"use client";

import React from "react";
import Image from "next/image";

type Props = {
  url?: string | null;
  onDownload: () => void;
};

export function Preview({ url, onDownload }: Props) {
  if (!url) return null;
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium">Pixel art</figcaption>
      <div className="relative w-full aspect-square">
        <Image
          src={url}
          alt="Pixel art preview"
          className="rounded-lg border border-foreground/10"
          quality={100} // Görüntü kalitesini belirtebilirsiniz (opsiyonel).
          layout="fill" // Görüntü yerleşimi için.
          objectFit="contain" // Görüntünün nasıl sığacağını tanımlar.
        />
      </div>
    </figure>
  );
}

export default Preview;
