// Scrapes the SKF catalog from bearingworld.com.sa, merges it with our own seed list (lib/data.ts) and
// replaces the Postgres `products` table.
//
//   npm run db:import             # scrape + write to DATABASE_URL
//   npm run db:import -- --dry    # scrape + print stats only
//
// bearingworld.com.sa is a client-side app with the whole catalog (~15k rows) inlined in its Catalog chunk
// as compact tuples: [designation, classificationIdx, boreTypeIdx, sealingIdx, d, D, B]. We fetch the page,
// follow the bundle to that chunk and evaluate just the array literals. No per-page crawling, no /api/ calls.
import vm from "node:vm";
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { seedProducts, slugify, type Product, type SealCode } from "../lib/data.ts";

const ORIGIN = "https://bearingworld.com.sa";
const dry = process.argv.includes("--dry");

async function get(path: string) {
  const res = await fetch(ORIGIN + path, { headers: { "user-agent": "bbunikoop-demo catalog import" } });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.text();
}

function find(src: string, re: RegExp, what: string) {
  const m = src.match(re);
  if (!m) throw new Error(`bearingworld layout changed: ${what} not found`);
  return m[1];
}

type Tuple = [string, number, number, number, number, number, number];

async function scrape() {
  const html = await get("/catalog");
  const entry = await get(find(html, /src="(\/assets\/index-[\w-]+\.js)"/, "entry bundle"));
  const chunk = await get("/" + find(entry, /(assets\/Catalog-[\w-]+\.js)/, "Catalog chunk"));
  // `...,$=[classifications],z=[bore types],C1=[sealings],i1=[[tuples]];function f(P){return{designation:P[0],...`
  const decoder = find(chunk, /function (\w+)\(\w\)\{return\{designation:/, "row decoder");
  const end = chunk.indexOf(`;function ${decoder}(`);
  const names = find(chunk.slice(end), /classification:\w+\[1\]>=0\?([\w$]+)\[/, "classification table");
  const start = chunk.lastIndexOf(`,${names}=[`, end) + 1;
  const ctx: Record<string, unknown> = {};
  vm.runInNewContext(`var ${chunk.slice(start, end)};`, ctx);
  const [classes, bores, seals, rows] = Object.values(ctx) as [string[], string[], string[], Tuple[]];
  if (!Array.isArray(rows?.[0])) throw new Error("bearingworld layout changed: product tuples not found");
  return rows.map(([designation, c, b, s, d, D, B]) => ({
    designation: designation.trim(),
    classification: classes[c] ?? null,
    boreType: bores[b] ?? null,
    sealing: seals[s] ?? null,
    d, D, B,
  }));
}

const typeOf: Record<string, string> = {
  "Radial deep groove": "deep-groove",
  "Angular contact radial": "angular-contact",
  "Angular contact thrust": "angular-contact",
  "Self-aligning": "self-aligning",
  "Spherical radial": "spherical-roller",
  "Spherical thrust": "spherical-roller",
  "Tapered radial": "tapered-roller",
  "Tapered thrust": "tapered-roller",
  "Cylindrical radial": "cylindrical-roller",
  "Thrust collar (L- shaped)": "cylindrical-roller",
  "Thrust": "thrust-ball",
  "Aligning seat washer (thrust ball bearing)": "thrust-ball",
  "Bearing unit": "unit",
  "Housing unit": "unit",
  "Bearing only": "unit", // Y-bearing inserts
  "Toroidal radial": "toroidal",
  "Needle radial": "needle-roller",
  "Needle thrust": "needle-roller",
  "Radial needle roller/thrust ball or Radial needle roller/thrust roller": "needle-roller",
  "Yoke-type": "track-runner",
  "Stud-type": "track-runner",
  "Bushing": "plain",
  "Rod end": "plain",
  "Housing": "housing",
  "Sealing": "housing", // housing seals (TSN …)
  "Accessories": "housing", // locating rings, end covers
  "Tapered sleeve": "sleeve-nut",
  "Lock nut and locking device": "sleeve-nut",
  "Seal": "seal",
};

const sealOf = (s: string | null): SealCode | null => {
  if (!s) return null;
  if (s === "Without") return "open";
  if (/^Shields? on both sides$/.test(s)) return "shields";
  if (/one side/.test(s)) return "one-side";
  if (/both sides|^Contact/.test(s)) return "both";
  return "other"; // gap seals, special
};

// The source has no industry data. Demo default per type so industry pages and filters cover the whole range.
const industriesOf: Record<string, string[]> = {
  "deep-groove": ["food", "power", "paper"],
  "angular-contact": ["power", "chemical", "paper"],
  "self-aligning": ["paper", "food", "recycling"],
  "spherical-roller": ["cement", "mining", "metallurgy", "paper"],
  "tapered-roller": ["mining", "metallurgy", "power"],
  "cylindrical-roller": ["power", "metallurgy", "cement"],
  "thrust-ball": ["chemical", "power"],
  "unit": ["food", "recycling"],
  "toroidal": ["paper", "cement", "mining"],
  "needle-roller": ["chemical", "food"],
  "track-runner": ["food", "recycling", "metallurgy"],
  "plain": ["metallurgy", "mining", "recycling"],
  "housing": ["cement", "mining", "paper"],
  "sleeve-nut": ["cement", "mining", "paper"],
  "seal": ["food", "chemical"],
};

type Row = Product & { sealing: string | null; source: string };

const toRows = (scraped: Awaited<ReturnType<typeof scrape>>) => {
  const unmapped = new Set<string>();
  const rows = new Map<string, Row>();
  for (const s of scraped) {
    const type = typeOf[s.classification ?? ""];
    if (!type) { unmapped.add(s.classification ?? "(none)"); continue; }
    const slug = slugify(s.designation);
    rows.set(slug, {
      slug,
      designation: s.designation,
      brand: "SKF",
      type,
      classification: s.classification,
      boreType: s.boreType === "Tapered" ? "tapered" : s.boreType === "Cylindrical" ? "cylindrical" : null,
      seal: sealOf(s.sealing),
      sealing: s.sealing,
      d: s.d || null, // 0 = not applicable (housings, end covers)
      D: s.D || null,
      B: s.B || null,
      industries: industriesOf[type],
      source: "bearingworld",
    });
  }
  // our curated rows win on type, seal and industries; the scraped row adds its SKF classification
  let both = 0;
  for (const p of seedProducts) {
    const hit = rows.get(p.slug);
    if (hit) both++;
    rows.set(p.slug, { ...p, classification: hit?.classification ?? null, sealing: hit?.sealing ?? null, source: hit ? "both" : "bbunikoop" });
  }
  return { rows: [...rows.values()], unmapped, both };
};

const scraped = await scrape();
const { rows, unmapped, both } = toRows(scraped);
const byType = Object.entries(Object.groupBy(rows, (r) => r.type)).map(([k, v]) => `${k} ${v!.length}`);
console.log(`scraped ${scraped.length}, seed ${seedProducts.length} (${both} overlap) → ${rows.length} products`);
console.log(byType.join(", "));
if (unmapped.size) console.warn("skipped unmapped classifications:", [...unmapped]);
if (dry) process.exit(0);

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see .env.local)");
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1, onnotice: () => {} });
try {
  await sql.unsafe(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  await sql.begin(async (tx) => {
    await tx`delete from products`;
    const cols = rows.map((r) => ({
      slug: r.slug, designation: r.designation, brand: r.brand, type: r.type, classification: r.classification,
      bore_type: r.boreType, seal: r.seal, sealing: r.sealing, d: r.d, outer_d: r.D, width: r.B,
      industries: r.industries, source: r.source,
    }));
    for (let i = 0; i < cols.length; i += 1000) await tx`insert into products ${tx(cols.slice(i, i + 1000))}`;
  });
  const [{ n }] = await sql`select count(*)::int as n from products`;
  console.log(`products table now has ${n} rows`);
} finally {
  await sql.end();
}
