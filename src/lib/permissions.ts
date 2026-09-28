// ─── Role & Permission Types ───

export const ROLES = {
  ADMIN: "ADMIN",
  TRANSPORT_MANAGER: "TRANSPORT_MANAGER",
  FLEET_MANAGER: "FLEET_MANAGER",
  DRIVER: "DRIVER",
  MECHANIC: "MECHANIC",
  FUEL_CONTROLLER: "FUEL_CONTROLLER",
  HR: "HR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Access levels
export type AccessLevel = "FULL" | "VIEW" | "OWN" | "NONE";

// Modules
export const MODULES = {
  DASHBOARD: "DASHBOARD",
  VEHICLES: "VEHICLES",
  VEHICLE_SERVICE: "VEHICLE_SERVICE",
  VEHICLE_MAINTENANCE: "VEHICLE_MAINTENANCE",
  FUEL_MANAGEMENT: "FUEL_MANAGEMENT",
  BOOKING: "BOOKING",
  DRIVER_ASSIGNMENT: "DRIVER_ASSIGNMENT",
  DRIVER_BEHAVIOR: "DRIVER_BEHAVIOR",
  REPORTS: "REPORTS",
  USERS: "USERS",
  ROLES_MGMT: "ROLES_MGMT",
  SYSTEM_SETTINGS: "SYSTEM_SETTINGS",
  EMPLOYEES: "EMPLOYEES",
  DRIVERS: "DRIVERS",
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

// ─── Permission Matrix ───

const PERMISSION_MATRIX: Record<Role, Record<Module, AccessLevel>> = {
  ADMIN: {
    DASHBOARD: "FULL",
    VEHICLES: "FULL",
    VEHICLE_SERVICE: "FULL",
    VEHICLE_MAINTENANCE: "FULL",
    FUEL_MANAGEMENT: "FULL",
    BOOKING: "FULL",
    DRIVER_ASSIGNMENT: "FULL",
    DRIVER_BEHAVIOR: "FULL",
    REPORTS: "FULL",
    USERS: "FULL",
    ROLES_MGMT: "FULL",
    SYSTEM_SETTINGS: "FULL",
    EMPLOYEES: "FULL",
    DRIVERS: "FULL",
  },
  TRANSPORT_MANAGER: {
    DASHBOARD: "FULL",
    VEHICLES: "VIEW",
    VEHICLE_SERVICE: "NONE",
    VEHICLE_MAINTENANCE: "NONE",
    FUEL_MANAGEMENT: "NONE",
    BOOKING: "FULL",
    DRIVER_ASSIGNMENT: "FULL",
    DRIVER_BEHAVIOR: "FULL",
    REPORTS: "FULL",
    USERS: "NONE",
    ROLES_MGMT: "NONE",
    SYSTEM_SETTINGS: "NONE",
    EMPLOYEES: "NONE",
    DRIVERS: "VIEW",
  },
  FLEET_MANAGER: {
    DASHBOARD: "FULL",
    VEHICLES: "FULL",
    VEHICLE_SERVICE: "FULL",
    VEHICLE_MAINTENANCE: "FULL",
    FUEL_MANAGEMENT: "VIEW",
    BOOKING: "FULL",
    DRIVER_ASSIGNMENT: "FULL",
    DRIVER_BEHAVIOR: "FULL",
    REPORTS: "FULL",
    USERS: "NONE",
    ROLES_MGMT: "NONE",
    SYSTEM_SETTINGS: "NONE",
    EMPLOYEES: "NONE",
    DRIVERS: "FULL",
  },
  DRIVER: {
    DASHBOARD: "FULL",
    VEHICLES: "OWN",
    VEHICLE_SERVICE: "OWN",
    VEHICLE_MAINTENANCE: "OWN",
    FUEL_MANAGEMENT: "NONE",
    BOOKING: "OWN",
    DRIVER_ASSIGNMENT: "OWN",
    DRIVER_BEHAVIOR: "OWN",
    REPORTS: "OWN",
    USERS: "NONE",
    ROLES_MGMT: "NONE",
    SYSTEM_SETTINGS: "NONE",
    EMPLOYEES: "NONE",
    DRIVERS: "NONE",
  },
  MECHANIC: {
    DASHBOARD: "FULL",
    VEHICLES: "FULL",
    VEHICLE_SERVICE: "FULL",
    VEHICLE_MAINTENANCE: "FULL",
    FUEL_MANAGEMENT: "NONE",
    BOOKING: "NONE",
    DRIVER_ASSIGNMENT: "NONE",
    DRIVER_BEHAVIOR: "NONE",
    REPORTS: "FULL",
    USERS: "NONE",
    ROLES_MGMT: "NONE",
    SYSTEM_SETTINGS: "NONE",
    EMPLOYEES: "NONE",
    DRIVERS: "NONE",
  },
  FUEL_CONTROLLER: {
    DASHBOARD: "FULL",
    VEHICLES: "VIEW",
    VEHICLE_SERVICE: "NONE",
    VEHICLE_MAINTENANCE: "NONE",
    FUEL_MANAGEMENT: "FULL",
    BOOKING: "NONE",
    DRIVER_ASSIGNMENT: "NONE",
    DRIVER_BEHAVIOR: "NONE",
    REPORTS: "FULL",
    USERS: "NONE",
    ROLES_MGMT: "NONE",
    SYSTEM_SETTINGS: "NONE",
    EMPLOYEES: "NONE",
    DRIVERS: "NONE",
  },
  HR: {
    DASHBOARD: "FULL",
    VEHICLES: "NONE",
    VEHICLE_SERVICE: "NONE",
    VEHICLE_MAINTENANCE: "NONE",
    FUEL_MANAGEMENT: "NONE",
    BOOKING: "NONE",
    DRIVER_ASSIGNMENT: "VIEW",
    DRIVER_BEHAVIOR: "FULL",
    REPORTS: "FULL",
    USERS: "NONE",
    ROLES_MGMT: "NONE",
    SYSTEM_SETTINGS: "NONE",
    EMPLOYEES: "FULL",
    DRIVERS: "FULL",
  },
};

// ─── Permission Helpers ───

export function getAccessLevel(role: Role, module: Module): AccessLevel {
  return PERMISSION_MATRIX[role]?.[module] ?? "NONE";
}

export function hasAccess(role: Role, module: Module): boolean {
  return getAccessLevel(role, module) !== "NONE";
}

export function hasFullAccess(role: Role, module: Module): boolean {
  return getAccessLevel(role, module) === "FULL";
}

// ─── Role → Dashboard Route Map ───

export const ROLE_DASHBOARD_ROUTES: Record<Role, string> = {
  ADMIN: "/admin",
  TRANSPORT_MANAGER: "/transport",
  FLEET_MANAGER: "/fleet",
  DRIVER: "/driver",
  MECHANIC: "/mechanic",
  FUEL_CONTROLLER: "/fuel",
  HR: "/hr",
};

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  ADMIN: "Administrator",
  TRANSPORT_MANAGER: "Transport Manager",
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  MECHANIC: "Mechanic",
  FUEL_CONTROLLER: "Fuel Controller",
  HR: "HR",
};

// ─── Route → Required Role Map ───

export function getRequiredRoleForRoute(pathname: string): Role | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/transport")) return "TRANSPORT_MANAGER";
  if (pathname.startsWith("/fleet")) return "FLEET_MANAGER";
  if (pathname.startsWith("/driver")) return "DRIVER";
  if (pathname.startsWith("/mechanic")) return "MECHANIC";
  if (pathname.startsWith("/fuel")) return "FUEL_CONTROLLER";
  if (pathname.startsWith("/hr")) return "HR";
  return null;
}

// ─── Route Access Check ───
// ADMIN has global FULL access to all operational dashboards.
// Other roles can only access their own route namespace.

export function canAccessRoute(role: Role, pathname: string): boolean {
  // Shared routes accessible by any authenticated user
  if (pathname === "/profile" || pathname.startsWith("/change-password")) {
    return true;
  }

  const requiredRole = getRequiredRoleForRoute(pathname);

  // No role requirement → accessible
  if (!requiredRole) return true;

  // ADMIN has FULL access to every operational route
  if (role === "ADMIN") return true;

  // Other roles: exact match only
  return role === requiredRole;
}

// ─── Sidebar Configuration ───

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  children?: SidebarItem[];
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export function getSidebarConfig(role: Role): SidebarGroup[] {
  const base = ROLE_DASHBOARD_ROUTES[role];

  switch (role) {
    case "ADMIN":
      return [
        {
          label: "Overview",
          items: [
            { label: "Dashboard", href: base, icon: "fas fa-gauge-high" },
            { label: "Statistics & Analytics", href: `${base}/statistics`, icon: "fas fa-chart-pie" },
          ],
        },
        {
          label: "Fleet Management",
          items: [
            { label: "Vehicles", href: `${base}/vehicles`, icon: "fas fa-truck" },
            { label: "Vehicle Service", href: `${base}/service`, icon: "fas fa-wrench" },
            { label: "Vehicle Maintenance", href: `${base}/maintenance`, icon: "fas fa-tools" },
          ],
        },
        {
          label: "Operations",
          items: [
            { label: "Booking", href: `${base}/bookings`, icon: "fas fa-calendar-check" },
            { label: "Driver Assignment", href: `${base}/assignments`, icon: "fas fa-id-card" },
            { label: "Driver Behavior", href: `${base}/behavior`, icon: "fas fa-tachometer-alt" },
          ],
        },
        {
          label: "Fuel",
          items: [
            { label: "Fuel Management", href: `${base}/fuel`, icon: "fas fa-gas-pump" },
          ],
        },
        {
          label: "Administration",
          items: [
            { label: "Users", href: `${base}/users`, icon: "fas fa-users-cog" },
            { label: "Employees", href: `${base}/employees`, icon: "fas fa-users" },
            { label: "Drivers", href: `${base}/drivers`, icon: "fas fa-id-card" },
          ],
        },
      ];

    case "TRANSPORT_MANAGER":
      return [
        {
          label: "Overview",
          items: [
            { label: "Dashboard", href: base, icon: "fas fa-gauge-high" },
            { label: "Statistics & Analytics", href: `${base}/statistics`, icon: "fas fa-chart-pie" },
          ],
        },
        {
          label: "Transport",
          items: [
            { label: "Booking Requests", href: `${base}/bookings`, icon: "fas fa-calendar-check" },
            { label: "Driver Assignment", href: `${base}/assignments`, icon: "fas fa-id-card" },
          ],
        },
        {
          label: "Fleet",
          items: [
            { label: "Vehicle Availability", href: `${base}/vehicles`, icon: "fas fa-truck" },
          ],
        },
        {
          label: "Drivers",
          items: [
            { label: "Driver Behavior", href: `${base}/behavior`, icon: "fas fa-tachometer-alt" },
          ],
        },
      ];

    case "FLEET_MANAGER":
      return [
        {
          label: "Overview",
          items: [
            { label: "Dashboard", href: base, icon: "fas fa-gauge-high" },
            { label: "Statistics & Analytics", href: `${base}/statistics`, icon: "fas fa-chart-pie" },
          ],
        },
        {
          label: "Fleet",
          items: [
            { label: "Vehicles", href: `${base}/vehicles`, icon: "fas fa-truck" },
            { label: "Vehicle Service", href: `${base}/service`, icon: "fas fa-wrench" },
            { label: "Vehicle Maintenance", href: `${base}/maintenance`, icon: "fas fa-tools" },
          ],
        },
        {
          label: "Operations",
          items: [
            { label: "Driver Assignment", href: `${base}/assignments`, icon: "fas fa-id-card" },
            { label: "Driver Behavior", href: `${base}/behavior`, icon: "fas fa-tachometer-alt" },
          ],
        },
        {
          label: "Fuel",
          items: [
            { label: "Fuel Overview", href: `${base}/fuel`, icon: "fas fa-gas-pump" },
          ],
        },
      ];

    case "DRIVER":
      return [
        {
          label: "Overview",
          items: [
            { label: "Dashboard", href: base, icon: "fas fa-gauge-high" },
          ],
        },
        {
          label: "My Transport",
          items: [
            { label: "My Assignments", href: `${base}/assignments`, icon: "fas fa-clipboard-list" },
            { label: "Booking Requests", href: `${base}/bookings`, icon: "fas fa-calendar-check" },
          ],
        },
        {
          label: "My Vehicle",
          items: [
            { label: "Vehicle Information", href: `${base}/vehicle`, icon: "fas fa-car" },
          ],
        },
        {
          label: "My Performance",
          items: [
            { label: "Driver Behavior", href: `${base}/behavior`, icon: "fas fa-tachometer-alt" },
          ],
        },
      ];

    case "MECHANIC":
      return [
        {
          label: "Overview",
          items: [
            { label: "Dashboard", href: base, icon: "fas fa-gauge-high" },
          ],
        },
        {
          label: "Maintenance",
          items: [
            { label: "Maintenance Jobs", href: `${base}/maintenance`, icon: "fas fa-tools" },
          ],
        },
        {
          label: "Vehicle Service",
          items: [
            { label: "Service Schedule", href: `${base}/service`, icon: "fas fa-calendar" },
          ],
        },
        {
          label: "Vehicles",
          items: [
            { label: "Vehicle Status", href: `${base}/vehicles`, icon: "fas fa-truck" },
          ],
        },
      ];

    case "FUEL_CONTROLLER":
      return [
        {
          label: "Overview",
          items: [
            { label: "Dashboard", href: base, icon: "fas fa-gauge-high" },
            { label: "Statistics & Analytics", href: `${base}/statistics`, icon: "fas fa-chart-pie" },
          ],
        },
        {
          label: "Fuel Management",
          items: [
            { label: "Fuel Transactions", href: `${base}/transactions`, icon: "fas fa-receipt" },
            { label: "Fuel Consumption", href: `${base}/consumption`, icon: "fas fa-gas-pump" },
          ],
        },
      ];

    case "HR":
      return [
        {
          label: "Overview",
          items: [
            { label: "Dashboard", href: base, icon: "fas fa-gauge-high" },
            { label: "Statistics & Analytics", href: `${base}/statistics`, icon: "fas fa-chart-pie" },
          ],
        },
        {
          label: "People",
          items: [
            { label: "Employees", href: `${base}/employees`, icon: "fas fa-users" },
            { label: "Drivers", href: `${base}/drivers`, icon: "fas fa-id-card" },
          ],
        },
        {
          label: "Driver Information",
          items: [
            { label: "Driver Behavior", href: `${base}/behavior`, icon: "fas fa-tachometer-alt" },
          ],
        },
      ];

    default:
      return [];
  }
}

