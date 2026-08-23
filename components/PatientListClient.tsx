"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface PatientDTO {
  id: string;
  firstName: string;
  lastName: string;
  sex: string;
  birthDate: string;
  clinicalNote: string | null;
  measurementCount: number;
}

export default function PatientListClient({ patients, userName }: { patients: PatientDTO[]; userName: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  function age(birthDate: string) {
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: "#2a2a28" }}>
      <NavBar userName={userName} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8578", marginBottom: 6 }}>
            Fase 2
          </div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Pazienti</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={primaryButton}>
          {showForm ? "Annulla" : "+ Nuovo paziente"}
        </button>
      </div>

      {showForm && <NewPatientForm onCreated={() => { setShowForm(false); router.refresh(); }} />}

      {patients.length === 0 ? (
        <div style={{ padding: 24, background: "#f5f3ee", borderRadius: 4, fontSize: 13, color: "#8a8578" }}>
          Nessun paziente ancora registrato.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e2d8", textAlign: "left" }}>
              <th style={th}>Nome</th>
              <th style={th}>Sesso</th>
              <th style={th}>Età</th>
              <th style={th}>Misurazioni</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #eeece5" }}>
                <td style={td}>{p.lastName} {p.firstName}</td>
                <td style={td}>{p.sex === "M" ? "Uomo" : "Donna"}</td>
                <td style={td}>{age(p.birthDate)}</td>
                <td style={td}>{p.measurementCount}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <Link href={`/pazienti/${p.id}`} style={{ color: "#4a7ab5", textDecoration: "none", fontSize: 12 }}>
                    Apri →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
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
    <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #e5e2d8", borderRadius: 4, padding: 20, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
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
      {error && <div style={{ fontSize: 13, color: "#b23a3a", marginTop: 10 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ ...primaryButton, marginTop: 14 }}>
        {loading ? "Salvataggio..." : "Salva paziente"}
      </button>
    </form>
  );
}

function NavBar({ userName }: { userName: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 14, borderBottom: "1px solid #e5e2d8" }}>
      <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
        <Link href="/pazienti" style={{ color: "#2a2a28", textDecoration: "none", fontWeight: 600 }}>Pazienti</Link>
        <Link href="/misurazione" style={{ color: "#5a564c", textDecoration: "none" }}>Calcolatore</Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#8a8578" }}>
        <span>{userName}</span>
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ background: "none", border: "1px solid #c9c5b8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#5a564c" }}>
          Esci
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#5a564c", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const th: React.CSSProperties = { padding: "8px 4px", color: "#8a8578", fontWeight: 500, fontSize: 12 };
const td: React.CSSProperties = { padding: "10px 4px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #c9c5b8", borderRadius: 3, fontSize: 13, boxSizing: "border-box" };
const primaryButton: React.CSSProperties = { padding: "8px 16px", borderRadius: 3, border: "none", background: "#2a2a28", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
