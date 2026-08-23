import { prisma } from "@/lib/prisma";
import ComparisonClient from "@/components/ComparisonClient";

export const dynamic = "force-dynamic";

export default async function ConfrontoPage() {
  const populations = await prisma.referencePopulation.findMany({
    where: { method: "classic" },
    orderBy: [{ category: "asc" }, { label: "asc" }],
  });

  const patients = await prisma.patient.findMany({
    include: {
      measurements: {
        orderBy: { measuredAt: "desc" },
        take: 1,
      },
    },
  });

  const dto = patients
    .filter((p) => p.measurements.length > 0)
    .map((p) => {
      const m = p.measurements[0];
      return {
        id: p.id,
        name: `${p.lastName} ${p.firstName}`,
        sex: p.sex,
        rH: m.rH,
        xcH: m.xcH,
        measuredAt: m.measuredAt.toISOString(),
      };
    });

  return <ComparisonClient populations={populations} patients={dto} />;
}
