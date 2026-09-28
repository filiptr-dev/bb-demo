import { getTranslations } from "next-intl/server";
import ErrorState from "@/components/shared/ErrorState";
import ErrorActions from "@/components/shared/ErrorActions";

export default async function Unauthorized() {
  const t = await getTranslations("Errors");
  return (
    <ErrorState code="401" title={t("unauthorized.title")} text={t("unauthorized.text")}>
      <ErrorActions />
    </ErrorState>
  );
}
