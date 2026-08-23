import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return null;
  return session;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const pop = await prisma.referencePopulation.update({
    where: { id },
    data: {
      label: body.label,
      category: body.category,
      n: Number(body.n),
      meanX: Number(body.meanX),
      sdX: Number(body.sdX),
      meanY: Number(body.meanY),
      sdY: Number(body.sdY),
      correlationR: Number(body.correlationR),
      ageMin: body.ageMin ? Number(body.ageMin) : null,
      ageMax: body.ageMax ? Number(body.ageMax) : null,
      sourceCitation: body.sourceCitation,
      sourceDOI: body.sourceDOI || null,
      pubmedVerified: !!body.pubmedVerified,
    },
  });

  return NextResponse.json(pop);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;

  const inUse = await prisma.measurement.count({ where: { referencePopulationId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Impossibile eliminare: ${inUse} misurazioni salvate usano questa popolazione.` },
      { status: 409 }
    );
  }

  await prisma.referencePopulation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
