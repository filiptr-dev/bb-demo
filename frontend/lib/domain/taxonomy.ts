export type Industry = {
  slug: string;
  image: string;
};

export type BearingType = {
  slug: string;
  image?: string;
  banner?: boolean; // legacy type banner: product photo left, SKF logo panel right
};

export const industries: Industry[] = [
  { slug: "cement", image: "/images/industries/cement.jpg" },
  { slug: "metallurgy", image: "/images/industries/metallurgy.jpg" },
  { slug: "paper", image: "/images/industries/paper.jpg" },
  { slug: "power", image: "/images/industries/power.jpg" },
  { slug: "mining", image: "/images/industries/mining.jpg" },
  { slug: "chemical", image: "/images/industries/chemical.jpg" },
  { slug: "food", image: "/images/industries/food.jpg" },
  { slug: "recycling", image: "/images/industries/recycling.jpg" },
];

// Demo only: type photos are hotlinked from the legacy site's bearings page.
const legacyBearings = "https://bbunikoop.com.mk/wp-content/uploads/2022/04/";

const b = (slug: string, file: string): BearingType => ({ slug, image: `${legacyBearings}${file}`, banner: true });

export const bearingTypes: BearingType[] = [
  b("deep-groove", "radijalno-topchesti-lezhishta.jpg"),
  b("angular-contact", "ednoredni-topchesti-lezhishta-so-kos-dopir.jpg"),
  b("self-aligning", "samopodeslivi-topchesti-lezhishta.jpg"),
  b("spherical-roller", "buresto-valchesti-lezhishta.jpg"),
  b("tapered-roller", "konusno-valchesti-lezhishta.jpg"),
  b("cylindrical-roller", "ednoredni-cilindrichno-valchesti-lezhishta.jpg"),
  b("thrust-ball", "aksijalni-lezhishta.jpg"),
  b("unit", "y-lezhishta-i-lezhishni-edinici.jpg"),
  { slug: "toroidal" }, // no CARB photo on the legacy site
  b("needle-roller", "iglesti-lezhishta.jpg"),
  b("track-runner", "traektorni-lezhishta.jpg"),
  b("plain", "zglobni-lezhishta.jpg"),
  b("housing", "kukjishta.jpg"),
  { slug: "sleeve-nut", image: "https://bbunikoop.com.mk/wp-content/uploads/2022/05/hilzni-adapteri1.jpg" },
  { slug: "seal", image: "/images/products/seals.jpg" },
];

export type ProductCategory = {
  slug: string;
  pageType: "hub" | "article" | "showcase" | "data-table";
  image: string;
  catalog?: string; // bearing-type slug to filter /catalog by; "" = the whole catalog
};

// Demo only: product photos are hotlinked from the client's own media library (seals has none there, so it stays local).
const skfOffer = "https://bbunikoop.com.mk/wp-content/uploads/";

// Mirrors the "Original SKF Offer" category grid on the legacy site (bbunikoop.com.mk). Names/blurbs live in messages/*.json under ProductCategories.
export const productCategories: ProductCategory[] = [
  { slug: "bearings", pageType: "hub", image: `${skfOffer}2022/04/SINGLE-ROW-BALL-BEARINGS__66409.1605765209.jpg`, catalog: "" },
  { slug: "housings", pageType: "article", image: `${skfOffer}2022/04/kukjishta-2.jpg`, catalog: "housing" },
  { slug: "cooper", pageType: "article", image: `${skfOffer}2022/05/split-cooper3.png` },
  { slug: "seals", pageType: "article", image: "/images/products/seals.jpg", catalog: "seal" },
  { slug: "sleeves", pageType: "article", image: `${skfOffer}2022/05/hilzni-adapteri1.jpg`, catalog: "sleeve-nut" },
  { slug: "belts-chains", pageType: "hub", image: `${skfOffer}2022/04/Power-Transmission-1.jpg` },
  { slug: "bushings", pageType: "hub", image: `${skfOffer}2022/05/chauri1.jpg` },
  { slug: "nuts", pageType: "showcase", image: `${skfOffer}2022/05/navrtki1.png`, catalog: "sleeve-nut" },
  { slug: "speedi-sleeve", pageType: "article", image: `${skfOffer}2022/05/speedi-sleeve1.jpg` },
  { slug: "food-industry", pageType: "hub", image: `${skfOffer}2022/06/food-line-topchesti.jpg` },
  { slug: "pulley-alignment", pageType: "hub", image: `${skfOffer}2022/05/tkba-40-1.jpg` },
  { slug: "monitoring-instruments", pageType: "data-table", image: `${skfOffer}2022/05/instrumenti-za-sledenje-1.png` },
  { slug: "mounting-tools", pageType: "hub", image: `${skfOffer}2022/05/skf-tmmp1.jpg` },
  { slug: "maintenance", pageType: "hub", image: `${skfOffer}2022/05/induktivni2.jpg` },
  { slug: "shim-packs", pageType: "article", image: `${skfOffer}2022/06/paketi-so-podloshki-skf-tmas-2.jpg` },
  { slug: "greases", pageType: "data-table", image: `${skfOffer}2022/04/0901d1968063f674-LGFQ2-1x1_tcm_12-296405.webp` },
  { slug: "lubrication-systems", pageType: "hub", image: `${skfOffer}2022/06/tlgh-1.jpg` },
  { slug: "automatic-lubricators", pageType: "hub", image: `${skfOffer}2022/06/skf-24-1.jpg` },
  { slug: "vibracon", pageType: "article", image: `${skfOffer}2022/06/prilagodlivi-prikluchoci-za-skf-vibracon-1.jpg` },
  { slug: "composite-housing-units", pageType: "article", image: `${skfOffer}2022/04/edinici-so-kompozitni-kukjishta-2.jpg`, catalog: "unit" },
  { slug: "y-bearings", pageType: "article", image: `${skfOffer}2022/04/y-5.jpg`, catalog: "unit" },
];

// SKF product lines shown in the brands strip, each linked to the category page that carries it.
// Brand names stay untranslated.
export const skfLines: { name: string; category: string }[] = [
  { name: "SKF Explorer", category: "bearings" },
  { name: "SKF Y-bearings", category: "y-bearings" },
  { name: "SKF Cooper", category: "cooper" },
  { name: "SKF SNL", category: "housings" },
  { name: "SKF Speedi-Sleeve", category: "speedi-sleeve" },
  { name: "SKF Vibracon", category: "vibracon" },
  { name: "SKF TMAS", category: "shim-packs" },
  { name: "SKF LGMT 2", category: "greases" },
  { name: "SKF SYSTEM 24", category: "automatic-lubricators" },
  { name: "SKF Food Line", category: "food-industry" },
  { name: "SKF TKBA", category: "pulley-alignment" },
  { name: "SKF TIH", category: "maintenance" },
  { name: "SKF Microlog", category: "monitoring-instruments" },
  { name: "SKF KM", category: "nuts" },
];

export const getType =(slug: string) => bearingTypes.find((t) => t.slug === slug);
export const getIndustry = (slug: string) => industries.find((i) => i.slug === slug);
export const getProductCategory = (slug: string) => productCategories.find((c) => c.slug === slug);
