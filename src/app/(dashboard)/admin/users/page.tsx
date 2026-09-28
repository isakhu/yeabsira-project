import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { AddUserButton } from "@/components/dashboard/CreateActionButtons";
import { CSVExportButton } from "@/components/dashboard/StatisticsCharts";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN") redirect("/forbidden");

  const users = await prisma.user.findMany({
    orderBy: { userId: "asc" },
    select: { userId: true, name: true, role: true, active: true, mustChangePassword: true, createdAt: true },
  });

  const csvHeaders = ["User ID", "Name", "Role", "Account Status", "Password Change Pending", "Created Date"];
  const csvRows = users.map((u) => [
    u.userId,
    u.name,
    u.role,
    u.active ? "Active" : "Inactive",
    u.mustChangePassword ? "Pending" : "Changed",
    new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">All institutional system accounts — {users.length} accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <CSVExportButton
            filename="FMS_System_Users_List"
            reportName="System Users Directory Report"
            headers={csvHeaders}
            rows={csvRows}
          />
          <AddUserButton />
        </div>
      </div>

      <DataTable
        columns={[
          { key: "userId", label: "User ID", render: (v) => <span className="font-mono text-brand-gold font-bold">{v as string}</span> },
          { key: "name", label: "Name" },
          { key: "role", label: "Role" },
          { key: "active", label: "Status", render: (v) => <StatusBadge status={v === "Active" ? "ACTIVE" : "INACTIVE"} /> },
          { key: "pwChange", label: "Password Changed" },
          { key: "created", label: "Created" },
        ]}
        data={users.map((u) => ({
          userId: u.userId,
          name: u.name,
          role: u.role,
          active: u.active ? "Active" : "Inactive",
          pwChange: u.mustChangePassword ? "Pending" : "Yes",
          created: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        }))}
        emptyMessage="No system users found."
      />
    </div>
  );
}
