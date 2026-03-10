// ── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'Admin' | 'Manager' | 'Employee';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// ── Department ────────────────────────────────────────────────────────────────
export interface Department {
  _id: string;
  name: string;
  head: string;
  description: string;
  budget: number;
  color: string;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Employee ──────────────────────────────────────────────────────────────────
export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave';

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department | string;
  salary: number;
  status: EmployeeStatus;
  joinDate: string;
  avatar: string;
  phone?: string;
  address?: string;
  performance: number;
  createdAt: string;
  updatedAt: string;
}

// ── Project ───────────────────────────────────────────────────────────────────
export type ProjectStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Project {
  _id: string;
  title: string;
  description: string;
  department: Department | string;
  status: ProjectStatus;
  priority: Priority;
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string;
  team: Employee[] | string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Task ──────────────────────────────────────────────────────────────────────
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: Project | string;
  assignee: Employee | string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Expense ───────────────────────────────────────────────────────────────────
export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected';
export type ExpenseCategory =
  | 'Technology'
  | 'Software'
  | 'Marketing'
  | 'HR'
  | 'Operations'
  | 'Training'
  | 'Travel'
  | 'Other';

export interface Expense {
  _id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  status: ExpenseStatus;
  department: string;
  submittedBy: { _id: string; name: string; avatar: string } | string;
  reviewedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  activeProjects: number;
  totalProjects: number;
  pendingTasks: number;
  doneTasks: number;
  totalTasks: number;
  pendingExpenses: number;
  approvedExpensesTotal: number;
}
