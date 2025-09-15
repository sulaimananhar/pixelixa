"use client";

import React, { useEffect, useState } from "react";

export default function FloatingReturnBadge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const ref = document.referrer || "";
    const url = new URL(window.location.href);
    const fromParam = url.searchParams.get("ref");
    if (ref.includes("berkin.tech") || fromParam === "berkin") setShow(true);
  }, []);

  if (!show) return null;

  return (
    <a
      href="https://berkin.tech"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-foreground text-background text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-lg hover:opacity-90"
      title="Back to berkin.tech"
      aria-label="Back to berkin.tech"
    >
      <span className="-ml-0.5">←</span>
      <span className="hidden sm:inline">Back to berkin.tech</span>
      <span className="sm:hidden">berkin.tech</span>
    </a>
  );
}
