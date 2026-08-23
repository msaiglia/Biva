import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import MeasurementReport from "@/lib/pdf/MeasurementReport";
import { computeBodyComposition, type ReferencePopulation } from "@/lib/biva-engine";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { id } = await params;

  const measurement = await prisma.measurement.findUnique({
    where: { id },
    include: { patient: true, referencePopulation: true },
  });

  if (!measurement) return NextResponse.json({ error: "Misurazione non trovata" }, { status: 404 });

  const pop = measurement.referencePopulation;
  const enginePop: ReferencePopulation = {
    code: pop.code,
    label: pop.label,
    sex: pop.sex as "M" | "F",
    method: pop.method as "classic" | "specific",
    n: pop.n,
    meanX: pop.meanX,
    sdX: pop.sdX,
    meanY: pop.meanY,
    sdY: pop.sdY,
    r: pop.correlationR,
    sourceCitation: pop.sourceCitation,
    pubmedVerified: pop.pubmedVerified,
  };

  const bodyComposition = measurement.weightKg
    ? computeBodyComposition(
        measurement.resistanceOhm,
        measurement.reactanceOhm,
        measurement.heightCm,
        measurement.weightKg,
        measurement.patient.sex as "M" | "F"
      )
    : null;

  const buffer = await renderToBuffer(
    React.createElement(MeasurementReport, {
      patient: {
        firstName: measurement.patient.firstName,
        lastName: measurement.patient.lastName,
        sex: measurement.patient.sex,
        birthDate: measurement.patient.birthDate.toISOString(),
        clinicalNote: measurement.patient.clinicalNote,
      },
      measurement: {
        measuredAt: measurement.measuredAt.toISOString(),
        heightCm: measurement.heightCm,
        weightKg: measurement.weightKg,
        resistanceOhm: measurement.resistanceOhm,
        reactanceOhm: measurement.reactanceOhm,
        phaseAngleComputed: measurement.phaseAngleComputed,
        rH: measurement.rH,
        xcH: measurement.xcH,
        bivaPattern: measurement.bivaPattern,
      },
      population: enginePop,
      bodyComposition,
    }) as unknown as Parameters<typeof renderToBuffer>[0]
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="referto-${measurement.patient.lastName}-${new Date(measurement.measuredAt).toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
