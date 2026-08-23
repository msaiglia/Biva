"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

interface PopulationRow {
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
  ageMin: number | null;
  ageMax: number | null;
  sourceCitation: string;
  sourceDOI: string | null;
  pubmedVerified: boolean;
}

const emptyForm = {
  code: "", label: "", sex: "M", method: "classic", category: "generale",
  n: "", meanX: "", sdX: "", meanY: "", sdY: "", correlationR: "",
  ageMin: "", ageMax: "", sourceCitation: "", sourceDOI: "", pubmedVerified: false,
};

export default function AdminPopulationsClient({ initialPopulations }: { initialPopulations: PopulationRow[] }) {
  const [populations, setPopulations] = useState(initialPopulations);
  const [editing, setEditing] = useState<PopulationRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(p: PopulationRow) {
    setEditing(p);
    setCreating(false);
    setForm({
      code: p.code, label: p.label, sex: p.sex, method: p.method, category: p.category,
      n: String(p.n), meanX: String(p.meanX), sdX: String(p.sdX), meanY: String(p.meanY), sdY: String(p.sdY),
      correlationR: String(p.correlationR), ageMin: p.ageMin ? String(p.ageMin) : "", ageMax: p.ageMax ? String(p.ageMax) : "",
      sourceCitation: p.sourceCitation, sourceDOI: p.sourceDOI || "", pubmedVerified: p.pubmedVerified,
    });
  }

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm);
  }

  function cancel() {
    setEditing(null);
    setCreating(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url = editing ? `/api/admin/popolazioni/${editing.id}` : "/api/admin/popolazioni";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Errore durante il salvataggio.");
      return;
    }
    const saved = await res.json();
    if (editing) {
      setPopulations(populations.map((p) => (p.id === saved.id ? saved : p)));
    } else {
      setPopulations([...populations, saved]);
    }
    cancel();
  }

  async function handleDelete(p: PopulationRow) {
    if (!confirm(`Eliminare "${p.label}"? Non è reversibile.`)) return;
    const res = await fetch(`/api/admin/popolazioni/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Errore durante l'eliminazione.");
      return;
    }
    setPopulations(populations.filter((x) => x.id !== p.id));
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: "#2a2a28" }}>
      <div className="nav-bar" style={{ display: "flex", gap: 20, fontSize: 13, marginBottom: 24, paddingBottom: 14, borderBottom: "1px solid #e5e2d8", flexWrap: "wrap" }}>
        <Link href="/pazienti" style={{ color: "#5a564c", textDecoration: "none" }}>Pazienti</Link>
        <Link href="/misurazione" style={{ color: "#5a564c", textDecoration: "none" }}>Calcolatore</Link>
        <Link href="/confronto" style={{ color: "#5a564c", textDecoration: "none" }}>Confronto</Link>
        <Link href="/admin/popolazioni" style={{ color: "#2a2a28", textDecoration: "none", fontWeight: 600 }}>Popolazioni</Link>
      </div>

      <div className="responsive-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Popolazioni di riferimento</h1>
        </div>
        <button onClick={startCreate} style={primaryButton}>+ Nuova popolazione</button>
      </div>

      {(editing || creating) && (
        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #e5e2d8", borderRadius: 4, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{editing ? `Modifica: ${editing.label}` : "Nuova popolazione"}</div>
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {!editing && (
              <Field label="Codice (univoco)"><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={inputStyle} /></Field>
            )}
            <Field label="Etichetta"><input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={inputStyle} /></Field>
            <Field label="Categoria"><input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle} /></Field>
            {!editing && (
              <Field label="Sesso">
                <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} style={inputStyle}>
                  <option value="M">M</option><option value="F">F</option>
                </select>
              </Field>
            )}
            {!editing && (
              <Field label="Metodo">
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} style={inputStyle}>
                  <option value="classic">classic</option><option value="specific">specific</option>
                </select>
              </Field>
            )}
            <Field label="N (campione)"><input required type="number" value={form.n} onChange={(e) => setForm({ ...form, n: e.target.value })} style={inputStyle} /></Field>
            <Field label="Media X (R/H o Rsp)"><input required type="number" step="any" value={form.meanX} onChange={(e) => setForm({ ...form, meanX: e.target.value })} style={inputStyle} /></Field>
            <Field label="SD X"><input required type="number" step="any" value={form.sdX} onChange={(e) => setForm({ ...form, sdX: e.target.value })} style={inputStyle} /></Field>
            <Field label="Media Y (Xc/H o Xcsp)"><input required type="number" step="any" value={form.meanY} onChange={(e) => setForm({ ...form, meanY: e.target.value })} style={inputStyle} /></Field>
            <Field label="SD Y"><input required type="number" step="any" value={form.sdY} onChange={(e) => setForm({ ...form, sdY: e.target.value })} style={inputStyle} /></Field>
            <Field label="Correlazione r"><input required type="number" step="any" min="-1" max="1" value={form.correlationR} onChange={(e) => setForm({ ...form, correlationR: e.target.value })} style={inputStyle} /></Field>
            <Field label="Età min (opz.)"><input type="number" value={form.ageMin} onChange={(e) => setForm({ ...form, ageMin: e.target.value })} style={inputStyle} /></Field>
            <Field label="Età max (opz.)"><input type="number" value={form.ageMax} onChange={(e) => setForm({ ...form, ageMax: e.target.value })} style={inputStyle} /></Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="Citazione completa"><input required value={form.sourceCitation} onChange={(e) => setForm({ ...form, sourceCitation: e.target.value })} style={inputStyle} /></Field>
          </div>
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label="DOI (opzionale)"><input value={form.sourceDOI} onChange={(e) => setForm({ ...form, sourceDOI: e.target.value })} style={inputStyle} /></Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: 20 }}>
              <input type="checkbox" checked={form.pubmedVerified} onChange={(e) => setForm({ ...form, pubmedVerified: e.target.checked })} />
              Verificato su PubMed (PMID)
            </label>
          </div>
          {error && <div style={{ fontSize: 13, color: "#b23a3a", marginTop: 12 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="submit" disabled={saving} style={primaryButton}>{saving ? "Salvataggio..." : "Salva"}</button>
            <button type="button" onClick={cancel} style={secondaryButton}>Annulla</button>
          </div>
        </form>
      )}

      <div className="table-scroll">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e2d8", textAlign: "left" }}>
            <th style={th}>Etichetta</th>
            <th style={th}>Metodo</th>
            <th style={th}>Sesso</th>
            <th style={th}>n</th>
            <th style={th}>Media X / Y</th>
            <th style={th}>r</th>
            <th style={th}>PubMed</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {populations.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eeece5" }}>
              <td style={td}>{p.label}</td>
              <td style={td}>{p.method}</td>
              <td style={td}>{p.sex}</td>
              <td style={td}>{p.n}</td>
              <td style={td}>{p.meanX.toFixed(1)} / {p.meanY.toFixed(1)}</td>
              <td style={td}>{p.correlationR.toFixed(2)}</td>
              <td style={td}>{p.pubmedVerified ? "✓" : "—"}</td>
              <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                <button onClick={() => startEdit(p)} style={linkButton}>Modifica</button>
                <button onClick={() => handleDelete(p)} style={{ ...linkButton, color: "#b23a3a" }}>Elimina</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Footer />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "#5a564c", marginBottom: 3 }}>{label}</label>
      {children}
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 4px", color: "#8a8578", fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 4px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "6px 8px", border: "1px solid #c9c5b8", borderRadius: 3, fontSize: 12, boxSizing: "border-box" };
const primaryButton: React.CSSProperties = { padding: "8px 16px", borderRadius: 3, border: "none", background: "#2a2a28", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const secondaryButton: React.CSSProperties = { padding: "8px 16px", borderRadius: 3, border: "1px solid #c9c5b8", background: "#fff", color: "#5a564c", fontSize: 13, cursor: "pointer" };
const linkButton: React.CSSProperties = { background: "none", border: "none", color: "#4a7ab5", cursor: "pointer", fontSize: 11, marginLeft: 10, padding: 0 };
