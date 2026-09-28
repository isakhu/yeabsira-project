import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_DASHBOARD_ROUTES, type Role } from "@/lib/permissions";

export default async function DashboardRedirectPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.mustChangePassword) redirect("/change-password");

  const route = ROLE_DASHBOARD_ROUTES[session.role as Role] || "/signin";
  redirect(route);
}
