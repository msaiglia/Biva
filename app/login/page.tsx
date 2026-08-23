"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registrato") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email o password non corretti.");
      return;
    }
    router.push("/pazienti");
    router.refresh();
  }

  return (
    <main
      style={{
        maxWidth: 380,
        margin: "80px auto",
        padding: "0 24px",
        fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
        color: "#2a2a28",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8578", marginBottom: 6 }}>
        Piattaforma BIVA
      </div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Accedi</h1>

      {justRegistered && (
        <div style={{ fontSize: 13, color: "#3d7a5c", marginBottom: 16, padding: "8px 12px", background: "#eaf5ee", borderRadius: 3 }}>
          Account creato. Accedi con le credenziali appena scelte.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: "#5a564c", marginBottom: 4 }}>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: "#5a564c", marginBottom: 4 }}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>
        {error && <div style={{ fontSize: 13, color: "#b23a3a", marginBottom: 14 }}>{error}</div>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
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
