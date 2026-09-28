import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MaintenanceManagerClient from "@/components/dashboard/MaintenanceManagerClient";

export default async function AdminMaintenancePage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN") redirect("/forbidden");

  const [jobsRaw, vehicles] = await Promise.all([
    prisma.maintenanceJob.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: {
        vehicle: { select: { id: true, registration: true, make: true, model: true } },
        mechanic: { select: { name: true, userId: true } },
      },
    }),
    prisma.vehicle.findMany({
      orderBy: { registration: "asc" },
      select: { id: true, registration: true, make: true, model: true },
    }),
  ]);

  const jobsFormatted = jobsRaw.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
    completedAt: j.completedAt ? j.completedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Vehicle Maintenance</h1>
        <p className="text-gray-400 mt-1">
          Complete fleet repair work orders, maintenance schedules, and garage tracking — {jobsRaw.length} records
        </p>
      </div>

      <MaintenanceManagerClient
        initialJobs={jobsFormatted as any}
        vehicles={vehicles}
        userRole={session.role}
      />
    </div>
  );
}
