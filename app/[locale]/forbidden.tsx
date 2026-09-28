import { getTranslations } from "next-intl/server";
import ErrorState from "@/components/shared/ErrorState";
import ErrorActions from "@/components/shared/ErrorActions";

export default async function Forbidden() {
  const t = await getTranslations("Errors");
  return (
    <ErrorState code="403" title={t("forbidden.title")} text={t("forbidden.text")}>
      <ErrorActions />
    </ErrorState>
  );
}
