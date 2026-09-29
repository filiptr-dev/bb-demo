// Products, photos and SKF links for each "Original SKF offer" category page, ported from the matching page on the
// legacy site (bbunikoop.com.mk). Demo only: photos are hotlinked from the client's media library.
//
// An item's `label` is a key under CategoryItems in messages/*.json (a translated description); `code` is the SKF
// model name, which stays untranslated. Items with `type` are bearing types: named from BearingTypes and linked
// into the catalog.

const up = "https://bbunikoop.com.mk/wp-content/uploads/";
const skf = "https://www.skf.com/";

export type CategoryItem = {
  image: string;
  label?: string;
  code?: string;
  type?: string;
  href?: string;
  banner?: boolean; // legacy type banner with a blue SKF panel on the right, cropped like ProductTypeImage
};

// `title` names the linked document; SKF publishes these in English, so it stays untranslated.
export type CategoryResource = { kind: "pdf" | "link"; href: string; title?: string };

export type CategoryContent = {
  items?: CategoryItem[];
  gallery?: string[];
  resources?: CategoryResource[];
};

const img = (path: string) => `${up}${path}`;
const pdf = (href: string, title?: string): CategoryResource => ({ kind: "pdf", href, title });
const link = (href: string, title?: string): CategoryResource => ({ kind: "link", href, title });

const bearing = (file: string, type: string): CategoryItem => ({ image: img(`2022/04/${file}`), type });
const special = (file: string, label: string): CategoryItem => ({ image: img(file), label });

export const categoryContent: Record<string, CategoryContent> = {
  bearings: {
    // every tile on the legacy bearings page is a type banner
    items: ([
      bearing("radijalno-topchesti-lezhishta.jpg", "deep-groove"),
      bearing("samopodeslivi-topchesti-lezhishta.jpg", "self-aligning"),
      bearing("ednoredni-topchesti-lezhishta-so-kos-dopir.jpg", "angular-contact"),
      special("2022/04/topchesti-lezhishta-so-dopir-vo-4-tochki.jpg", "fourPointContact"),
      bearing("ednoredni-cilindrichno-valchesti-lezhishta.jpg", "cylindrical-roller"),
      bearing("iglesti-lezhishta.jpg", "needle-roller"),
      bearing("buresto-valchesti-lezhishta.jpg", "spherical-roller"),
      special("2022/04/zatvoreno-buresto-valchesti-lezhishta.jpg", "sealedSpherical"),
      bearing("konusno-valchesti-lezhishta.jpg", "tapered-roller"),
      bearing("aksijalni-lezhishta.jpg", "thrust-ball"),
      bearing("traektorni-lezhishta.jpg", "track-runner"),
      bearing("kukjishta.jpg", "housing"),
      bearing("zglobni-lezhishta.jpg", "plain"),
      special("2022/04/zglobni-glavi.jpg", "rodEnds"),
      { image: img("2022/05/carb.jpg"), type: "toroidal" },
      special("2022/04/hibridno-keramichki-lezhishta.jpg", "hybrid"),
      special("2022/04/hibridno-topchesti-lezhishta.jpg", "hybridBall"),
      special("2022/04/hibridni-cilindrichni-valchesti-lezhishta.jpg", "hybridCylindrical"),
      special("2022/04/visokotemperaturni-lezhishta-i-dodatoci.jpg", "highTemperature"),
      special("2022/04/prohromski-ednoredni-topchesti-lezhishta.jpg", "stainless"),
      { image: img("2022/04/insocoat-lezhishta.jpg"), label: "insulated", code: "INSOCOAT" },
      special("2022/05/lezhishta-so-senzori.jpg", "sensor"),
      { image: img("2022/05/e2-lezhishta.jpg"), label: "energyEfficient", code: "E2" },
      { image: img("2022/05/nilos-prsteni.jpg"), label: "sealingRings", code: "NILOS" },
      special("2022/05/lezhishta-za-vrtenje.jpg", "slewing"),
      special("2022/05/go-kart.jpg", "goKart"),
      special("2022/05/polimerni-lezhishta.jpg", "polymer"),
    ] as CategoryItem[]).map((item) => ({ ...item, banner: true })),
  },
  housings: {
    gallery: [img("2022/04/kukjishta-1.png")],
    resources: [
      pdf("https://www.skf.com/binaries/pub12/Images/0901d196801106cc-6112_1_EN_tcm_12-494474.pdf", "SNL"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d196803969af-13186_1-EN-SKF-bearing-housings-and-roller-bearing-units_tcm_12-315185.pdf"),
      link(`${skf}group/products/mounted-bearings/bearing-housings`),
    ],
  },
  cooper: {
    gallery: [img("2022/05/split-cooper1.jpg"), img("2022/05/split-cooper2.png"), img("2022/05/split-cooper4.png")],
    resources: [
      pdf("https://www.skf.com/binaries/pub12/Images/0947fa932013366d-19045-EN---SKF-Cooper-split-roller-bearings-and-bearing-units_tcm_12-592407.pdf"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d19680cb92ae-SKF-Cooper-Applications-Catalogue---19147_1-EN_tcm_12-583701.pdf", "Applications"),
      link(`${skf}group/products/rolling-bearings/roller-bearings/skf-cooper-split-roller-bearings`),
      link("https://www.cooperbearings.com/", "Cooper"),
    ],
  },
  seals: {
    resources: [
      pdf("https://www.skf.com/binaries/pub12/Images/09433a92e9164581-SKF-ISSC_220121_EN_linked_18729_1_tcm_12-524179.pdf", "Industrial seals"),
      link(`${skf}group/products/industrial-seals`),
      link(`${skf}group/products/industrial-seals/power-transmission-seals/radial-shaft-seals`, "Radial shaft seals"),
      link(`${skf}group/products/industrial-seals/cr-seals-from-skf`, "CR seals"),
    ],
  },
  sleeves: {
    gallery: [img("2022/04/hilzni.jpg"), img("2022/04/hilzni-1.jpg"), img("2022/05/hilzni-adapteri.jpg")],
    resources: [
      link(`${skf}group/products/rolling-bearings/accessories/adapter-sleeves`),
      link(`${skf}group/support/engineering-tools/tool-and-accessory-selector-for-sleeves-and-shafts`, "Selector"),
    ],
  },
  "belts-chains": {
    items: [
      special("2022/05/kaishi.jpg", "belts"),
      special("2022/05/remenicii.jpg", "pulleys"),
      special("2022/05/lanci.jpg", "chains"),
      special("2022/05/lanchanici.jpg", "sprockets"),
      special("2022/05/chauri-i-vmetnuvachi.jpg", "bushingsInserts"),
      special("2022/05/spojki.jpg", "couplings"),
    ],
  },
  bushings: {
    items: [
      { image: img("2022/05/chauri1.jpg"), label: "bushings", href: `${skf}group/products/plain-bearings/bushings-thrust-washers-strips/bushings` },
      { image: img("2022/05/potisni-podloshki.png"), label: "thrustWashers", href: `${skf}group/products/plain-bearings/bushings-thrust-washers-strips/thrust-washers` },
      { image: img("2022/05/lenti.jpg"), label: "strips", href: `${skf}group/products/plain-bearings/bushings-thrust-washers-strips/strips` },
    ],
    resources: [
      pdf("https://www.skf.com/binaries/pub12/Images/0901d19680090e01-SKF-bushings-thrust-washers-and-strips-1-EN_tcm_12-582374.pdf"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d1968008f69c-SKF-FX-Keyless-Bushings_10114EN_tcm_12-160614.pdf", "FX keyless"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d19680229dfc-SKF-composite-plain-bearings---11004-EN_tcm_12-582368.pdf", "Composite"),
      link(`${skf}group/products/plain-bearings/bushings-thrust-washers-strips`),
    ],
  },
  nuts: {
    items: [
      { image: img("2022/05/navrtki1.png"), label: "lockNuts", code: "KM · KML · HM", href: `${skf}group/products/rolling-bearings/accessories/lock-nuts/keyway` },
      { image: img("2022/05/navrtki3.jpg"), label: "lockNutsIntegral", code: "KMFE · KMK", href: `${skf}group/products/rolling-bearings/accessories/lock-nuts/integral-locking` },
      { image: img("2022/05/navrtki4.jpg"), label: "precisionLockNuts", code: "KMT · KMTA", href: `${skf}group/products/rolling-bearings/accessories/lock-nuts/precision` },
    ],
  },
  "speedi-sleeve": {
    gallery: [img("2022/05/speedi-sleeve2.jpg"), img("2022/05/speedi-sleeve3.jpg"), img("2022/05/speedi-sleeve4.jpg")],
    resources: [link(`${skf}group/products/industrial-seals/power-transmission-seals/wear-sleeves/skf-speedi-sleeve`)],
  },
  "food-industry": {
    items: [
      { image: img("2022/06/food-line-topchesti.jpg"), label: "foodBallBearingUnits", code: "SKF Food Line" },
      { image: img("2022/06/food-line-blue-range.jpg"), label: "foodBallBearingUnits", code: "Blue Range" },
      special("2022/06/food-line-bezbedno-proizvodstvo.jpg", "foodBearingPortfolio"),
      special("2022/06/food-line-podmachkuvanje.jpg", "foodLubrication"),
      special("2022/06/food-line-post-obrabotka.jpg", "packaging"),
      special("2022/06/food-line-primena-na-toplina.jpg", "heatApplications"),
    ],
    resources: [
      pdf("https://www.skf.com/binaries/pub307/Images/0901d19680c58b0b-Food-line-catalogue---18157_2-EN_tcm_307-470954.pdf", "Food Line"),
      link(`${skf}group/products/mounted-bearings/ball-bearing-units/pillow-block-ball-bearing-units`, "Pillow block units"),
      link(`${skf}group/products/mounted-bearings/ball-bearing-units/flanged-ball-bearing-units`, "Flanged units"),
      link(`${skf}group/products/mounted-bearings/ball-bearing-units/take-up-ball-bearing-units`, "Take-up units"),
    ],
  },
  "pulley-alignment": {
    items: [
      { image: img("2022/05/TKBA-10-TKBA-20.jpg"), label: "beltAlignmentTool", code: "TKBA 10 · TKBA 20" },
      { image: img("2022/05/tkba-40.jpg"), label: "beltAlignmentTool", code: "TKBA 40" },
      { image: img("2022/05/PHL-FM-10-400.jpg"), label: "beltTensionMeter", code: "PHL FM 10/400" },
    ],
  },
  "monitoring-instruments": {
    items: [
      { image: img("2022/05/tkes-10f.jpg"), label: "endoscope", code: "TKES 10" },
      { image: img("2022/05/tmeh-1.jpg"), label: "oilCheckMonitor", code: "TMEH 1" },
      { image: img("2022/05/tkdt-10.jpg"), label: "thermometer", code: "TKDT 10" },
      { image: img("2022/05/tktl-11.jpg"), label: "infraredThermometer", code: "TKTL 11" },
      { image: img("2022/05/tktl-31.jpg"), label: "infraredThermometer", code: "TKTL 31" },
      { image: img("2022/05/tktl-40.jpg"), label: "infraredThermometer", code: "TKTL 40" },
      { image: img("2022/05/tkrt-10-1.jpg"), label: "tachometer", code: "TKRT 10", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/speed-measurement/digital-tachometer` },
      { image: img("2022/05/tkrt-31-1.jpg"), label: "tachometer", code: "TKRT 31", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/speed-measurement/multi-functional-digital-tachometer` },
      { image: img("2022/05/tkrs-21.jpg"), label: "stroboscope", code: "TKRS 21", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/visual-inspection/stroboscopes/stroboscope-tkrs-21` },
      { image: img("2022/05/tkrs-31.jpg"), label: "stroboscope", code: "TKRS 31", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/visual-inspection/stroboscopes/stroboscope-tkrs-31` },
      { image: img("2022/05/tkrs-41-1.jpg"), label: "stroboscope", code: "TKRS 41", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/visual-inspection/stroboscopes/stroboscope-tkrs-41` },
      { image: img("2022/05/tmst-3-1.jpg"), label: "stethoscope", code: "TMST 3", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/sound-measurement/stethoscope` },
      { image: img("2022/05/tmsp-1.jpg"), label: "soundPressureMeter", code: "TMSP 1", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/sound-measurement/sound-pressure-meter` },
      { image: img("2022/05/tksu-10-1.jpg"), label: "leakDetector", code: "TKSU 10", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/sound-measurement/ultrasonic-leak-detector` },
      { image: img("2022/05/tked-1.jpg"), label: "dischargeDetector", code: "TKED 1", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/electrical-discharge-current-measurement` },
      { image: img("2022/05/qc-1.jpg"), label: "vibrationSensor", code: "QuickCollect" },
      { image: img("2022/06/skf-pulse.jpg"), label: "vibrationSensor", code: "SKF Pulse", href: `${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/vibration-measurement/quickcollect-sensor/skf-pulse` },
      { image: img("2022/06/go-plant-1.jpg"), label: "inspectionApp", code: "GoPlant", href: `${skf}group/products/condition-monitoring-systems/portable-systems/goplant` },
      { image: img("2022/06/ax-cmxa-80.jpg"), label: "vibrationAnalyzer", code: "Microlog AX · CMXA 80" },
      { image: img("2022/06/imx-1.jpg"), label: "wirelessSensor", code: "Enlight Collect IMx-1" },
      { image: img("2022/06/multilog-1.jpg"), label: "onlineMonitoring", code: "Multilog IMx-8 · IMx-16Plus" },
    ],
    resources: [
      pdf("https://www.skf.com/binaries/pub12/Images/0901d196809c4f9a-MP5493_TKTL11_tcm_12-560502.pdf", "TKTL 11"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d196809c5587-MP5494_TKTL21_tcm_12-560500.pdf", "TKTL 21"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d196809ceeb6-MP5495_TKTL31_tcm_12-560494.pdf", "TKTL 31"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d196802d3abc-MP5427_TKTL-40_tcm_12-244859.pdf", "TKTL 40"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d19680cbe36e-11643_9-EN-SKF-Microlog-Accessories-Catalog_tcm_12-584048.pdf", "Microlog"),
      link(`${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/temperature-measurement/ir-thermometer-comparison-table`, "TKTL"),
      link(`${skf}group/products/condition-monitoring-systems/basic-condition-monitoring-products/visual-inspection/stroboscopes/stroboscopes-comparison`, "TKRS"),
    ],
  },
  "mounting-tools": {
    items: [
      { image: img("2022/05/tmip.jpg"), label: "internalPullerKit", code: "TMIP" },
      { image: img("2022/05/tmmd-100.jpg"), label: "ballBearingPullerKit", code: "TMMD 100" },
      { image: img("2022/05/tmmp.jpg"), label: "jawPullers", code: "TMMP" },
      { image: img("2022/05/tmbp-20e.jpg"), label: "blindHousingPullerKit", code: "TMBP 20E" },
      { image: img("2022/05/tmma-easypull.jpg"), label: "jawPullers", code: "TMMA EasyPull" },
      { image: img("2022/05/TMHP-10E-TMHC-110E.jpg"), label: "hydraulicPullerKit", code: "TMHP 10E · TMHC 110E" },
      { image: img("2022/05/skf-tmmp.jpg"), label: "heavyDutyPullers", code: "TMMP" },
      { image: img("2022/05/tmhp-15-30-50.jpg"), label: "hydraulicJawPullers", code: "TMHP 15 · 30 · 50" },
      { image: img("2022/05/lgaf-3e.jpg"), label: "antiFrettingPaste", code: "LGAF 3E" },
    ],
  },
  maintenance: {
    items: [
      { image: img("2022/05/tih-100m.jpg"), label: "inductionHeater", code: "TIH 100M" },
      { image: img("2022/05/tih-220m.jpg"), label: "inductionHeater", code: "TIH 220M" },
      { image: img("2022/05/tih-l.jpg"), label: "inductionHeater", code: "TIH L" },
      { image: img("2022/05/tih-l-mb.jpg"), label: "inductionHeater", code: "TIH L MB" },
      special("2022/05/povekjezhilen-indukciski-greach.jpg", "multiCoreHeater"),
      { image: img("2022/05/twim-15.jpg"), label: "portableHeater", code: "TWIM 15" },
      { image: img("2022/05/tmba-rakavici.jpg"), label: "heatResistantGloves", code: "TMBA" },
    ],
    resources: [pdf("https://www.skf.com/binaries/pub12/Images/094fe398236d3d0a-03000EN_tcm_12-595611.pdf", "Tools & maintenance products")],
  },
  "shim-packs": {
    items: [
      { image: img("2022/06/paketi-so-podloshki-skf-tmas-1.jpg"), label: "shimPacks", code: "TMAS", href: `${skf}group/products/maintenance-products/alignment-tools/shims/shim-packs` },
      { image: img("2022/06/paketi-so-podloshki-skf-tmas-2.jpg"), label: "shimKits", code: "TMAS", href: `${skf}group/products/maintenance-products/alignment-tools/shims/shim-kits` },
    ],
  },
  greases: {
    items: [
      { image: img("2022/04/0901d19680152b23-LGFP2-1x1_tcm_12-32542.webp"), label: "foodGradeGrease", code: "LGFP 2" },
      { image: img("2022/04/0901d196803ffafb-LGED2-1x1_tcm_12-257189.webp"), label: "grease", code: "LGED 2" },
      { image: img("2022/04/0901d1968063f674-LGFQ2-1x1_tcm_12-296405.webp"), label: "foodGradeGrease", code: "LGFQ 2" },
      { image: img("2022/04/094c56ab04152267-LGFG2-1x1_tcm_12-590789.webp"), label: "foodGradeGrease", code: "LGFG 2" },
      { image: img("2022/04/0901d19680152b1c-LDTS1_tcm_12-32535.webp"), label: "dryFilmLubricant", code: "LDTS 1" },
      { image: img("2022/05/lhmt68.jpg"), label: "chainOil", code: "LHMT 68", href: `${skf}group/products/lubrication-management/lubricants/medium-temperature-chain-oil` },
      { image: img("2022/05/lhht250.jpg"), label: "chainOil", code: "LHHT 250", href: `${skf}group/products/lubrication-management/lubricants/high-temperature-chain-oil` },
      { image: img("2022/05/lffm100.jpg"), label: "foodGradeChainOil", code: "LFFM 100", href: `${skf}group/products/lubrication-management/lubricants/general-purpose-food-grade-chain-oil` },
      { image: img("2022/05/lmcg1.jpg"), label: "gearGrease", code: "LMCG 1" },
      { image: img("2022/06/tkgt-1.jpg"), label: "greaseTestKit", code: "TKGT 1" },
    ],
    resources: [
      pdf("https://www.skf.com/binaries/pub12/Images/0901d196800a283f-MP5366E_tcm_12-35956.pdf", "TKGT 1"),
      link(`${skf}group/products/lubrication-management/lubricants`),
    ],
  },
  "lubrication-systems": {
    items: [
      special("2022/06/rachni-podmachkuvachi.jpg", "manualLubricators"),
      special("2022/06/ednorachen-pishtol-za-masti.jpg", "oneHandGreaseGun"),
      special("2022/06/bateriski-pishtol-za-masti-na-baterii.jpg", "batteryGreaseGun"),
      { image: img("2022/06/pumpi-za-polnenje-masti-lagf-serija.jpg"), label: "greaseFillerPump", code: "LAGF" },
      special("2022/06/pakuvach-na-lezhishta.jpg", "bearingPacker"),
      special("2022/06/pumpi-za-masti.jpg", "greasePumps"),
      special("2022/06/izramnuvachi-na-maslo.jpg", "oilLevellers"),
      special("2022/06/merach-na-masnotii.jpg", "greaseMeter"),
      { image: img("2022/06/mlaznici-za-masnotii.jpg"), label: "greaseNozzles", code: "LAGS 8" },
      special("2022/06/mazalici.jpg", "greaseNipples"),
    ],
  },
  "automatic-lubricators": {
    items: [
      { image: img("2022/06/skf-24.jpg"), label: "gasLubricator", code: "SKF SYSTEM 24" },
      { image: img("2022/06/tsld.jpg"), label: "electroMechanicalLubricator", code: "TLSD" },
      { image: img("2022/06/tlmr.jpg"), label: "electroMechanicalLubricator", code: "TLMR" },
      { image: img("2022/06/tlmp.jpg"), label: "multiPointLubricator", code: "TLMP" },
      { image: img("2022/06/skf-dialset.jpg"), label: "lubricationCalculator", code: "SKF DialSet" },
    ],
  },
  vibracon: {
    resources: [link(`${skf}group/products/maintenance-products/alignment-tools/adjustable-chocks`)],
  },
  "composite-housing-units": {
    gallery: [img("2022/04/edinici-so-kompozitni-kukjishta-1.jpg")],
    resources: [
      link(`${skf}group/products/mounted-bearings/ball-bearing-units/ball-bearing-units-with-composite-housings`),
      link(`${skf}group/products/mounted-bearings/ball-bearing-units/ball-bearing-units-for-high-temperature-applications`, "High temperature"),
    ],
  },
  "y-bearings": {
    gallery: ["y-1.png", "y-2.png", "y-3.jpg", "y-4.jpg", "y-6.jpg", "y-7.png", "y-8.jpg", "y-9.png", "y-10.jpg", "y-11.png", "y-12.jpg", "y-13.png", "y-14.jpg"].map((f) => img(`2022/04/${f}`)),
    resources: [
      pdf("https://www.skf.com/binaries/pub12/Images/0901d196802a2b8f-13728-EN-Y-bearing-and-Y-b-units_tcm_12-129182.pdf", "Y-bearings"),
      pdf("https://www.skf.com/binaries/pub12/Images/0901d19680bd1e86-17273_2-EN---SKF-insert-bearing-units-UC-range_Asia_tcm_12-568178.pdf", "UC"),
      link(`${skf}group/products/mounted-bearings/ball-bearing-units`),
      link(`${skf}group/products/mounted-bearings/roller-bearing-units`, "Roller bearing units"),
    ],
  },
};
