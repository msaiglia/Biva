import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import TrajectoryGraph from "@/components/TrajectoryGraph";
import AppShell from "@/components/AppShell";
import { COLORS } from "@/components/Sidebar";
import MeasurementRowActions from "@/components/MeasurementRowActions";
import type { ReferencePopulation, BivaMethod } from "@/lib/biva-engine";

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

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      measurements: {
        orderBy: { measuredAt: "desc" },
        include: { referencePopulation: true },
      },
    },
  });

  if (!patient) notFound();

  const age = Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 3600 * 1000));

  // Traiettoria: tutte le misurazioni in ordine cronologico, sull'ellisse
  // della popolazione usata più di recente (contesto clinico "attuale").
  const chronological = [...patient.measurements].reverse();
  const mostRecentPop = patient.measurements[0]?.referencePopulation;
  const trajectoryPoints = chronological.map((m) => ({ x: m.rH, y: m.xcH, date: m.measuredAt.toISOString() }));
  const trajectoryPop: ReferencePopulation | null = mostRecentPop
    ? {
        code: mostRecentPop.code,
        label: mostRecentPop.label,
        sex: mostRecentPop.sex as "M" | "F",
        method: mostRecentPop.method as BivaMethod,
        n: mostRecentPop.n,
        meanX: mostRecentPop.meanX,
        sdX: mostRecentPop.sdX,
        meanY: mostRecentPop.meanY,
        sdY: mostRecentPop.sdY,
        r: mostRecentPop.correlationR,
        sourceCitation: mostRecentPop.sourceCitation,
        pubmedVerified: mostRecentPop.pubmedVerified,
      }
    : null;

  return (
    <AppShell userName={session?.user?.name ?? session?.user?.email ?? ""}>
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 60px", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", color: COLORS.text }}>
      <Link href="/pazienti" style={{ fontSize: 12, color: COLORS.textMuted, textDecoration: "none" }}>← Pazienti</Link>

      <div className="responsive-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "14px 0 24px", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>{patient.lastName} {patient.firstName}</h1>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
            {patient.sex === "M" ? "Uomo" : "Donna"} · {age} anni
            {patient.clinicalNote && <> · {patient.clinicalNote}</>}
          </div>
        </div>
        <Link
          href={`/misurazione?pazienteId=${patient.id}`}
          style={{ padding: "9px 18px", borderRadius: 6, background: COLORS.primary, color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}
        >
          + Nuova misurazione
        </Link>
      </div>

      {trajectoryPop && trajectoryPoints.length > 1 && (
        <div style={{ marginBottom: 28 }}>
          <TrajectoryGraph population={trajectoryPop} points={trajectoryPoints} />
        </div>
      )}

      <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: COLORS.textMuted, marginBottom: 10 }}>
        Storico misurazioni ({patient.measurements.length})
      </div>

      {patient.measurements.length === 0 ? (
        <div style={{ padding: 24, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 13, color: COLORS.textMuted }}>
          Nessuna misurazione ancora registrata per questo paziente.
        </div>
      ) : (
        <div className="table-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}`, textAlign: "left" }}>
              <th style={th}>Data</th>
              <th style={th}>R/H</th>
              <th style={th}>Xc/H</th>
              <th style={th}>Angolo di fase</th>
              <th style={th}>Popolazione</th>
              <th style={th}>Pattern</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {patient.measurements.map((m) => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={td}>{new Date(m.measuredAt).toLocaleDateString("it-IT")}</td>
                <td style={td}>{m.rH.toFixed(1)}</td>
                <td style={td}>{m.xcH.toFixed(1)}</td>
                <td style={td}>{m.phaseAngleComputed.toFixed(2)}°</td>
                <td style={td}>{m.referencePopulation.label}</td>
                <td style={td}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 9px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      color: m.bivaPattern === "normale" ? COLORS.success : COLORS.warning,
                      background: m.bivaPattern === "normale" ? COLORS.successBg : COLORS.warningBg,
                    }}
                  >
                    {m.bivaPattern ? PATTERN_LABELS[m.bivaPattern] ?? m.bivaPattern : "—"}
                  </span>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <MeasurementRowActions measurementId={m.id} patientId={patient.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
    </AppShell>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", color: COLORS.textMuted, fontWeight: 500, fontSize: 12 };
const td: React.CSSProperties = { padding: "12px 12px" };
