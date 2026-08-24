/**
 * RANGE DI RIFERIMENTO — per il widget a barra colorata (RangeBar)
 * ===================================================================
 *
 * A differenza delle popolazioni BIVA (dove abbiamo media/SD/r veri e
 * un'ellisse statistica), qui usiamo range più semplici — percentili
 * 25°-75° dove disponibili da studi validati, altrimenti range
 * fisiologici generali chiaramente etichettati come tali.
 *
 * FFMI, FMI — Coin A, Sergi G, Minicuci N, et al. "Fat-free mass and fat
 * mass reference values by dual-energy X-ray absorptiometry (DEXA) in a
 * 20-80 year-old Italian population." Clin Nutr. 2008;27:87-94.
 * PMID: 18206273 — popolazione italiana, 1866 adulti sani.
 * FFMI: range 25°-75° percentile stabile a tutte le età.
 * FMI: varia con l'età, qui semplificato a 2 fasce (< 50 anni, ≥ 50 anni)
 * usando i dati riportati per le fasce 20-29 e 60-69/70-80.
 *
 * TBW% — range fisiologico generale (non uno specifico studio
 * percentile), ampiamente consolidato in fisiologia clinica.
 *
 * ECW/ICW, BCM — NESSUNA zona colorata: Moissl et al. 2006 fornisce solo
 * un rapporto medio di popolazione (non una distribuzione con percentili
 * individualizzabili); per il BCM, la revisione sistematica più recente
 * disponibile (Kampo D, Závodná E, Vondra V. "Multi-Frequency
 * Bioimpedance Analysis in Practice: A Review of Validated Prediction
 * Equations for Key Body Composition Parameters." Physiol Res.
 * 2025;74(Suppl 1):S77-S92. PMID: 41511100) conferma esplicitamente una
 * carenza di equazioni/range validati per BCM nella letteratura
 * scientifica attuale — non è un limite della ricerca fatta qui, è un
 * gap riconosciuto nel campo.
 */

export type Sex = "M" | "F";

export interface RangeZones {
  min: number;
  lowBoundary: number; // sotto = arancio
  normalLow: number; // 25° percentile
  normalHigh: number; // 75° percentile
  highBoundary: number; // sopra = arancio
  max: number;
  sourceLabel: string;
}

/** FFMI (kg/m²) — stabile a tutte le età (Coin et al. 2008). */
export function ffmiRange(sex: Sex): RangeZones {
  const normalLow = sex === "M" ? 18.7 : 14.9;
  const normalHigh = sex === "M" ? 21.0 : 17.2;
  const span = normalHigh - normalLow;
  return {
    min: normalLow - span * 1.2,
    lowBoundary: normalLow - span * 0.4,
    normalLow,
    normalHigh,
    highBoundary: normalHigh + span * 0.4,
    max: normalHigh + span * 1.2,
    sourceLabel: "Coin et al. 2008 (PMID 18206273) — popolazione italiana, 25°-75° percentile",
  };
}

/** FMI (kg/m²) — varia con l'età, semplificato a 2 fasce (Coin et al. 2008). */
export function fmiRange(sex: Sex, ageYears: number): RangeZones {
  const young = ageYears < 50;
  let normalLow: number, normalHigh: number;
  if (sex === "M") {
    normalLow = young ? 2.9 : 5.6;
    normalHigh = young ? 4.8 : 8.6;
  } else {
    // Donne: range approssimato dagli stessi bracket d'età riportati nello studio
    normalLow = young ? 3.7 : 7.0;
    normalHigh = young ? 6.0 : 10.5;
  }
  const span = normalHigh - normalLow;
  return {
    min: Math.max(0, normalLow - span * 1.2),
    lowBoundary: Math.max(0, normalLow - span * 0.4),
    normalLow,
    normalHigh,
    highBoundary: normalHigh + span * 0.4,
    max: normalHigh + span * 1.2,
    sourceLabel: `Coin et al. 2008 (PMID 18206273) — fascia ${young ? "<50" : "≥50"} anni, 25°-75° percentile`,
  };
}

/** TBW come % del peso corporeo — range fisiologico generale, non uno specifico studio percentile. */
export function tbwPercentRange(): RangeZones {
  return {
    min: 35,
    lowBoundary: 45,
    normalLow: 45,
    normalHigh: 65,
    highBoundary: 65,
    max: 75,
    sourceLabel: "Range fisiologico generale (fisiologia clinica consolidata, non percentili di uno studio specifico)",
  };
}

/**
 * BMI (kg/m²) — classificazione OMS/WHO standard internazionale
 * (WHO Technical Report Series 894, 2000): sottopeso <18.5, normopeso
 * 18.5-24.9, sovrappeso 25-29.9, obesità ≥30. Non individualizzata per
 * sesso/età/composizione corporea — è un indice antropometrico generico,
 * non specifico per la BIVA.
 */
export function bmiRange(): RangeZones {
  return {
    min: 12,
    lowBoundary: 18.5,
    normalLow: 18.5,
    normalHigh: 25.0,
    highBoundary: 30.0,
    max: 45,
    sourceLabel: "Classificazione OMS (WHO) — sottopeso <18.5, normopeso 18.5-24.9, sovrappeso 25-29.9, obesità ≥30",
  };
}

/** Etichetta categoria OMS/WHO per un dato valore di BMI. */
export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Sottopeso";
  if (bmi < 25) return "Normopeso";
  if (bmi < 30) return "Sovrappeso";
  return "Obesità";
}
