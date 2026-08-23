"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toleranceEllipse, type ReferencePopulation, type BivaMethod } from "@/lib/biva-engine";
import Footer from "@/components/Footer";

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

interface PatientPointDTO {
  id: string;
  name: string;
  sex: string;
  rH: number;
  xcH: number;
  measuredAt: string;
}

const PALETTE = ["#4a7ab5", "#c15a2e", "#7a9e5f", "#a559a0", "#c9a227", "#4a9e9e", "#b5504a", "#6b6558"];

export default function ComparisonClient({ populations, patients }: { populations: PopulationDTO[]; patients: PatientPointDTO[] }) {
  const [sex, setSex] = useState<"M" | "F">("M");
  const sexPops = useMemo(() => populations.filter((p) => p.sex === sex), [populations, sex]);
  const [popCode, setPopCode] = useState("");
  const activePop = sexPops.find((p) => p.code === popCode) || sexPops[0];

  const eligiblePatients = useMemo(() => patients.filter((p) => p.sex === sex), [patients, sex]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visiblePatients = eligiblePatients.filter((p) => selected.size === 0 || selected.has(p.id));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: "#2a2a28" }}>
      <div style={{ display: "flex", gap: 20, fontSize: 13, marginBottom: 24, paddingBottom: 14, borderBottom: "1px solid #e5e2d8" }}>
        <Link href="/pazienti" style={{ color: "#5a564c", textDecoration: "none" }}>Pazienti</Link>
        <Link href="/misurazione" style={{ color: "#5a564c", textDecoration: "none" }}>Calcolatore</Link>
        <Link href="/confronto" style={{ color: "#2a2a28", textDecoration: "none", fontWeight: 600 }}>Confronto</Link>
      </div>

      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8578", marginBottom: 6 }}>Fase 3</div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Confronto multi-paziente</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <SexButton active={sex === "M"} onClick={() => { setSex("M"); setSelected(new Set()); }}>Uomini</SexButton>
        <SexButton active={sex === "F"} onClick={() => { setSex("F"); setSelected(new Set()); }}>Donne</SexButton>
      </div>

      {!activePop ? (
        <div style={{ padding: 24, background: "#f5f3ee", borderRadius: 4, fontSize: 13, color: "#8a8578" }}>
          Nessuna popolazione di riferimento classica per questo sesso.
        </div>
      ) : eligiblePatients.length === 0 ? (
        <div style={{ padding: 24, background: "#f5f3ee", borderRadius: 4, fontSize: 13, color: "#8a8578" }}>
          Nessun paziente con almeno una misurazione per questo sesso.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, color: "#5a564c", marginBottom: 4 }}>Popolazione di riferimento</label>
              <select value={activePop.code} onChange={(e) => setPopCode(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #c9c5b8", borderRadius: 3, fontSize: 13 }}>
                {sexPops.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
              </select>
            </div>

            <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "#8a8578", marginBottom: 8 }}>
              Pazienti ({eligiblePatients.length})
            </div>
            <div style={{ fontSize: 11, color: "#a39d8a", marginBottom: 10 }}>Nessuno selezionato = mostra tutti</div>
            {eligiblePatients.map((p, i) => (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "5px 0", cursor: "pointer" }}>
                <input type="checkbox" checked={selected.size === 0 || selected.has(p.id)} onChange={() => toggle(p.id)} />
                <span style={{ width: 8, height: 8, borderRadius: 4, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                {p.name}
              </label>
            ))}
          </div>

          <ComparisonGraph population={activePop} patients={visiblePatients} />
        </div>
      )}

      <Footer />
    </main>
  );
}

function ComparisonGraph({ population, patients }: { population: PopulationDTO; patients: PatientPointDTO[] }) {
  const enginePop: ReferencePopulation = {
    code: population.code,
    label: population.label,
    sex: population.sex as "M" | "F",
    method: population.method as BivaMethod,
    n: population.n,
    meanX: population.meanX,
    sdX: population.sdX,
    meanY: population.meanY,
    sdY: population.sdY,
    r: population.correlationR,
    sourceCitation: population.sourceCitation,
    pubmedVerified: population.pubmedVerified,
  };

  const ellipses = useMemo(() => [50, 75, 95].map((p) => toleranceEllipse(enginePop, p as 50 | 75 | 95)), [population]);
  const e95 = ellipses[2];

  const W = 600;
  const H = 500;
  const padding = 60;

  const theta95 = (e95.rotationDeg * Math.PI) / 180;
  const extentX = Math.sqrt(e95.semiAxisMajor ** 2 * Math.cos(theta95) ** 2 + e95.semiAxisMinor ** 2 * Math.sin(theta95) ** 2);
  const extentY = Math.sqrt(e95.semiAxisMajor ** 2 * Math.sin(theta95) ** 2 + e95.semiAxisMinor ** 2 * Math.cos(theta95) ** 2);
  const margin = 1.3;

  let rMin = population.meanX - extentX * margin;
  let rMax = population.meanX + extentX * margin;
  let yMin = population.meanY - extentY * margin;
  let yMax = population.meanY + extentY * margin;
  patients.forEach((p) => {
    if (p.rH < rMin) rMin = p.rH - extentX * 0.1;
    if (p.rH > rMax) rMax = p.rH + extentX * 0.1;
    if (p.xcH < yMin) yMin = p.xcH - extentY * 0.1;
    if (p.xcH > yMax) yMax = p.xcH + extentY * 0.1;
  });

  const sx = (x: number) => padding + ((x - rMin) / (rMax - rMin)) * (W - 2 * padding);
  const sy = (y: number) => H - padding - ((y - yMin) / (yMax - yMin)) * (H - 2 * padding);

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

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e2d8", borderRadius: 4, padding: 20 }}>
      <svg width={W} height={H} style={{ background: "#fafaf8", border: "1px solid #eeece5", borderRadius: 3 }}>
        <line x1={padding} y1={H - padding} x2={W - padding} y2={H - padding} stroke="#c9c5b8" />
        <line x1={padding} y1={padding} x2={padding} y2={H - padding} stroke="#c9c5b8" />
        <text x={W / 2} y={H - 20} fontSize="11" fill="#8a8578" textAnchor="middle">R/H (Ω/m)</text>
        <text x={20} y={H / 2} fontSize="11" fill="#8a8578" textAnchor="middle" transform={`rotate(-90 20 ${H / 2})`}>Xc/H (Ω/m)</text>

        {ellipses.map((e, i) => (
          <path key={e.percentile} d={ellipsePath(e)} fill="none" stroke={["#3d7a5c", "#b8873a", "#b23a3a"][i]} strokeWidth={i === 2 ? 1.8 : 1.2} strokeDasharray={i < 2 ? "4 3" : "none"} />
        ))}
        <circle cx={sx(population.meanX)} cy={sy(population.meanY)} r={2.5} fill="#6b6558" />

        {patients.map((p, i) => (
          <g key={p.id}>
            <circle cx={sx(p.rH)} cy={sy(p.xcH)} r={6} fill={PALETTE[i % PALETTE.length]} stroke="#fff" strokeWidth={1.5} />
            <text x={sx(p.rH) + 9} y={sy(p.xcH) + 3} fontSize="9" fill="#5a564c">{p.name.split(" ")[0]}</text>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 11, color: "#8a8578", marginTop: 10 }}>{population.label} — n={population.n}</div>
    </div>
  );
}

function SexButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: 3, border: "1px solid #c9c5b8", background: active ? "#2a2a28" : "#fff", color: active ? "#fff" : "#2a2a28", cursor: "pointer", fontSize: 13 }}>
      {children}
    </button>
  );
}
