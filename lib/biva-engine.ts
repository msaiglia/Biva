/**
 * MOTORE DI CALCOLO BIVA (Bioelectrical Impedance Vector Analysis)
 * ==================================================================
 *
 * Le formule geometriche delle ellissi di tolleranza/confidenza (funzioni
 * `criticalFValueD1Eq2` e `toleranceEllipse`) sono tradotte letteralmente
 * dalle Equazioni 1a e 2a della fonte primaria:
 *
 *   Piccoli A, Pastori G. "BIVA software." Dept. of Medical and Surgical
 *   Sciences, University of Padova, 2002.
 *   (guida ufficiale del software originale del metodo RXc graph)
 *
 * Riferimento del metodo RXc graph:
 *   Piccoli A, Rossi B, Pillon L, Bucciante G. "A new method for monitoring
 *   body fluid variation by bioimpedance analysis: the RXc graph."
 *   Kidney Int. 1994;46:534-539.
 *
 * NESSUN valore numerico di popolazione di riferimento (media, SD, r) è
 * hard-coded in questo file: quei dati vanno inseriti nel database
 * `ReferencePopulation` a partire da tabelle pubblicate e verificate
 * (vedi campo `sourceCitation` e `pubmedVerified`), esattamente come nel
 * foglio "Reference populations" del software originale di Piccoli.
 */

// ---------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------

export type Sex = "M" | "F";

/** Una popolazione di riferimento (un'ellisse), da tabelle pubblicate. */
export interface ReferencePopulation {
  code: string;
  label: string; // es. "Adulti generali (Piccoli 1995)"
  sex: Sex;
  n: number; // numerosità campionaria dello studio originale
  meanRH: number; // media R/H, Ohm/m
  sdRH: number; // deviazione standard R/H, Ohm/m
  meanXcH: number; // media Xc/H, Ohm/m
  sdXcH: number; // deviazione standard Xc/H, Ohm/m
  r: number; // coefficiente di correlazione lineare R/H, Xc/H
  sourceCitation: string; // citazione completa
  sourceDOI?: string;
  pubmedVerified: boolean; // true solo se verificato con PMID/indicizzazione PubMed
}

export interface RawMeasurement {
  R: number; // Ohm
  Xc: number; // Ohm
  heightCm: number;
  phaseAngleDevice?: number; // angolo di fase letto direttamente dal dispositivo, se disponibile
}

export interface NormalizedVector {
  RH: number; // Ohm/m
  XcH: number; // Ohm/m
}

export interface EllipseGeometry {
  percentile: 50 | 75 | 95;
  centerRH: number;
  centerXcH: number;
  semiAxisMajor: number;
  semiAxisMinor: number;
  rotationDeg: number; // rotazione dell'asse maggiore rispetto all'asse R/H
}

// ---------------------------------------------------------------------
// Normalizzazione e angolo di fase
// ---------------------------------------------------------------------

/** Normalizza R e Xc per l'altezza (Ohm/m). */
export function normalize(m: RawMeasurement): NormalizedVector {
  const heightM = m.heightCm / 100;
  if (heightM <= 0) throw new Error("Altezza non valida");
  return { RH: m.R / heightM, XcH: m.Xc / heightM };
}

/** Angolo di fase in gradi: arctan(Xc/R) * 180/pi. */
export function phaseAngleDeg(R: number, Xc: number): number {
  return Math.atan(Xc / R) * (180 / Math.PI);
}

/** Modulo del vettore di impedenza |Z| = sqrt(R^2 + Xc^2). */
export function impedanceModulus(R: number, Xc: number): number {
  return Math.sqrt(R * R + Xc * Xc);
}

/**
 * Verifica incrociata tra l'angolo di fase calcolato e quello letto dal
 * dispositivo (utile come controllo qualità del dato, dato che il
 * dispositivo dell'utente fornisce PA direttamente).
 */
export function crossCheckPhaseAngle(
  m: RawMeasurement,
  toleranceDeg = 0.2
): { computed: number; device?: number; withinTolerance: boolean | null } {
  const computed = phaseAngleDeg(m.R, m.Xc);
  if (m.phaseAngleDevice === undefined) {
    return { computed, device: undefined, withinTolerance: null };
  }
  const diff = Math.abs(computed - m.phaseAngleDevice);
  return {
    computed,
    device: m.phaseAngleDevice,
    withinTolerance: diff <= toleranceDeg,
  };
}

// ---------------------------------------------------------------------
// Geometria delle ellissi di tolleranza (Piccoli & Pastori 2002, Eq. 1a/2a)
// ---------------------------------------------------------------------

/**
 * Valore critico F(alpha; d1=2, d2=m) in forma chiusa esatta.
 *
 * Per d1=2, la CDF di F(2,m) ha forma chiusa:
 *   CDF(x) = 1 - (1 + 2x/m)^(-m/2)
 * Invertendo per il valore critico superiore F_alpha (P(F > F_alpha) = alpha):
 *   F_alpha = (m/2) * (alpha^(-2/m) - 1)
 *
 * Verifica asintotica (m -> infinito): F_alpha -> -ln(alpha), che coincide
 * con chi-quadro_inv(1-alpha, 2)/2, il limite noto per F(2, m) con m grande.
 */
function criticalFValueD1Eq2(alpha: number, m: number): number {
  if (m <= 2) throw new Error("Numerosità campionaria insufficiente (n <= 4)");
  return (m / 2) * (Math.pow(alpha, -2 / m) - 1);
}

function alphaForPercentile(percentile: 50 | 75 | 95): number {
  // Convenzione della fonte primaria: alpha = 0.05, 0.25, 0.50 per il
  // percentile 95°, 75°, 50° rispettivamente.
  if (percentile === 95) return 0.05;
  if (percentile === 75) return 0.25;
  return 0.5;
}

/**
 * Calcola la geometria dell'ellisse di TOLLERANZA (per vettori individuali)
 * al percentile richiesto, per una data popolazione di riferimento.
 *
 * Traduzione letterale di Eq. 1a e 2a della fonte primaria:
 *   K = F(n+1) / [n(n-2)]                         (tolleranza)
 *   L1,L2 = K * sqrt( (n-1)(sx²+sy²) ± sqrt(...) )
 *   b1,b2 = pendenze degli assi principali
 */
export function toleranceEllipse(
  pop: ReferencePopulation,
  percentile: 50 | 75 | 95
): EllipseGeometry {
  const { n, sdRH: sx, sdXcH: sy, r } = pop;
  const m = n - 2;
  const alpha = alphaForPercentile(percentile);
  const F = criticalFValueD1Eq2(alpha, m);
  const K = (F * (n + 1)) / (n * (n - 2));

  const sx2 = sx * sx;
  const sy2 = sy * sy;
  const A = (n - 1) * (sx2 + sy2);
  const discriminant =
    A * A - 4 * (n - 1) * (n - 1) * (1 - r * r) * sx2 * sy2;
  const sqrtDisc = Math.sqrt(Math.max(discriminant, 0));

  const L1 = K * Math.sqrt(A + sqrtDisc);
  const L2 = K * Math.sqrt(A - sqrtDisc);

  // Pendenza dell'asse principale (Eq. 2a)
  const term = (sy2 - sx2) / (2 * r * sx * sy);
  const b1 = term + Math.sqrt(1 + term * term);
  const rotationDeg = Math.atan(b1) * (180 / Math.PI);

  return {
    percentile,
    centerRH: pop.meanRH,
    centerXcH: pop.meanXcH,
    semiAxisMajor: Math.max(L1, L2),
    semiAxisMinor: Math.min(L1, L2),
    rotationDeg,
  };
}

/**
 * Calcola la geometria dell'ellisse di CONFIDENZA (per il vettore medio di
 * un gruppo di soggetti, non per un singolo individuo). Stesse equazioni,
 * ma K = F / [n(n-2)] (senza il fattore (n+1), Piccoli & Pastori 2002).
 */
export function confidenceEllipse(
  pop: ReferencePopulation,
  alphaLevel = 0.05
): EllipseGeometry {
  const { n, sdRH: sx, sdXcH: sy, r } = pop;
  const m = n - 2;
  const F = criticalFValueD1Eq2(alphaLevel, m);
  const K = F / (n * (n - 2));

  const sx2 = sx * sx;
  const sy2 = sy * sy;
  const A = (n - 1) * (sx2 + sy2);
  const discriminant =
    A * A - 4 * (n - 1) * (n - 1) * (1 - r * r) * sx2 * sy2;
  const sqrtDisc = Math.sqrt(Math.max(discriminant, 0));

  const L1 = K * Math.sqrt(A + sqrtDisc);
  const L2 = K * Math.sqrt(A - sqrtDisc);
  const term = (sy2 - sx2) / (2 * r * sx * sy);
  const b1 = term + Math.sqrt(1 + term * term);
  const rotationDeg = Math.atan(b1) * (180 / Math.PI);

  return {
    percentile: 95,
    centerRH: pop.meanRH,
    centerXcH: pop.meanXcH,
    semiAxisMajor: Math.max(L1, L2),
    semiAxisMinor: Math.min(L1, L2),
    rotationDeg,
  };
}

// ---------------------------------------------------------------------
// Z-score bivariato (RXc-score graph) — Eq. 1b/2b della fonte primaria
// ---------------------------------------------------------------------

export interface BivariateZScore {
  zRH: number;
  zXcH: number;
}

/** Trasforma un vettore individuale in Z-score bivariato rispetto a una popolazione. */
export function toBivariateZScore(
  v: NormalizedVector,
  pop: ReferencePopulation
): BivariateZScore {
  return {
    zRH: (v.RH - pop.meanRH) / pop.sdRH,
    zXcH: (v.XcH - pop.meanXcH) / pop.sdXcH,
  };
}

/**
 * Geometria dell'ellisse di tolleranza sul piano Z-score standardizzato.
 * Per costruzione ha assi a ±45° (Eq. 2b: b1,b2 = ±1) e semiassi da Eq. 1b:
 *   L1,L2 = K * sqrt( 2(n-1) ± 2r(n-1) )
 */
export function toleranceEllipseZScore(
  pop: ReferencePopulation,
  percentile: 50 | 75 | 95
): EllipseGeometry {
  const { n, r } = pop;
  const m = n - 2;
  const alpha = alphaForPercentile(percentile);
  const F = criticalFValueD1Eq2(alpha, m);
  const K = (F * (n + 1)) / (n * (n - 2));

  const L1 = K * Math.sqrt(2 * (n - 1) + 2 * r * (n - 1));
  const L2 = K * Math.sqrt(2 * (n - 1) - 2 * r * (n - 1));

  return {
    percentile,
    centerRH: 0,
    centerXcH: 0,
    semiAxisMajor: Math.max(L1, L2),
    semiAxisMinor: Math.min(L1, L2),
    rotationDeg: 45,
  };
}

// ---------------------------------------------------------------------
// Posizione rispetto alle ellissi e classificazione a 7 zone (pattern Piccoli)
// ---------------------------------------------------------------------

export type BivaPattern =
  | "normale"
  | "disidratazione"
  | "iperidratazione-edema"
  | "massa-cellulare-aumentata"
  | "massa-cellulare-ridotta"
  | "disidratazione-massa-aumentata"
  | "iperidratazione-massa-ridotta";

/**
 * Determina se un punto (RH, XcH) è dentro un'ellisse ruotata, e la sua
 * "distanza" normalizzata (1.0 = esattamente sul bordo dell'ellisse).
 */
function pointEllipseDistance(
  RH: number,
  XcH: number,
  e: EllipseGeometry
): number {
  const dx = RH - e.centerRH;
  const dy = XcH - e.centerXcH;
  const theta = (e.rotationDeg * Math.PI) / 180;
  // Ruota il punto nel sistema di riferimento degli assi dell'ellisse
  const xRot = dx * Math.cos(theta) + dy * Math.sin(theta);
  const yRot = -dx * Math.sin(theta) + dy * Math.cos(theta);
  return Math.sqrt(
    (xRot * xRot) / (e.semiAxisMajor * e.semiAxisMajor) +
      (yRot * yRot) / (e.semiAxisMinor * e.semiAxisMinor)
  );
}

export interface BivaClassification {
  pattern: BivaPattern;
  withinEllipse50: boolean;
  withinEllipse75: boolean;
  withinEllipse95: boolean;
  distanceFromCenter95: number; // 1.0 = sul bordo della 95%
}

/**
 * Classifica un vettore rispetto alla popolazione di riferimento, secondo
 * la logica del pattern Piccoli: l'asse maggiore descrive l'idratazione,
 * l'asse minore la massa cellulare/tessuti molli (Piccoli & Pastori 2002).
 */
export function classifyVector(
  v: NormalizedVector,
  pop: ReferencePopulation
): BivaClassification {
  const e50 = toleranceEllipse(pop, 50);
  const e75 = toleranceEllipse(pop, 75);
  const e95 = toleranceEllipse(pop, 95);

  const d50 = pointEllipseDistance(v.RH, v.XcH, e50);
  const d75 = pointEllipseDistance(v.RH, v.XcH, e75);
  const d95 = pointEllipseDistance(v.RH, v.XcH, e95);

  const withinEllipse50 = d50 <= 1;
  const withinEllipse75 = d75 <= 1;
  const withinEllipse95 = d95 <= 1;

  // Proiezione sugli assi maggiore/minore rispetto al centro, per capire
  // la direzione dello spostamento (idratazione vs massa cellulare).
  const dx = v.RH - pop.meanRH;
  const dy = v.XcH - pop.meanXcH;
  const theta = (e95.rotationDeg * Math.PI) / 180;
  const majorAxisProjection = dx * Math.cos(theta) + dy * Math.sin(theta);
  const minorAxisProjection = -dx * Math.sin(theta) + dy * Math.cos(theta);

  let pattern: BivaPattern = "normale";
  if (!withinEllipse75) {
    const hydrationShift = majorAxisProjection > 0; // verso il polo superiore = disidratazione
    const cellMassShift = minorAxisProjection > 0; // verso sinistra (asse minore +) = più massa cellulare

    if (Math.abs(majorAxisProjection) > Math.abs(minorAxisProjection) * 2) {
      pattern = hydrationShift ? "disidratazione" : "iperidratazione-edema";
    } else if (Math.abs(minorAxisProjection) > Math.abs(majorAxisProjection) * 2) {
      pattern = cellMassShift
        ? "massa-cellulare-aumentata"
        : "massa-cellulare-ridotta";
    } else {
      pattern =
        hydrationShift && cellMassShift
          ? "disidratazione-massa-aumentata"
          : "iperidratazione-massa-ridotta";
    }
  }

  return {
    pattern,
    withinEllipse50,
    withinEllipse75,
    withinEllipse95,
    distanceFromCenter95: d95,
  };
}

// ---------------------------------------------------------------------
// Migrazione vettoriale (follow-up longitudinale)
// ---------------------------------------------------------------------

export interface VectorDisplacement {
  dRH: number;
  dXcH: number;
  distanceOhmPerM: number;
}

/** Calcola lo spostamento del vettore tra due misurazioni dello stesso paziente. */
export function vectorDisplacement(
  from: NormalizedVector,
  to: NormalizedVector
): VectorDisplacement {
  const dRH = to.RH - from.RH;
  const dXcH = to.XcH - from.XcH;
  return { dRH, dXcH, distanceOhmPerM: Math.sqrt(dRH * dRH + dXcH * dXcH) };
}
