export type Industry = {
  slug: string;
  image: string;
};

export type BearingType = {
  slug: string;
  image: string;
};

export type SealCode = "open" | "shields" | "both";
export type BoreCode = "tapered" | "cylindrical";

export type Product = {
  slug: string;
  designation: string;
  brand: string;
  type: string;
  d: number;
  D: number;
  B: number;
  seal: SealCode;
  boreType: BoreCode;
  industries: string[];
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

export const bearingTypes: BearingType[] = [
  { slug: "deep-groove", image: `${legacyBearings}radijalno-topchesti-lezhishta.jpg` },
  { slug: "angular-contact", image: `${legacyBearings}ednoredni-topchesti-lezhishta-so-kos-dopir.jpg` },
  { slug: "self-aligning", image: `${legacyBearings}samopodeslivi-topchesti-lezhishta.jpg` },
  { slug: "spherical-roller", image: `${legacyBearings}buresto-valchesti-lezhishta.jpg` },
  { slug: "tapered-roller", image: `${legacyBearings}konusno-valchesti-lezhishta.jpg` },
  { slug: "cylindrical-roller", image: `${legacyBearings}ednoredni-cilindrichno-valchesti-lezhishta.jpg` },
  { slug: "thrust-ball", image: `${legacyBearings}aksijalni-lezhishta.jpg` },
  { slug: "unit", image: `${legacyBearings}y-lezhishta-i-lezhishni-edinici.jpg` },
];

export const typeImage = (type: string) => bearingTypes.find((t) => t.slug === type)?.image;

const DG = "deep-groove", AC = "angular-contact", SA = "self-aligning", SR = "spherical-roller",
  TR = "tapered-roller", CR = "cylindrical-roller", TB = "thrust-ball", UN = "unit";
const BOTH: SealCode = "both", SHIELDS: SealCode = "shields", OPEN: SealCode = "open";

type Raw = [string, string, number, number, number, SealCode, string[]];

const raw: Raw[] = [
  ["6004-2RS1", DG, 20, 42, 12, BOTH, ["food", "chemical", "power"]],
  ["6204-2Z", DG, 20, 47, 14, SHIELDS, ["food", "paper", "power"]],
  ["6205", DG, 25, 52, 15, OPEN, ["power", "paper", "chemical"]],
  ["6205-2RS1", DG, 25, 52, 15, BOTH, ["food", "chemical", "recycling"]],
  ["6206-2Z", DG, 30, 62, 16, SHIELDS, ["food", "power", "paper"]],
  ["6208", DG, 40, 80, 18, OPEN, ["power", "metallurgy", "paper"]],
  ["6305-2RS1", DG, 25, 62, 17, BOTH, ["food", "chemical", "recycling"]],
  ["6310", DG, 50, 110, 27, OPEN, ["mining", "cement", "power"]],
  ["6312-2Z", DG, 60, 130, 31, SHIELDS, ["power", "cement", "chemical"]],
  ["6316", DG, 80, 170, 39, OPEN, ["mining", "metallurgy", "cement"]],
  ["7207 BECBP", AC, 35, 72, 17, OPEN, ["paper", "power", "chemical"]],
  ["7308 BECBP", AC, 40, 90, 23, OPEN, ["chemical", "power", "metallurgy"]],
  ["7311 BECBM", AC, 55, 120, 29, OPEN, ["mining", "metallurgy", "recycling"]],
  ["3205 A-2RS1TN9/MT33", AC, 25, 52, 20.6, BOTH, ["food", "chemical"]],
  ["1207 ETN9", SA, 35, 72, 17, OPEN, ["paper", "power", "food"]],
  ["2208 ETN9", SA, 40, 80, 23, OPEN, ["paper", "recycling", "cement"]],
  ["1310 ETN9", SA, 50, 110, 27, OPEN, ["mining", "metallurgy", "cement"]],
  ["1210 EKTN9", SA, 50, 90, 20, OPEN, ["paper", "cement", "recycling"]],
  ["1310 EKTN9", SA, 50, 110, 27, OPEN, ["mining", "metallurgy", "cement"]],
  ["22212 E", SR, 60, 110, 28, OPEN, ["paper", "power", "food"]],
  ["22212 EK", SR, 60, 110, 28, OPEN, ["paper", "power", "food"]],
  ["22220 EK", SR, 100, 180, 46, OPEN, ["cement", "mining", "paper", "recycling"]],
  ["23124 CCK/W33", SR, 120, 200, 62, OPEN, ["cement", "metallurgy", "mining", "paper"]],
  ["22220 E", SR, 100, 180, 46, OPEN, ["cement", "mining", "paper", "recycling"]],
  ["22314 E", SR, 70, 150, 51, OPEN, ["mining", "recycling", "metallurgy"]],
  ["22316 E", SR, 80, 170, 58, OPEN, ["mining", "cement", "recycling"]],
  ["23124 CC/W33", SR, 120, 200, 62, OPEN, ["cement", "metallurgy", "mining", "paper"]],
  ["30208 J2/Q", TR, 40, 80, 19.75, OPEN, ["metallurgy", "power", "mining"]],
  ["32208 J2/Q", TR, 40, 80, 24.75, OPEN, ["metallurgy", "power", "mining"]],
  ["30310 J2", TR, 50, 110, 29.25, OPEN, ["mining", "metallurgy", "cement"]],
  ["32310 J2/Q", TR, 50, 110, 42.25, OPEN, ["mining", "metallurgy", "cement"]],
  ["32220 J2/Q", TR, 100, 180, 49, OPEN, ["metallurgy", "mining", "cement"]],
  ["NU 208 ECP", CR, 40, 80, 18, OPEN, ["power", "paper", "chemical"]],
  ["NJ 310 ECP", CR, 50, 110, 27, OPEN, ["power", "metallurgy", "cement"]],
  ["NU 2216 ECP", CR, 80, 140, 33, OPEN, ["power", "paper", "recycling"]],
  ["NU 320 ECP", CR, 100, 215, 47, OPEN, ["mining", "cement", "metallurgy"]],
  ["51108", TB, 40, 60, 13, OPEN, ["chemical", "power", "food"]],
  ["51210", TB, 50, 78, 22, OPEN, ["chemical", "power", "recycling"]],
  ["YAR 205-2F", UN, 25, 52, 34.1, BOTH, ["food", "recycling", "chemical"]],
  ["6001-2RS1", DG, 12, 28, 8, BOTH, ["food", "chemical", "power"]],
  ["6002-2Z", DG, 15, 32, 9, SHIELDS, ["food", "paper", "power"]],
  ["6003", DG, 17, 35, 10, OPEN, ["power", "paper", "chemical"]],
  ["6006-2RS1", DG, 30, 55, 13, BOTH, ["food", "chemical", "recycling"]],
  ["6007", DG, 35, 62, 14, OPEN, ["power", "paper", "mining"]],
  ["6008-2Z", DG, 40, 68, 15, SHIELDS, ["food", "paper", "power"]],
  ["6009", DG, 45, 75, 16, OPEN, ["power", "chemical", "paper"]],
  ["6010-2RS1", DG, 50, 80, 16, BOTH, ["food", "chemical", "recycling"]],
  ["6206", DG, 30, 62, 16, OPEN, ["power", "paper", "mining"]],
  ["6207-2RS1", DG, 35, 72, 17, BOTH, ["food", "chemical", "recycling"]],
  ["6210-2Z", DG, 50, 90, 20, SHIELDS, ["food", "paper", "power"]],
  ["6305", DG, 25, 62, 17, OPEN, ["power", "mining", "recycling"]],
  ["6306-2RS1", DG, 30, 72, 19, BOTH, ["food", "chemical", "recycling"]],
  ["6308", DG, 40, 90, 23, OPEN, ["power", "mining", "cement"]],
  ["7205 BECBP", AC, 25, 52, 15, OPEN, ["power", "chemical", "paper"]],
  ["3208 A-2RS1", AC, 40, 80, 30.8, BOTH, ["chemical", "food", "recycling"]],
  ["1205 ETN9", SA, 25, 52, 15, OPEN, ["paper", "power", "food"]],
  ["2206 ETN9", SA, 30, 62, 20, OPEN, ["paper", "mining", "recycling"]],
  ["22210 E", SR, 50, 90, 23, OPEN, ["mining", "cement", "recycling"]],
  ["22215 E", SR, 75, 130, 31, OPEN, ["mining", "cement", "metallurgy"]],
  ["22312 E", SR, 60, 130, 46, OPEN, ["mining", "cement", "metallurgy"]],
  ["23222 CCK/W33", SR, 110, 200, 69.8, OPEN, ["cement", "metallurgy", "mining"]],
  ["30205", TR, 25, 52, 16.25, OPEN, ["power", "mining", "recycling"]],
  ["30207", TR, 35, 72, 18.25, OPEN, ["power", "mining", "cement"]],
  ["32008 X", TR, 40, 68, 19, OPEN, ["power", "paper", "metallurgy"]],
  ["32310", TR, 50, 110, 42.25, OPEN, ["mining", "cement", "metallurgy"]],
  ["33215", TR, 75, 130, 41.25, OPEN, ["mining", "metallurgy", "recycling"]],
  ["NU 205 ECP", CR, 25, 52, 15, OPEN, ["power", "paper", "chemical"]],
  ["NU 210 ECP", CR, 50, 90, 20, OPEN, ["power", "paper", "metallurgy"]],
  ["NJ 308 ECP", CR, 40, 90, 23, OPEN, ["power", "mining", "cement"]],
  ["NU 2210 ECP", CR, 50, 90, 23, OPEN, ["power", "metallurgy", "mining"]],
  ["51105", TB, 25, 42, 11, OPEN, ["chemical", "power", "food"]],
  ["51206", TB, 30, 52, 16, OPEN, ["chemical", "power", "recycling"]],
  ["51307", TB, 35, 68, 24, OPEN, ["mining", "power", "chemical"]],
  ["YAR 206-2F", UN, 30, 62, 38.1, BOTH, ["food", "recycling", "chemical"]],
  ["YAR 207-2F", UN, 35, 72, 42.9, BOTH, ["food", "recycling", "paper"]],
  ["YAR 208-2F", UN, 40, 80, 49.2, BOTH, ["food", "recycling", "mining"]],
];

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const products: Product[] = raw.map(([designation, type, d, D, B, seal, inds]) => ({
  slug: slugify(designation),
  designation,
  brand: "SKF",
  type,
  d,
  D,
  B,
  seal,
  boreType: /(EK|CCK)/.test(designation) ? "tapered" : "cylindrical",
  industries: inds,
}));

export type ProductCategory = {
  slug: string;
  pageType: "hub" | "article" | "showcase" | "data-table";
  image: string;
};

// Demo only: product photos are hotlinked from the client's own media library (seals has none there, so it stays local).
const skfOffer = "https://bbunikoop.com.mk/wp-content/uploads/";

// Mirrors the "Original SKF Offer" category grid on the legacy site (bbunikoop.com.mk). Names/blurbs live in messages/*.json under ProductCategories.
export const productCategories: ProductCategory[] = [
  { slug: "bearings", pageType: "hub", image: `${skfOffer}2022/04/SINGLE-ROW-BALL-BEARINGS__66409.1605765209.jpg` },
  { slug: "housings", pageType: "article", image: `${skfOffer}2022/04/kukjishta-2.jpg` },
  { slug: "cooper", pageType: "article", image: `${skfOffer}2022/05/split-cooper3.png` },
  { slug: "seals", pageType: "article", image: "/images/products/seals.jpg" },
  { slug: "sleeves", pageType: "article", image: `${skfOffer}2022/05/hilzni-adapteri1.jpg` },
  { slug: "belts-chains", pageType: "hub", image: `${skfOffer}2022/04/Power-Transmission-1.jpg` },
  { slug: "bushings", pageType: "hub", image: `${skfOffer}2022/05/chauri1.jpg` },
  { slug: "nuts", pageType: "showcase", image: `${skfOffer}2022/05/navrtki1.png` },
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
  { slug: "composite-housing-units", pageType: "article", image: `${skfOffer}2022/04/edinici-so-kompozitni-kukjishta-2.jpg` },
  { slug: "y-bearings", pageType: "article", image: `${skfOffer}2022/04/y-5.jpg` },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getType = (slug: string) => bearingTypes.find((t) => t.slug === slug);
export const getIndustry = (slug: string) => industries.find((i) => i.slug === slug);
export const getProductCategory = (slug: string) => productCategories.find((c) => c.slug === slug);
