import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/dashboard/StatusBadge";
import Link from "next/link";

export default async function HRDriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");

  const allowedRoles = ["ADMIN", "HR", "FLEET_MANAGER", "TRANSPORT_MANAGER", "DRIVER"];
  if (!allowedRoles.includes(session.role)) redirect("/forbidden");

  const { id } = await params;
  const drvIdNum = parseInt(id, 10);

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
        take: 5,
        include: { vehicle: { select: { registration: true, type: true } } },
      },
      driverBehaviors: {
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  });

  if (!driver) notFound();

  // ─── DRIVER ROLE PRIVACY CHECK ───
  if (session.role === "DRIVER") {
    const sessionDriver = await prisma.driver.findFirst({
      where: {
        OR: [
          { userId: session.dbId },
          { employee: { userId: session.dbId } },
        ],
      },
    });

    if (!sessionDriver || sessionDriver.id !== driver.id) {
      redirect("/forbidden");
    }
  }

  // Calculate Expiry Status
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  function getStatusBadge(expiry: Date | null) {
    if (!expiry) return <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-gray-400">N/A</span>;
    const now = new Date();
    if (expiry < now) {
      return <span className="text-xs px-2.5 py-1 rounded bg-red-500/20 text-red-400 font-mono border border-red-500/30">EXPIRED</span>;
    } else if (expiry <= thirtyDaysFromNow) {
      return <span className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30 font-bold">EXPIRING</span>;
    }
    return <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">OK</span>;
  }

  // Aggregate telematics
  const telematics = driver.driverBehaviors.reduce(
    (acc, b) => ({
      speed: acc.speed + b.speedEvents,
      braking: acc.braking + b.harshBraking,
      rpm: acc.rpm + b.highRPM,
      accel: acc.accel + b.acceleration,
    }),
    { speed: 0, braking: 0, rpm: 0, accel: 0 }
  );

  const isOperationalRole = session.role === "TRANSPORT_MANAGER" || session.role === "FLEET_MANAGER";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/hr/drivers" className="text-xs text-brand-gold hover:underline">
              &larr; Back to Driver Registry
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Driver Profile: {driver.employee?.fullName || `${driver.employee?.firstName || ""} ${driver.employee?.lastName || ""}`.trim() || driver.user?.name || "Driver"}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Driver ID: <span className="font-mono text-brand-gold font-semibold">{driver.driverId || `DRV-${driver.id}`}</span> — License No: <span className="font-mono text-white">{driver.licenseNumber}</span>
          </p>
        </div>
        <StatusBadge status={driver.status} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Profile & Contact */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <i className="fas fa-user-id text-brand-gold"></i>
            <span>Personnel & Contact Info</span>
          </h3>

          <div className="space-y-3">
            {[
              { label: "Driver ID", value: driver.driverId || `DRV-${driver.id}`, mono: true },
              { label: "Employee ID", value: driver.employee?.employeeId || `EMP-${driver.employee?.id || "N/A"}`, mono: true },
              { label: "Full Name", value: driver.employee?.fullName || `${driver.employee?.firstName || ""} ${driver.employee?.lastName || ""}`.trim() || driver.user?.name || "N/A" },
              { label: "Department", value: driver.employee?.department || "Transport & Fleet Operations" },
              { label: "Phone Number", value: driver.employee?.phoneNumber || "Not recorded", gold: true },
              { label: "Email Address", value: driver.employee?.email || "Not recorded" },
              ...(!isOperationalRole
                ? [
                    { label: "Address / City", value: driver.employee?.address ? `${driver.employee.address}, ${driver.employee.city || ""}` : "Not recorded" },
                    { label: "Emergency Contact", value: driver.employee?.emergencyContactName ? `${driver.employee.emergencyContactName} (${driver.employee.emergencyContactPhone || ""})` : "Not recorded" },
                  ]
                : []),
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span
                  className={`text-sm font-semibold ${
                    item.mono ? "font-mono text-brand-gold" : item.gold ? "text-brand-gold font-semibold" : "text-white"
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* License & Compliance */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <i className="fas fa-id-card text-brand-gold"></i>
            <span>License & Compliance</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-gray-400">License Number</span>
              <span className="text-sm font-mono font-bold text-white">{driver.licenseNumber}</span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-gray-400">License Category</span>
              <span className="text-sm font-semibold text-brand-gold">{driver.licenseCategory || "Commercial"}</span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-gray-400">License Expiry</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-300">
                  {new Date(driver.licenseExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {getStatusBadge(new Date(driver.licenseExpiry))}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-gray-400">Medical Cert. Expiry</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-300">
                  {driver.medicalCertificateExpiry
                    ? new Date(driver.medicalCertificateExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Not on file"}
                </span>
                {getStatusBadge(driver.medicalCertificateExpiry ? new Date(driver.medicalCertificateExpiry) : null)}
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-gray-400">Training Status</span>
              <span className="text-xs px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                {driver.trainingStatus || "UP_TO_DATE"}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Vehicle & Qualifications */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <i className="fas fa-truck text-brand-gold"></i>
            <span>Vehicle & Qualifications</span>
          </h3>

          <div className="space-y-3">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
              <div className="text-xs text-gray-400 mb-1">Current Vehicle Assignment</div>
              {driver.assignedVehicle ? (
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-base font-mono font-extrabold text-brand-gold">
                      {driver.assignedVehicle.registration}
                    </div>
                    <div className="text-xs text-gray-300">
                      {driver.assignedVehicle.make} {driver.assignedVehicle.model} ({driver.assignedVehicle.type})
                    </div>
                  </div>
                  <StatusBadge status={driver.assignedVehicle.status} />
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic py-2">No vehicle currently assigned</div>
              )}
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-gray-400">Years of Experience</span>
              <span className="text-sm font-bold text-white">{driver.yearsOfExperience || 0} Years</span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-gray-400">Driver Operational Status</span>
              <StatusBadge status={driver.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Driver Telematics */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Driver Behavior & Safety Telematics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Speed Events", value: telematics.speed, color: "text-red-400", icon: "fas fa-tachometer-alt" },
            { label: "Harsh Braking", value: telematics.braking, color: "text-orange-400", icon: "fas fa-stop-circle" },
            { label: "High RPM Events", value: telematics.rpm, color: "text-yellow-400", icon: "fas fa-gauge-high" },
            { label: "Harsh Acceleration", value: telematics.accel, color: "text-purple-400", icon: "fas fa-forward" },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-slate-900/60 rounded-xl border border-slate-700">
              <i className={`${item.icon} ${item.color} text-2xl mb-2`}></i>
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-gray-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
