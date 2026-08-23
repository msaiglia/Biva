import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegistratiPage() {
  const count = await prisma.user.count();
  if (count > 0) {
    redirect("/login");
  }

  return (
    <main
      style={{
        maxWidth: 400,
        margin: "80px auto",
        padding: "0 24px",
        fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
        color: "#2a2a28",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8578", marginBottom: 6 }}>
        Primo accesso
      </div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Crea il tuo account</h1>
      <p style={{ fontSize: 13, color: "#8a8578", marginBottom: 24 }}>
        Questa pagina funziona solo una volta: dopo aver creato il primo account, si disattiva automaticamente.
      </p>
      <RegisterForm />
    </main>
  );
}
