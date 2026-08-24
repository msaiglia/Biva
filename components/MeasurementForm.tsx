"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import RangeBar from "@/components/RangeBar";
import { ffmiRange, fmiRange, tbwPercentRange, bmiRange, bmiCategory } from "@/lib/reference-ranges";
import {
  normalizeClassic,
  computeSpecificVector,
  hasSpecificData,
  toleranceEllipse,
  classifyVector,
  phaseAngleDeg,
  computeBodyComposition,
  type ReferencePopulation,
  type Vector2D,
  type BivaMethod,
} from "@/lib/biva-engine";

interface PopulationDTO {
  id: string;
  code: string;
  label: string;
  sex: string;
  method: string;
  category: string;
  n: number;
  meanX: number;
  sdX: number;
  meanY: number;
  sdY: number;
  correlationR: number;
  sourceCitation: string;
  sourceDOI: string | null;
  pubmedVerified: boolean;
}

function toEnginePop(p: PopulationDTO): ReferencePopulation {
  return {
    code: p.code,
    label: p.label,
    sex: p.sex as "M" | "F",
    method: p.method as BivaMethod,
    n: p.n,
    meanX: p.meanX,
    sdX: p.sdX,
    meanY: p.meanY,
    sdY: p.sdY,
    r: p.correlationR,
    sourceCitation: p.sourceCitation,
    sourceDOI: p.sourceDOI ?? undefined,
    pubmedVerified: p.pubmedVerified,
  };
}

const PATTERN_LABELS: Record<string, string> = {
  normale: "Normale",
  disidratazione: "Disidratazione",
  "iperidratazione-edema": "Iperidratazione / edema",
  "massa-cellulare-aumentata": "Massa cellulare aumentata",
  "massa-cellulare-ridotta": "Massa cellulare ridotta",
  "disidratazione-massa-aumentata": "Disidratazione + massa aumentata",
  "iperidratazione-massa-ridotta": "Iperidratazione + massa ridotta",
};

interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  sex: string;
}

interface ExistingMeasurement {
  id: string;
  measuredAt: string;
  heightCm: number;
  weightKg: number | null;
  resistanceOhm: number;
  reactanceOhm: number;
  phaseAngleDevice: number | null;
  armCircumferenceCm: number | null;
  waistCircumferenceCm: number | null;
  calfCircumferenceCm: number | null;
  referencePopulationId: string;
}

export default function MeasurementForm({
  populations,
  patient,
  existingMeasurement,
}: {
  populations: PopulationDTO[];
  patient?: PatientInfo | null;
  existingMeasurement?: ExistingMeasurement | null;
}) {
  const isEditing = !!existingMeasurement;
  const [sex, setSex] = useState<"M" | "F">((patient?.sex as "M" | "F") || "M");
  const [R, setR] = useState(existingMeasurement?.resistanceOhm ?? 500);
  const [Xc, setXc] = useState(existingMeasurement?.reactanceOhm ?? 55);
  const [measuredAt, setMeasuredAt] = useState(existingMeasurement?.measuredAt ?? (() => new Date().toISOString().slice(0, 10))());
  const [heightCm, setHeightCm] = useState(existingMeasurement?.heightCm ?? 170);
  const [weightKg, setWeightKg] = useState<string>(existingMeasurement?.weightKg ? String(existingMeasurement.weightKg) : "");
  const [age, setAge] = useState<string>("40");
  const [phaseAngleDevice, setPhaseAngleDevice] = useState<string>(existingMeasurement?.phaseAngleDevice ? String(existingMeasurement.phaseAngleDevice) : "");
  const [showSpecific, setShowSpecific] = useState(!!existingMeasurement?.armCircumferenceCm);
  const [armCm, setArmCm] = useState<string>(existingMeasurement?.armCircumferenceCm ? String(existingMeasurement.armCircumferenceCm) : "");
  const [waistCm, setWaistCm] = useState<string>(existingMeasurement?.waistCircumferenceCm ? String(existingMeasurement.waistCircumferenceCm) : "");
  const [calfCm, setCalfCm] = useState<string>(existingMeasurement?.calfCircumferenceCm ? String(existingMeasurement.calfCircumferenceCm) : "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const classicPops = useMemo(
    () => populations.filter((p) => p.method === "classic" && p.sex === sex),
    [populations, sex]
  );
  const specificPops = useMemo(
    () => populations.filter((p) => p.method === "specific" && p.sex === sex),
    [populations, sex]
  );

  const [classicPopCode, setClassicPopCode] = useState<string>(() => {
    if (existingMeasurement) {
      return populations.find((p) => p.id === existingMeasurement.referencePopulationId)?.code || "";
    }
    return "";
  });
  const [specificPopCode, setSpecificPopCode] = useState<string>("");

  // Preferenza di default: i riferimenti più aggiornati e con la
  // numerosità campionaria maggiore, non il primo in ordine alfabetico.
  const PREFERRED_CLASSIC = ["CAMPA_2023_M", "CAMPA_2023_F"];
  const PREFERRED_SPECIFIC = [
    "BUFFA_2013_SPECIFIC_US_M",
    "IBANEZ_2015_SPECIFIC_YOUNG_ITES_F",
  ];

  function pickDefault(pops: PopulationDTO[], preferred: string[]): string {
    const found = pops.find((p) => preferred.includes(p.code));
    return found?.code ?? pops[0]?.code ?? "";
  }

  const activeClassicCode = classicPopCode || pickDefault(classicPops, PREFERRED_CLASSIC);
  const activeSpecificCode = specificPopCode || pickDefault(specificPops, PREFERRED_SPECIFIC);

  const classicPopDTO = classicPops.find((p) => p.code === activeClassicCode);
  const specificPopDTO = specificPops.find((p) => p.code === activeSpecificCode);

  const raw = {
    R,
    Xc,
    heightCm,
    phaseAngleDevice: phaseAngleDevice ? Number(phaseAngleDevice) : undefined,
    armCircumferenceCm: armCm ? Number(armCm) : undefined,
    waistCircumferenceCm: waistCm ? Number(waistCm) : undefined,
    calfCircumferenceCm: calfCm ? Number(calfCm) : undefined,
  };

  const pa = phaseAngleDeg(R, Xc);
  const vClassic = useMemo(() => normalizeClassic(raw), [R, Xc, heightCm]);
  const specificAvailable = hasSpecificData(raw);
  const specVector = useMemo(
    () =>
      specificAvailable
        ? computeSpecificVector(R, Xc, heightCm, raw.armCircumferenceCm!, raw.waistCircumferenceCm!, raw.calfCircumferenceCm!)
        : null,
    [R, Xc, heightCm, armCm, waistCm, calfCm]
  );

  const router = useRouter();

  async function handleSave() {
    if (!patient || !classicPopDTO) return;
    setSaveStatus("saving");
    setSaveError("");
    try {
      const url = isEditing ? `/api/misurazioni/${existingMeasurement!.id}` : "/api/misurazioni";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          measuredAt,
          heightCm,
          weightKg: weightKg ? Number(weightKg) : undefined,
          resistanceOhm: R,
          reactanceOhm: Xc,
          phaseAngleDevice: phaseAngleDevice ? Number(phaseAngleDevice) : undefined,
          armCircumferenceCm: armCm ? Number(armCm) : undefined,
          waistCircumferenceCm: waistCm ? Number(waistCm) : undefined,
          calfCircumferenceCm: calfCm ? Number(calfCm) : undefined,
          referencePopulationId: classicPops.find((p) => p.code === activeClassicCode)?.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Errore durante il salvataggio.");
        setSaveStatus("error");
        return;
      }
      setSaveStatus("saved");
      if (isEditing) {
        setTimeout(() => router.push(`/pazienti/${patient.id}`), 700);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
      setSaveStatus("error");
    }
  }

  return (
    <AppShell>
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 60px", color: "#2a2a28", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
      <div className="responsive-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8578", marginBottom: 6 }}>
            {patient
              ? `${isEditing ? "Modifica misurazione" : "Misurazione"} per ${patient.lastName} ${patient.firstName}`
              : "Calcolatore — nessun paziente collegato"}
          </div>
          <h1 style={{ fontSize: 26, marginBottom: 28 }}>{isEditing ? "Modifica misurazione" : "Misurazione BIVA"}</h1>
        </div>
        {patient && (
          <div style={{ textAlign: "right" }}>
            <button onClick={handleSave} disabled={saveStatus === "saving"} style={saveButtonStyle}>
              {saveStatus === "saving" ? "Salvataggio..." : isEditing ? "Salva modifiche" : "Salva misurazione"}
            </button>
            {saveStatus === "saved" && <div style={{ fontSize: 12, color: "#3d7a5c", marginTop: 6 }}>✓ Salvata{isEditing ? ", torno alla scheda paziente..." : ""}</div>}
            {saveStatus === "error" && <div style={{ fontSize: 12, color: "#b23a3a", marginTop: 6 }}>{saveError}</div>}
          </div>
        )}
      </div>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32, alignItems: "start" }}>
        {/* --- Colonna sinistra: form --- */}
        <div>
          <Section title="Dati paziente">
            <FieldRow label="Sesso">
              <div style={{ display: "flex", gap: 8 }}>
                <SexButton active={sex === "M"} onClick={() => setSex("M")}>Uomo</SexButton>
                <SexButton active={sex === "F"} onClick={() => setSex("F")}>Donna</SexButton>
              </div>
            </FieldRow>
            <FieldRow label="Altezza (cm)">
              <input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} style={inputStyle} />
            </FieldRow>
            <FieldRow label="Peso (kg) — opzionale">
              <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} style={inputStyle} placeholder="es. 75" />
            </FieldRow>
            <FieldRow label="Età (anni) — per i range di riferimento">
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} placeholder="es. 40" />
            </FieldRow>
          </Section>

          <Section title="Misurazione bioimpedenziometrica">
            <FieldRow label="Data del rilevamento">
              <input type="date" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} style={inputStyle} max={new Date().toISOString().slice(0, 10)} />
            </FieldRow>
            <FieldRow label="Resistenza R (Ω)">
              <input type="number" value={R} onChange={(e) => setR(Number(e.target.value))} style={inputStyle} />
            </FieldRow>
            <FieldRow label="Reattanza Xc (Ω)">
              <input type="number" value={Xc} onChange={(e) => setXc(Number(e.target.value))} style={inputStyle} />
            </FieldRow>
            <FieldRow label="Angolo di fase da dispositivo (°) — opzionale">
              <input type="number" value={phaseAngleDevice} onChange={(e) => setPhaseAngleDevice(e.target.value)} style={inputStyle} placeholder={pa.toFixed(2)} />
            </FieldRow>
          </Section>

          <Section title="Popolazione di riferimento — classica">
            <select value={activeClassicCode} onChange={(e) => setClassicPopCode(e.target.value)} style={inputStyle}>
              {classicPops.map((p) => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
            {classicPops.length === 0 && (
              <div style={{ fontSize: 12, color: "#b23a3a", marginTop: 6 }}>
                Nessuna popolazione classica per questo sesso.
              </div>
            )}
          </Section>

          <Section title="BIVA specifica (opzionale)">
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: showSpecific ? 12 : 0, cursor: "pointer" }}>
              <input type="checkbox" checked={showSpecific} onChange={(e) => setShowSpecific(e.target.checked)} />
              Aggiungi circonferenze per correggere l&apos;effetto &quot;spessore&quot; corporeo
            </label>
            {showSpecific && (
              <>
                <div style={{ fontSize: 12, color: "#8a8578", marginBottom: 10, lineHeight: 1.5 }}>
                  Corregge l&apos;artefatto per cui un soggetto più voluminoso (muscoloso o con più massa grassa) risulta con resistenza più bassa a parità di reale idratazione cellulare (Buffa &amp; Marini 2013).
                </div>
                <FieldRow label="Circonferenza braccio (cm)">
                  <input type="number" value={armCm} onChange={(e) => setArmCm(e.target.value)} style={inputStyle} placeholder="es. 28" />
                </FieldRow>
                <FieldRow label="Circonferenza vita (cm)">
                  <input type="number" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} style={inputStyle} placeholder="es. 85" />
                </FieldRow>
                <FieldRow label="Circonferenza polpaccio (cm)">
                  <input type="number" value={calfCm} onChange={(e) => setCalfCm(e.target.value)} style={inputStyle} placeholder="es. 36" />
                </FieldRow>
                {specificAvailable && (
                  <div style={{ marginTop: 10 }}>
                    <select value={activeSpecificCode} onChange={(e) => setSpecificPopCode(e.target.value)} style={inputStyle}>
                      {specificPops.map((p) => (
                        <option key={p.code} value={p.code}>{p.label}</option>
                      ))}
                    </select>
                    {specificPops.length === 0 && (
                      <div style={{ fontSize: 12, color: "#b23a3a", marginTop: 6 }}>
                        Nessuna popolazione specifica per questo sesso.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </Section>
        </div>

        {/* --- Colonna destra: grafici e risultati --- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {classicPopDTO ? (
            <GraphPanel
              title="BIVA classica — R/H, Xc/H"
              subtitle={classicPopDTO.label}
              unit="Ω/m"
              pop={toEnginePop(classicPopDTO)}
              vector={vClassic}
            />
          ) : (
            <EmptyPanel text="Seleziona una popolazione classica per vedere il grafico." />
          )}

          {showSpecific && specificAvailable && specVector && specificPopDTO && (
            <GraphPanel
              title="BIVA specifica — Rsp, Xcsp"
              subtitle={specificPopDTO.label}
              unit="Ω·cm"
              pop={toEnginePop(specificPopDTO)}
              vector={{ x: specVector.Rsp, y: specVector.Xcsp }}
              extraInfo={`Area corporea stimata: ${specVector.totalAreaCm2.toFixed(1)} cm² · Zsp: ${specVector.Zsp.toFixed(1)} Ω·cm`}
            />
          )}

          {showSpecific && !specificAvailable && (
            <EmptyPanel text="Inserisci tutte e tre le circonferenze (braccio, vita, polpaccio) per vedere il grafico della BIVA specifica." />
          )}

          {weightKg ? (
            <BodyCompositionPanel R={R} Xc={Xc} heightCm={heightCm} weightKg={Number(weightKg)} sex={sex} ageYears={Number(age) || 40} />
          ) : (
            <EmptyPanel text="Inserisci il peso corporeo per vedere le stime quantitative (TBW, FFM, FM, ECW, ICW)." />
          )}

          <div style={{ fontSize: 13, color: "#8a8578", padding: "12px 16px", background: "#f5f3ee", borderRadius: 3 }}>
            Angolo di fase calcolato: <strong style={{ color: "#2a2a28" }}>{pa.toFixed(2)}°</strong>
            {phaseAngleDevice && Math.abs(Number(phaseAngleDevice) - pa) > 0.2 && (
              <span style={{ color: "#c15a2e" }}> — differisce da quello del dispositivo ({phaseAngleDevice}°) di oltre 0.2°, controlla i dati inseriti.</span>
            )}
          </div>
        </div>
      </div>
    </main>
    </AppShell>
  );
}

// -----------------------------------------------------------------------
// Pannello stime quantitative (TBW, FFM, FM, ECW, ICW)
// -----------------------------------------------------------------------

function BodyCompositionPanel({
  R,
  Xc,
  heightCm,
  weightKg,
  sex,
  ageYears,
}: {
  R: number;
  Xc: number;
  heightCm: number;
  weightKg: number;
  sex: "M" | "F";
  ageYears: number;
}) {
  const [refMode, setRefMode] = useState<"altezza" | "peso">("altezza");
  const bc = useMemo(
    () => computeBodyComposition(R, Xc, heightCm, weightKg, sex),
    [R, Xc, heightCm, weightKg, sex]
  );
  const heightM = heightCm / 100;

  function formatRef(valueKgOrL: number, unit: "kg" | "L"): string {
    if (refMode === "altezza") {
      return `${(valueKgOrL / heightM).toFixed(1)} ${unit}/m`;
    }
    return `${((valueKgOrL / weightKg) * 100).toFixed(1)} %`;
  }

  const ffmi = bc.ffmKg / (heightM * heightM);
  const fmi = bc.fmKg / (heightM * heightM);
  const tbwPercent = (bc.tbwL / weightKg) * 100;
  const bmi = weightKg / (heightM * heightM);

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e2d8", borderRadius: 4, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Stime quantitative</div>
        <div style={{ display: "flex", gap: 6 }}>
          <ToggleButton active={refMode === "altezza"} onClick={() => setRefMode("altezza")}>Riferimenti su altezza</ToggleButton>
          <ToggleButton active={refMode === "peso"} onClick={() => setRefMode("peso")}>Riferimenti su peso (%)</ToggleButton>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "6px 16px", fontSize: 13, alignItems: "center", marginBottom: 20 }}>
        <HeaderRow />
        <BcRow label="Indice di Massa Corporea (BMI)" value={`${bmi.toFixed(1)} kg/m²`} ref={bmiCategory(bmi)} />
        <BcRow label="Acqua Totale (TBW)" value={`${bc.tbwL.toFixed(1)} l`} ref={formatRef(bc.tbwL, "L")} />
        <BcRow
          label="Acqua Extracellulare (ECW)"
          value={`${bc.ecwL.toFixed(1)} l`}
          ref={`${bc.ecwToTbwPercent.toFixed(0)}% del TBW`}
        />
        <BcRow
          label="Acqua Intracellulare (ICW)"
          value={`${bc.icwL.toFixed(1)} l`}
          ref={`${bc.icwToTbwPercent.toFixed(0)}% del TBW`}
        />
        <BcRow label="Massa Magra (FFM)" value={`${bc.ffmKg.toFixed(1)} kg`} ref={formatRef(bc.ffmKg, "kg")} />
        <BcRow label="Massa Grassa (FM)" value={`${bc.fmKg.toFixed(1)} kg`} ref={formatRef(bc.fmKg, "kg")} />
        <BcRow label="Massa Cellulare (BCM)" value={`${bc.bcmKg.toFixed(1)} kg`} ref={formatRef(bc.bcmKg, "kg")} />
      </div>

      <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a8578", marginBottom: 14, borderTop: "1px solid #eeece5", paddingTop: 14 }}>
        Posizione rispetto a range di riferimento pubblicati
      </div>

      <RangeBar label="Indice di Massa Corporea (BMI)" value={bmi} unit="kg/m²" zones={bmiRange()} />
      <RangeBar label="Indice Massa Magra (FFMI)" value={ffmi} unit="kg/m²" zones={ffmiRange(sex)} />
      <RangeBar label="Indice Massa Grassa (FMI)" value={fmi} unit="kg/m²" zones={fmiRange(sex, ageYears)} />
      <RangeBar label="Acqua Totale (% peso corporeo)" value={tbwPercent} unit="%" zones={tbwPercentRange()} />

      <div style={{ fontSize: 11, color: "#8a8578", marginTop: 4, marginBottom: 16, padding: "10px 12px", background: "#f7f9fa", borderRadius: 4 }}>
        <strong>ECW, ICW e BCM non hanno zone colorate.</strong> Per ECW/ICW disponiamo solo di un rapporto medio di popolazione
        (Moissl et al. 2006), non di una distribuzione con percentili individualizzabili. Per il BCM, la revisione sistematica più
        recente (Kampo, Závodná &amp; Vondra, <em>Physiol Res</em> 2025, PMID 41511100) conferma una carenza di equazioni e range di
        riferimento validati in letteratura per questo parametro — non è un limite di questa app, è un gap riconosciuto nel campo.
      </div>

      <div style={{ fontSize: 11, color: "#8a8578", lineHeight: 1.6, borderTop: "1px solid #eeece5", paddingTop: 12 }}>
        <strong>Nota metodologica</strong> — a differenza del vettore BIVA sopra (nessuna equazione), questi sono
        <strong> valori stimati</strong> tramite equazioni di regressione pubblicate: TBW da Sun et al., <em>Am J Clin Nutr</em> 2003
        (DOI: 10.1093/ajcn/77.2.331); FFM derivata da TBW/0.73 (costante di idratazione, ESPEN/Kyle et al., <em>Clin Nutr</em> 2004,
        DOI: 10.1016/j.clnu.2004.06.004); FFMI/FMI da Coin et al., <em>Clin Nutr</em> 2008 (PMID 18206273, popolazione italiana).
        Software diversi (incluso il tuo dispositivo) possono dare numeri leggermente diversi a parità di R/Xc: è un limite noto
        della letteratura, non un errore.
      </div>
    </div>
  );
}

function HeaderRow() {
  return (
    <>
      <span></span>
      <span style={{ fontSize: 11, color: "#8a8578", textAlign: "right" }}>Valore</span>
      <span style={{ fontSize: 11, color: "#8a8578", textAlign: "right" }}>Riferimento</span>
    </>
  );
}

function BcRow({ label, value, ref }: { label: string; value: string; ref: string }) {
  return (
    <>
      <span style={{ color: "#5a564c" }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value}</span>
      <span style={{ color: "#8a8578", textAlign: "right" }}>{ref}</span>
    </>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 3,
        border: "1px solid #c9c5b8",
        background: active ? "#2a2a28" : "#fff",
        color: active ? "#fff" : "#5a564c",
        cursor: "pointer",
        fontSize: 11,
      }}
    >
      {children}
    </button>
  );
}

function GraphPanel({
  title,
  subtitle,
  unit,
  pop,
  vector,
  extraInfo,
}: {
  title: string;
  subtitle: string;
  unit: string;
  pop: ReferencePopulation;
  vector: Vector2D;
  extraInfo?: string;
}) {
  const ellipses = useMemo(() => [50, 75, 95].map((p) => toleranceEllipse(pop, p as 50 | 75 | 95)), [pop]);
  const classification = useMemo(() => classifyVector(vector, pop), [vector, pop]);

  const W = 460;
  const H = 440;
  const padding = 56;
  const e95 = ellipses[2];

  // Estensione reale dell'ellisse ruotata lungo ciascun asse (bounding box
  // esatto, non un'approssimazione) — è la chiave per range degli assi
  // proporzionati: R/H e Xc/H hanno naturalmente scale molto diverse
  // (l'ellisse è ~6-7 volte più "lunga" lungo R/H che lungo Xc/H), esattamente
  // come nei grafici Akern (Rz/H 100-600 vs Xc/H 10-60, rapporto ~10:1).
  // Usare lo stesso range su entrambi gli assi è ciò che schiacciava l'ellisse.
  const theta95 = (e95.rotationDeg * Math.PI) / 180;
  const extentX = Math.sqrt(
    e95.semiAxisMajor ** 2 * Math.cos(theta95) ** 2 + e95.semiAxisMinor ** 2 * Math.sin(theta95) ** 2
  );
  const extentY = Math.sqrt(
    e95.semiAxisMajor ** 2 * Math.sin(theta95) ** 2 + e95.semiAxisMinor ** 2 * Math.cos(theta95) ** 2
  );
  const margin = 1.25;

  let rMin = pop.meanX - extentX * margin;
  let rMax = pop.meanX + extentX * margin;
  let yMin = pop.meanY - extentY * margin;
  let yMax = pop.meanY + extentY * margin;
  // Se il vettore del paziente è un outlier fuori dall'ellisse al 95%,
  // allargo il range per tenerlo comunque visibile.
  if (vector.x < rMin) rMin = vector.x - extentX * 0.15;
  if (vector.x > rMax) rMax = vector.x + extentX * 0.15;
  if (vector.y < yMin) yMin = vector.y - extentY * 0.15;
  if (vector.y > yMax) yMax = vector.y + extentY * 0.15;

  const sx = (x: number) => padding + ((x - rMin) / (rMax - rMin)) * (W - 2 * padding);
  const sy = (y: number) => H - padding - ((y - yMin) / (yMax - yMin)) * (H - 2 * padding);

  // Campiono l'ellisse per punti (in coordinate dati, poi trasformati con
  // sx/sy) invece di usare il transform="rotate()" nativo di SVG: quel
  // trucco presuppone una scala uniforme fra i due assi, che qui NON
  // abbiamo (scaleX ≠ scaleY per costruzione) — con punti campionati la
  // forma resta geometricamente corretta qualunque sia il rapporto di scala.
  function ellipsePath(e: typeof e95): string {
    const th = (e.rotationDeg * Math.PI) / 180;
    const cosT = Math.cos(th);
    const sinT = Math.sin(th);
    const n = 72;
    let d = "";
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 2 * Math.PI;
      const localX = e.semiAxisMajor * Math.cos(t);
      const localY = e.semiAxisMinor * Math.sin(t);
      const dataX = e.centerX + localX * cosT - localY * sinT;
      const dataY = e.centerY + localX * sinT + localY * cosT;
      d += (i === 0 ? "M" : "L") + sx(dataX).toFixed(2) + "," + sy(dataY).toFixed(2) + " ";
    }
    return d + "Z";
  }

  const statusColor =
    classification.distanceFromCenter95 > 1
      ? "#b23a3a"
      : classification.pattern === "normale"
      ? "#3d7a5c"
      : "#b8873a";

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e2d8", borderRadius: 4, padding: 20 }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#8a8578" }}>{subtitle}</div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 12 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="responsive-svg" style={{ maxWidth: W, background: "#fafaf8", border: "1px solid #eeece5", borderRadius: 3 }}>
          <line x1={padding} y1={H - padding} x2={W - padding} y2={H - padding} stroke="#c9c5b8" />
          <line x1={padding} y1={padding} x2={padding} y2={H - padding} stroke="#c9c5b8" />
          <text x={W / 2} y={H - 18} fontSize="11" fill="#8a8578" textAnchor="middle">x ({unit})</text>
          <text x={18} y={H / 2} fontSize="11" fill="#8a8578" textAnchor="middle" transform={`rotate(-90 18 ${H / 2})`}>y ({unit})</text>

          {ellipses.map((e, i) => (
            <path
              key={e.percentile}
              d={ellipsePath(e)}
              fill="none"
              stroke={["#3d7a5c", "#b8873a", "#b23a3a"][i]}
              strokeWidth={i === 2 ? 1.8 : 1.3}
              strokeDasharray={i < 2 ? "4 3" : "none"}
            />
          ))}

          <circle cx={sx(pop.meanX)} cy={sy(pop.meanY)} r={2.5} fill="#6b6558" />
          <line x1={sx(pop.meanX)} y1={sy(pop.meanY)} x2={sx(vector.x)} y2={sy(vector.y)} stroke={statusColor} strokeWidth={1.2} opacity={0.6} />
          <circle cx={sx(vector.x)} cy={sy(vector.y)} r={6} fill={statusColor} stroke="#fff" strokeWidth={2} />
        </svg>

        <div style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
          <Row label="x" value={vector.x.toFixed(1) + " " + unit} />
          <Row label="y" value={vector.y.toFixed(1) + " " + unit} />
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                background: statusColor,
              }}
            >
              {PATTERN_LABELS[classification.pattern] ?? classification.pattern}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#8a8578" }}>
            {classification.withinEllipse50
              ? "Entro il 50%"
              : classification.withinEllipse75
              ? "Tra 50% e 75%"
              : classification.withinEllipse95
              ? "Tra 75% e 95%"
              : "Fuori dal 95%"}
          </div>
          {extraInfo && <div style={{ fontSize: 11, color: "#8a8578", marginTop: 8 }}>{extraInfo}</div>}
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div style={{ background: "#f5f3ee", border: "1px dashed #d8d4c8", borderRadius: 4, padding: 24, fontSize: 13, color: "#8a8578" }}>
      {text}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a8578", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 12, color: "#5a564c", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "#8a8578" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function SexButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 0",
        borderRadius: 3,
        border: "1px solid #c9c5b8",
        background: active ? "#2a2a28" : "#fff",
        color: active ? "#fff" : "#2a2a28",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}

const saveButtonStyle: React.CSSProperties = {
  padding: "9px 18px",
  borderRadius: 3,
  border: "none",
  background: "#3d7a5c",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #c9c5b8",
  borderRadius: 3,
  fontSize: 13,
  boxSizing: "border-box",
};
