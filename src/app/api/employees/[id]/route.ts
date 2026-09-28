import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "HR") {
    return NextResponse.json({ error: "Forbidden: HR or Admin required" }, { status: 403 });
  }

  const { id } = await params;
  const empIdNum = parseInt(id, 10);

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          ...(isNaN(empIdNum) ? [] : [{ id: empIdNum }]),
          { employeeId: id },
        ],
      },
      include: {
        user: { select: { id: true, userId: true, name: true, role: true, active: true } },
        driver: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch employee details" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "ADMIN" && session.role !== "HR") {
    return NextResponse.json({ error: "Forbidden: HR or Admin required" }, { status: 403 });
  }

  const { id } = await params;
  const empIdNum = parseInt(id, 10);

  try {
    const body = await request.json();
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          ...(isNaN(empIdNum) ? [] : [{ id: empIdNum }]),
          { employeeId: id },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      phoneNumber,
      alternatePhoneNumber,
      email,
      address,
      city,
      department,
      position,
      employmentType,
      hireDate,
      status,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      notes,
    } = body;

    const newFirstName = firstName ?? existing.firstName;
    const newLastName = lastName ?? existing.lastName;
    const newMiddleName = middleName !== undefined ? middleName : existing.middleName;
    const fullName = `${newFirstName || ""} ${newMiddleName ? newMiddleName + " " : ""}${newLastName || ""}`.trim();

    const updated = await prisma.employee.update({
      where: { id: existing.id },
      data: {
        firstName: newFirstName,
        middleName: newMiddleName,
        lastName: newLastName,
        fullName: fullName || existing.fullName,
        gender: gender !== undefined ? gender : existing.gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existing.dateOfBirth,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : existing.phoneNumber,
        alternatePhoneNumber: alternatePhoneNumber !== undefined ? alternatePhoneNumber : existing.alternatePhoneNumber,
        email: email !== undefined ? email : existing.email,
        address: address !== undefined ? address : existing.address,
        city: city !== undefined ? city : existing.city,
        department: department ?? existing.department,
        position: position ?? existing.position,
        employmentType: employmentType ?? existing.employmentType,
        hireDate: hireDate ? new Date(hireDate) : existing.hireDate,
        status: status ?? existing.status,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : existing.emergencyContactName,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : existing.emergencyContactPhone,
        emergencyContactRelationship: emergencyContactRelationship !== undefined ? emergencyContactRelationship : existing.emergencyContactRelationship,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        user: { select: { userId: true, role: true, active: true } },
        driver: true,
      },
    });

    const isStatusChange = status && status !== existing.status;
    await logAction(
      session.userId,
      isStatusChange ? "EMPLOYEE_STATUS_CHANGE" : "EMPLOYEE_UPDATE",
      `employee:${updated.employeeId || updated.id}`,
      { status: updated.status, department: updated.department }
    );

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update employee" }, { status: 500 });
  }
}
