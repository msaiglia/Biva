"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function MeasurementRowActions({ measurementId, patientId }: { measurementId: string; patientId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Eliminare questa misurazione? L'operazione non è reversibile.")) return;
    setDeleting(true);
    const res = await fetch(`/api/misurazioni/${measurementId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      alert("Errore durante l'eliminazione.");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
        onClick={handleDelete}
        disabled={deleting}
        style={{ background: "none", border: "none", color: "#b23a3a", cursor: "pointer", fontSize: 12, padding: 0 }}
      >
        {deleting ? "..." : "Elimina"}
      </button>
    </div>
  );
}
