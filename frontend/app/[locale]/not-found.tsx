import { getTranslations } from "next-intl/server";
import ErrorState from "@/components/shared/ErrorState";
import ErrorActions from "@/components/shared/ErrorActions";

// Rendered for notFound() anywhere under [locale] and, via [...rest], for every unmatched URL.
export default async function NotFound() {
  const t = await getTranslations("Errors");
  return (
    <ErrorState code="404" title={t("notFound.title")} text={t("notFound.text")}>
      <ErrorActions />
    </ErrorState>
  );
}
