// Side-by-side comparison tables for the "Original SKF offer" category pages. Every value comes from the matching
// page on the legacy site (bbunikoop.com.mk); a dash means the legacy page doesn't state it.
//
// A cell is either literal text (model codes, numbers with units) or `{ t: key }`, a translated value under
// Specs.values in messages/*.json. Row labels are keys under Specs.labels; each table's title and optional note
// live under Comparisons.<id>.

export type Cell = string | { t: string };

export type Comparison = {
  id: string;
  columns: Cell[];
  rows: { label: string; cells: Cell[] }[];
};

const v = (t: string): Cell => ({ t });
export const none = "–";

export const categoryComparisons: Record<string, Comparison[]> = {
  greases: [
    {
      id: "foodGreases",
      columns: ["LGFP 2", "LGFG 2"],
      rows: [
        { label: "baseOil", cells: [v("whiteMineralOil"), v("whiteMineralOil")] },
        { label: "thickener", cells: [v("aluminiumComplex"), v("calciumSulphonateComplex")] },
        { label: "viscosity40", cells: ["150", "150"] },
        { label: "viscosity100", cells: ["15.5", "16"] },
        { label: "dinCode", cells: ["K2G-20", "KP2N-30"] },
        { label: "nlgi", cells: ["2", "2"] },
        { label: "colour", cells: [v("transparent"), v("brown")] },
        { label: "weldLoad", cells: ["1 100", "4 000"] },
        { label: "speedNdm", cells: ["300", "500"] },
        { label: "temperatureRange", cells: ["−20 … 110 °C", "−30 … 140 °C"] },
        { label: "gpf", cells: ["0.7", "1"] },
        { label: "corrosionEmcor", cells: [v("good"), v("excellent")] },
        { label: "mechanicalStability", cells: [v("good"), v("excellent")] },
      ],
    },
  ],
  maintenance: [
    {
      id: "inductionHeaters",
      columns: ["TIH 030M", "TIH 100M", "TIH 220M", "TIH L", "TIH L MB", "TWIM 15"],
      rows: [
        { label: "maxBearingWeight", cells: ["40 kg", "120 kg", "300 kg", "1 200 kg", v("solidParts"), none] },
        { label: "heatedIn20Min", cells: ["28 kg", "97 kg", "220 kg", none, none, none] },
        { label: "yokes", cells: ["3", "3", "2", v("slidingYokes"), v("slidingYoke"), v("noYokes")] },
        { label: "supplyVoltage", cells: ["230 V · 100–110 V", "230 V · 400–460 V", v("severalVoltages"), v("threeVoltages"), v("threeVoltages"), none] },
        { label: "bestFor", cells: [v("portableWorkshop"), v("mediumBearings"), v("largeBearings"), v("extraLargeBearings"), v("solidWorkpieces"), v("fieldMaintenance")] },
      ],
    },
  ],
  "mounting-tools": [
    {
      id: "jawPullers",
      columns: ["TMMP", "TMMA EasyPull", "TMHP 10E", "TMMP 6 · 10 · 15", "TMHP 15 · 30 · 50"],
      rows: [
        { label: "operation", cells: [v("mechanical"), v("mechanicalHydraulicOption"), v("hydraulic"), v("mechanical"), v("hydraulicallyAssisted")] },
        { label: "maxPullingForce", cells: [none, "60 · 80 · 120 kN", "100 kN", "6–15 t", "15 · 30 · 50 t"] },
        { label: "arms", cells: [v("twoOrThree"), none, v("twoOrThree"), none, none] },
        { label: "span", cells: ["65–300 mm", none, v("armLength200"), none, none] },
        { label: "gripSystem", cells: [v("conicalSelfCentring"), v("springArms"), v("selfLockingArms"), v("pantograph"), v("pantograph")] },
      ],
    },
    {
      id: "blindPullers",
      columns: ["TMIP", "TMMD 100", "TMBP 20E"],
      rows: [
        { label: "application", cells: [v("internalBore"), v("blindHousingShaft"), v("blindHousing")] },
        { label: "shaftDiameter", cells: [none, "10–100 mm", "30–160 mm"] },
        { label: "reach", cells: [none, none, "583 mm"] },
        { label: "bearingsCovered", cells: [none, v("dgbb71"), v("dgbb")] },
      ],
    },
  ],
  "pulley-alignment": [
    {
      id: "beltAlignment",
      columns: ["TKBA 10", "TKBA 20", "TKBA 40"],
      rows: [
        { label: "laser", cells: [v("red"), v("green"), none] },
        { label: "maxDistance", cells: ["3 m", "6 m", "6 m"] },
        { label: "alignsOn", cells: [v("pulleyFace"), v("pulleyFace"), v("pulleyGrooves")] },
        { label: "suitableFor", cells: [v("beltsAndSprockets"), v("beltsAndSprockets"), v("vBeltsAdapter")] },
      ],
    },
  ],
  "automatic-lubricators": [
    {
      id: "autoLubricators",
      columns: ["SYSTEM 24 (LAGD)", "TLSD", "TLMR", "TLMP"],
      rows: [
        { label: "drive", cells: [v("gas"), v("electroMechanical"), v("electroMechanical"), v("electroMechanical")] },
        { label: "lubricationPoints", cells: ["1", "1", "1", "1–18"] },
        { label: "maxPressure", cells: [none, "5 bar", "30 bar", none] },
        { label: "dispensePeriod", cells: [v("months1to12"), none, none, none] },
        { label: "capacity", cells: [none, none, "120 · 380 ml", "≈ 1 l"] },
        { label: "power", cells: [none, v("batteryPack"), v("batteryOr12to24"), v("severalVoltages")] },
        { label: "approvals", cells: ["ATEX zone 0", none, "IP67", none] },
      ],
    },
  ],
  "lubrication-systems": [
    {
      id: "greaseGuns",
      columns: ["1077600", "TLGH 1", v("oneHandGun"), "TLGB 20"],
      rows: [
        { label: "operation", cells: [v("manual"), v("manual"), v("manualOneHand"), v("batteryDriven")] },
        { label: "maxPressure", cells: ["40 MPa", "40 MPa", "30 MPa", "70 MPa"] },
        { label: "volumePerStroke", cells: ["1.5 cm³", "≈ 0.9 cm³", none, none] },
        { label: "length", cells: ["380 mm", "380 mm", none, none] },
        { label: "weight", cells: ["1.5 kg", "1.5 kg", none, none] },
      ],
    },
  ],
  "monitoring-instruments": [
    {
      id: "thermometers",
      columns: ["TKDT 10", "TKTL 11", "TKTL 21", "TKTL 31", "TKTL 40"],
      rows: [
        { label: "measurement", cells: [v("contact"), v("infrared"), v("infrared"), v("infrared"), v("infraredVideoContact")] },
        { label: "temperatureRange", cells: ["−200 … 1 372 °C", "−60 … 625 °C", "−60 … 760 °C", "−60 … 1 600 °C", "−50 … 1 000 °C"] },
        { label: "class", cells: [v("basic"), v("basic"), v("advanced"), v("highPerformance"), v("highPerformance")] },
      ],
    },
    {
      id: "endoscopes",
      columns: ["TKES 10F", "TKES 10S", "TKES 10A"],
      rows: [
        { label: "insertionTube", cells: [v("flexible"), v("semiRigid"), v("articulatingTip")] },
        { label: "tubeLength", cells: ["1 m", "1 m", "1 m"] },
        { label: "tipDiameter", cells: ["5.8 mm", "5.8 mm", "5.8 mm"] },
        { label: "screen", cells: ["3.5″", "3.5″", "3.5″"] },
      ],
    },
    {
      id: "multilog",
      columns: ["IMx-8", "IMx-16Plus"],
      rows: [
        { label: "analogInputs", cells: ["8", "16"] },
        { label: "digitalInputs", cells: ["2", "4"] },
        { label: "power", cells: ["PoE · 24–48 V DC", "PoE · 24–48 V DC"] },
        { label: "memory", cells: ["4 GB", "4 GB"] },
        { label: "wireless", cells: [none, "LTE/GSM · Wi-Fi"] },
        { label: "pt1000", cells: [none, v("channels9to16")] },
      ],
    },
  ],
};
