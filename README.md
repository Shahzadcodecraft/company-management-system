# NexusCMS — Enterprise Company Management System

> A full-stack, production-ready Company Management System built with **Next.js 14**, **TypeScript**, **MongoDB**, and **NextAuth.js**. Features a dark-themed dashboard, role-based access control, and complete CRUD for every module.

![NexusCMS Dashboard](https://company-management-system-eight.vercel.app/login)

---

## ✨ Features

| Module | Capabilities |
|---|---|
| **Authentication** | Email/password login, Google OAuth, JWT sessions, RBAC |
| **Dashboard** | Live stats, project progress, task distribution, dept overview |
| **Employees** | Full CRUD, search/filter, performance tracking, profile view |
| **Departments** | Create/edit/delete, budget tracking, headcount display |
| **Projects** | Kanban-style filters, budget vs spend tracking, team assignment |
| **Tasks** | Drag-and-drop Kanban board (Todo → In Progress → Review → Done) |
| **Finance** | Expense submission, approve/reject workflow, category breakdown |
| **Reports** | Overview, workforce, project, financial reports + CSV export |
| **Settings** | Profile update, company config, notification/security toggles |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Database | MongoDB 7 via Mongoose 8 |
| Auth | NextAuth.js v4 (Credentials + Google OAuth) |
| Data Fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod validation |
| Styling | Inline styles + CSS modules (zero-config) |
| Notifications | react-hot-toast |
| Testing | Jest + React Testing Library |
| Deployment | Vercel / Docker + docker-compose |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20 LTS
- **MongoDB** ≥ 7 (local) **or** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- **npm** ≥ 10 (comes with Node 20)

---

### 1 — Clone & Install

```bash
git clone https://github.com/your-org/nexuscms.git
cd nexuscms
npm install
```

---

### 2 — Configure Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/nexuscms
NEXTAUTH_SECRET=some-random-32-character-string-here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=another-random-secret-string

# Optional – Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> **Tip:** Generate secrets with `openssl rand -base64 32`

---

### 3 — Seed the Database

```bash
npm run seed
```

This creates:
- 3 user accounts (Admin, Manager, Employee)
- 5 departments
- 8 employees
- 5 projects with progress data
- 10 tasks across all Kanban columns
- 8 expense records

**Demo credentials after seeding:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexuscms.com | admin123 |
| Manager | manager@nexuscms.com | manager123 |
| Employee | employee@nexuscms.com | employee123 |

---

### 4 — Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

---

## 📁 Project Structure

```
nexuscms/
├── app/                          # Next.js App Router
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # NextAuth + register endpoints
│   │   ├── employees/            # CRUD + [id]
│   │   ├── departments/          # CRUD + [id]
│   │   ├── projects/             # CRUD + [id]
│   │   ├── tasks/                # CRUD + [id]
│   │   ├── expenses/             # CRUD + status update
│   │   └── dashboard/            # Aggregated stats
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── layout.tsx            # Sidebar + topbar shell
│   │   ├── page.tsx              # Dashboard home
│   │   ├── employees/page.tsx
│   │   ├── departments/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── finance/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   ├── login/page.tsx            # Login / Register page
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── providers.tsx             # SessionProvider + QueryClient
│   ├── page.tsx                  # Root redirect (/ → /dashboard)
│   └── globals.css               # Global reset + scrollbar styles
│
├── components/
│   ├── layout/
│   │   └── DashboardShell.tsx    # Collapsible sidebar + sticky topbar
│   └── pages/                    # Client-side page components (React Query)
│       ├── DashboardClient.tsx
│       ├── EmployeesClient.tsx
│       ├── DepartmentsClient.tsx
│       ├── ProjectsClient.tsx
│       ├── TasksClient.tsx
│       ├── FinanceClient.tsx
│       ├── ReportsClient.tsx
│       └── SettingsClient.tsx
│
├── lib/
│   ├── db.ts                     # Mongoose singleton connection
│   ├── auth.ts                   # NextAuth options + callbacks
│   ├── api-helpers.ts            # Response helpers, pagination, validation
│   └── hooks/
│       └── useApi.ts             # React Query hooks for all resources
│
├── models/                       # Mongoose schemas
│   ├── User.ts
│   ├── Employee.ts
│   ├── Department.ts
│   ├── Project.ts
│   ├── Task.ts
│   ├── Expense.ts
│   └── AuditLog.ts
│
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
│
├── scripts/
│   └── seed.ts                   # Database seeder (npm run seed)
│
├── __tests__/
│   ├── api.test.ts               # API helper unit tests
│   └── components.test.tsx       # Component smoke tests
│
├── public/                       # Static assets
│   └── favicon.svg
│
├── middleware.ts                 # NextAuth route protection
├── next.config.js
├── tsconfig.json
├── jest.config.ts
├── jest.setup.ts
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 🔐 Role-Based Access Control

| Feature | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| View dashboard | ✅ | ✅ | ✅ |
| View all employees | ✅ | ✅ | ✅ |
| Create/edit employees | ✅ | ✅ | ❌ |
| Delete employees | ✅ | ❌ | ❌ |
| Create/edit projects | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ |
| Approve/reject expenses | ✅ | ✅ | ❌ |
| Manage departments | ✅ | ❌ | ❌ |
| Access settings | ✅ | ❌ | ❌ |

---

## 🌐 API Reference

All endpoints require a valid session (NextAuth JWT cookie).

### Employees
```
GET    /api/employees?search=&department=&role=&page=&limit=
POST   /api/employees                  { name, email, role, department, salary, status }
GET    /api/employees/:id
PUT    /api/employees/:id              { ...partial fields }
DELETE /api/employees/:id              Admin only
```

### Departments
```
GET    /api/departments
POST   /api/departments                { name, head, description, budget, color }
PUT    /api/departments/:id
DELETE /api/departments/:id            Admin only
```

### Projects
```
GET    /api/projects?status=&page=&limit=
POST   /api/projects                   { title, description, department, status, priority, budget, startDate, endDate }
GET    /api/projects/:id
PUT    /api/projects/:id               { ...partial fields }
DELETE /api/projects/:id               Admin only
```

### Tasks
```
GET    /api/tasks?project=&assignee=&status=
POST   /api/tasks                      { title, description, project, assignee, priority, status, dueDate }
PUT    /api/tasks/:id                  { ...partial fields }
DELETE /api/tasks/:id
```

### Expenses
```
GET    /api/expenses?status=
POST   /api/expenses                   { description, category, amount, date, department }
PUT    /api/expenses/:id               { status: 'Approved' | 'Rejected' }
DELETE /api/expenses/:id               Admin only
```

### Dashboard
```
GET    /api/dashboard                  Aggregated stats, recent projects, task distribution
```

### Auth
```
POST   /api/auth/register              { name, email, password, role }
POST   /api/auth/signin                Handled by NextAuth
GET    /api/auth/session               Current session
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## 🐳 Docker Deployment

### Option A — Docker Compose (recommended for dev/staging)

```bash
# Start MongoDB + App together
docker-compose up -d

# Seed the database inside the container
docker-compose exec app npm run seed

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Option B — Manual Docker build

```bash
docker build -t nexuscms:latest .

docker run -p 3000:3000 \
  -e MONGODB_URI="mongodb://..." \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  nexuscms:latest
```

---

## ☁️ Vercel Deployment

1. Push the project to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the following **Environment Variables** in the Vercel dashboard:

```
MONGODB_URI         → your Atlas connection string
NEXTAUTH_SECRET     → random 32-char string
NEXTAUTH_URL        → https://your-app.vercel.app
JWT_SECRET          → another random string
GOOGLE_CLIENT_ID    → (optional)
GOOGLE_CLIENT_SECRET → (optional)
```

4. Deploy — Vercel auto-detects Next.js and configures everything.

> **Important:** Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available) for the database when deploying to Vercel since local MongoDB won't be accessible.

---

## 🔧 MongoDB Atlas Setup (Cloud DB)

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new **free M0 cluster**
3. Create a **database user** with a strong password
4. Add `0.0.0.0/0` to the **IP allowlist** (or your server IP for production)
5. Click **Connect → Drivers** and copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nexuscms?retryWrites=true&w=majority
   ```
6. Paste it as `MONGODB_URI` in your `.env.local`

---

## 🎨 Design System

The UI uses a custom design system with CSS-in-JS inline styles:

| Token | Value | Use |
|---|---|---|
| `bg` | `#0A0B0F` | Page background |
| `surface` | `#111318` | Cards, sidebar |
| `border` | `#1E2430` | Dividers, outlines |
| `accent` | `#4F8EF7` | Primary actions, links |
| `success` | `#2DD4A0` | Active, completed states |
| `warning` | `#F59E0B` | Pending, in-progress |
| `danger` | `#F04F5A` | Errors, deletions |
| `purple` | `#9B6FF5` | Finance, secondary accent |
| `text` | `#E8ECF2` | Primary text |
| `textMuted` | `#6B7A99` | Labels, secondary text |

**Font:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) — loaded from Google Fonts

---

## 📋 Environment Variables Reference

| Variable | Required | Description |
|---|:---:|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing (min 32 chars) |
| `NEXTAUTH_URL` | ✅ | Full URL of the app (e.g. `http://localhost:3000`) |
| `JWT_SECRET` | ✅ | Separate secret for API JWT tokens |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | ❌ | Public app URL (for client-side links) |
| `NEXT_PUBLIC_APP_NAME` | ❌ | App name override (default: `NexusCMS`) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

---

## 📄 License

MIT © 2024 NexusCMS. See [LICENSE](LICENSE) for details.

---

## 🆘 Troubleshooting

**`MongoServerError: Authentication failed`**
→ Check your `MONGODB_URI` credentials. For Atlas, ensure the user has `readWrite` role on the `nexuscms` database.

**`[next-auth][error] NO_SECRET`**
→ Make sure `NEXTAUTH_SECRET` is set in `.env.local` and is at least 32 characters.

**`Module not found: Can't resolve '@/...'`**
→ Ensure `tsconfig.json` has `"paths": { "@/*": ["./*"] }` and you ran `npm install`.

**Login redirects back to `/login`**
→ Check that `NEXTAUTH_URL` matches the URL you're accessing (including port).

**Seed script fails**
→ Ensure MongoDB is running: `mongod --dbpath /data/db` or check your Atlas connection string.
