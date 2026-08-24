import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeClassic, phaseAngleDeg, classifyVector, type ReferencePopulation } from "@/lib/biva-engine";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const {
    patientId,
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
    bodyCompositionMethod,
    notes,
  } = body;

  if (!patientId || !heightCm || !resistanceOhm || !reactanceOhm || !referencePopulationId) {
    return NextResponse.json({ error: "Dati mancanti (paziente, altezza, R, Xc, popolazione di riferimento)." }, { status: 400 });
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

  const measurement = await prisma.measurement.create({
    data: {
      patientId,
      measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
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
      bodyCompositionMethod: bodyCompositionMethod === "athlete" ? "athlete" : "standard",
      notes: notes || null,
    },
  });

  return NextResponse.json(measurement);
}
