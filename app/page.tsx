import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  let dbStatus: "ok" | "error" = "ok";
  let referencePopulationCount = 0;

  try {
    referencePopulationCount = await prisma.referencePopulation.count();
  } catch (e) {
    dbStatus = "error";
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
        color: "#2a2a28",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#8a8578",
          marginBottom: 6,
        }}
      >
        Fase 1 — MVP
      </div>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>
        Piattaforma BIVA
      </h1>

      <StatusRow
        label="Connessione database (Neon)"
        ok={dbStatus === "ok"}
        detail={dbStatus === "ok" ? "connesso" : "non connesso — controlla DATABASE_URL"}
      />
      <StatusRow
        label="Popolazioni di riferimento caricate"
        ok={referencePopulationCount > 0}
        detail={
          referencePopulationCount > 0
            ? `${referencePopulationCount} popolazioni`
            : "0 — dati di riferimento non ancora inseriti"
        }
      />

      <div
        style={{
          marginTop: 32,
          padding: "14px 16px",
          background: "#fff3cd",
          border: "1px solid #e0c068",
          borderRadius: 3,
          fontSize: 14,
          color: "#6b5518",
        }}
      >
        Questa è una pagina di verifica del deployment, non ancora
        l&apos;interfaccia clinica. Le pagine per gestione pazienti,
        misurazioni e grafico RXc si aggiungono dopo aver caricato le
        popolazioni di riferimento verificate.
      </div>
    </main>
  );
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #e5e2d8",
      }}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: ok ? "#3d7a5c" : "#b23a3a",
        }}
      >
        {ok ? "✓" : "✗"} {detail}
      </span>
    </div>
  );
}
