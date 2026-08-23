import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const patients = await prisma.patient.findMany({
    orderBy: { lastName: "asc" },
    include: { _count: { select: { measurements: true } } },
  });
  return NextResponse.json(patients);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, sex, birthDate, clinicalNote } = body;

  if (!firstName || !lastName || !sex || !birthDate) {
    return NextResponse.json({ error: "Nome, cognome, sesso e data di nascita sono obbligatori." }, { status: 400 });
  }

  const patient = await prisma.patient.create({
    data: {
      firstName,
      lastName,
      sex,
      birthDate: new Date(birthDate),
      clinicalNote: clinicalNote || null,
      createdById: (session.user as { id: string }).id,
    },
  });

  return NextResponse.json(patient);
}
