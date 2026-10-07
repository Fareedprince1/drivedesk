# 🚗 DriveDesk — Driving School Management System

![DriveDesk Banner](https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80)

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?logo=supabase)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **DriveDesk** is an admin-only driving school management application tailored for Indian driving schools. It replaces paper logbooks, phone calls, and manual registers with automated 30-minute slot scheduling, conflict-free double-booking prevention, fee collection receipts with WhatsApp reminders, a 6-stage RTO driving licence pipeline, vehicle maintenance tracking, and financial profit & loss analytics.

---

## 🌟 Key Features

### 1. 🇮🇳 Indian Localization Built-In
- **Currency**: Indian Rupees (`₹2,50,000`, `₹12,000`) with standard Indian numbering grouping.
- **Dates & Times**: Standard `DD-MM-YYYY` display, 12-hour AM/PM format, and `Asia/Kolkata` (IST) timezone.
- **Direct WhatsApp & Phone Integration**: 1-click links with pre-filled payment reminders, class notifications, and test alerts.

### 2. 📅 Conflict-Free Scheduling (30-Min Slot Grid)
- Interactive daily calendar grid from **06:00 to 20:00** with instructor columns.
- **Triple Double-Booking Prevention**: Database and client-side guards prevent overlaps on `(Instructor, Date, Time)`, `(Vehicle, Date, Time)`, and `(Candidate, Date, Time)`.
- **Multi-Booking Generator**: Generate 5, 10, 15, or 20 recurring weekday/daily appointments in one click.
- **Bulk Reassignment Modal**: Reassign an instructor's entire daily batch to another instructor if they call in sick.

### 3. 💳 Payments, Receipts & Balance Recovery
- Itemized payment ledger with automated receipt numbering (`R-1001`, `R-1002`...).
- Clean, printable receipt modal with instant WhatsApp sharing.
- Admin-only reversal workflow with audit logging (preserves accounting history without hard deletions).
- **Pending Balance Recovery Desk**: Live aging summary, total outstanding tally, and 1-tap WhatsApp fee reminders.

### 4. 🚦 6-Stage RTO Pipeline & Driving Tests
- Visual **Kanban Board** & tabular list covering:
  1. `LL Pending` (Learner's Licence application)
  2. `LL Completed` (LL number active)
  3. `Training Ongoing` (Practical classes in progress)
  4. `Test Booked` (Official RTO driving test date & track assigned)
  5. `Test Completed` (Pass / Fail outcome recorded)
  6. `Licence Received` (Smart Card DL issued)
- **7-Day Upcoming Tests Alert Banner** with audit warnings:
  - ⚠️ **Incomplete Training**: Flags candidates whose remaining classes $> 0$.
  - ⚠️ **Pending Balance**: Flags candidates with unpaid fee balances.
- Modal to record test outcome: prompt for licence number on **Pass** or automatic re-test scheduling on **Fail**.

### 5. 👥 Instructors & 🚘 Fleet Maintenance
- **Instructors**: Working hours (`06:00 - 15:00`), lesson delivery stats, and leave scheduling that blocks calendar bookings.
- **Vehicles**: Color-coded 4-pillar document expiry indicators (Insurance, Pollution, Fitness, Road Tax) with green/amber/red alerts, plus an `In Service` toggle blocking vehicle bookings.

### 6. 📊 Expenses & Reports (Admin Only)
- **Expenses**: Fuel, vehicle maintenance, staff salaries, office overheads, and RTO fees.
- **Reports**: P&L operating margins, payment mode breakdowns (UPI, Cash, Card), instructor utilization, and vehicle cost-per-class.
- **Exports**: Instant CSV download with UTF-8 BOM (Excel-compatible), print-ready PDF styling, and full database JSON backups.

### 7. 🛡️ Role-Based Access Control
- **Admin (Owner)**: Unrestricted access to all modules, financial metrics, expenses, reports, packages, and system settings.
- **Staff (Receptionist)**: Focused operations desk (candidates, attendance, payments, calendar); access to financial expenses, reports, and settings is automatically hidden and guarded.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Backend / Database**: Supabase (PostgreSQL 15+, Row Level Security, Sequences, Triggers)
- **Fallback Engine**: Local storage database engine with seed data for offline or demo usage
- **Hosting**: Vercel

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/drivedesk.git
cd drivedesk
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment configuration (Optional for cloud Supabase)
DriveDesk runs out-of-the-box in **Local Mode** with complete seed data. To connect to your cloud Supabase database:

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your Supabase keys:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start local development server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

---

## 🌐 Deploy to Vercel

DriveDesk is pre-configured with [`vercel.json`](./vercel.json) for Single-Page Application (SPA) URL rewrites.

### Method 1: Deploy via Vercel Dashboard (Recommended)
1. Push your repository to **GitHub**.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your **`drivedesk`** repository.
4. Framework Preset: **Vite** (auto-detected).
5. Build Command: `npm run build` (auto-detected).
6. Output Directory: `dist` (auto-detected).
7. *(Optional)* Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
8. Click **Deploy**.

### Method 2: Deploy using Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 🗄️ Supabase Database Setup

To run your own Supabase backend:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repository, paste the entire SQL file into the editor, and click **Run**.
4. The script automatically sets up:
   - All 16 database tables
   - Sequences for candidate codes (`DS0001`...) and receipt numbers (`R-1001`...)
   - 3 partial unique indexes preventing appointment double-booking overlaps
   - Row Level Security (RLS) policies
   - Automated timestamp triggers and views
   - Real Supabase authentication role trigger (`handle_new_user()`)

5. *(Optional)* If you already ran `schema.sql` earlier and want to configure live user roles and auto-confirmation, run [`supabase/auth_setup.sql`](./supabase/auth_setup.sql) in your SQL editor.

---

## 📁 Project Structure

```
drivedesk/
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # Reusable UI components & layouts
│   │   ├── common/         # Modals, Badges, Search modals
│   │   └── layout/         # Sidebar, Header, Mobile Drawer
│   ├── context/            # AuthContext (role isolation & credentials)
│   ├── lib/
│   │   ├── exportUtils.ts  # CSV export with UTF-8 BOM & JSON backups
│   │   ├── formatters.ts   # INR currency, Indian dates, 12h time, WhatsApp links
│   │   ├── storage.ts      # Local database engine, validators & seed data
│   │   └── supabase.ts     # Supabase client initializer
│   ├── pages/              # Application pages
│   │   ├── appointments/   # 30-min slot calendar, multi-booking, bulk reassign
│   │   ├── candidates/     # Candidate directory & candidate detail profile
│   │   ├── expenses/       # Expense tracking & category breakdown
│   │   ├── instructors/    # Instructor directory, workload & leave blocking
│   │   ├── payments/       # Payment ledger, receipt print & reversals
│   │   ├── pending-balance/# Fee recovery desk & 1-tap WhatsApp reminders
│   │   ├── reports/        # P&L, revenue, utilization & vehicle analytics
│   │   ├── rto/            # 6-stage RTO Kanban pipeline & test results
│   │   ├── settings/       # Packages, school profile, rules & data backup
│   │   ├── Dashboard.tsx   # Morning admin dashboard with alerts & schedule
│   │   └── Login.tsx       # 1-click demo login & authentication
│   ├── types/              # Comprehensive TypeScript interfaces
│   ├── App.tsx             # Route configuration & role guards
│   ├── index.css           # Custom styles & Tailwind utilities
│   └── main.tsx            # React application entry point
├── supabase/
│   └── schema.sql          # Full PostgreSQL DDL, sequences, RLS & triggers
├── vercel.json             # Vercel SPA routing rewrite rules
└── package.json            # Project dependencies & scripts
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
