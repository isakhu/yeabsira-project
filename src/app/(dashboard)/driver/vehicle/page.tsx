import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default async function DriverVehiclePage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "ADMIN" && session.role !== "DRIVER") redirect("/forbidden");

  const user = await prisma.user.findUnique({ where: { userId: session.userId } });
  const driver = user
    ? await prisma.driver.findUnique({
        where: { userId: user.id },
        include: {
          assignedVehicle: {
            include: {
              vehicleServices: { orderBy: { dueDate: "asc" }, take: 5 },
              maintenanceJobs: { orderBy: { createdAt: "desc" }, take: 5 },
            },
          },
        },
      })
    : null;

  const vehicle = driver?.assignedVehicle;

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-white">My Vehicle</h1>
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-12 text-center">
          <i className="fas fa-car text-3xl text-gray-500 mb-4"></i>
          <p className="text-gray-400">No vehicle currently assigned to you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Vehicle</h1>
        <p className="text-gray-400 mt-1">Assigned vehicle details and service history</p>
      </div>

      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Registration</p>
            <p className="text-lg font-mono text-brand-gold font-bold">{vehicle.registration}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Make / Model</p>
            <p className="text-lg text-white font-semibold">{vehicle.make} {vehicle.model}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Year</p>
            <p className="text-lg text-white font-semibold">{vehicle.year}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
            <StatusBadge status={vehicle.status} size="md" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Mileage</p>
            <p className="text-lg text-white font-semibold">{vehicle.mileage.toLocaleString()} km</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Fuel Type</p>
            <p className="text-lg text-white font-semibold">{vehicle.fuelType}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Type</p>
            <p className="text-lg text-white font-semibold">{vehicle.type}</p>
          </div>
        </div>
      </div>

      {vehicle.vehicleServices.length > 0 && (
        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Upcoming Services</h2>
          <div className="space-y-3">
            {vehicle.vehicleServices.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{s.serviceType}</p>
                  <p className="text-xs text-gray-400">Due: {new Date(s.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
