import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let userCount = 0;
  try {
    userCount = await prisma.user.count();
  } catch {
    // Se il database non è raggiungibile, mostra comunque la pagina di stato
    // diagnostica invece di un redirect che fallirebbe silenziosamente.
    return <DiagnosticFallback />;
  }

  if (userCount === 0) {
    redirect("/registrati");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  redirect("/pazienti");
}

function DiagnosticFallback() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 24 }}>Database non raggiungibile</h1>
      <p style={{ color: "#b23a3a" }}>Controlla DATABASE_URL su Vercel.</p>
    </main>
  );
}
