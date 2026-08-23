/**
 * MOTORE DI CALCOLO BIVA (Bioelectrical Impedance Vector Analysis)
 * ==================================================================
 *
 * Supporta DUE metodi, con la STESSA geometria statistica (ellisse di
 * tolleranza) applicata a variabili diverse:
 *
 *  - CLASSICA (Piccoli 1994): normalizza solo per altezza.
 *      x = R/H, y = Xc/H, unità Ω/m.
 *      Fonte: Piccoli A, Rossi B, Pillon L, Bucciante G. "A new method
 *      for monitoring body fluid variation by bioimpedance analysis:
 *      the RXc graph." Kidney Int. 1994;46:534-539.
 *
 *  - SPECIFICA (Buffa & Marini 2013): corregge anche per la "sezione"
 *      corporea (peso/circonferenze), non solo la lunghezza — elimina
 *      l'artefatto per cui un soggetto fisicamente più voluminoso (più
 *      massa muscolare o più massa grassa) risulta con resistenza più
 *      bassa a parità di reale stato di idratazione cellulare.
 *      x = Rsp, y = Xcsp, unità Ω·cm.
 *      Fonte: Buffa R, Saragat B, Cabras S, Rinaldi AC, Marini E.
 *      "Accuracy of Specific BIVA for the Assessment of Body Composition
 *      in the United States Population." PLoS ONE. 2013;8(3):e58533.
 *      DOI: 10.1371/journal.pone.0058533 (open access)
 *
 * Le formule geometriche delle ellissi di tolleranza/confidenza sono
 * tradotte letteralmente dalle Equazioni 1a e 2a di:
 *   Piccoli A, Pastori G. "BIVA software." Univ. of Padova, 2002.
 *
 * NESSUN valore numerico di popolazione di riferimento (media, SD, r) è
 * hard-coded in questo file: quei dati vanno inseriti nel database
 * `ReferencePopulation` a partire da tabelle pubblicate e verificate
 * (vedi campo `sourceCitation` e `pubmedVerified`).
 */

// ---------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------

export type Sex = "M" | "F";
export type BivaMethod = "classic" | "specific";

/** Un punto generico sul piano (R/H,Xc/H) oppure (Rsp,Xcsp). */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Una popolazione di riferimento (un'ellisse), da tabelle pubblicate.
 *
 * I campi meanX/sdX/meanY/sdY sono generici perché la STESSA geometria
 * statistica si applica identica sia al metodo classico sia a quello
 * specifico — cambia solo cosa rappresentano i numeri, non la matematica.
 */
export interface ReferencePopulation {
  code: string;
  label: string; // es. "Adulti generali (Piccoli 1995)"
  sex: Sex;
  method: BivaMethod;
  n: number; // numerosità campionaria dello studio originale
  meanX: number; // media R/H (classico, Ω/m) o Rsp (specifico, Ω·cm)
  sdX: number;
  meanY: number; // media Xc/H (classico, Ω/m) o Xcsp (specifico, Ω·cm)
  sdY: number;
  r: number; // coefficiente di correlazione lineare
  sourceCitation: string; // citazione completa
  sourceDOI?: string;
  pubmedVerified: boolean; // true solo se verificato con PMID/indicizzazione PubMed
}

export interface RawMeasurement {
  R: number; // Ohm
  Xc: number; // Ohm
  heightCm: number;
  phaseAngleDevice?: number; // angolo di fase letto direttamente dal dispositivo, se disponibile
  // Opzionali, necessari solo per il calcolo BIVA specifica:
  armCircumferenceCm?: number;
  waistCircumferenceCm?: number;
  calfCircumferenceCm?: number;
}

export interface EllipseGeometry {
  percentile: 50 | 75 | 95;
  centerX: number;
  centerY: number;
  semiAxisMajor: number;
  semiAxisMinor: number;
  rotationDeg: number; // rotazione dell'asse maggiore rispetto all'asse x
}

// ---------------------------------------------------------------------
// BIVA CLASSICA — normalizzazione per altezza, angolo di fase
// ---------------------------------------------------------------------

/** Normalizza R e Xc per l'altezza (Ohm/m) — metodo classico. */
export function normalizeClassic(m: RawMeasurement): Vector2D {
  const heightM = m.heightCm / 100;
  if (heightM <= 0) throw new Error("Altezza non valida");
  return { x: m.R / heightM, y: m.Xc / heightM };
}

/** Angolo di fase in gradi: arctan(Xc/R) * 180/pi. Uguale per entrambi i metodi. */
export function phaseAngleDeg(R: number, Xc: number): number {
  return Math.atan(Xc / R) * (180 / Math.PI);
}

/** Modulo del vettore di impedenza |Z| = sqrt(R^2 + Xc^2). */
export function impedanceModulus(R: number, Xc: number): number {
  return Math.sqrt(R * R + Xc * Xc);
}

/**
 * Verifica incrociata tra l'angolo di fase calcolato e quello letto dal
 * dispositivo (utile come controllo qualità del dato).
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
// BIVA SPECIFICA — normalizzazione per "sezione" corporea (Buffa 2013)
// ---------------------------------------------------------------------

export interface SpecificVector {
  Rsp: number; // Ω·cm
  Xcsp: number; // Ω·cm
  Zsp: number; // Ω·cm, impedivity = sqrt(Rsp² + Xcsp²)
  totalAreaCm2: number; // per trasparenza/debug
}

/** Area di un segmento corporeo (braccio, vita o polpaccio) da circonferenza, in cm². */
function segmentArea(circumferenceCm: number): number {
  return (circumferenceCm * circumferenceCm) / (4 * Math.PI);
}

/**
 * Calcola i valori di resistività/reattività specifica (Rsp, Xcsp) da
 * R, Xc, altezza e le tre circonferenze corporee (braccio, vita, polpaccio).
 *   Rsp  = R  × (A / L),   Xcsp = Xc × (A / L)
 *   A (cm²) = 0.45·area_braccio + 0.10·area_vita + 0.45·area_polpaccio
 *   L (cm)  = 1.1 × statura
 */
export function computeSpecificVector(
  R: number,
  Xc: number,
  heightCm: number,
  armCircumferenceCm: number,
  waistCircumferenceCm: number,
  calfCircumferenceCm: number
): SpecificVector {
  const armArea = segmentArea(armCircumferenceCm);
  const waistArea = segmentArea(waistCircumferenceCm);
  const calfArea = segmentArea(calfCircumferenceCm);
  const totalAreaCm2 = 0.45 * armArea + 0.1 * waistArea + 0.45 * calfArea;
  const effectiveLengthCm = 1.1 * heightCm;
  const factor = totalAreaCm2 / effectiveLengthCm;

  const Rsp = R * factor;
  const Xcsp = Xc * factor;
  const Zsp = Math.sqrt(Rsp * Rsp + Xcsp * Xcsp);

  return { Rsp, Xcsp, Zsp, totalAreaCm2 };
}

/** True se la misurazione contiene tutti i dati necessari per la BIVA specifica. */
export function hasSpecificData(m: RawMeasurement): boolean {
  return (
    m.armCircumferenceCm !== undefined &&
    m.waistCircumferenceCm !== undefined &&
    m.calfCircumferenceCm !== undefined
  );
}

// ---------------------------------------------------------------------
// STIME QUANTITATIVE — TBW, FFM, FM, ECW, ICW
//
// A differenza del vettore BIVA (nessuna equazione, solo posizionamento
// statistico), queste sono stime derivate da equazioni di regressione
// pubblicate. Sono un metodo concettualmente diverso, con un proprio
// errore standard di stima intrinseco — due software diversi (es.
// questo strumento vs un dispositivo Akern con formule proprietarie)
// possono dare numeri assoluti leggermente diversi anche partendo dagli
// stessi R, Xc, altezza, peso: è un limite noto e documentato in
// letteratura, non un errore di calcolo.
//
// TBW (total body water): Sun SS, Chumlea WC, Heymsfield SB, et al.
// "Development of bioelectrical impedance analysis prediction equations
// for body composition with the use of a multicomponent model for use
// in epidemiologic surveys." Am J Clin Nutr. 2003;77:331-340.
// DOI: 10.1093/ajcn/77.2.331
//   Uomini: TBW = 1.203 + 0.449×(Ht²/R) + 0.176×peso   (SEE 3.8 L)
//   Donne:  TBW = 3.747 + 0.450×(Ht²/R) + 0.113×peso   (SEE 2.6 L)
//   (altezza in cm, R in Ω, peso in kg)
// Verificata in questa sessione contro 2 referti Akern reali forniti
// dall'utente: scarto di 1.1 L e 0.8 L rispetto al valore del dispositivo,
// ben entro l'errore standard pubblicato.
//
// FFM (massa magra): derivata da TBW tramite la costante di idratazione
// della massa magra (~73% negli adulti sani), citata nelle stesse linee
// guida ESPEN (Kyle UG, et al. "Bioelectrical impedance analysis—part I."
// Clin Nutr. 2004;23:1226-1243. DOI: 10.1016/j.clnu.2004.06.004) — scelta
// preferita rispetto a un'equazione di regressione diretta per FFM (es.
// Kyle 2001) perché nel test contro i referti reali ha dato risultati
// più vicini (1.7 kg e 0.6 kg di scarto, contro 4.5 kg dell'equazione
// diretta).
//
// ECW/ICW: la scomposizione individualizzata da un dispositivo a singola
// frequenza (50 kHz, come il tuo) ha un errore noto e documentato in
// letteratura (ESPEN: "SF-BIA... cannot determine differences in ICW").
// Non essendoci un'equazione R50/Xc50 verificabile con sufficiente
// affidabilità in questa sessione, uso un rapporto di popolazione medio
// (ECW ≈40%, ICW ≈60% del TBW), esplicitamente segnalato come
// approssimazione — non una stima individualizzata:
//   Moissl U, et al. Physiol Meas. 2006 (rapporto ECW/ICW fisiologico).
// Una BIS multi-frequenza darebbe una scomposizione più accurata.
// ---------------------------------------------------------------------

export interface BodyComposition {
  tbwL: number;
  ffmKg: number;
  fmKg: number;
  ecwL: number;
  icwL: number;
  ecwToTbwPercent: number; // quota di TBW, non del peso corporeo
  icwToTbwPercent: number;
}

export function computeBodyComposition(
  R: number,
  Xc: number,
  heightCm: number,
  weightKg: number,
  sex: Sex
): BodyComposition {
  const ht2R = (heightCm * heightCm) / R;
  const tbwL =
    sex === "M"
      ? 1.203 + 0.449 * ht2R + 0.176 * weightKg
      : 3.747 + 0.45 * ht2R + 0.113 * weightKg;

  const HYDRATION_CONSTANT = 0.73; // ESPEN: idratazione media della FFM negli adulti sani
  const ffmKg = tbwL / HYDRATION_CONSTANT;
  const fmKg = weightKg - ffmKg;

  const ECW_TBW_RATIO = 0.4; // Moissl et al. 2006 — rapporto medio di popolazione
  const ecwL = tbwL * ECW_TBW_RATIO;
  const icwL = tbwL * (1 - ECW_TBW_RATIO);

  return {
    tbwL,
    ffmKg,
    fmKg,
    ecwL,
    icwL,
    ecwToTbwPercent: ECW_TBW_RATIO * 100,
    icwToTbwPercent: (1 - ECW_TBW_RATIO) * 100,
  };
}

// ---------------------------------------------------------------------
// Geometria delle ellissi di tolleranza (Piccoli & Pastori 2002, Eq. 1a/2a)
// Identica per entrambi i metodi: opera sui campi generici meanX/sdX/meanY/sdY.
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
 *   L1,L2 = sqrt( K * [ (n-1)(sx²+sy²) ± sqrt(...) ] )
 *   b1,b2 = pendenze degli assi principali
 *
 * NOTA sul fix: la radice quadrata va sull'INTERO prodotto K*(...), non
 * solo sulla parentesi interna — verificato numericamente contro il
 * comportamento asintotico atteso (l'ellisse di tolleranza deve
 * convergere a un valore costante al crescere di n, non tendere a zero).
 */
export function toleranceEllipse(
  pop: ReferencePopulation,
  percentile: 50 | 75 | 95
): EllipseGeometry {
  const { n, sdX: sx, sdY: sy, r } = pop;
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

  const L1 = Math.sqrt(K * (A + sqrtDisc));
  const L2 = Math.sqrt(K * (A - sqrtDisc));

  const term = (sy2 - sx2) / (2 * r * sx * sy);
  const b1 = term + Math.sqrt(1 + term * term);
  const rotationDeg = Math.atan(b1) * (180 / Math.PI);

  return {
    percentile,
    centerX: pop.meanX,
    centerY: pop.meanY,
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
  const { n, sdX: sx, sdY: sy, r } = pop;
  const m = n - 2;
  const F = criticalFValueD1Eq2(alphaLevel, m);
  const K = F / (n * (n - 2));

  const sx2 = sx * sx;
  const sy2 = sy * sy;
  const A = (n - 1) * (sx2 + sy2);
  const discriminant =
    A * A - 4 * (n - 1) * (n - 1) * (1 - r * r) * sx2 * sy2;
  const sqrtDisc = Math.sqrt(Math.max(discriminant, 0));

  const L1 = Math.sqrt(K * (A + sqrtDisc));
  const L2 = Math.sqrt(K * (A - sqrtDisc));
  const term = (sy2 - sx2) / (2 * r * sx * sy);
  const b1 = term + Math.sqrt(1 + term * term);
  const rotationDeg = Math.atan(b1) * (180 / Math.PI);

  return {
    percentile: 95,
    centerX: pop.meanX,
    centerY: pop.meanY,
    semiAxisMajor: Math.max(L1, L2),
    semiAxisMinor: Math.min(L1, L2),
    rotationDeg,
  };
}

// ---------------------------------------------------------------------
// Z-score bivariato (RXc-score graph) — Eq. 1b/2b della fonte primaria
// ---------------------------------------------------------------------

/** Trasforma un vettore individuale in Z-score bivariato rispetto a una popolazione. */
export function toBivariateZScore(v: Vector2D, pop: ReferencePopulation): Vector2D {
  return {
    x: (v.x - pop.meanX) / pop.sdX,
    y: (v.y - pop.meanY) / pop.sdY,
  };
}

/**
 * Geometria dell'ellisse di tolleranza sul piano Z-score standardizzato.
 * Per costruzione ha assi a ±45° (Eq. 2b: b1,b2 = ±1) e semiassi da Eq. 1b:
 *   L1,L2 = sqrt( K * [ 2(n-1) ± 2r(n-1) ] )
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

  const L1 = Math.sqrt(K * (2 * (n - 1) + 2 * r * (n - 1)));
  const L2 = Math.sqrt(K * (2 * (n - 1) - 2 * r * (n - 1)));

  return {
    percentile,
    centerX: 0,
    centerY: 0,
    semiAxisMajor: Math.max(L1, L2),
    semiAxisMinor: Math.min(L1, L2),
    rotationDeg: 45,
  };
}

// ---------------------------------------------------------------------
// Posizione rispetto alle ellissi e classificazione a 7 zone (pattern Piccoli)
// Vale sia per il piano classico (R/H,Xc/H) sia per quello specifico
// (Rsp,Xcsp): l'interpretazione degli assi (idratazione / massa cellulare)
// è la stessa in entrambi i casi (Buffa & Marini 2013).
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
 * Determina se un punto è dentro un'ellisse ruotata, e la sua "distanza"
 * normalizzata (1.0 = esattamente sul bordo dell'ellisse).
 */
function pointEllipseDistance(v: Vector2D, e: EllipseGeometry): number {
  const dx = v.x - e.centerX;
  const dy = v.y - e.centerY;
  const theta = (e.rotationDeg * Math.PI) / 180;
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
 * l'asse minore la massa cellulare/tessuti molli.
 */
export function classifyVector(
  v: Vector2D,
  pop: ReferencePopulation
): BivaClassification {
  const e50 = toleranceEllipse(pop, 50);
  const e75 = toleranceEllipse(pop, 75);
  const e95 = toleranceEllipse(pop, 95);

  const d50 = pointEllipseDistance(v, e50);
  const d75 = pointEllipseDistance(v, e75);
  const d95 = pointEllipseDistance(v, e95);

  const withinEllipse50 = d50 <= 1;
  const withinEllipse75 = d75 <= 1;
  const withinEllipse95 = d95 <= 1;

  const dx = v.x - pop.meanX;
  const dy = v.y - pop.meanY;
  const theta = (e95.rotationDeg * Math.PI) / 180;
  const majorAxisProjection = dx * Math.cos(theta) + dy * Math.sin(theta);
  const minorAxisProjection = -dx * Math.sin(theta) + dy * Math.cos(theta);

  let pattern: BivaPattern = "normale";
  if (!withinEllipse75) {
    const hydrationShift = majorAxisProjection > 0;
    const cellMassShift = minorAxisProjection > 0;

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
  dx: number;
  dy: number;
  distance: number;
}

/** Calcola lo spostamento del vettore tra due misurazioni dello stesso paziente. */
export function vectorDisplacement(from: Vector2D, to: Vector2D): VectorDisplacement {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return { dx, dy, distance: Math.sqrt(dx * dx + dy * dy) };
}
