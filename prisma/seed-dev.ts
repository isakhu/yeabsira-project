import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function generatePassword(): string {
  return crypto.randomBytes(6).toString("base64url") + "!Aa1";
}

async function main() {
  console.log("🌱 [DEVELOPMENT ONLY] Seeding FMS demo database...\n");

  // ─── 1. Seed Users ───
  const users = [
    { userId: "4262", name: "User 4262", role: "ADMIN" },
    { userId: "4263", name: "User 4263", role: "TRANSPORT_MANAGER" },
    { userId: "4264", name: "User 4264", role: "FLEET_MANAGER" },
    { userId: "4265", name: "User 4265", role: "DRIVER" },
    { userId: "4266", name: "User 4266", role: "MECHANIC" },
    { userId: "4267", name: "User 4267", role: "FUEL_CONTROLLER" },
    { userId: "4268", name: "User 4268", role: "HR" },
  ];

  const roleDisplayNames: Record<string, string> = {
    ADMIN: "Administrator",
    TRANSPORT_MANAGER: "Transport Manager",
    FLEET_MANAGER: "Fleet Manager",
    DRIVER: "Driver",
    MECHANIC: "Mechanic",
    FUEL_CONTROLLER: "Fuel Controller",
    HR: "HR",
  };

  const credentials: { userId: string; role: string; password: string }[] = [];
  const createdUsers: { userId: string; dbId: number; role: string }[] = [];

  for (const u of users) {
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { userId: u.userId },
      update: {},
      create: {
        userId: u.userId,
        name: u.name,
        passwordHash,
        role: u.role,
        active: true,
        mustChangePassword: true,
      },
    });

    credentials.push({ userId: u.userId, role: roleDisplayNames[u.role], password });
    createdUsers.push({ userId: u.userId, dbId: user.id, role: u.role });
    console.log(`  ✓ User ${u.userId} (${roleDisplayNames[u.role]})`);
  }

  // ─── 2. Seed Driver & Employee Profiles ───
  console.log("\n👤 Seeding Driver & Employee profiles...\n");

  const allRoles = ["ADMIN", "TRANSPORT_MANAGER", "FLEET_MANAGER", "DRIVER", "MECHANIC", "FUEL_CONTROLLER", "HR"];
  const seededEmployees: Record<string, any> = {};

  for (const r of allRoles) {
    const u = createdUsers.find((user) => user.role === r)!;
    const emp = await prisma.employee.upsert({
      where: { userId: u.dbId },
      update: {},
      create: {
        employeeId: `EMP-${u.userId}`,
        userId: u.dbId,
        firstName: "User",
        lastName: u.userId,
        fullName: `User ${u.userId}`,
        department: r === "HR" ? "Human Resources" : r === "MECHANIC" ? "Maintenance" : "Transport & Fleet Operations",
        position: roleDisplayNames[r],
        status: "ACTIVE",
      },
    });
    seededEmployees[r] = emp;
    console.log(`  ✓ Employee profile created for User ${u.userId}`);
  }

  const driverUser = createdUsers.find((u) => u.role === "DRIVER")!;
  const driverEmp = seededEmployees["DRIVER"];
  const driver = await prisma.driver.upsert({
    where: { employeeId: driverEmp.id },
    update: {},
    create: {
      driverId: `DRV-${driverUser.userId}`,
      employeeId: driverEmp.id,
      userId: driverUser.dbId,
      licenseNumber: "ETH-DL-884920",
      licenseCategory: "Commercial",
      licenseExpiry: new Date("2028-12-31"),
      status: "ACTIVE",
    },
  });
  console.log(`  ✓ Driver profile created for User ${driverUser.userId}`);

  // ─── 3. Seed Demo Vehicles ───
  console.log("\n🚗 Seeding Vehicles...\n");

  const vehiclesData = [
    { registration: "AA-1234", type: "SUV", make: "Toyota", model: "Land Cruiser", year: 2022, status: "FIELD_WORK", mileage: 45200, fuelType: "Diesel", nextServiceDate: new Date("2026-09-15"), currentDriverId: driver.id },
    { registration: "AA-5678", type: "Sedan", make: "Hyundai", model: "Elantra", year: 2021, status: "IDLE", mileage: 32100, fuelType: "Petrol", nextServiceDate: new Date("2026-08-30") },
    { registration: "AA-9012", type: "Bus", make: "Isuzu", model: "NPR", year: 2020, status: "GARAGE", mileage: 87500, fuelType: "Diesel", nextServiceDate: new Date("2026-08-01") },
    { registration: "AA-3456", type: "Pickup", make: "Toyota", model: "Hilux", year: 2023, status: "FIELD_WORK", mileage: 18400, fuelType: "Diesel", nextServiceDate: new Date("2026-11-20") },
    { registration: "AA-7890", type: "Van", make: "Nissan", model: "Urvan", year: 2019, status: "OUT_OF_SERVICE", mileage: 124000, fuelType: "Diesel", nextServiceDate: new Date("2026-06-10") },
  ];

  const createdVehicles = [];
  for (const v of vehiclesData) {
    const { currentDriverId, ...vData } = v;
    const vehicle = await prisma.vehicle.upsert({
      where: { registration: v.registration },
      update: {},
      create: {
        ...vData,
        ...(currentDriverId ? { currentDriver: { connect: { id: currentDriverId } } } : {}),
      },
    });
    createdVehicles.push(vehicle);
    console.log(`  ✓ Vehicle ${vehicle.registration} (${vehicle.type} — ${vehicle.status})`);
  }

  // ─── 4. Seed Maintenance Jobs & Services ───
  console.log("\n🔧 Seeding Maintenance Jobs \& Services...\n");

  const adminDbId = createdUsers.find((u) => u.role === "ADMIN")!.dbId;
  const mechanicDbId = createdUsers.find((u) => u.role === "MECHANIC")!.dbId;

  await prisma.maintenanceJob.createMany({
    data: [
      { vehicleId: createdVehicles[2].id, mechanicId: mechanicDbId, problem: "Engine overheating", description: "Radiator leak detected during route inspection", priority: "HIGH", status: "IN_PROGRESS" },
      { vehicleId: createdVehicles[4].id, mechanicId: mechanicDbId, problem: "Brake pad replacement", description: "Brake lining below safety threshold", priority: "CRITICAL", status: "PENDING" },
      { vehicleId: createdVehicles[0].id, mechanicId: mechanicDbId, problem: "Oil leak inspection", description: "Minor oil drip underneath oil pan", priority: "MEDIUM", status: "COMPLETED", completedAt: new Date("2025-07-28") },
    ],
  });

  await prisma.vehicleService.createMany({
    data: [
      { vehicleId: createdVehicles[1].id, serviceType: "Oil Change & Filter", dueDate: new Date("2026-08-30"), mileage: 32100, status: "SCHEDULED" },
      { vehicleId: createdVehicles[2].id, serviceType: "Full Service & Brake Check", dueDate: new Date("2026-08-01"), mileage: 87500, status: "OVERDUE" },
      { vehicleId: createdVehicles[0].id, serviceType: "Tire Rotation", dueDate: new Date("2025-07-15"), mileage: 45000, status: "COMPLETED", completedAt: new Date("2025-07-15") },
    ],
  });

  // ─── 5. Seed Bookings ───
  console.log("\n📅 Seeding Bookings...\n");

  const transportDbId = createdUsers.find((u) => u.role === "TRANSPORT_MANAGER")!.dbId;

  const bookings = [
    { requesterId: adminDbId, destination: "Bahir Dar Regional Office", purpose: "Administrative inspection", status: "COMPLETED", date: new Date("2025-07-20") },
    { requesterId: transportDbId, destination: "Addis Ababa Airport", purpose: "VIP transport", status: "APPROVED", date: new Date("2025-08-12") },
    { requesterId: driverUser.dbId, destination: "Debre Markos", purpose: "Document delivery", status: "PENDING", date: new Date("2025-08-15") },
    { requesterId: adminDbId, destination: "Gondar University", purpose: "Conference attendance", status: "PENDING", date: new Date("2025-08-18") },
    { requesterId: transportDbId, destination: "Hawassa Industrial Park", purpose: "Site assessment", status: "APPROVED", date: new Date("2025-08-20") },
  ];

  for (const b of bookings) {
    await prisma.booking.create({ data: b });
  }

  // ─── 6. Seed Assignments ───
  console.log("\n📋 Seeding assignments...\n");

  const assignments = [
    { vehicleId: createdVehicles[1].id, driverId: driver.id, destination: "Bahir Dar → Addis Ababa", departure: new Date("2025-08-10T06:00:00"), status: "COMPLETED" },
    { vehicleId: createdVehicles[2].id, driverId: driver.id, destination: "Addis Ababa → Hawassa", departure: new Date("2025-08-14T07:30:00"), status: "SCHEDULED" },
    { vehicleId: createdVehicles[0].id, driverId: driver.id, destination: "City center transport", departure: new Date("2025-08-11T09:00:00"), status: "IN_PROGRESS" },
  ];

  for (const a of assignments) {
    await prisma.assignment.create({ data: a });
  }

  // ─── 7. Seed Fuel Transactions ───
  console.log("\n⛽ Seeding Fuel Transactions...\n");

  const fuelControllerDbId = createdUsers.find((u) => u.role === "FUEL_CONTROLLER")!.dbId;

  await prisma.fuelTransaction.createMany({
    data: [
      { vehicleId: createdVehicles[0].id, controllerId: fuelControllerDbId, fuelType: "Diesel", quantity: 65.5, cost: 4257.5, odometer: 45200, date: new Date("2025-08-01") },
      { vehicleId: createdVehicles[1].id, controllerId: fuelControllerDbId, fuelType: "Petrol", quantity: 45.0, cost: 3150.0, odometer: 32100, date: new Date("2025-08-03") },
      { vehicleId: createdVehicles[3].id, controllerId: fuelControllerDbId, fuelType: "Diesel", quantity: 70.0, cost: 4550.0, odometer: 18400, date: new Date("2025-08-05") },
    ],
  });

  // ─── 8. Seed Driver Behavior ───
  console.log("\n📊 Seeding Driver Behavior Telematics...\n");

  await prisma.driverBehavior.createMany({
    data: [
      { driverId: driver.id, speedEvents: 2, harshBraking: 1, highRPM: 0, acceleration: 1, date: new Date("2025-08-01") },
      { driverId: driver.id, speedEvents: 0, harshBraking: 3, highRPM: 1, acceleration: 0, date: new Date("2025-08-05") },
      { driverId: driver.id, speedEvents: 1, harshBraking: 0, highRPM: 0, acceleration: 0, date: new Date("2025-08-10") },
    ],
  });

  // ─── Output Credentials file ───
  const credentialsFilePath = path.join(process.cwd(), "SEED_CREDENTIALS.md");
  let mdContent = `# FMS Seeded Credentials (DEV ONLY)\n\nGenerated: ${new Date().toISOString()}\n\n| User ID | Role | Password |\n|---------|------|----------|\n`;

  for (const c of credentials) {
    mdContent += `| ${c.userId} | ${c.role} | ${c.password} |\n`;
  }

  fs.writeFileSync(credentialsFilePath, mdContent, "utf8");
  console.log(`\n✅ Seed credentials written to ${credentialsFilePath}\n`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
