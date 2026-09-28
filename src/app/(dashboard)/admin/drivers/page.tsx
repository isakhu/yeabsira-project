import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DriverDirectoryClient from "@/components/dashboard/DriverDirectoryClient";

export default async function AdminDriversPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN") redirect("/forbidden");

  const [driversRaw, unassignedEmployeesRaw] = await Promise.all([
    prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        employee: true,
        user: { select: { userId: true, name: true, active: true } },
        assignedVehicle: { select: { id: true, registration: true, type: true } },
      },
    }),
    prisma.employee.findMany({
      where: { driver: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, employeeId: true, fullName: true, firstName: true, lastName: true },
    }),
  ]);

  const driversFormatted = driversRaw.map((d) => ({
    ...d,
    licenseIssueDate: d.licenseIssueDate ? d.licenseIssueDate.toISOString() : null,
    licenseExpiry: d.licenseExpiry.toISOString(),
    medicalCertificateExpiry: d.medicalCertificateExpiry ? d.medicalCertificateExpiry.toISOString() : null,
    trainingExpiryDate: d.trainingExpiryDate ? d.trainingExpiryDate.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">System Driver Management</h1>
        <p className="text-gray-400 mt-1">
          Global administrative oversight of driver licensing, medical compliance, and vehicle assignments
        </p>
      </div>

      <DriverDirectoryClient
        initialDrivers={driversFormatted as any}
        unassignedEmployees={unassignedEmployeesRaw}
        userRole={session.role}
      />
    </div>
  );
}
