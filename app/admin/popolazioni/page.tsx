import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminPopulationsClient from "@/components/AdminPopulationsClient";

export const dynamic = "force-dynamic";

export default async function AdminPopolazioniPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "admin") {
    redirect("/pazienti");
  }

  const populations = await prisma.referencePopulation.findMany({
    orderBy: [{ method: "asc" }, { category: "asc" }, { label: "asc" }],
  });

  return <AdminPopulationsClient initialPopulations={populations} />;
}
