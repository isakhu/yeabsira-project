import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmployeeDirectoryClient from "@/components/dashboard/EmployeeDirectoryClient";

export default async function HREmployeesPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "HR") redirect("/forbidden");

  const employeesRaw = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, userId: true, name: true, role: true, active: true } },
      driver: { select: { id: true, driverId: true, licenseNumber: true, status: true } },
    },
  });

  const employeesFormatted = employeesRaw.map((e) => ({
    ...e,
    dateOfBirth: e.dateOfBirth ? e.dateOfBirth.toISOString() : null,
    hireDate: e.hireDate ? e.hireDate.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Employee Directory</h1>
        <p className="text-gray-400 mt-1">
          Institutional workforce records, personnel contact profiles, and role management
        </p>
      </div>

      <EmployeeDirectoryClient
        initialEmployees={employeesFormatted as any}
        userRole={session.role}
      />
    </div>
  );
}
