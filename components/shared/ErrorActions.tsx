"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

// Where to go from an error page. `retry` adds a "try again" button first (error boundaries only).
export default function ErrorActions({ retry, contact = true }: { retry?: () => void; contact?: boolean }) {
  const t = useTranslations("Errors.actions");
  return (
    <>
      {retry && (
        <Button onClick={retry} className="rounded-full bg-brand-gradient text-white">{t("retry")}</Button>
      )}
      <Button nativeButton={false} render={<Link href="/" />} variant={retry ? "outline" : "default"} className={retry ? "rounded-full" : "rounded-full bg-brand-gradient text-white"}>
        {t("home")}
      </Button>
      <Button nativeButton={false} render={<Link href="/catalog" />} variant="outline" className="rounded-full">{t("catalog")}</Button>
      {contact && (
        <Button nativeButton={false} render={<Link href="/contact" />} variant="outline" className="rounded-full">{t("contact")}</Button>
      )}
    </>
  );
}
