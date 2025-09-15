"use client";

import React, { useRef } from "react";

export type BackgroundItem = { id: string; name: string; src: string };

type Props = {
  items: BackgroundItem[];
  selectedId?: string | null;
  onSelect: (item: BackgroundItem) => void;
};

export function BackgroundGallery({ items, selectedId, onSelect }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  if (!items?.length) return (
    <div className="flex items-center">
      <button
        onClick={() => fileRef.current?.click()}
        className="border rounded-md w-14 h-10 flex items-center justify-center hover:bg-foreground/10"
        title="Add background"
      >
        +
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = URL.createObjectURL(f);
          onSelect({ id: `custom-${Date.now()}`, name: f.name || "Custom", src: url });
        }}
      />
    </div>
  );
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className={
            "border rounded-md overflow-hidden w-14 h-10 relative " +
            (selectedId === item.id ? "ring-2 ring-foreground" : "border-foreground/20")
          }
          title={item.name}
        >
          <img
            src={item.src}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover image-render-pixelated"
            crossOrigin="anonymous"
          />
        </button>
      ))}
      <button
        onClick={() => fileRef.current?.click()}
        className="border rounded-md w-14 h-10 flex items-center justify-center hover:bg-foreground/10"
        title="Add background"
      >
        +
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = URL.createObjectURL(f);
          onSelect({ id: `custom-${Date.now()}`, name: f.name || "Custom", src: url });
        }}
      />
    </div>
  );
}

export default BackgroundGallery;
