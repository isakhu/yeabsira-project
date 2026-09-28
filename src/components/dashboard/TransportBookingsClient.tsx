"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import DataTable from "./DataTable";
import { useRouter } from "next/navigation";
import { CSVExportButton } from "./StatisticsCharts";

interface BookingItem {
  id: number;
  destination: string;
  purpose: string;
  date: string;
  status: string;
  requester: {
    name: string;
    userId: string;
  };
  vehicle?: {
    registration: string;
  } | null;
}

export default function TransportBookingsClient({
  initialBookings,
  userRole,
}: {
  initialBookings: BookingItem[];
  userRole: string;
}) {
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("ALL");
  const router = useRouter();

  const filteredBookings = bookings.filter((b) => {
    if (filter === "ALL") return true;
    return b.status === filter;
  });

  async function handleStatusChange(id: number, newStatus: string) {
    setLoadingId(id);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update booking status");

      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-3 rounded-2xl border border-slate-700">
        <div className="flex flex-wrap gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === st
                  ? "bg-brand-gold text-slate-950 shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <CSVExportButton
          filename="FMS_Trip_Booking_Requisitions"
          reportName="Trip Booking Requisitions Report"
          headers={["Req ID", "Requester", "Destination", "Purpose", "Requested Date", "Status"]}
          rows={filteredBookings.map((b) => [
            `#${b.id}`,
            `${b.requester.name} (${b.requester.userId})`,
            b.destination,
            b.purpose,
            new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            b.status,
          ])}
          className="px-3.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600 transition-all cursor-pointer self-start sm:self-auto"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "id",
            label: "Req ID",
            render: (v) => <span className="font-mono text-brand-gold font-semibold">#{v as number}</span>,
          },
          { key: "requester", label: "Requester" },
          { key: "destination", label: "Destination" },
          { key: "purpose", label: "Purpose" },
          {
            key: "date",
            label: "Requested Date",
            render: (v) => new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          },
          { key: "status", label: "Status", render: (v) => <StatusBadge status={v as string} /> },
          {
            key: "actions",
            label: "Actions / Decision",
            render: (_, row) => {
              const item = row as unknown as BookingItem;
              if (item.status === "PENDING" && (userRole === "ADMIN" || userRole === "TRANSPORT_MANAGER")) {
                return (
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={loadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "APPROVED")}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                    >
                      <i className="fas fa-check"></i>
                      <span>Approve</span>
                    </button>
                    <button
                      disabled={loadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "REJECTED")}
                      className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                    >
                      <i className="fas fa-times"></i>
                      <span>Reject</span>
                    </button>
                  </div>
                );
              }
              if (item.status === "APPROVED" && (userRole === "ADMIN" || userRole === "TRANSPORT_MANAGER")) {
                return (
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={loadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "COMPLETED")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                    >
                      <i className="fas fa-flag-checkered"></i>
                      <span>Complete</span>
                    </button>
                    <button
                      disabled={loadingId === item.id}
                      onClick={() => handleStatusChange(item.id, "REJECTED")}
                      className="px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                    >
                      <i className="fas fa-times"></i>
                      <span>Cancel</span>
                    </button>
                  </div>
                );
              }
              if (item.status === "COMPLETED") {
                return (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <i className="fas fa-check-circle"></i> Fulfilled
                  </span>
                );
              }
              return <span className="text-xs text-gray-500 italic">No action required</span>;
            },
          },
        ]}
        data={filteredBookings.map((b) => ({
          ...b,
          requester: `${b.requester.name} (${b.requester.userId})`,
        }))}
        emptyMessage="No booking requisitions found."
      />
    </div>
  );
}
