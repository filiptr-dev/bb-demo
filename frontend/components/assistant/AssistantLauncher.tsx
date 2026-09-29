"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

// The panel (and react-markdown with it) loads on the first open, and stays mounted afterwards so a closed panel
// keeps its conversation and a running answer.
const AssistantPanel = dynamic(() => import("./AssistantPanel"), { ssr: false });

export default function AssistantLauncher() {
  const t = useTranslations("Assistant");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={button}
        type="button"
        hidden={open}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        aria-label={t("launcherAria")}
        className="fixed bottom-[4.5rem] right-6 z-50 flex items-center gap-2.5 rounded-full bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 sm:right-12"
      >
        <Sparkles className="size-5" />
        {t("launcher")}
      </button>
      {loaded && (
        <AssistantPanel
          open={open}
          onClose={() => {
            setOpen(false);
            requestAnimationFrame(() => button.current?.focus());
          }}
        />
      )}
    </>
  );
}
