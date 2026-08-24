import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PatientListClient from "@/components/PatientListClient";

export const dynamic = "force-dynamic";

export default async function PazientiPage() {
  const session = await getServerSession(authOptions);

  const patients = await prisma.patient.findMany({
    orderBy: { lastName: "asc" },
    include: {
      _count: { select: { measurements: true } },
      measurements: { orderBy: { measuredAt: "desc" }, take: 1 },
    },
  });

  const dto = patients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    sex: p.sex,
    birthDate: p.birthDate.toISOString(),
    clinicalNote: p.clinicalNote,
    measurementCount: p._count.measurements,
    lastPattern: p.measurements[0]?.bivaPattern ?? null,
    lastMeasuredAt: p.measurements[0]?.measuredAt.toISOString() ?? null,
  }));

  const totalMeasurements = patients.reduce((sum, p) => sum + p._count.measurements, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const recentMeasurements = await prisma.measurement.count({ where: { measuredAt: { gte: thirtyDaysAgo } } });

  return (
    <PatientListClient
      patients={dto}
      userName={session?.user?.name ?? session?.user?.email ?? ""}
      stats={{ totalPatients: patients.length, totalMeasurements, recentMeasurements }}
    />
  );
}
