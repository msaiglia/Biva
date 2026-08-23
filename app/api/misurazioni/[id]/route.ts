import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeClassic, phaseAngleDeg, classifyVector, type ReferencePopulation } from "@/lib/biva-engine";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { id } = await params;
  const measurement = await prisma.measurement.findUnique({ where: { id } });
  if (!measurement) return NextResponse.json({ error: "Misurazione non trovata" }, { status: 404 });

  return NextResponse.json(measurement);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const {
    measuredAt,
    heightCm,
    weightKg,
    resistanceOhm,
    reactanceOhm,
    phaseAngleDevice,
    armCircumferenceCm,
    waistCircumferenceCm,
    calfCircumferenceCm,
    referencePopulationId,
    notes,
  } = body;

  if (!heightCm || !resistanceOhm || !reactanceOhm || !referencePopulationId) {
    return NextResponse.json({ error: "Dati mancanti (altezza, R, Xc, popolazione di riferimento)." }, { status: 400 });
  }

  const pop = await prisma.referencePopulation.findUnique({ where: { id: referencePopulationId } });
  if (!pop) return NextResponse.json({ error: "Popolazione di riferimento non trovata." }, { status: 404 });

  const vector = normalizeClassic({ R: resistanceOhm, Xc: reactanceOhm, heightCm });
  const paComputed = phaseAngleDeg(resistanceOhm, reactanceOhm);
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
  const classification = classifyVector(vector, enginePop);

  const measurement = await prisma.measurement.update({
    where: { id },
    data: {
      measuredAt: measuredAt ? new Date(measuredAt) : undefined,
      heightCm,
      weightKg: weightKg || null,
      resistanceOhm,
      reactanceOhm,
      phaseAngleDevice: phaseAngleDevice || null,
      armCircumferenceCm: armCircumferenceCm || null,
      waistCircumferenceCm: waistCircumferenceCm || null,
      calfCircumferenceCm: calfCircumferenceCm || null,
      rH: vector.x,
      xcH: vector.y,
      phaseAngleComputed: paComputed,
      referencePopulationId,
      bivaPattern: classification.pattern,
      notes: notes || null,
    },
  });

  return NextResponse.json(measurement);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { id } = await params;
  await prisma.measurement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
