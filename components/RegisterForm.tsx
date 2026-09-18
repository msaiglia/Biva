"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Errore durante la registrazione.");
      return;
    }
    router.push("/login?registrato=1");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Nome (opzionale)">
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Email">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Password (minimo 8 caratteri)">
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: 60 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#8a8578",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 6px",
            }}
          >
            {showPassword ? "Nascondi" : "Mostra"}
          </button>
        </div>
      </Field>
      {error && (
        <div style={{ fontSize: 13, color: "#b23a3a", marginBottom: 14 }}>{error}</div>
      )}
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Creazione in corso..." : "Crea account"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: "#5a564c", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  border: "1px solid #c9c5b8",
  borderRadius: 3,
  fontSize: 13,
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 0",
  borderRadius: 3,
  border: "none",
  background: "#2a2a28",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
