-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Driver" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "driverId" TEXT,
    "employeeId" INTEGER,
    "userId" INTEGER,
    "licenseNumber" TEXT NOT NULL,
    "licenseCategory" TEXT DEFAULT 'Automobile',
    "licenseIssueDate" DATETIME,
    "licenseExpiry" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "yearsOfExperience" INTEGER DEFAULT 0,
    "medicalCertificateExpiry" DATETIME,
    "trainingStatus" TEXT DEFAULT 'UP_TO_DATE',
    "trainingExpiryDate" DATETIME,
    "assignedVehicleId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Driver_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Driver" ("assignedVehicleId", "createdAt", "id", "licenseExpiry", "licenseNumber", "status", "updatedAt", "userId") SELECT "assignedVehicleId", "createdAt", "id", "licenseExpiry", "licenseNumber", "status", "updatedAt", "userId" FROM "Driver";
DROP TABLE "Driver";
ALTER TABLE "new_Driver" RENAME TO "Driver";
CREATE UNIQUE INDEX "Driver_driverId_key" ON "Driver"("driverId");
CREATE UNIQUE INDEX "Driver_employeeId_key" ON "Driver"("employeeId");
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");
CREATE UNIQUE INDEX "Driver_assignedVehicleId_key" ON "Driver"("assignedVehicleId");
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" TEXT,
    "userId" INTEGER,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "gender" TEXT,
    "dateOfBirth" DATETIME,
    "phoneNumber" TEXT,
    "alternatePhoneNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "employmentType" TEXT DEFAULT 'FULL_TIME',
    "hireDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("createdAt", "department", "id", "position", "status", "updatedAt", "userId") SELECT "createdAt", "department", "id", "position", "status", "updatedAt", "userId" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
