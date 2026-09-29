"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "theme-variant";
const DEMO_ICON = "/icon-demo.svg";

// app/icon.svg (client blue) is what Next renders into <head>; the demo colors swap in the orange one from public/.
// The original href is kept on the element so switching back restores Next's hashed URL.
function setFavicon(isClient: boolean) {
  document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((link) => {
    link.dataset.clientHref ??= link.getAttribute("href") ?? "";
    link.href = isClient ? link.dataset.clientHref : DEMO_ICON;
  });
}

// The <html> tag ships with data-theme="client" (the real client colors) by default — see app/[locale]/layout.tsx.
// This effect only needs to *remove* it for a visitor who explicitly opted into the "demo" colors, and it must
// run as a real effect (not a <script> tag): a locale switch remounts <html>/<body> fresh each time, and React
// does not re-execute inline scripts on a client-driven remount, only actual component effects.
export default function ThemeVariantToggle() {
  const t = useTranslations("ThemeToggle");
  const [isClientTheme, setIsClientTheme] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "demo") {
      setIsClientTheme(false);
      document.documentElement.removeAttribute("data-theme");
      setFavicon(false);
    }
  }, []);

  function toggle() {
    const next = !isClientTheme;
    setIsClientTheme(next);
    setFavicon(next);
    if (next) {
      document.documentElement.dataset.theme = "client";
      localStorage.setItem(STORAGE_KEY, "client");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(STORAGE_KEY, "demo");
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
      {isClientTheme ? t("client") : t("demo")}
    </button>
  );
}
