import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const drvIdNum = parseInt(id, 10);

  try {
    const driver = await prisma.driver.findFirst({
      where: {
        OR: [
          ...(isNaN(drvIdNum) ? [] : [{ id: drvIdNum }]),
          { driverId: id },
        ],
      },
      include: {
        employee: true,
        user: { select: { id: true, userId: true, name: true, active: true } },
        assignedVehicle: true,
        assignments: {
          orderBy: { departure: "desc" },
          take: 10,
          include: { vehicle: { select: { registration: true, type: true } } },
        },
        driverBehaviors: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver record not found" }, { status: 404 });
    }

    // ─── STRICT DRIVER PRIVACY ENFORCEMENT ───
    if (session.role === "DRIVER") {
      // Find session user's driver record
      const sessionDriver = await prisma.driver.findFirst({
        where: {
          OR: [
            { userId: session.dbId },
            { employee: { userId: session.dbId } },
          ],
        },
      });

      // Reject access if session driver ID does not match requested driver ID
      if (!sessionDriver || sessionDriver.id !== driver.id) {
        return NextResponse.json({ error: "Forbidden: Drivers may only access their own profile" }, { status: 403 });
      }
    }

    // Privacy filtering for Transport & Fleet managers (hide personal DOB/address/emergency contacts)
    if ((session.role === "TRANSPORT_MANAGER" || session.role === "FLEET_MANAGER") && driver.employee) {
      const { dateOfBirth, address, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, notes, ...opEmp } = driver.employee;
      return NextResponse.json({ driver: { ...driver, employee: opEmp } });
    }

    return NextResponse.json({ driver });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch driver details" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "HR") {
    return NextResponse.json({ error: "Forbidden: HR or Admin required to modify driver profiles" }, { status: 403 });
  }

  const { id } = await params;
  const drvIdNum = parseInt(id, 10);

  try {
    const existing = await prisma.driver.findFirst({
      where: {
        OR: [
          ...(isNaN(drvIdNum) ? [] : [{ id: drvIdNum }]),
          { driverId: id },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Driver record not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
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

    const updated = await prisma.driver.update({
      where: { id: existing.id },
      data: {
        licenseNumber: licenseNumber ? licenseNumber.trim() : existing.licenseNumber,
        licenseCategory: licenseCategory ?? existing.licenseCategory,
        licenseIssueDate: licenseIssueDate ? new Date(licenseIssueDate) : existing.licenseIssueDate,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : existing.licenseExpiry,
        status: status ?? existing.status,
        yearsOfExperience: yearsOfExperience !== undefined ? parseInt(yearsOfExperience, 10) : existing.yearsOfExperience,
        medicalCertificateExpiry: medicalCertificateExpiry ? new Date(medicalCertificateExpiry) : existing.medicalCertificateExpiry,
        trainingStatus: trainingStatus ?? existing.trainingStatus,
        trainingExpiryDate: trainingExpiryDate ? new Date(trainingExpiryDate) : existing.trainingExpiryDate,
      },
      include: {
        employee: true,
        assignedVehicle: true,
      },
    });

    const isStatusChange = status && status !== existing.status;
    await logAction(
      session.userId,
      isStatusChange ? "DRIVER_STATUS_CHANGE" : "DRIVER_UPDATE",
      `driver:${updated.driverId || updated.id}`,
      { status: updated.status, licenseNumber: updated.licenseNumber }
    );

    return NextResponse.json({ success: true, driver: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update driver profile" }, { status: 500 });
  }
}
