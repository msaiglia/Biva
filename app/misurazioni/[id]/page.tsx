import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { COLORS } from "@/components/Sidebar";
import { computeBodyComposition } from "@/lib/biva-engine";
import { bmiCategory } from "@/lib/reference-ranges";
import RxcVectorGraph from "@/components/RxcVectorGraph";

export const dynamic = "force-dynamic";

const PATTERN_LABELS: Record<string, string> = {
  normale: "Normale",
  disidratazione: "Disidratazione",
  "iperidratazione-edema": "Iperidratazione / edema",
  "massa-cellulare-aumentata": "Massa cellulare aumentata",
  "massa-cellulare-ridotta": "Massa cellulare ridotta",
  "disidratazione-massa-aumentata": "Disidratazione + massa aumentata",
  "iperidratazione-massa-ridotta": "Iperidratazione + massa ridotta",
};

export default async function MeasurementViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const measurement = await prisma.measurement.findUnique({
    where: { id },
    include: { patient: true, referencePopulation: true },
  });

  if (!measurement) notFound();

  const age = Math.floor(
    (measurement.measuredAt.getTime() - measurement.patient.birthDate.getTime()) / (365.25 * 24 * 3600 * 1000)
  );

  const bc = measurement.weightKg
    ? computeBodyComposition(
        measurement.resistanceOhm,
        measurement.reactanceOhm,
        measurement.heightCm,
        measurement.weightKg,
        measurement.patient.sex as "M" | "F"
      )
    : null;
  const bmi = measurement.weightKg
    ? measurement.weightKg / ((measurement.heightCm / 100) * (measurement.heightCm / 100))
    : null;

  return (
    <AppShell userName={session?.user?.name ?? session?.user?.email ?? ""}>
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "32px 24px 60px",
          fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
          color: COLORS.text,
        }}
      >
        <Link href={`/pazienti/${measurement.patientId}`} style={{ fontSize: 12, color: COLORS.textMuted, textDecoration: "none" }}>
          ← {measurement.patient.lastName} {measurement.patient.firstName}
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "14px 0 24px", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, margin: 0 }}>
              Misurazione del {new Date(measurement.measuredAt).toLocaleDateString("it-IT")}
            </h1>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
              {measurement.patient.lastName} {measurement.patient.firstName} · {measurement.patient.sex === "M" ? "Uomo" : "Donna"} · {age} anni all&apos;esame
            </div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <a
              href={`/api/misurazioni/${measurement.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              style={{ color: COLORS.primary, textDecoration: "none", fontSize: 13, fontWeight: 600 }}
            >
              PDF ↓
            </a>
            <Link
              href={`/misurazione?pazienteId=${measurement.patientId}&misurazioneId=${measurement.id}`}
              style={{ color: COLORS.primary, textDecoration: "none", fontSize: 13, fontWeight: 600 }}
            >
              Modifica
            </Link>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <RxcVectorGraph
            title="BIVA classica — R/H, Xc/H"
            subtitle={measurement.referencePopulation.label}
            unit="Ω/m"
            pop={{
              code: measurement.referencePopulation.code,
              label: measurement.referencePopulation.label,
              sex: measurement.referencePopulation.sex as "M" | "F",
              method: measurement.referencePopulation.method as "classic" | "specific",
              n: measurement.referencePopulation.n,
              meanX: measurement.referencePopulation.meanX,
              sdX: measurement.referencePopulation.sdX,
              meanY: measurement.referencePopulation.meanY,
              sdY: measurement.referencePopulation.sdY,
              r: measurement.referencePopulation.correlationR,
              sourceCitation: measurement.referencePopulation.sourceCitation,
              pubmedVerified: measurement.referencePopulation.pubmedVerified,
            }}
            vector={{ x: measurement.rH, y: measurement.xcH }}
          />
        </div>

        <Section title="Valori misurati">
          <Row label="Resistenza (R)" value={`${measurement.resistanceOhm.toFixed(1)} Ω`} />
          <Row label="Reattanza (Xc)" value={`${measurement.reactanceOhm.toFixed(1)} Ω`} />
          <Row label="R/H" value={`${measurement.rH.toFixed(1)} Ω/m`} />
          <Row label="Xc/H" value={`${measurement.xcH.toFixed(1)} Ω/m`} />
          <Row label="Angolo di fase" value={`${measurement.phaseAngleComputed.toFixed(2)}°`} />
          <Row label="Altezza" value={`${measurement.heightCm} cm`} />
          {measurement.weightKg && <Row label="Peso" value={`${measurement.weightKg} kg`} />}
        </Section>

        <Section title="Classificazione BIVA">
          <Row label="Popolazione di riferimento" value={measurement.referencePopulation.label} />
          <Row
            label="Pattern"
            value={measurement.bivaPattern ? PATTERN_LABELS[measurement.bivaPattern] ?? measurement.bivaPattern : "—"}
          />
        </Section>

        {bc && bmi !== null && (
          <Section title="Stime quantitative">
            <Row label="Indice di Massa Corporea (BMI)" value={`${bmi.toFixed(1)} kg/m² (${bmiCategory(bmi)})`} />
            <Row label="Acqua Totale (TBW)" value={`${bc.tbwL.toFixed(1)} l`} />
            <Row label="Acqua Extracellulare (ECW)" value={`${bc.ecwL.toFixed(1)} l (${bc.ecwToTbwPercent.toFixed(0)}% del TBW)`} />
            <Row label="Acqua Intracellulare (ICW)" value={`${bc.icwL.toFixed(1)} l (${bc.icwToTbwPercent.toFixed(0)}% del TBW)`} />
            <Row label="Massa Magra (FFM)" value={`${bc.ffmKg.toFixed(1)} kg`} />
            <Row label="Massa Grassa (FM)" value={`${bc.fmKg.toFixed(1)} kg`} />
            <Row label="Massa Cellulare (BCM)" value={`${bc.bcmKg.toFixed(1)} kg`} />
          </Section>
        )}

        {measurement.notes && (
          <Section title="Note">
            <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>{measurement.notes}</div>
          </Section>
        )}
      </main>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: COLORS.textMuted, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "4px 18px" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "11px 0",
        borderBottom: `1px solid ${COLORS.border}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: COLORS.textMuted }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
