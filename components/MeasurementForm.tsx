"use client";

import { useMemo, useState } from "react";
import {
  normalizeClassic,
  computeSpecificVector,
  hasSpecificData,
  toleranceEllipse,
  classifyVector,
  phaseAngleDeg,
  type ReferencePopulation,
  type Vector2D,
  type BivaMethod,
} from "@/lib/biva-engine";

interface PopulationDTO {
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

export default function MeasurementForm({ populations }: { populations: PopulationDTO[] }) {
  const [sex, setSex] = useState<"M" | "F">("M");
  const [R, setR] = useState(500);
  const [Xc, setXc] = useState(55);
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState<string>("");
  const [phaseAngleDevice, setPhaseAngleDevice] = useState<string>("");
  const [showSpecific, setShowSpecific] = useState(false);
  const [armCm, setArmCm] = useState<string>("");
  const [waistCm, setWaistCm] = useState<string>("");
  const [calfCm, setCalfCm] = useState<string>("");

  const classicPops = useMemo(
    () => populations.filter((p) => p.method === "classic" && p.sex === sex),
    [populations, sex]
  );
  const specificPops = useMemo(
    () => populations.filter((p) => p.method === "specific" && p.sex === sex),
    [populations, sex]
  );

  const [classicPopCode, setClassicPopCode] = useState<string>("");
  const [specificPopCode, setSpecificPopCode] = useState<string>("");

  const activeClassicCode = classicPopCode || classicPops[0]?.code || "";
  const activeSpecificCode = specificPopCode || specificPops[0]?.code || "";

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

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", color: "#2a2a28", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8578", marginBottom: 6 }}>
        Fase 1 — MVP
      </div>
      <h1 style={{ fontSize: 26, marginBottom: 28 }}>Misurazione BIVA</h1>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32, alignItems: "start" }}>
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
          </Section>

          <Section title="Misurazione bioimpedenziometrica">
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

          <div style={{ fontSize: 13, color: "#8a8578", padding: "12px 16px", background: "#f5f3ee", borderRadius: 3 }}>
            Angolo di fase calcolato: <strong style={{ color: "#2a2a28" }}>{pa.toFixed(2)}°</strong>
            {phaseAngleDevice && Math.abs(Number(phaseAngleDevice) - pa) > 0.2 && (
              <span style={{ color: "#c15a2e" }}> — differisce da quello del dispositivo ({phaseAngleDevice}°) di oltre 0.2°, controlla i dati inseriti.</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// -----------------------------------------------------------------------
// Sottocomponenti
// -----------------------------------------------------------------------

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
        <svg width={W} height={H} style={{ background: "#fafaf8", border: "1px solid #eeece5", borderRadius: 3 }}>
          <line x1={padding} y1={H - padding} x2={W - padding} y2={H - padding} stroke="#c9c5b8" />
          <line x1={padding} y1={padding} x2={padding} y2={H - padding} stroke="#c9c5b8" />
          <text x={W / 2} y={H - 18} fontSize="11" fill="#8a8578" textAnchor="middle">x ({unit})</text>
          <text x={18} y={H / 2} fontSize="11" fill="#8a8578" textAnchor="middle" transform={`rotate(-90 18 ${H / 2})`}>y ({unit})</text>

          {ellipses.map((e, i) => (
            <path
              key={e.percentile}
              d={ellipsePath(e)}
              fill="none"
              stroke={i === 2 ? "#4a7ab5" : "#a8bcd8"}
              strokeWidth={i === 2 ? 1.8 : 1.2}
              strokeDasharray={i < 2 ? "4 3" : "none"}
            />
          ))}

          <circle cx={sx(pop.meanX)} cy={sy(pop.meanY)} r={2.5} fill="#4a7ab5" />
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #c9c5b8",
  borderRadius: 3,
  fontSize: 13,
  boxSizing: "border-box",
};
