import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  StatMetricCard,
  BarChartCard,
  ProgressRingGauge,
  EmptyStatisticsState,
  CSVExportButton,
} from "@/components/dashboard/StatisticsCharts";
import DataTable from "@/components/dashboard/DataTable";

export default async function TransportStatisticsPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/signin");
  if (session.role !== "TRANSPORT_MANAGER" && session.role !== "ADMIN") redirect("/forbidden");

  const [
    totalBookings,
    bookingsByStatus,
    totalAssignments,
    assignmentsByStatus,
    topDestinations,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.assignment.count(),
    prisma.assignment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.groupBy({
      by: ["destination"],
      _count: { _all: true },
      orderBy: { _count: { destination: "desc" } },
      take: 5,
    }),
  ]);

  const bookingStatusMap = Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count._all]));
  const assignmentStatusMap = Object.fromEntries(assignmentsByStatus.map((a) => [a.status, a._count._all]));

  const pendingBookings = bookingStatusMap["PENDING"] || 0;
  const approvedBookings = bookingStatusMap["APPROVED"] || 0;
  const completedBookings = bookingStatusMap["COMPLETED"] || 0;
  const rejectedBookings = bookingStatusMap["REJECTED"] || 0;

  const totalDecided = approvedBookings + completedBookings + rejectedBookings;

  // Zero-Division Safe Calculations
  const approvalRatePct = totalBookings > 0 && totalDecided > 0
    ? ((approvedBookings + completedBookings) / totalBookings) * 100
    : null;

  const completionRatePct = totalBookings > 0 && totalDecided > 0
    ? (completedBookings / totalBookings) * 100
    : null;

  const csvHeaders = ["Category", "Metric", "Value"];
  const csvRows = [
    ["Transport", "Total Bookings", totalBookings],
    ["Transport", "Pending Bookings", pendingBookings],
    ["Transport", "Approved Bookings", approvedBookings],
    ["Transport", "Completed Bookings", completedBookings],
    ["Transport", "Rejected Bookings", rejectedBookings],
    ["Transport", "Approval Rate", approvalRatePct !== null ? `${approvalRatePct.toFixed(1)}%` : "Insufficient data"],
    ["Transport", "Completion Rate", completionRatePct !== null ? `${completionRatePct.toFixed(1)}%` : "Insufficient data"],
    ["Assignments", "Total Assignments", totalAssignments],
    ["Assignments", "Scheduled Assignments", assignmentStatusMap["SCHEDULED"] || 0],
    ["Assignments", "In-Progress Assignments", assignmentStatusMap["IN_PROGRESS"] || 0],
    ["Assignments", "Completed Assignments", assignmentStatusMap["COMPLETED"] || 0],
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Transport & Booking Operations Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Trip request volume, approval workflow trends, and driver assignment fulfillment.
          </p>
        </div>
        <CSVExportButton
          filename="FMS_Transport_Operations_Statistics"
          reportName="Transport Operations Statistics"
          headers={csvHeaders}
          rows={csvRows}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          title="Total Booking Requests"
          value={totalBookings}
          subtitle={`${pendingBookings} awaiting review`}
          icon="fas fa-calendar-check"
          color="gold"
        />
        <StatMetricCard
          title="Approved Transport Requests"
          value={approvedBookings + completedBookings}
          subtitle={`${approvedBookings} ready for dispatch`}
          icon="fas fa-check-double"
          color="green"
        />
        <StatMetricCard
          title="Driver Assignments"
          value={totalAssignments}
          subtitle={`${assignmentStatusMap["IN_PROGRESS"] || 0} currently on road`}
          icon="fas fa-id-card"
          color="blue"
        />
        <StatMetricCard
          title="Completed Trips"
          value={completedBookings}
          subtitle={`${rejectedBookings} requests rejected`}
          icon="fas fa-flag-checkered"
          color="purple"
        />
      </div>

      {/* Progress Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressRingGauge
          title="Booking Approval Rate"
          subtitle="Percentage of transport requests approved for dispatch"
          percentage={approvalRatePct}
          color="green"
        />

        <ProgressRingGauge
          title="Trip Completion Rate"
          subtitle="Percentage of total bookings successfully completed"
          percentage={completionRatePct}
          color="blue"
        />
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Booking Status Distribution"
          subtitle="Status breakdown of all trip requisitions"
          items={[
            { label: "Pending Approval", value: pendingBookings, color: "bg-amber-500" },
            { label: "Approved", value: approvedBookings, color: "bg-emerald-500" },
            { label: "Completed", value: completedBookings, color: "bg-blue-500" },
            { label: "Rejected", value: rejectedBookings, color: "bg-red-500" },
          ]}
        />

        <BarChartCard
          title="Driver Assignment Status"
          subtitle="Status breakdown of vehicle assignments"
          items={[
            { label: "Scheduled", value: assignmentStatusMap["SCHEDULED"] || 0, color: "bg-amber-500" },
            { label: "In Progress", value: assignmentStatusMap["IN_PROGRESS"] || 0, color: "bg-emerald-500" },
            { label: "Completed", value: assignmentStatusMap["COMPLETED"] || 0, color: "bg-blue-500" },
            { label: "Cancelled", value: assignmentStatusMap["CANCELLED"] || 0, color: "bg-red-500" },
          ]}
        />
      </div>

      {/* Top Travel Destinations */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Top Requested Trip Destinations</h3>
        {topDestinations.length === 0 ? (
          <EmptyStatisticsState
            title="No booking requests recorded"
            message="Popular destinations will populate here as employees submit transport booking requests."
          />
        ) : (
          <DataTable
            columns={[
              { key: "destination", label: "Destination Location", render: (v) => <span className="font-bold text-white">{String(v)}</span> },
              { key: "count", label: "Request Frequency", render: (_, item: any) => <span className="font-bold text-brand-gold">{item._count._all} trips</span> },
            ]}
            data={topDestinations}
            emptyMessage="No trip destination data found."
          />
        )}
      </div>
    </div>
  );
}
