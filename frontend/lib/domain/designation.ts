// SKF/ISO 15 bearing designation decoder.
// Covers the common industrial series and suffix codes this catalog actually sells;
// deliberately skips miniature/instrument series and rare suffixes rather than guess.

export type Segment = {
  token: string;
  kind: "prefix" | "series" | "bore" | "suffix" | "unknown";
  id?: string; // key into Decoder.codes.<id> for the human-readable meaning
  boreMm?: number;
};

export type DecodedDesignation = {
  segments: Segment[];
  boreMm: number | null;
};

// Leading letters before the numeric core (checked longest-first).
const TYPE_PREFIXES: [string, string][] = [
  ["NUP", "nup"],
  ["NJ", "nj"],
  ["NU", "nu"],
  ["NN", "nn"],
  ["QJ", "qj"],
  ["GE", "ge"],
  ["N", "n"],
  ["W", "w-stainless"],
];

// Suffix codes, matched as a whole dash/slash-separated token (case-insensitive).
const SUFFIXES: Record<string, string> = {
  "Z": "z",
  "2Z": "2z",
  "RS1": "rs1",
  "2RS1": "2rs1",
  "RSH": "rsh",
  "2RSH": "2rsh",
  "RSL": "rsl",
  "2RSL": "2rsl",
  "N": "snap-ring-groove",
  "NR": "snap-ring",
  "M": "brass-cage",
  "MA": "brass-cage-outer",
  "TN9": "tn9-cage",
  "P6": "p6",
  "P5": "p5",
  "P4": "p4",
  "C2": "c2",
  "C3": "c3",
  "C4": "c4",
  "C5": "c5",
  "E": "e-design",
  "HT": "ht",
  "VA201": "va201",
  "VA208": "va208",
  "W64": "w64",
  "W203": "w203",
};

function boreFromCode(code: string): number | null {
  if (!/^\d{2}$/.test(code)) return null;
  if (code === "00") return 10;
  if (code === "01") return 12;
  if (code === "02") return 15;
  if (code === "03") return 17;
  const n = Number(code);
  return n >= 4 ? n * 5 : null;
}

function classifyNumericCore(core: string): { id: string; digits: number } {
  const first = core[0];
  const len = core.length;
  if (first === "6" || first === "16") return { id: "deep-groove", digits: len };
  if (first === "7") return { id: "angular-contact", digits: len };
  if (first === "3") return { id: "tapered-roller", digits: len };
  if ((first === "1" || first === "2") && len === 4) return { id: "self-aligning", digits: len };
  if (first === "2" && len === 5) return { id: "spherical-roller", digits: len };
  if (first === "5" && len === 5) return { id: "thrust-ball", digits: len };
  return { id: "unknown-series", digits: len };
}

export function decodeDesignation(raw: string): DecodedDesignation | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  const slashParts = cleaned.split("/").filter(Boolean);
  const [mainPart, ...slashSuffixes] = slashParts;
  const dashParts = mainPart.split("-").filter(Boolean);
  const [basePart, ...dashSuffixes] = dashParts;
  if (!basePart) return null;

  const segments: Segment[] = [];
  let boreMm: number | null = null;

  const upperBase = basePart.toUpperCase();
  const prefixMatch = TYPE_PREFIXES.find(([p]) => upperBase.startsWith(p));
  const letters = prefixMatch?.[0] ?? "";
  const numericCore = upperBase.slice(letters.length);

  if (letters) {
    segments.push({ token: letters, kind: "prefix", id: prefixMatch![1] });
  }

  if (/^\d+$/.test(numericCore) && numericCore.length >= 2) {
    const boreCode = numericCore.slice(-2);
    const seriesDigits = numericCore.slice(0, -2);
    const mm = boreFromCode(boreCode);
    boreMm = mm;

    if (!letters) {
      const { id } = classifyNumericCore(numericCore);
      segments.push({ token: numericCore.slice(0, numericCore.length - 2) || numericCore, kind: "series", id });
    } else if (seriesDigits) {
      segments.push({ token: seriesDigits, kind: "series", id: "dimension-series" });
    }

    segments.push({ token: boreCode, kind: "bore", boreMm: mm ?? undefined });
  } else {
    segments.push({ token: numericCore || basePart, kind: "unknown" });
  }

  for (const raw of [...dashSuffixes, ...slashSuffixes]) {
    const key = raw.toUpperCase();
    const id = SUFFIXES[key];
    segments.push({ token: raw, kind: id ? "suffix" : "unknown", id });
  }

  return { segments, boreMm };
}
