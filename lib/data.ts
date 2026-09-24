export type Industry = {
  slug: string;
  name: string;
  nameEn: string;
  blurb: string;
  image: string;
};

export type BearingType = {
  slug: string;
  name: string;
  short: string;
};

export type Product = {
  slug: string;
  designation: string;
  brand: string;
  type: string;
  d: number;
  D: number;
  B: number;
  seal: string;
  boreType: string;
  industries: string[];
  description: string;
};

export const industries: Industry[] = [
  { slug: "cement", name: "Цемент", nameEn: "Cement", blurb: "Лежишта за вртливи печки, мелници и вентилатори – отпорни на прашина и високи температури.", image: "linear-gradient(135deg,#334155,#64748b)" },
  { slug: "metallurgy", name: "Металургија", nameEn: "Metallurgy", blurb: "Решенија за валци, континуирано леење и тешки товари во екстремни услови.", image: "linear-gradient(135deg,#7c2d12,#ea580c)" },
  { slug: "paper", name: "Хартија", nameEn: "Paper", blurb: "Прецизни лежишта за машини за хартија, сушилници и каландри.", image: "linear-gradient(135deg,#0f766e,#2dd4bf)" },
  { slug: "power", name: "Енергетика", nameEn: "Power generation", blurb: "Сигурни лежишта за генератори, турбини, пумпи и електромотори.", image: "linear-gradient(135deg,#1d4ed8,#60a5fa)" },
  { slug: "mining", name: "Рудници", nameEn: "Mining", blurb: "Издржливи лежишта за багери, транспортери, дробилки и вибрациски сита.", image: "linear-gradient(135deg,#44403c,#a8a29e)" },
  { slug: "chemical", name: "Хемиска индустрија", nameEn: "Chemical", blurb: "Лежишта и заптивки за пумпи, мешалки и компресори во агресивна средина.", image: "linear-gradient(135deg,#6d28d9,#a78bfa)" },
  { slug: "food", name: "Прехранбена индустрија", nameEn: "Food & beverage", blurb: "Заптитени лежишта со мазива безбедни за храна – лесно чистење и долг век.", image: "linear-gradient(135deg,#15803d,#86efac)" },
  { slug: "recycling", name: "Рециклирање", nameEn: "Recycling", blurb: "Лежишта за дробилки, шредери и преси со ударни оптоварувања.", image: "linear-gradient(135deg,#0e7490,#67e8f9)" },
];

export const bearingTypes: BearingType[] = [
  { slug: "deep-groove", name: "Радијални куглични лежишта", short: "Deep groove ball" },
  { slug: "angular-contact", name: "Аголни куглични лежишта", short: "Angular contact ball" },
  { slug: "self-aligning", name: "Самоместечки куглични лежишта", short: "Self-aligning ball" },
  { slug: "spherical-roller", name: "Сферни валчести лежишта", short: "Spherical roller" },
  { slug: "tapered-roller", name: "Конусни валчести лежишта", short: "Tapered roller" },
  { slug: "cylindrical-roller", name: "Цилиндрични валчести лежишта", short: "Cylindrical roller" },
  { slug: "thrust-ball", name: "Аксијални куглични лежишта", short: "Thrust ball" },
  { slug: "unit", name: "Лежишни единици", short: "Ball bearing units" },
];

const DG = "deep-groove", AC = "angular-contact", SA = "self-aligning", SR = "spherical-roller",
  TR = "tapered-roller", CR = "cylindrical-roller", TB = "thrust-ball", UN = "unit";

type Raw = [string, string, number, number, number, string, string[]];

const raw: Raw[] = [
  ["6004-2RS1", DG, 20, 42, 12, "Заптивка на двете страни", ["food", "chemical", "power"]],
  ["6204-2Z", DG, 20, 47, 14, "Штитови на двете страни", ["food", "paper", "power"]],
  ["6205", DG, 25, 52, 15, "Отворено", ["power", "paper", "chemical"]],
  ["6205-2RS1", DG, 25, 52, 15, "Заптивка на двете страни", ["food", "chemical", "recycling"]],
  ["6206-2Z", DG, 30, 62, 16, "Штитови на двете страни", ["food", "power", "paper"]],
  ["6208", DG, 40, 80, 18, "Отворено", ["power", "metallurgy", "paper"]],
  ["6305-2RS1", DG, 25, 62, 17, "Заптивка на двете страни", ["food", "chemical", "recycling"]],
  ["6310", DG, 50, 110, 27, "Отворено", ["mining", "cement", "power"]],
  ["6312-2Z", DG, 60, 130, 31, "Штитови на двете страни", ["power", "cement", "chemical"]],
  ["6316", DG, 80, 170, 39, "Отворено", ["mining", "metallurgy", "cement"]],
  ["7207 BECBP", AC, 35, 72, 17, "Отворено", ["paper", "power", "chemical"]],
  ["7308 BECBP", AC, 40, 90, 23, "Отворено", ["chemical", "power", "metallurgy"]],
  ["7311 BECBM", AC, 55, 120, 29, "Отворено", ["mining", "metallurgy", "recycling"]],
  ["3205 A-2RS1TN9/MT33", AC, 25, 52, 20.6, "Заптивка на двете страни", ["food", "chemical"]],
  ["1207 ETN9", SA, 35, 72, 17, "Отворено", ["paper", "power", "food"]],
  ["2208 ETN9", SA, 40, 80, 23, "Отворено", ["paper", "recycling", "cement"]],
  ["1310 ETN9", SA, 50, 110, 27, "Отворено", ["mining", "metallurgy", "cement"]],
  ["1210 EKTN9", SA, 50, 90, 20, "Отворено", ["paper", "cement", "recycling"]],
  ["1310 EKTN9", SA, 50, 110, 27, "Отворено", ["mining", "metallurgy", "cement"]],
  ["22212 E", SR, 60, 110, 28, "Отворено", ["paper", "power", "food"]],
  ["22212 EK", SR, 60, 110, 28, "Отворено", ["paper", "power", "food"]],
  ["22220 EK", SR, 100, 180, 46, "Отворено", ["cement", "mining", "paper", "recycling"]],
  ["23124 CCK/W33", SR, 120, 200, 62, "Отворено", ["cement", "metallurgy", "mining", "paper"]],
  ["22220 E", SR, 100, 180, 46, "Отворено", ["cement", "mining", "paper", "recycling"]],
  ["22314 E", SR, 70, 150, 51, "Отворено", ["mining", "recycling", "metallurgy"]],
  ["22316 E", SR, 80, 170, 58, "Отворено", ["mining", "cement", "recycling"]],
  ["23124 CC/W33", SR, 120, 200, 62, "Отворено", ["cement", "metallurgy", "mining", "paper"]],
  ["30208 J2/Q", TR, 40, 80, 19.75, "Отворено", ["metallurgy", "power", "mining"]],
  ["32208 J2/Q", TR, 40, 80, 24.75, "Отворено", ["metallurgy", "power", "mining"]],
  ["30310 J2", TR, 50, 110, 29.25, "Отворено", ["mining", "metallurgy", "cement"]],
  ["32310 J2/Q", TR, 50, 110, 42.25, "Отворено", ["mining", "metallurgy", "cement"]],
  ["32220 J2/Q", TR, 100, 180, 49, "Отворено", ["metallurgy", "mining", "cement"]],
  ["NU 208 ECP", CR, 40, 80, 18, "Отворено", ["power", "paper", "chemical"]],
  ["NJ 310 ECP", CR, 50, 110, 27, "Отворено", ["power", "metallurgy", "cement"]],
  ["NU 2216 ECP", CR, 80, 140, 33, "Отворено", ["power", "paper", "recycling"]],
  ["NU 320 ECP", CR, 100, 215, 47, "Отворено", ["mining", "cement", "metallurgy"]],
  ["51108", TB, 40, 60, 13, "Отворено", ["chemical", "power", "food"]],
  ["51210", TB, 50, 78, 22, "Отворено", ["chemical", "power", "recycling"]],
  ["YAR 205-2F", UN, 25, 52, 34.1, "Заптивка на двете страни", ["food", "recycling", "chemical"]],
  ["6001-2RS1", DG, 12, 28, 8, "Заптивка на двете страни", ["food", "chemical", "power"]],
  ["6002-2Z", DG, 15, 32, 9, "Штитови на двете страни", ["food", "paper", "power"]],
  ["6003", DG, 17, 35, 10, "Отворено", ["power", "paper", "chemical"]],
  ["6006-2RS1", DG, 30, 55, 13, "Заптивка на двете страни", ["food", "chemical", "recycling"]],
  ["6007", DG, 35, 62, 14, "Отворено", ["power", "paper", "mining"]],
  ["6008-2Z", DG, 40, 68, 15, "Штитови на двете страни", ["food", "paper", "power"]],
  ["6009", DG, 45, 75, 16, "Отворено", ["power", "chemical", "paper"]],
  ["6010-2RS1", DG, 50, 80, 16, "Заптивка на двете страни", ["food", "chemical", "recycling"]],
  ["6206", DG, 30, 62, 16, "Отворено", ["power", "paper", "mining"]],
  ["6207-2RS1", DG, 35, 72, 17, "Заптивка на двете страни", ["food", "chemical", "recycling"]],
  ["6210-2Z", DG, 50, 90, 20, "Штитови на двете страни", ["food", "paper", "power"]],
  ["6305", DG, 25, 62, 17, "Отворено", ["power", "mining", "recycling"]],
  ["6306-2RS1", DG, 30, 72, 19, "Заптивка на двете страни", ["food", "chemical", "recycling"]],
  ["6308", DG, 40, 90, 23, "Отворено", ["power", "mining", "cement"]],
  ["7205 BECBP", AC, 25, 52, 15, "Отворено", ["power", "chemical", "paper"]],
  ["3208 A-2RS1", AC, 40, 80, 30.8, "Заптивка на двете страни", ["chemical", "food", "recycling"]],
  ["1205 ETN9", SA, 25, 52, 15, "Отворено", ["paper", "power", "food"]],
  ["2206 ETN9", SA, 30, 62, 20, "Отворено", ["paper", "mining", "recycling"]],
  ["22210 E", SR, 50, 90, 23, "Отворено", ["mining", "cement", "recycling"]],
  ["22215 E", SR, 75, 130, 31, "Отворено", ["mining", "cement", "metallurgy"]],
  ["22312 E", SR, 60, 130, 46, "Отворено", ["mining", "cement", "metallurgy"]],
  ["23222 CCK/W33", SR, 110, 200, 69.8, "Отворено", ["cement", "metallurgy", "mining"]],
  ["30205", TR, 25, 52, 16.25, "Отворено", ["power", "mining", "recycling"]],
  ["30207", TR, 35, 72, 18.25, "Отворено", ["power", "mining", "cement"]],
  ["32008 X", TR, 40, 68, 19, "Отворено", ["power", "paper", "metallurgy"]],
  ["32310", TR, 50, 110, 42.25, "Отворено", ["mining", "cement", "metallurgy"]],
  ["33215", TR, 75, 130, 41.25, "Отворено", ["mining", "metallurgy", "recycling"]],
  ["NU 205 ECP", CR, 25, 52, 15, "Отворено", ["power", "paper", "chemical"]],
  ["NU 210 ECP", CR, 50, 90, 20, "Отворено", ["power", "paper", "metallurgy"]],
  ["NJ 308 ECP", CR, 40, 90, 23, "Отворено", ["power", "mining", "cement"]],
  ["NU 2210 ECP", CR, 50, 90, 23, "Отворено", ["power", "metallurgy", "mining"]],
  ["51105", TB, 25, 42, 11, "Отворено", ["chemical", "power", "food"]],
  ["51206", TB, 30, 52, 16, "Отворено", ["chemical", "power", "recycling"]],
  ["51307", TB, 35, 68, 24, "Отворено", ["mining", "power", "chemical"]],
  ["YAR 206-2F", UN, 30, 62, 38.1, "Заптивка на двете страни", ["food", "recycling", "chemical"]],
  ["YAR 207-2F", UN, 35, 72, 42.9, "Заптивка на двете страни", ["food", "recycling", "paper"]],
  ["YAR 208-2F", UN, 40, 80, 49.2, "Заптивка на двете страни", ["food", "recycling", "mining"]],
];

const typeBlurb: Record<string, string> = {
  [DG]: "Свестрано лежиште со мало триење, погодно за високи брзини и тивка работа.",
  [AC]: "Лежиште кое прима комбинирани радијални и аксијални оптоварувања со висока прецизност.",
  [SA]: "Самоместечко лежиште кое ги компензира несовпаѓањата на вратилото и куќиштето.",
  [SR]: "Лежиште за тешки товари и ударни оптоварувања, со можност за самопоставување.",
  [TR]: "Конусно лежиште за високи комбинирани оптоварувања, се поставува во пар.",
  [CR]: "Лежиште со висока радијална носивост и цврстина, за тешки индустриски услови.",
  [TB]: "Лежиште наменето за аксијални оптоварувања во една насока при умерени брзини.",
  [UN]: "Готова лежишна единица со заптивка, едноставна за монтажа и одржување.",
};

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
  boreType: /(EK|CCK)/.test(designation) ? "Конусен" : "Цилиндричен",
  industries: inds,
  description: `${typeBlurb[type]} Димензии ${d} × ${D} × ${B} mm.`,
}));

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getType = (slug: string) => bearingTypes.find((t) => t.slug === slug);
export const getIndustry = (slug: string) => industries.find((i) => i.slug === slug);
