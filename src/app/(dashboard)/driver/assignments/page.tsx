import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default async function DriverAssignmentsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "DRIVER") redirect("/forbidden");

  const user = await prisma.user.findUnique({ where: { userId: session.userId } });
  const driver = user ? await prisma.driver.findUnique({ where: { userId: user.id } }) : null;
  const assignments = driver
    ? await prisma.assignment.findMany({
        where: { driverId: driver.id },
        orderBy: { departure: "desc" },
        include: { vehicle: { select: { registration: true } } },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Assignments</h1>
        <p className="text-gray-400 mt-1">Your driver-vehicle assignments — {assignments.length} records</p>
      </div>
      <DataTable
        columns={[
          { key: "vehicle", label: "Vehicle", render: (v) => <span className="font-mono text-brand-gold">{v as string}</span> },
          { key: "destination", label: "Destination" },
          { key: "departure", label: "Departure" },
          { key: "returnTime", label: "Return" },
          { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
        ]}
        data={assignments.map((a) => ({
          vehicle: a.vehicle.registration,
          destination: a.destination,
          departure: new Date(a.departure).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          returnTime: a.returnTime ? new Date(a.returnTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
          status: a.status,
        }))}
        emptyMessage="No assignments"
      />
    </div>
  );
}
