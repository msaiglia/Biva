import { prisma } from "@/lib/prisma";
import MeasurementForm from "@/components/MeasurementForm";

export const dynamic = "force-dynamic";

export default async function MisurazionePage() {
  let populations: Array<{
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
  }> = [];
  let loadError = "";

  try {
    populations = await prisma.referencePopulation.findMany({
      orderBy: [{ method: "asc" }, { category: "asc" }, { label: "asc" }],
    });
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  if (loadError) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 24 }}>Errore di connessione</h1>
        <p style={{ color: "#b23a3a" }}>{loadError}</p>
      </main>
    );
  }

  if (populations.length === 0) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 24 }}>Nessuna popolazione di riferimento caricata</h1>
        <p>
          Esegui <code>npx prisma db seed</code> per caricare le popolazioni
          di riferimento verificate, poi ricarica questa pagina.
        </p>
      </main>
    );
  }

  return <MeasurementForm populations={populations} />;
}
