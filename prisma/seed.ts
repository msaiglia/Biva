/**
 * SEED — Popolazioni di riferimento BIVA
 * ========================================
 *
 * METODO CLASSICO: valori estratti dal materiale supplementare (Tabelle
 * S5, S7, S8) di Serafini S, et al. J Funct Morphol Kinesiol.
 * 2025;10(4):415. DOI: 10.3390/jfmk10040415 (open access, CC BY).
 *
 * METODO SPECIFICO (Buffa & Marini): valori estratti dalla stessa fonte
 * (colonne "Specific" delle stesse tabelle) più verifica diretta della
 * formula su Buffa et al. 2013, PLoS ONE, DOI: 10.1371/journal.pone.0058533.
 *
 * Per le fonti primarie verificate indipendentemente in questa sessione
 * (Piccoli 1995, Campa 2023, Campa 2025, Campa 2019) pubmedVerified = true
 * con DOI diretto. Per le altre, la citazione proviene dalla Tabella S4
 * della scoping review ma il DOI/PMID non è stato verificato
 * individualmente: pubmedVerified = false, da confermare prima di uso clinico.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const populations = [
  // =====================================================================
  // METODO CLASSICO (R/H, Xc/H — Ohm/m)
  // =====================================================================
  {
    code: "PICCOLI_1995_M",
    label: "Adulti generali maschi — storico (Piccoli 1995)",
    sex: "M" as const,
    method: "classic",
    category: "generale",
    n: 354,
    meanX: 298.6,
    sdX: 43.2,
    meanY: 30.8,
    sdY: 7.2,
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
    method: "classic",
    category: "generale",
    n: 372,
    meanX: 371.9,
    sdX: 49.0,
    meanY: 34.4,
    sdY: 7.7,
    correlationR: 0.41,
    ageMin: 15,
    ageMax: 85,
    sourceCitation:
      "Piccoli A, Nigrelli S, Caberlotto A, et al. Bivariate normal values of the bioelectrical impedance vector in adult and elderly populations. Am J Clin Nutr. 1995;61:269-270.",
    sourceDOI: "10.1093/ajcn/61.2.269",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2023_M",
    label: "Adulti generali maschi — aggiornato (Campa 2023)",
    sex: "M" as const,
    method: "classic",
    category: "generale",
    n: 2137,
    meanX: 265.7,
    sdX: 35.1,
    meanY: 32.1,
    sdY: 4.9,
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
    method: "classic",
    category: "generale",
    n: 2230,
    meanX: 337.2,
    sdX: 47.8,
    meanY: 35.9,
    sdY: 5.5,
    correlationR: 0.67,
    ageMin: 18,
    ageMax: 65,
    sourceCitation:
      "Campa F, et al. New bioelectrical impedance vector references and phase angle centile curves in 4,367 adults: the need for an urgent update after 30 years. Clin Nutr. 2023;42:1749-1758.",
    sourceDOI: "10.1016/j.clnu.2023.07.025",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2025_ELDERLY_M",
    label: "Anziani maschi (Campa 2025)",
    sex: "M" as const,
    method: "classic",
    category: "anziani",
    n: 363,
    meanX: 280.2,
    sdX: 47.9,
    meanY: 26.8,
    sdY: 4.1,
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
    method: "classic",
    category: "anziani",
    n: 472,
    meanX: 363.8,
    sdX: 63.9,
    meanY: 30.6,
    sdY: 6.1,
    correlationR: 0.70,
    ageMin: 65,
    ageMax: 92,
    sourceCitation:
      "Campa F, et al. Bioelectrical Impedance Vector Analysis in Older Adults: Reference Standards from a Cross-Sectional Study. Front Nutr. 2025;12:1640407.",
    sourceDOI: "10.3389/fnut.2025.1640407",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2019_ATHLETES_M",
    label: "Atleti maschi, tutte le discipline (Campa 2019)",
    sex: "M" as const,
    method: "classic",
    category: "atleti",
    n: 1116,
    meanX: 251.6,
    sdX: 32.5,
    meanY: 33.9,
    sdY: 4.8,
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
    method: "classic",
    category: "atleti",
    n: 440,
    meanX: 318.1,
    sdX: 42.8,
    meanY: 38.3,
    sdY: 6.4,
    correlationR: 0.70,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2019_ATHLETES_ENDURANCE_M",
    label: "Atleti maschi — endurance: ciclismo, maratona, sci di fondo, canottaggio, triathlon (Campa 2019)",
    sex: "M" as const,
    method: "classic",
    category: "atleti",
    n: 165,
    meanX: 267.2,
    sdX: 28.0,
    meanY: 35.5,
    sdY: 4.7,
    correlationR: 0.50,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2019_ATHLETES_ENDURANCE_F",
    label: "Atlete femmine — endurance: ciclismo, maratona, sci di fondo, canottaggio, triathlon (Campa 2019)",
    sex: "F" as const,
    method: "classic",
    category: "atleti",
    n: 76,
    meanX: 337.5,
    sdX: 42.9,
    meanY: 40.1,
    sdY: 5.5,
    correlationR: 0.60,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2019_ATHLETES_POWER_M",
    label: "Atleti maschi — velocità/potenza: atletica leggera, salti, lanci, nuoto veloce, judo, karate, CrossFit (Campa 2019)",
    sex: "M" as const,
    method: "classic",
    category: "atleti",
    n: 375,
    meanX: 253.3,
    sdX: 32.4,
    meanY: 34.2,
    sdY: 5.5,
    correlationR: 0.70,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2019_ATHLETES_POWER_F",
    label: "Atlete femmine — velocità/potenza: atletica leggera, salti, lanci, nuoto veloce, judo, karate, CrossFit (Campa 2019)",
    sex: "F" as const,
    method: "classic",
    category: "atleti",
    n: 177,
    meanX: 321.0,
    sdX: 46.9,
    meanY: 38.0,
    sdY: 7.4,
    correlationR: 0.80,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2019_ATHLETES_TEAM_M",
    label: "Atleti maschi — sport di squadra: calcio, pallavolo, basket, rugby, hockey, pallanuoto (Campa 2019)",
    sex: "M" as const,
    method: "classic",
    category: "atleti",
    n: 576,
    meanX: 246.2,
    sdX: 32.3,
    meanY: 32.9,
    sdY: 4.8,
    correlationR: 0.60,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },
  {
    code: "CAMPA_2019_ATHLETES_TEAM_F",
    label: "Atlete femmine — sport di squadra: calcio, pallavolo, basket, rugby, hockey, pallanuoto (Campa 2019)",
    sex: "F" as const,
    method: "classic",
    category: "atleti",
    n: 187,
    meanX: 305.6,
    sdX: 37.6,
    meanY: 36.3,
    sdY: 5.3,
    correlationR: 0.60,
    ageMin: 16,
    ageMax: 40,
    sourceCitation:
      "Campa F, Matias C, Gatterer H, et al. Classic Bioelectrical Impedance Vector Reference Values for Assessing Body Composition in Male and Female Athletes. Int J Environ Res Public Health. 2019;16:5066.",
    sourceDOI: "10.3390/ijerph16245066",
    pubmedVerified: true,
  },
  {
    code: "PICCOLI_1998_HD_STABLE_M",
    label: "Emodialisi, stabili emodinamicamente — maschi (Piccoli 1998)",
    sex: "M" as const,
    method: "classic",
    category: "IRC-dialisi",
    n: 680,
    meanX: 292.6,
    sdX: 40.6,
    meanY: 26.3,
    sdY: 5.8,
    correlationR: 0.32,
    sourceCitation:
      "Piccoli A. Identification of operational clues to dry weight prescription in hemodialysis using bioimpedance vector analysis. Kidney Int. 1998. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "PICCOLI_1998_HD_STABLE_F",
    label: "Emodialisi, stabili emodinamicamente — femmine (Piccoli 1998)",
    sex: "F" as const,
    method: "classic",
    category: "IRC-dialisi",
    n: 436,
    meanX: 353.6,
    sdX: 44.9,
    meanY: 29.3,
    sdY: 7.3,
    correlationR: 0.38,
    sourceCitation:
      "Piccoli A. Identification of operational clues to dry weight prescription in hemodialysis using bioimpedance vector analysis. Kidney Int. 1998. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "PICCOLI_1998_OBESITY_M",
    label: "Obesità I-III — maschi (Piccoli 1998)",
    sex: "M" as const,
    method: "classic",
    category: "obesita",
    n: 169,
    meanX: 234.6,
    sdX: 28.6,
    meanY: 25.3,
    sdY: 4.9,
    correlationR: 0.52,
    sourceCitation:
      "Piccoli A. Discriminating between body fat and fluid changes in the obese adult using bioimpedance vector analysis. 1998. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "PICCOLI_1998_OBESITY_F",
    label: "Obesità I-III — femmine (Piccoli 1998)",
    sex: "F" as const,
    method: "classic",
    category: "obesita",
    n: 371,
    meanX: 299.0,
    sdX: 43.5,
    meanY: 30.2,
    sdY: 7.2,
    correlationR: 0.63,
    sourceCitation:
      "Piccoli A. Discriminating between body fat and fluid changes in the obese adult using bioimpedance vector analysis. 1998. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "GUGLIELMI_1999_CIRRHOSIS_M",
    label: "Cirrosi epatica, senza ascite — maschi (Guglielmi 1999)",
    sex: "M" as const,
    method: "classic",
    category: "epatologia",
    n: 144,
    meanX: 290.0,
    sdX: 42.0,
    meanY: 30.0,
    sdY: 6.0,
    correlationR: 0.4,
    sourceCitation:
      "Guglielmi FW, et al. The RXc graph in evaluating and monitoring fluid balance in patients with liver cirrhosis. 1999. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "GUGLIELMI_1999_CIRRHOSIS_F",
    label: "Cirrosi epatica, senza ascite — femmine (Guglielmi 1999)",
    sex: "F" as const,
    method: "classic",
    category: "epatologia",
    n: 116,
    meanX: 361.0,
    sdX: 50.0,
    meanY: 34.0,
    sdY: 7.0,
    correlationR: 0.4,
    sourceCitation:
      "Guglielmi FW, et al. The RXc graph in evaluating and monitoring fluid balance in patients with liver cirrhosis. 1999. (citazione da Tabella S4, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },

  // =====================================================================
  // METODO SPECIFICO (Rsp, Xcsp — Ohm*cm) — Buffa & Marini
  // =====================================================================
  {
    code: "BUFFA_2013_SPECIFIC_US_M",
    label: "Adulti USA maschi — BIVA specifica (Buffa 2013)",
    sex: "M" as const,
    method: "specific",
    category: "generale",
    n: 836,
    meanX: 402.4,
    sdX: 62.9,
    meanY: 52.5,
    sdY: 9.5,
    correlationR: 0.839,
    ageMin: 21,
    ageMax: 49,
    sourceCitation:
      "Buffa R, Saragat B, Cabras S, Rinaldi AC, Marini E. Accuracy of Specific BIVA for the Assessment of Body Composition in the United States Population. PLoS ONE. 2013;8(3):e58533.",
    sourceDOI: "10.1371/journal.pone.0058533",
    pubmedVerified: true,
  },
  {
    code: "SARAGAT_2014_SPECIFIC_ELDERLY_IT_M",
    label: "Anziani italiani maschi — BIVA specifica (Saragat 2014)",
    sex: "M" as const,
    method: "specific",
    category: "anziani",
    n: 265,
    meanX: 391.8,
    sdX: 57.9,
    meanY: 42.6,
    sdY: 9.9,
    correlationR: 0.59,
    sourceCitation:
      "Saragat B, Buffa R, Mereu E, De Rui M, Coin A, Sergi G, Marini E. Specific bioelectrical impedance vector reference values for assessing body composition in the Italian elderly. Exp Gerontol. 2014;50:52-56. (citazione da Tabella S4/S5, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "SARAGAT_2014_SPECIFIC_ELDERLY_IT_F",
    label: "Anziane italiane femmine — BIVA specifica (Saragat 2014)",
    sex: "F" as const,
    method: "specific",
    category: "anziani",
    n: 295,
    meanX: 462.0,
    sdX: 80.1,
    meanY: 47.9,
    sdY: 11.2,
    correlationR: 0.75,
    sourceCitation:
      "Saragat B, Buffa R, Mereu E, De Rui M, Coin A, Sergi G, Marini E. Specific bioelectrical impedance vector reference values for assessing body composition in the Italian elderly. Exp Gerontol. 2014;50:52-56. (citazione da Tabella S4/S5, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "IBANEZ_2015_SPECIFIC_YOUNG_ITES_M",
    label: "Giovani adulti italo-spagnoli maschi — BIVA specifica (Ibáñez 2015)",
    sex: "M" as const,
    method: "specific",
    category: "generale",
    n: 213,
    meanX: 332.7,
    sdX: 41.6,
    meanY: 44.4,
    sdY: 6.8,
    correlationR: 0.77,
    sourceCitation:
      "Ibáñez ME, et al. New specific bioelectrical impedance vector reference values for assessing body composition in the Italian-Spanish young adult population. Am J Hum Biol. 2015. (citazione da Tabella S4/S5, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
    pubmedVerified: false,
  },
  {
    code: "IBANEZ_2015_SPECIFIC_YOUNG_ITES_F",
    label: "Giovani adulte italo-spagnole femmine — BIVA specifica (Ibáñez 2015)",
    sex: "F" as const,
    method: "specific",
    category: "generale",
    n: 227,
    meanX: 388.6,
    sdX: 60.0,
    meanY: 43.7,
    sdY: 7.5,
    correlationR: 0.79,
    sourceCitation:
      "Ibáñez ME, et al. New specific bioelectrical impedance vector reference values for assessing body composition in the Italian-Spanish young adult population. Am J Hum Biol. 2015. (citazione da Tabella S4/S5, Serafini et al. 2025 — DOI/PMID non verificato individualmente in questa sessione)",
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
    console.log(`  ✓ ${pop.code} (${pop.method})`);
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
