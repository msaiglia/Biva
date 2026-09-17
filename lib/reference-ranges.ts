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
 * DOI: 10.1016/j.clnu.2007.10.008. PMID: 18206273 — popolazione italiana,
 * 1866 adulti sani (1435 donne, 431 uomini). Verificato sul PDF originale
 * (non solo su fonte secondaria) in questa sessione.
 * FFMI: range 25°-75° percentile stabile a tutte le età (Tabella 2).
 * FMI: varia sensibilmente con l'età — 6 fasce decennali esatte da
 * Tabella 4 (non più una semplificazione a 2 fasce)
 * usando i dati riportati per le fasce 20-29 e 60-69/70-80.
 *
 * TBW% — range fisiologico generale (non uno specifico studio
 * percentile), ampiamente consolidato in fisiologia clinica.
 *
 * ECW/TBW% — Enderle et al. 2023 (Clin Nutr 42:644-652), valore atteso e
 * fascia età/sesso/BMI-specifici (solo modalità Standard, popolazione
 * caucasica; non applicabile alla modalità Atleta).
 *
 * ICW, BCM — ancora NESSUNA zona colorata: per l'ICW il gap è lo stesso
 * di ECW prima di Enderle 2023 (nessun range età/sesso-specifico ancora
 * verificato); per il BCM, la revisione sistematica più recente
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
    sourceLabel: "Coin et al. 2008 (PMID 18206273) — popolazione italiana N=1866, 25°-75° percentile, stabile a tutte le età (Tabella 2, verificato su fonte primaria)",
  };
}

/** FMI (kg/m²) — varia sensibilmente con l'età (Coin et al. 2008, Tabella 4): 6 fasce decennali, non 2. */
/**
 * Fasce d'età FMI (25°-75° percentile) — Tabella 4, Coin et al. 2008.
 * A differenza della FFMI (stabile a tutte le età secondo gli stessi
 * autori), la FMI varia sensibilmente per decade: usare solo 2 fasce
 * (<50/≥50) sarebbe una semplificazione eccessiva rispetto alla fonte —
 * qui si usano le 6 fasce esatte riportate nello studio primario
 * (verificato sul PDF originale, non su una fonte secondaria).
 */
const FMI_BRACKETS_M: { maxAge: number; low: number; high: number }[] = [
  { maxAge: 29, low: 2.9, high: 4.8 },
  { maxAge: 39, low: 3.8, high: 6.0 },
  { maxAge: 49, low: 4.3, high: 7.2 },
  { maxAge: 59, low: 5.0, high: 7.4 },
  { maxAge: 69, low: 5.8, high: 8.5 },
  { maxAge: Infinity, low: 5.6, high: 8.6 }, // 70-80
];
const FMI_BRACKETS_F: { maxAge: number; low: number; high: number }[] = [
  { maxAge: 29, low: 4.9, high: 8.2 },
  { maxAge: 39, low: 6.1, high: 9.3 },
  { maxAge: 49, low: 5.9, high: 9.7 },
  { maxAge: 59, low: 6.9, high: 10.5 },
  { maxAge: 69, low: 8.0, high: 11.5 },
  { maxAge: Infinity, low: 7.7, high: 11.3 }, // 70-80
];

export function fmiRange(sex: Sex, ageYears: number): RangeZones {
  const brackets = sex === "M" ? FMI_BRACKETS_M : FMI_BRACKETS_F;
  const bracket = brackets.find((b) => ageYears <= b.maxAge) ?? brackets[brackets.length - 1];
  const normalLow = bracket.low;
  const normalHigh = bracket.high;
  const ageLabel =
    bracket.maxAge === Infinity ? "70-80" : `${bracket.maxAge - 9}-${bracket.maxAge}`;
  const span = normalHigh - normalLow;
  return {
    min: Math.max(0, normalLow - span * 1.2),
    lowBoundary: Math.max(0, normalLow - span * 0.4),
    normalLow,
    normalHigh,
    highBoundary: normalHigh + span * 0.4,
    max: normalHigh + span * 1.2,
    sourceLabel: `Coin et al. 2008 (PMID 18206273) — fascia ${ageLabel} anni, 25°-75° percentile (Tabella 4, verificato su fonte primaria)`,
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

/**
 * Valore ATTESO di ECW/TBW% per un adulto sano, individualizzato per età,
 * sesso e BMI — NON un valore fisso di popolazione.
 *
 * Fonte: Enderle J, Reljic D, Jensen B, Peine S, Zopf Y, Bosy-Westphal A.
 * "Normal values for body composition in adults are better represented by
 * continuous reference ranges dependent on age and BMI." Clin Nutr.
 * 2023;42(5):644-652. DOI: 10.1016/j.clnu.2023.03.006. Tabella 2 (modello
 * BMI-dipendente), n=1958 adulti caucasici sani, età 18-97 anni, validato
 * contro diluizione D2O/NaBr. Limite dichiarato: solo popolazione
 * caucasica; nessun dato specifico per atleti.
 */
export function ecwTbwExpected(ageYears: number, sex: Sex, bmi: number): number {
  return sex === "M"
    ? -0.0979 * ageYears + 0.00198 * ageYears * ageYears + 0.1131 * bmi + 38.68
    : -0.096 * ageYears + 0.002088 * ageYears * ageYears + 0.1119 * bmi + 42.0;
}

/**
 * Fascia di riferimento per ECW/TBW% attorno al valore atteso (età, sesso,
 * BMI), usando l'errore standard di stima (SEE) del modello di Enderle et
 * al. 2023 come unità di scostamento: normale entro ±1 SEE, borderline
 * entro ±2 SEE (convenzione statistica standard, analoga a come le altre
 * fasce di quest'app usano percentili o deviazioni standard pubblicate).
 */
export function ecwTbwRange(ageYears: number, sex: Sex, bmi: number): RangeZones {
  const expected = ecwTbwExpected(ageYears, sex, bmi);
  const see = sex === "M" ? 1.06 : 1.46;
  return {
    min: expected - 3 * see,
    lowBoundary: expected - 2 * see,
    normalLow: expected - see,
    normalHigh: expected + see,
    highBoundary: expected + 2 * see,
    max: expected + 3 * see,
    sourceLabel: `Enderle et al. 2023 (Clin Nutr 42:644-652) — valore atteso età/sesso/BMI-specifico ±1-2 SEE (n=1958, adulti caucasici, non specifico per atleti)`,
  };
}

/**
 * Valore ATTESO di ICW/TBW% — NON una fonte separata: è il complemento
 * matematico di ecwTbwExpected (ICW/TBW = 100% - ECW/TBW per identità,
 * dato che TBW = ECW + ICW). Stessa fonte (Enderle et al. 2023), stessi
 * limiti (solo popolazione caucasica, non specifico per atleti).
 */
export function icwTbwExpected(ageYears: number, sex: Sex, bmi: number): number {
  return 100 - ecwTbwExpected(ageYears, sex, bmi);
}

/**
 * Fascia di riferimento ICW/TBW% — complemento matematico di ecwTbwRange
 * (stesso SEE di Enderle et al. 2023: la varianza di 100%-X è identica
 * alla varianza di X). Non introduce alcuna nuova assunzione statistica.
 */
export function icwTbwRange(ageYears: number, sex: Sex, bmi: number): RangeZones {
  const expected = icwTbwExpected(ageYears, sex, bmi);
  const see = sex === "M" ? 1.06 : 1.46;
  return {
    min: expected - 3 * see,
    lowBoundary: expected - 2 * see,
    normalLow: expected - see,
    normalHigh: expected + see,
    highBoundary: expected + 2 * see,
    max: expected + 3 * see,
    sourceLabel: `Enderle et al. 2023 (Clin Nutr 42:644-652) — complemento di ECW/TBW (100% − ECW/TBW atteso), stessa fonte e stesso errore standard`,
  };
}
