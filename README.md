# Fleet Management System (FMS)

An enterprise-grade, full-stack Fleet Management System built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM (SQLite)**.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.18 or higher recommended)
- **npm** or **pnpm** / **yarn**

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file (if not present):
```env
DATABASE_URL="file:./dev.db"
```

Create a `.env.local` file for session secrets:
```env
SESSION_SECRET="fms-session-secret-key-change-in-production-32chars!"
```

### 4. Database Setup
The repository includes the pre-configured SQLite database schema and migrations.
To synchronize or apply migrations:
```bash
npx prisma migrate dev
```

*(Optional)* To populate with sample operational data:
```bash
npm run db:seed:dev
```



---

## 🛠️ Core Features

- **Role-Based Access Control (RBAC):** 7 specialized roles with granular route guards and middleware security.
- **Vehicle Inventory & Telematics:** Vehicle registration, status tracking (`IDLE`, `FIELD_WORK`, `GARAGE`), and driver assignment.
- **Transport & Dispatch:** Requisition approval workflows, automated assignments, and dispatch scheduling.
- **Garage & Maintenance Management:** Work order generation, priority triage, and mechanic task tracking.
- **Fuel Tracking & Consumption Analytics:** Dispensation logs, efficiency analytics, and per-vehicle fuel cost tracking.
- **Workforce Directory & Compliance:** Driver licensing, medical certification monitoring, and safety violation scoring.
- **Universal CSV Export:** Real-time data exports with Excel Unicode UTF-8 BOM support and formula injection defense.
- **Interactive Analytics:** Executive dashboards and visual statistics across all organizational operations.

---

## 📦 Production Build

```bash
npm run build
npm start
```
