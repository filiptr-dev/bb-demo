"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import ErrorState from "@/components/shared/ErrorState";
import ErrorActions from "@/components/shared/ErrorActions";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("Errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      code="500"
      title={t("error.title")}
      text={t("error.text")}
      note={error.digest && t("error.reference", { digest: error.digest })}
    >
      <ErrorActions retry={retry} />
    </ErrorState>
  );
}
