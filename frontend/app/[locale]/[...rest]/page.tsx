import { notFound } from "next/navigation";
import { notFoundMetadata } from "@/i18n/metadata";

// Unmatched paths under a locale land here so they get the localized, site-styled 404 instead of Next's bare one.
export async function generateMetadata({ params }: PageProps<"/[locale]/[...rest]">) {
  return notFoundMetadata((await params).locale);
}

export default function CatchAll() {
  notFound();
}
