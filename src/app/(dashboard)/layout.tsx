import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSidebarConfig, ROLE_DISPLAY_NAMES, type Role } from "@/lib/permissions";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Layer 2: Page-level auth check (independent of middleware)
  if (!session.isLoggedIn) {
    redirect("/signin");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  const sidebarConfig = getSidebarConfig(session.role as Role);
  const roleDisplayName = ROLE_DISPLAY_NAMES[session.role as Role] || session.role;

  return (
    <DashboardLayout
      sidebarConfig={sidebarConfig}
      userName={session.name}
      userRole={session.role}
      roleDisplayName={roleDisplayName}
      userId={session.userId}
    >
      {children}
    </DashboardLayout>
  );
}
