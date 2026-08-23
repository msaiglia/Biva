import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Registrazione chiusa: esiste già un account. Usa la pagina di accesso." },
      { status: 403 }
    );
  }

  const { email, password, name } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email obbligatoria e password di almeno 8 caratteri." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || null, role: "admin" },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
