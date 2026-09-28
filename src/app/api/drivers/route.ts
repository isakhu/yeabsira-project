import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // DRIVER role is NOT allowed to list all drivers
  if (session.role === "DRIVER") {
    return NextResponse.json({ error: "Forbidden: Drivers cannot access driver directory" }, { status: 403 });
  }

  const allowedRoles = ["ADMIN", "HR", "TRANSPORT_MANAGER", "FLEET_MANAGER"];
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim();
  const status = searchParams.get("status");

  try {
    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    let drivers = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        employee: true,
        user: { select: { id: true, userId: true, name: true, active: true } },
        assignedVehicle: { select: { id: true, registration: true, type: true, status: true } },
        driverBehaviors: { orderBy: { date: "desc" }, take: 5 },
      },
    });

    if (search) {
      drivers = drivers.filter((d) => {
        const drvId = d.driverId?.toLowerCase() || "";
        const name = (d.employee?.fullName || d.user?.name || "").toLowerCase();
        const license = d.licenseNumber.toLowerCase();
        const phone = d.employee?.phoneNumber?.toLowerCase() || "";
        return drvId.includes(search) || name.includes(search) || license.includes(search) || phone.includes(search);
      });
    }

    // Role-based privacy filtering: Transport & Fleet managers receive operational fields only
    const isOperationalOnly = session.role === "TRANSPORT_MANAGER" || session.role === "FLEET_MANAGER";
    const sanitizedDrivers = drivers.map((d) => {
      if (isOperationalOnly && d.employee) {
        const { dateOfBirth, address, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, notes, ...opEmp } = d.employee;
        return { ...d, employee: opEmp };
      }
      return d;
    });

    return NextResponse.json({ drivers: sanitizedDrivers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "HR") {
    return NextResponse.json({ error: "Forbidden: HR or Admin required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      employeeId,
      driverId,
      licenseNumber,
      licenseCategory,
      licenseIssueDate,
      licenseExpiry,
      status,
      yearsOfExperience,
      medicalCertificateExpiry,
      trainingStatus,
      trainingExpiryDate,
    } = body;

    if (!employeeId || !licenseNumber || !licenseExpiry) {
      return NextResponse.json({ error: "Employee ID, license number, and license expiry date are required" }, { status: 400 });
    }

    // Check Employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: typeof employeeId === "number" ? employeeId : parseInt(employeeId, 10) || -1 },
          { employeeId: String(employeeId) },
        ],
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Target employee record not found" }, { status: 404 });
    }

    // Check if employee already has a driver profile
    const existingDriver = await prisma.driver.findUnique({ where: { employeeId: employee.id } });
    if (existingDriver) {
      return NextResponse.json({ error: "This employee already has a driver profile" }, { status: 400 });
    }

    const finalDriverId = driverId?.trim() || `DRV-${Date.now().toString().slice(-5)}`;

    // Check unique driverId and licenseNumber
    const dupDriverId = await prisma.driver.findUnique({ where: { driverId: finalDriverId } });
    if (dupDriverId) {
      return NextResponse.json({ error: `Driver ID "${finalDriverId}" is already taken` }, { status: 400 });
    }

    const dupLicense = await prisma.driver.findUnique({ where: { licenseNumber: licenseNumber.trim() } });
    if (dupLicense) {
      return NextResponse.json({ error: `License number "${licenseNumber}" is already registered` }, { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: {
        driverId: finalDriverId,
        employeeId: employee.id,
        userId: employee.userId ?? null,
        licenseNumber: licenseNumber.trim(),
        licenseCategory: licenseCategory || "Automobile",
        licenseIssueDate: licenseIssueDate ? new Date(licenseIssueDate) : null,
        licenseExpiry: new Date(licenseExpiry),
        status: status || "ACTIVE",
        yearsOfExperience: parseInt(yearsOfExperience, 10) || 0,
        medicalCertificateExpiry: medicalCertificateExpiry ? new Date(medicalCertificateExpiry) : null,
        trainingStatus: trainingStatus || "UP_TO_DATE",
        trainingExpiryDate: trainingExpiryDate ? new Date(trainingExpiryDate) : null,
      },
      include: {
        employee: true,
        user: { select: { userId: true, name: true, active: true } },
      },
    });

    await logAction(session.userId, "DRIVER_CREATE", `driver:${driver.driverId}`, {
      licenseNumber: driver.licenseNumber,
      employeeId: employee.employeeId,
    });

    return NextResponse.json({ success: true, driver }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create driver profile" }, { status: 500 });
  }
}
