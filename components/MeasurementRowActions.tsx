"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function MeasurementRowActions({ measurementId, patientId }: { measurementId: string; patientId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirmDelete() {
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/misurazioni/${measurementId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      setError("Errore durante l'eliminazione.");
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#b23a3a" }}>Sei sicuro di voler cancellare la misurazione?</span>
        <button
          onClick={handleConfirmDelete}
          disabled={deleting}
          style={{ background: "none", border: "none", color: "#b23a3a", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0 }}
        >
          {deleting ? "..." : "Sì"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          style={{ background: "none", border: "none", color: "#4a7ab5", cursor: "pointer", fontSize: 12, padding: 0 }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
      {error && <span style={{ fontSize: 11, color: "#b23a3a" }}>{error}</span>}
      <Link href={`/misurazioni/${measurementId}`} style={{ color: "#4a7ab5", textDecoration: "none", fontSize: 12 }}>
        Vedi
      </Link>
      <Link
        href={`/misurazione?pazienteId=${patientId}&misurazioneId=${measurementId}`}
        style={{ color: "#4a7ab5", textDecoration: "none", fontSize: 12 }}
      >
        Modifica
      </Link>
      <a href={`/api/misurazioni/${measurementId}/pdf`} target="_blank" rel="noreferrer" style={{ color: "#4a7ab5", textDecoration: "none", fontSize: 12 }}>
        PDF ↓
      </a>
      <button
        onClick={() => setConfirming(true)}
        style={{ background: "none", border: "none", color: "#b23a3a", cursor: "pointer", fontSize: 12, padding: 0 }}
      >
        Elimina
      </button>
    </div>
  );
}
