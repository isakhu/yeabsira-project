"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InteractiveModal from "./InteractiveModal";

export function AddVehicleButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    registration: "",
    type: "SUV",
    make: "Toyota",
    model: "Land Cruiser",
    year: "2023",
    fuelType: "Diesel",
    mileage: "0",
    status: "IDLE",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create vehicle");

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
      >
        <i className="fas fa-plus"></i> Add Vehicle
      </button>

      <InteractiveModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register New Vehicle">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Registration (Plate No.)</label>
              <input
                required
                placeholder="e.g. AA-9900"
                value={form.registration}
                onChange={(e) => setForm({ ...form, registration: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Vehicle Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              >
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Bus">Bus</option>
                <option value="Pickup">Pickup</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Make</label>
              <input
                required
                placeholder="Toyota, Isuzu, etc."
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Model</label>
              <input
                required
                placeholder="Hilux, Elantra, etc."
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Fuel Type</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Initial Mileage (km)</label>
              <input
                type="number"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-gold hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </>
  );
}

export function AddBookingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    destination: "",
    purpose: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to submit booking");

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
      >
        <i className="fas fa-plus"></i> Request Trip Booking
      </button>

      <InteractiveModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Trip Booking Requisition">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="text-xs text-gray-300 block mb-1">Destination</label>
            <input
              required
              placeholder="e.g. Bahir Dar Regional Office"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Purpose of Trip</label>
            <textarea
              required
              rows={3}
              placeholder="Brief description of the official business..."
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Departure Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Return Date (Optional)</label>
              <input
                type="date"
                value={(form as any).returnDate || ""}
                onChange={(e) => setForm({ ...form, returnDate: e.target.value } as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Booking"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </>
  );
}

export function AddMaintenanceButton({ vehicles }: { vehicles?: { id: number; registration: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    vehicleId: vehicles?.[0]?.id ? String(vehicles[0].id) : "",
    problem: "",
    description: "",
    priority: "MEDIUM",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to log maintenance job");

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
      >
        <i className="fas fa-wrench"></i> Log Maintenance Job
      </button>

      <InteractiveModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Garage Repair / Service Work Order">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="text-xs text-gray-300 block mb-1">Target Vehicle *</label>
            {vehicles && vehicles.length > 0 ? (
              <select
                required
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration} {(v as any).make ? `— ${(v as any).make} ${(v as any).model}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                placeholder="Vehicle ID or Plate (e.g. 1)"
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            )}
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Problem Title</label>
            <input
              required
              placeholder="e.g. Engine overheating, Brake pad wear"
              value={form.problem}
              onChange={(e) => setForm({ ...form, problem: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Notes on symptoms, diagnostic scans, or required parts..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Log Repair Job"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </>
  );
}

export function AddFuelButton({ vehicles }: { vehicles?: { id: number; registration: string; make?: string; model?: string }[] } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    vehicleId: vehicles?.[0]?.id ? String(vehicles[0].id) : "",
    quantity: "",
    cost: "",
    odometer: "",
    fuelType: "Diesel",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to log fuel transaction");

      setIsOpen(false);
      setForm({
        vehicleId: vehicles?.[0]?.id ? String(vehicles[0].id) : "",
        quantity: "",
        cost: "",
        odometer: "",
        fuelType: "Diesel",
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
      >
        <i className="fas fa-gas-pump"></i> Log Fuel Refill
      </button>

      <InteractiveModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Fuel Refill Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Vehicle *</label>
              {vehicles && vehicles.length > 0 ? (
                <select
                  required
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration} {v.make ? `— ${v.make} ${v.model}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  placeholder="Vehicle ID (e.g. 1)"
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Fuel Type</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">Quantity (Liters)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 60.5"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Total Cost (ETB)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 4200"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">Current Odometer (km)</label>
              <input
                type="number"
                placeholder="e.g. 45200"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Recording..." : "Log Fuel"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </>
  );
}

export function AddUserButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    userId: "",
    name: "",
    role: "TRANSPORT_MANAGER",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create user account");

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
      >
        <i className="fas fa-user-plus"></i> Create User Account
      </button>

      <InteractiveModal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New System User Account">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-xl text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1">User ID</label>
              <input
                required
                placeholder="e.g. 5001"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1">System Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="TRANSPORT_MANAGER">TRANSPORT_MANAGER</option>
                <option value="FLEET_MANAGER">FLEET_MANAGER</option>
                <option value="DRIVER">DRIVER</option>
                <option value="MECHANIC">MECHANIC</option>
                <option value="FUEL_CONTROLLER">FUEL_CONTROLLER</option>
                <option value="HR">HR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Full Name</label>
            <input
              required
              placeholder="e.g. Abebe Bikila"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1">Initial Password</label>
            <input
              type="password"
              required
              placeholder="Password..."
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </InteractiveModal>
    </>
  );
}
