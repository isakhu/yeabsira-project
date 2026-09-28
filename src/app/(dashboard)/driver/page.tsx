import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KPICard from "@/components/dashboard/KPICard";
import StatusBadge from "@/components/dashboard/StatusBadge";

import { AddBookingButton } from "@/components/dashboard/CreateActionButtons";

export default async function DriverDashboard() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "DRIVER") redirect("/forbidden");

  // Get driver record for this user
  const driver = await prisma.driver.findUnique({
    where: { userId: session.dbId },
    include: {
      assignedVehicle: true,
      assignments: {
        orderBy: { departure: "desc" },
        take: 5,
        include: { vehicle: { select: { registration: true, type: true } } },
      },
      driverBehaviors: {
        orderBy: { date: "desc" },
        take: 7,
      },
    },
  });

  // Get the vehicle via currentDriverId relation
  const myVehicle = driver
    ? await prisma.vehicle.findFirst({ where: { currentDriverId: driver.id } })
    : null;

  const todayTrips = driver?.assignments.filter(
    (a) => a.status === "IN_PROGRESS" || a.status === "SCHEDULED"
  ).length ?? 0;

  const pendingAssignments = driver?.assignments.filter(
    (a) => a.status === "SCHEDULED"
  ).length ?? 0;

  // Aggregate behavior
  const totalBehavior = driver?.driverBehaviors.reduce(
    (acc, b) => ({
      speed: acc.speed + b.speedEvents,
      braking: acc.braking + b.harshBraking,
      rpm: acc.rpm + b.highRPM,
      accel: acc.accel + b.acceleration,
    }),
    { speed: 0, braking: 0, rpm: 0, accel: 0 }
  ) ?? { speed: 0, braking: 0, rpm: 0, accel: 0 };

  const currentAssignment = driver?.assignments.find(
    (a) => a.status === "IN_PROGRESS"
  ) || driver?.assignments.find((a) => a.status === "SCHEDULED");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Driver Dashboard</h1>
          <p className="text-gray-400 mt-1">Your assignments, vehicle, and performance overview</p>
        </div>
        <AddBookingButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Assigned Vehicle"
          value={myVehicle?.registration || "None"}
          icon="fas fa-car"
          color="gold"
        />
        <KPICard title="Today's Trips" value={todayTrips} icon="fas fa-route" color="blue" />
        <KPICard title="Pending Assignments" value={pendingAssignments} icon="fas fa-clock" color="orange" />
      </div>

      {/* Current Assignment + My Vehicle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Assignment */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Current Assignment</h3>
          {currentAssignment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-700/50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Vehicle</div>
                  <div className="text-sm font-semibold text-brand-gold">
                    {currentAssignment.vehicle.registration}
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Destination</div>
                  <div className="text-sm font-semibold text-white">
                    {currentAssignment.destination}
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Departure</div>
                  <div className="text-sm font-semibold text-white">
                    {new Date(currentAssignment.departure).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-xl">
                  <div className="text-xs text-gray-400 mb-1">Trip Status</div>
                  <StatusBadge status={currentAssignment.status} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-clipboard-check text-3xl text-gray-600 mb-3"></i>
              <p className="text-gray-400">No active assignment</p>
            </div>
          )}
        </div>

        {/* My Vehicle */}
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">My Vehicle</h3>
          {myVehicle ? (
            <div className="space-y-3">
              {[
                { label: "Registration", value: myVehicle.registration, color: "text-brand-gold" },
                { label: "Vehicle Type", value: `${myVehicle.make} ${myVehicle.model} (${myVehicle.type})` },
                { label: "Current Status", value: myVehicle.status, badge: true },
                { label: "Mileage", value: `${myVehicle.mileage.toLocaleString()} km` },
                {
                  label: "Next Service",
                  value: myVehicle.nextServiceDate
                    ? new Date(myVehicle.nextServiceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Not scheduled",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  {item.badge ? (
                    <StatusBadge status={item.value as string} />
                  ) : (
                    <span className={`text-sm font-semibold ${item.color || "text-white"}`}>
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-car text-3xl text-gray-600 mb-3"></i>
              <p className="text-gray-400">No vehicle assigned</p>
            </div>
          )}
        </div>
      </div>

      {/* Driver Behavior */}
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">My Driver Behavior</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Acceleration Events", value: totalBehavior.accel, color: "text-purple-400", icon: "fas fa-forward" },
            { label: "Braking Events", value: totalBehavior.braking, color: "text-orange-400", icon: "fas fa-stop-circle" },
            { label: "Speed Events", value: totalBehavior.speed, color: "text-red-400", icon: "fas fa-tachometer-alt" },
            { label: "High RPM Events", value: totalBehavior.rpm, color: "text-yellow-400", icon: "fas fa-gauge-high" },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-slate-700/50 rounded-xl">
              <i className={`${item.icon} ${item.color} text-2xl mb-2`}></i>
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-gray-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Assignments */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Recent Assignments</h3>
        <div className="bg-slate-800 border border-slate-600 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  {["Vehicle", "Destination", "Departure", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {(driver?.assignments || []).map((a) => (
                  <tr key={a.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-brand-gold">{a.vehicle.registration}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{a.destination}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(a.departure).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!driver?.assignments || driver.assignments.length === 0) && (
            <div className="p-8 text-center text-gray-400">
              <i className="fas fa-inbox text-3xl text-gray-600 mb-3"></i>
              <p>No assignments yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
