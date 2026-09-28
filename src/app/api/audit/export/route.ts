import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const reportName = body.reportName || "Statistics Report";

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "STATISTICS_EXPORT",
        target: `report:${reportName}`,
        details: JSON.stringify({ format: "CSV", role: session.role }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log export" }, { status: 500 });
  }
}
