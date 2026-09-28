import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ROLE_DASHBOARD_ROUTES, ROLE_DISPLAY_NAMES, type Role } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ isLoggedIn: false });
    }

    return NextResponse.json({
      isLoggedIn: true,
      userId: session.userId,
      name: session.name,
      role: session.role,
      roleDisplayName: ROLE_DISPLAY_NAMES[session.role as Role],
      mustChangePassword: session.mustChangePassword,
      dashboardRoute: ROLE_DASHBOARD_ROUTES[session.role as Role],
    });
  } catch {
    return NextResponse.json({ isLoggedIn: false });
  }
}
