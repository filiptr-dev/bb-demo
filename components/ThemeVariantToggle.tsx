"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "theme-variant";

export default function ThemeVariantToggle() {
  const [isClientTheme, setIsClientTheme] = useState(false);

  useEffect(() => {
    setIsClientTheme(document.documentElement.dataset.theme === "client");
  }, []);

  function toggle() {
    const next = !isClientTheme;
    setIsClientTheme(next);
    if (next) {
      document.documentElement.dataset.theme = "client";
      localStorage.setItem(STORAGE_KEY, "client");
    } else {
      delete document.documentElement.dataset.theme;
      localStorage.setItem(STORAGE_KEY, "default");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground shadow-lg transition-colors hover:border-primary",
      )}
      aria-pressed={isClientTheme}
    >
      <Palette className="size-4" />
      {isClientTheme ? "Client site colors" : "Demo colors"}
    </button>
  );
}
