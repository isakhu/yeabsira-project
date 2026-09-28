import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  console.log("🔐 FMS Administrator Bootstrap Utility\n");

  // 1. Check if an ADMIN user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log(`⚠️  An Administrator account already exists (User ID: "${existingAdmin.userId}").`);
    console.log("   Bootstrap refused. System already initialized with an Administrator.\n");
    return;
  }

  // 2. Read configuration from environment or defaults
  const userId = process.env.ADMIN_ID || "4262";
  const name = process.env.ADMIN_NAME || "System Administrator";
  const rawPassword = process.env.ADMIN_PASSWORD || "AdminPass2026!";
  const mustChangePassword = false;

  if (!userId || !name || !rawPassword) {
    console.error("❌ Error: Invalid bootstrap parameters.");
    process.exit(1);
  }

  // 3. Hash password securely
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 4. Create ADMIN user and associated Employee record
  const adminUser = await prisma.user.create({
    data: {
      userId,
      name,
      passwordHash,
      role: "ADMIN",
      active: true,
      mustChangePassword,
    },
  });

  const nameParts = name.split(" ");
  const firstName = nameParts[0] || "System";
  const lastName = nameParts.slice(1).join(" ") || "Administrator";

  await prisma.employee.create({
    data: {
      employeeId: `EMP-${adminUser.userId}`,
      userId: adminUser.id,
      firstName,
      lastName,
      fullName: name,
      department: "Administration",
      position: "System Administrator",
      status: "ACTIVE",
    },
  });

  // 5. Log audit event
  try {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.userId,
        action: "USER_CREATE",
        target: `user:${adminUser.userId}`,
        details: JSON.stringify({ role: "ADMIN", bootstrap: true }),
      },
    });
  } catch (e) {
    // Non-fatal audit log catch
  }

  console.log(`✅ Production Administrator account successfully created!`);
  console.log(`   User ID: ${adminUser.userId}`);
  console.log(`   Name: ${adminUser.name}`);
  console.log(`   Role: ADMIN (Global Full Access)\n`);
}

bootstrapAdmin()
  .catch((e) => {
    console.error("Bootstrap error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
