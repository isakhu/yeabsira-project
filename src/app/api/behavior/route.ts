import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const records = await prisma.driverBehavior.findMany({
      orderBy: { date: "desc" },
      include: {
        driver: {
          include: {
            user: { select: { name: true, userId: true } },
            employee: { select: { fullName: true, firstName: true, lastName: true, employeeId: true } },
          },
        },
      },
    });

    return NextResponse.json({ records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch behavior records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "TRANSPORT_MANAGER" && session.role !== "FLEET_MANAGER" && session.role !== "HR") {
    return NextResponse.json({ error: "Forbidden: Management or HR access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { driverId, speedEvents, harshBraking, highRPM, acceleration, date } = body;

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
    }

    const driverIdNum = Number(driverId);
    const driver = await prisma.driver.findUnique({
      where: { id: driverIdNum },
      include: { user: { select: { name: true } }, employee: { select: { fullName: true } } },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const record = await prisma.driverBehavior.create({
      data: {
        driverId: driverIdNum,
        speedEvents: Number(speedEvents) || 0,
        harshBraking: Number(harshBraking) || 0,
        highRPM: Number(highRPM) || 0,
        acceleration: Number(acceleration) || 0,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        driver: {
          include: {
            user: { select: { name: true } },
            employee: { select: { fullName: true } },
          },
        },
      },
    });

    const driverName = driver.user?.name || driver.employee?.fullName || `Driver #${driver.id}`;
    await logAction(session.userId, "DRIVER_BEHAVIOR_LOG", `driver:${driver.id}`, {
      driver: driverName,
      speedEvents: record.speedEvents,
      harshBraking: record.harshBraking,
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log driver behavior" }, { status: 500 });
  }
}
