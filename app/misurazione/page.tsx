import { prisma } from "@/lib/prisma";
import MeasurementForm from "@/components/MeasurementForm";

export const dynamic = "force-dynamic";

export default async function MisurazionePage({
  searchParams,
}: {
  searchParams: Promise<{ pazienteId?: string; misurazioneId?: string }>;
}) {
  const params = await searchParams;
  let populations: Array<{
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
  }> = [];
  let loadError = "";
  let patient: { id: string; firstName: string; lastName: string; sex: string } | null = null;
  let existingMeasurement: {
    id: string;
    measuredAt: string;
    heightCm: number;
    weightKg: number | null;
    resistanceOhm: number;
    reactanceOhm: number;
    phaseAngleDevice: number | null;
    armCircumferenceCm: number | null;
    waistCircumferenceCm: number | null;
    calfCircumferenceCm: number | null;
    referencePopulationId: string;
  } | null = null;

  try {
    populations = await prisma.referencePopulation.findMany({
      orderBy: [{ method: "asc" }, { category: "asc" }, { label: "asc" }],
    });
    if (params.pazienteId) {
      const p = await prisma.patient.findUnique({ where: { id: params.pazienteId } });
      if (p) patient = { id: p.id, firstName: p.firstName, lastName: p.lastName, sex: p.sex };
    }
    if (params.misurazioneId) {
      const m = await prisma.measurement.findUnique({ where: { id: params.misurazioneId } });
      if (m) {
        existingMeasurement = {
          id: m.id,
          measuredAt: m.measuredAt.toISOString().slice(0, 10),
          heightCm: m.heightCm,
          weightKg: m.weightKg,
          resistanceOhm: m.resistanceOhm,
          reactanceOhm: m.reactanceOhm,
          phaseAngleDevice: m.phaseAngleDevice,
          armCircumferenceCm: m.armCircumferenceCm,
          waistCircumferenceCm: m.waistCircumferenceCm,
          calfCircumferenceCm: m.calfCircumferenceCm,
          referencePopulationId: m.referencePopulationId,
        };
      }
    }
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

  return <MeasurementForm populations={populations} patient={patient} existingMeasurement={existingMeasurement} />;
}
