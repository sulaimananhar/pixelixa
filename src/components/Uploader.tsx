"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Props = {
  onFiles: (files: FileList | File[] | null) => void;
  className?: string;
};

export function Uploader({ onFiles, className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

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

  const dropClasses = useMemo(
    () =>
      "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 text-center transition-colors " +
      (dragActive
        ? "border-blue-500 bg-blue-500/5"
        : "border-foreground/20 hover:border-foreground/40"),
    [dragActive]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiles(e.target.files);
    },
    [onFiles]
  );

  return (
    <div className={className}>
      <div
        ref={dropRef}
        className={dropClasses}
        role="button"
        aria-label="Upload area"
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-base font-medium">Drag & drop an image here</p>
        <p className="text-sm text-foreground/70">or click to choose a file</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="sr-only"
        />
      </div>
    </div>
  );
}

export default Uploader;
