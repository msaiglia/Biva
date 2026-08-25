"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { COLORS } from "@/components/Sidebar";

interface PatientDTO {
  id: string;
  firstName: string;
  lastName: string;
  sex: string;
  birthDate: string;
  clinicalNote: string | null;
  measurementCount: number;
  lastPattern: string | null;
  lastMeasuredAt: string | null;
}

interface Stats {
  totalPatients: number;
  totalMeasurements: number;
  recentMeasurements: number;
}

const PATTERN_LABELS: Record<string, string> = {
  normale: "Normale",
  disidratazione: "Disidratazione",
  "iperidratazione-edema": "Iperidratazione",
  "massa-cellulare-aumentata": "Massa cell. aumentata",
  "massa-cellulare-ridotta": "Massa cell. ridotta",
  "disidratazione-massa-aumentata": "Disidr. + massa aum.",
  "iperidratazione-massa-ridotta": "Iperidr. + massa rid.",
};

const AVATAR_PALETTE = ["#0f6e8c", "#2d8f6f", "#8a6d3b", "#7a5ca3", "#3b7ac2", "#c2673b"];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

const personSilhouette = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M12 14c-5 0-8 2.5-8 6v1h16v-1c0-3.5-3-6-8-6z" />
  </svg>
);

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function patternColor(pattern: string | null): { fg: string; bg: string } {
  if (!pattern) return { fg: COLORS.textMuted, bg: "#f1f3f5" };
  if (pattern === "normale") return { fg: COLORS.success, bg: COLORS.successBg };
  if (pattern.includes("disidratazione") || pattern.includes("iperidratazione")) return { fg: COLORS.danger, bg: COLORS.dangerBg };
  return { fg: COLORS.warning, bg: COLORS.warningBg };
}

export default function PatientListClient({ patients, userName, stats }: { patients: PatientDTO[]; userName: string; stats: Stats }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = patients.filter((p) =>
    `${p.lastName} ${p.firstName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell userName={userName}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 60px", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: COLORS.text }}>
        <div className="responsive-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ fontSize: 26, margin: 0, fontWeight: 700 }}>Pazienti</h1>
          <button onClick={() => setShowForm(!showForm)} style={primaryButton}>
            {showForm ? "Annulla" : "+ Nuovo paziente"}
          </button>
        </div>

        {/* Statistiche */}
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          <StatCard label="Pazienti totali" value={stats.totalPatients} />
          <StatCard label="Misurazioni totali" value={stats.totalMeasurements} />
          <StatCard label="Misurazioni (ultimi 30gg)" value={stats.recentMeasurements} accent />
        </div>

        {showForm && <NewPatientForm onCreated={() => { setShowForm(false); router.refresh(); }} />}

        {patients.length > 0 && (
          <input
            type="text"
            placeholder="Cerca paziente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: 320, marginBottom: 20 }}
          />
        )}

        {patients.length === 0 ? (
          <div style={{ padding: 40, background: COLORS.surface, borderRadius: 10, fontSize: 13, color: COLORS.textMuted, textAlign: "center", border: `1px solid ${COLORS.border}` }}>
            Nessun paziente ancora registrato. Comincia creandone uno.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {filtered.map((p) => {
              const pc = patternColor(p.lastPattern);
              return (
                <Link
                  key={p.id}
                  href={`/pazienti/${p.id}`}
                  style={{
                    display: "block",
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10,
                    padding: 18,
                    textDecoration: "none",
                    color: COLORS.text,
                    transition: "box-shadow 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: avatarColor(p.lastName + p.firstName),
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {personSilhouette}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.lastName} {p.firstName}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                        {p.sex === "M" ? "Uomo" : "Donna"} · {age(p.birthDate)} anni
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: 12,
                        color: pc.fg,
                        background: pc.bg,
                      }}
                    >
                      {p.lastPattern ? PATTERN_LABELS[p.lastPattern] ?? p.lastPattern : "Nessuna misurazione"}
                    </span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{p.measurementCount} mis.</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 48, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: "#a0aab3", textAlign: "center" }}>
          BIVA Platform — sviluppata dal Dott. Mauro Saiglia
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ background: accent ? COLORS.primaryLight : COLORS.surface, border: `1px solid ${accent ? COLORS.primary + "33" : COLORS.border}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent ? COLORS.primary : COLORS.text }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function NewPatientForm({ onCreated }: { onCreated: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("F");
  const [birthDate, setBirthDate] = useState("");
  const [clinicalNote, setClinicalNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/pazienti", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, sex, birthDate, clinicalNote }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Errore durante la creazione.");
      return;
    }
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Field label="Nome"><input required value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} /></Field>
        <Field label="Cognome"><input required value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} /></Field>
        <Field label="Sesso">
          <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
            <option value="F">Donna</option>
            <option value="M">Uomo</option>
          </select>
        </Field>
        <Field label="Data di nascita"><input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Nota clinica (opzionale — es. IRC, oncologico, atleta)">
        <input value={clinicalNote} onChange={(e) => setClinicalNote(e.target.value)} style={inputStyle} />
      </Field>
      {error && <div style={{ fontSize: 13, color: COLORS.danger, marginTop: 10 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ ...primaryButton, marginTop: 14 }}>
        {loading ? "Salvataggio..." : "Salva paziente"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const primaryButton: React.CSSProperties = { padding: "9px 18px", borderRadius: 6, border: "none", background: COLORS.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
