import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PatientListClient from "@/components/PatientListClient";

export const dynamic = "force-dynamic";

export default async function PazientiPage() {
  const session = await getServerSession(authOptions);

  const patients = await prisma.patient.findMany({
    orderBy: { lastName: "asc" },
    include: { _count: { select: { measurements: true } } },
  });

  const dto = patients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    sex: p.sex,
    birthDate: p.birthDate.toISOString(),
    clinicalNote: p.clinicalNote,
    measurementCount: p._count.measurements,
  }));

  return <PatientListClient patients={dto} userName={session?.user?.name ?? session?.user?.email ?? ""} />;
}
