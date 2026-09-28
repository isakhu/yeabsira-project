import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 FMS Production Initialization (Zero Operational Data).");
  console.log("   Use `npm run db:bootstrap-admin` to create the initial Administrator account.\n");
}

main()
  .catch((e) => {
    console.error("Initialization error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
