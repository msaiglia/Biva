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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const populations = await prisma.referencePopulation.findMany({
    orderBy: [{ method: "asc" }, { category: "asc" }, { label: "asc" }],
  });
  return NextResponse.json(populations);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const body = await req.json();
  const required = ["code", "label", "sex", "method", "category", "n", "meanX", "sdX", "meanY", "sdY", "correlationR", "sourceCitation"];
  for (const f of required) {
    if (body[f] === undefined || body[f] === "") {
      return NextResponse.json({ error: `Campo obbligatorio mancante: ${f}` }, { status: 400 });
    }
  }

  const pop = await prisma.referencePopulation.create({
    data: {
      code: body.code,
      label: body.label,
      sex: body.sex,
      method: body.method,
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
