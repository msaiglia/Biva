/**
 * SEED — Popolazioni di riferimento BIVA
 * ========================================
 *
 * Tutti i valori numerici (media R/H, media Xc/H, SD, r) sono estratti
 * letteralmente dal materiale supplementare (Tabelle S5, S7, S8) di:
 *
 *   Serafini S, Mascherini G, Vaquero-Cristóbal R, Esparza-Ros F, Campa F,
 *   Izzicupo P. "Reference Tolerance Ellipses in Bioelectrical Impedance
 *   Vector Analysis Across General, Pediatric, Pathological, and Athletic
 *   Populations: A Scoping Review." J Funct Morphol Kinesiol. 2025;10(4):415.
 *   DOI: 10.3390/jfmk10040415 (open access, CC BY)
 *
 * che a sua volta cita le fonti primarie elencate in ciascun record
 * (campo sourceCitation). Per le 4 fonti primarie verificate
 * indipendentemente in questa sessione (Piccoli 1995, Campa 2023,
 * Campa 2025, Campa 2019) pubmedVerified = true con DOI diretto.
 * Per le altre fonti primarie (Piccoli 1998, Guglielmi 1999, Toso 2000),
 * la citazione proviene dalla Tabella S4 della scoping review ma il
 * DOI/PMID non è stato verificato individualmente in questa sessione:
 * pubmedVerified = false, da confermare prima di uso clinico.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const populations = [
  // -------------------------------------------------------------------
  // GENERALE — STORICO (Piccoli 1995)
  // -------------------------------------------------------------------
  {
    code: "PICCOLI_1995_M",
    label: "Adulti generali maschi — storico (Piccoli 1995)",
    sex: "M" as const,
    category: "generale",
    n: 354,
    meanRH: 298.6,
    sdRH: 43.2,
    meanXcH: 30.8,
    sdXcH: 7.2,
    correlationR: 0.47,
    ageMin: 15,
    ageMax: 85,
    sourceCitation:
      "Piccoli A, Nigrelli S, Caberlotto A, et al. Bivariate normal values of the bioelectrical impedance vector in adult and elderly populations. Am J Clin Nutr. 1995;61:269-270.",
    sourceDOI: "10.1093/ajcn/61.2.269",
    pubmedVerified: true,
  },
  {
    code: "PICCOLI_1995_F",
    label: "Adulti generali femmine — storico (Piccoli 1995)",
    sex: "F" as const,
    category: "generale",
    n: 372,
    meanRH: 371.9,
    sdRH: 49.0,
    meanXcH: 34.4,
    sdXcH: 7.7,
    correlationR: 0.41,
    ageMin: 15,
    ageMax: 85,
    sourceCitation:
      "Piccoli A, Nigrelli S, Caberlotto A, et al. Bivariate normal values of the bioelectrical impedance vector in adult and elderly populations. Am J Clin Nutr. 1995;61:269-270.",
    sourceDOI: "10.1093/ajcn/61.2.269",
    pubmedVerified: true,
  },

  // -------------------------------------------------------------------
  // GENERALE — AGGIORNATO (Campa 2023) — DEFAULT CONSIGLIATO
  // -------------------------------------------------------------------
  {
    code: "CAMPA_2023_M",
    label: "Adulti generali maschi — aggiornato (Campa 2023)",
    sex: "M" as const,
    category: "generale",
    n: 2137,
    meanRH: 265.7,
    sdRH: 35.1,
    meanXcH: 32.1,
    sdXcH: 4.9,
    correlationR: 0.60,
    ageMin: 18,
    ageMax: 65,
    sourceCitation:
      "Campa F, et al. New bioelectrical impedance vector references and phase angle centile curves in 4,367 adults: the need for an urgent update after 30 years. Clin Nutr. 2023;42:1749-1758.",
    sourceDOI: "10.1016/j.clnu.2023.07.025",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2023_F",
    label: "Adulti generali femmine — aggiornato (Campa 2023)",
    sex: "F" as const,
    category: "generale",
    n: 2230,
    meanRH: 337.2,
    sdRH: 47.8,
    meanXcH: 35.9,
    sdXcH: 5.5,
    correlationR: 0.67,
    ageMin: 18,
    ageMax: 65,
    sourceCitation:
      "Campa F, et al. New bioelectrical impedance vector references and phase angle centile curves in 4,367 adults: the need for an urgent update after 30 years. Clin Nutr. 2023;42:1749-1758.",
    sourceDOI: "10.1016/j.clnu.2023.07.025",
    pubmedVerified: true,
  },

  // -------------------------------------------------------------------
  // ANZIANI (Campa 2025)
  // -------------------------------------------------------------------
  {
    code: "CAMPA_2025_ELDERLY_M",
    label: "Anziani maschi (Campa 2025)",
    sex: "M" as const,
    category: "anziani",
    n: 363,
    meanRH: 280.2,
    sdRH: 47.9,
    meanXcH: 26.8,
    sdXcH: 4.1,
    correlationR: 0.60,
    ageMin: 65,
    ageMax: 92,
    sourceCitation:
      "Campa F, et al. Bioelectrical Impedance Vector Analysis in Older Adults: Reference Standards from a Cross-Sectional Study. Front Nutr. 2025;12:1640407.",
    sourceDOI: "10.3389/fnut.2025.1640407",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2025_ELDERLY_F",
    label: "Anziani femmine (Campa 2025)",
    sex: "F" as const,
    category: "anziani",
    n: 472,
    meanRH: 363.8,
    sdRH: 63.9,
    meanXcH: 30.6,
    sdXcH: 6.1,
    correlationR: 0.70,
    ageMin: 65,
    ageMax: 92,
    sourceCitation:
      "Campa F, et al. Bioelectrical Impedance Vector Analysis in Older Adults: Reference Standards from a Cross-Sectional Study. Front Nutr. 2025;12:1640407.",
    sourceDOI: "10.3389/fnut.2025.1640407",
    pubmedVerified: true,
  },

  // -------------------------------------------------------------------
  // ATLETI (Campa 2019 — tutti gli atleti, aggregato)
  // -------------------------------------------------------------------
  {
    code: "CAMPA_2019_ATHLETES_M",
    label: "Atleti maschi, tutte le discipline (Campa 2019)",
    sex: "M" as const,
    category: "atleti",
    n: 1116,
    meanRH: 251.6,
    sdRH: 32.5,
    meanXcH: 33.9,
    sdXcH: 4.8,
    correlationR: 0.70,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2019_ATHLETES_F",
    label: "Atlete femmine, tutte le discipline (Campa 2019)",
    sex: "F" as const,
    category: "atleti",
    n: 440,
    meanRH: 318.1,
    sdRH: 42.8,
    meanXcH: 38.3,
    sdXcH: 6.4,
    correlationR: 0.70,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },

  // -------------------------------------------------------------------
  // IRC / EMODIALISI, stabili emodinamicamente (Piccoli 1998)
  // -------------------------------------------------------------------
  {
    code: "PICCOLI_1998_HD_STABLE_M",
    label: "Emodialisi, stabili emodinamicamente — maschi (Piccoli 1998)",
    sex: "M" as const,
    category: "IRC-dialisi",
    n: 680,
    meanRH: 292.6,
    sdRH: 40.6,
    meanXcH: 26.3,
    sdXcH: 5.8,
    correlationR: 0.32,
    sourceCitation:
      "Piccoli A. Identification of operational clues to dry weight prescription in hemodialysis using bioimpedance vector analysis. Kidney Int. 1998. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "PICCOLI_1998_HD_STABLE_F",
    label: "Emodialisi, stabili emodinamicamente — femmine (Piccoli 1998)",
    sex: "F" as const,
    category: "IRC-dialisi",
    n: 436,
    meanRH: 353.6,
    sdRH: 44.9,
    meanXcH: 29.3,
    sdXcH: 7.3,
    correlationR: 0.38,
    sourceCitation:
      "Piccoli A. Identification of operational clues to dry weight prescription in hemodialysis using bioimpedance vector analysis. Kidney Int. 1998. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },

  // -------------------------------------------------------------------
  // OBESITÀ I-III (Piccoli 1998)
  // -------------------------------------------------------------------
  {
    code: "PICCOLI_1998_OBESITY_M",
    label: "Obesità I-III — maschi (Piccoli 1998)",
    sex: "M" as const,
    category: "obesita",
    n: 169,
    meanRH: 234.6,
    sdRH: 28.6,
    meanXcH: 25.3,
    sdXcH: 4.9,
    correlationR: 0.52,
    sourceCitation:
      "Piccoli A. Discriminating between body fat and fluid changes in the obese adult using bioimpedance vector analysis. 1998. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "PICCOLI_1998_OBESITY_F",
    label: "Obesità I-III — femmine (Piccoli 1998)",
    sex: "F" as const,
    category: "obesita",
    n: 371,
    meanRH: 299.0,
    sdRH: 43.5,
    meanXcH: 30.2,
    sdXcH: 7.2,
    correlationR: 0.63,
    sourceCitation:
      "Piccoli A. Discriminating between body fat and fluid changes in the obese adult using bioimpedance vector analysis. 1998. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },

  // -------------------------------------------------------------------
  // CIRROSI EPATICA, senza ascite (Guglielmi 1999)
  // -------------------------------------------------------------------
  {
    code: "GUGLIELMI_1999_CIRRHOSIS_M",
    label: "Cirrosi epatica, senza ascite — maschi (Guglielmi 1999)",
    sex: "M" as const,
    category: "epatologia",
    n: 144,
    meanRH: 290.0,
    sdRH: 42.0,
    meanXcH: 30.0,
    sdXcH: 6.0,
    correlationR: 0.4,
    sourceCitation:
      "Guglielmi FW, et al. The RXc graph in evaluating and monitoring fluid balance in patients with liver cirrhosis. 1999. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "GUGLIELMI_1999_CIRRHOSIS_F",
    label: "Cirrosi epatica, senza ascite — femmine (Guglielmi 1999)",
    sex: "F" as const,
    category: "epatologia",
    n: 116,
    meanRH: 361.0,
    sdRH: 50.0,
    meanXcH: 34.0,
    sdXcH: 7.0,
    correlationR: 0.4,
    sourceCitation:
      "Guglielmi FW, et al. The RXc graph in evaluating and monitoring fluid balance in patients with liver cirrhosis. 1999. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
] as const;

async function main() {
  console.log(`Inserimento di ${populations.length} popolazioni di riferimento...`);
  for (const pop of populations) {
    await prisma.referencePopulation.upsert({
      where: { code: pop.code },
      update: pop,
      create: pop,
    });
    console.log(`  ✓ ${pop.code}`);
  }
  console.log("Completato.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
