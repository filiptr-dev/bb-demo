// SKF bearing grease selection data, transcribed from the legacy /masti/ page
// (itself a copy of SKF's "bearing grease selection chart").

export type GreaseCondition = "allPurpose" | "highTemp" | "extremeTemp" | "lowTemp" | "highLoad" | "food" | "green";

// Basic selection: LGMT 2 unless one of the conditions applies.
export const basicGreaseSelection: { condition: GreaseCondition; code: string }[] = [
  { condition: "allPurpose", code: "LGMT 2" },
  { condition: "highTemp", code: "LGHP 2" },
  { condition: "extremeTemp", code: "LGET 2" },
  { condition: "lowTemp", code: "LGLT 2" },
  { condition: "highLoad", code: "LGEP 2" },
  { condition: "food", code: "LGFP 2" },
  { condition: "green", code: "LGGB 2" },
];

// "+" recommended, "o" suitable, "-" not suitable
export type Suitability = "+" | "o" | "-";

export const greaseChartColumns = ["verticalShaft", "outerRing", "oscillating", "vibration", "shockLoad", "rust"] as const;

export type GreaseChartRow = {
  code: string;
  /** operating range in °C */
  tempC: [number, number];
  /** base oil viscosity at 40 °C, mm²/s */
  viscosity: number;
  temp: string;
  speed: string;
  load: string;
  /** one entry per greaseChartColumns */
  fit: [Suitability, Suitability, Suitability, Suitability, Suitability, Suitability];
};

export const greaseChart: GreaseChartRow[] = [
  { code: "LGMT 2", tempC: [-30, 120], viscosity: 110, temp: "M", speed: "M", load: "L–M", fit: ["o", "-", "-", "+", "-", "+"] },
  { code: "LGMT 3", tempC: [-30, 120], viscosity: 120, temp: "M", speed: "M", load: "L–M", fit: ["+", "o", "-", "+", "-", "o"] },
  { code: "LGEP 2", tempC: [-20, 110], viscosity: 200, temp: "M", speed: "L–M", load: "H", fit: ["o", "-", "o", "+", "+", "+"] },
  { code: "LGFP 2", tempC: [-20, 110], viscosity: 130, temp: "M", speed: "M", load: "L–M", fit: ["o", "-", "-", "-", "-", "+"] },
  { code: "LGEM 2", tempC: [-20, 120], viscosity: 500, temp: "M", speed: "VL", load: "H–VH", fit: ["o", "-", "+", "+", "+", "+"] },
  { code: "LGEV 2", tempC: [-10, 120], viscosity: 1020, temp: "M", speed: "VL", load: "H–VH", fit: ["o", "-", "+", "+", "+", "+"] },
  { code: "LGLT 2", tempC: [-50, 110], viscosity: 18, temp: "L–M", speed: "M–EH", load: "L", fit: ["o", "-", "-", "-", "o", "o"] },
  { code: "LGGB 2", tempC: [-40, 90], viscosity: 110, temp: "L–M", speed: "L–M", load: "M–H", fit: ["o", "-", "+", "+", "+", "o"] },
  { code: "LGWM 1", tempC: [-30, 110], viscosity: 200, temp: "L–M", speed: "L–M", load: "H", fit: ["-", "-", "+", "-", "+", "+"] },
  { code: "LGWM 2", tempC: [-40, 110], viscosity: 80, temp: "L–M", speed: "L–M", load: "L–H", fit: ["o", "o", "+", "+", "+", "+"] },
  { code: "LGWA 2", tempC: [-30, 140], viscosity: 185, temp: "M–H", speed: "L–M", load: "L–H", fit: ["o", "o", "o", "o", "+", "+"] },
  { code: "LGHB 2", tempC: [-20, 150], viscosity: 400, temp: "M–H", speed: "VL–M", load: "L–VH", fit: ["o", "+", "+", "+", "+", "+"] },
  { code: "LGHP 2", tempC: [-40, 150], viscosity: 96, temp: "M–H", speed: "M–H", load: "L–M", fit: ["+", "-", "-", "o", "o", "+"] },
  { code: "LGET 2", tempC: [-40, 260], viscosity: 400, temp: "VH", speed: "L–M", load: "H–VH", fit: ["o", "+", "+", "o", "o", "o"] },
];

// SKF bearing grease compatibility chart. Greases sharing a column behave the same (e.g. LGMT 2 and LGMT 3).
// "+" compatible, "-" incompatible. The chart is symmetric; each row lists the other columns in order.
export const compatibilityGroups = ["LGMT 2 · LGMT 3", "LGEP 2 · LGWM 1", "LGLT 2", "LGHP 2", "LGWA 2", "LGFP 2", "LGGB 2", "LGFB 2 · LGFL 1", "LGHB 2 · LGWM 2", "LGET 2", "LGEM 2", "LGEV 2"];

const others: Record<string, string> = {
  "LGMT 2 · LGMT 3": "+ + + + - + - + - + +",
  "LGEP 2 · LGWM 1": "+ + + + - + - + - + +",
  "LGLT 2": "+ + + + - + - + - + +",
  "LGHP 2": "+ + + + - + - + - + +",
  "LGWA 2": "+ + + + + + + + - + +",
  "LGFP 2": "- - - - + - + - - - -",
  "LGGB 2": "+ + + + + - + + - + +",
  "LGFB 2 · LGFL 1": "- - - - + + + - - - -",
  "LGHB 2 · LGWM 2": "+ + + + + - + - - + +",
  "LGET 2": "- - - - - - - - - - -",
  "LGEM 2": "+ + + + + - + - + - +",
  "LGEV 2": "+ + + + + - + - + - +",
};

// "+" compatible, "-" incompatible, "=" the same grease (diagonal)
export type Compatibility = "+" | "-" | "=";

// full matrix with the diagonal filled in: compatibility[row][col]
export const compatibility: Compatibility[][] = compatibilityGroups.map((g, r) => {
  const rest = others[g].split(" ") as ("+" | "-")[];
  return compatibilityGroups.map((_, c) => (c === r ? "=" : rest[c < r ? c : c - 1]));
});
