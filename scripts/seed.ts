/**
 * NexusCMS Database Seeder
 * Usage: npm run seed
 * Seeds admin user, departments, employees, projects, tasks, expenses
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexuscms';

// ── Inline schemas (avoid import issues in standalone script) ──────────────
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ['Admin', 'Manager', 'Employee'], default: 'Employee' },
    avatar: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const DeptSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    head: String,
    description: String,
    budget: Number,
    color: String,
  },
  { timestamps: true }
);

const EmpSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    role: String,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    salary: Number,
    status: String,
    joinDate: Date,
    avatar: String,
    phone: String,
    performance: { type: Number, default: 85 },
  },
  { timestamps: true }
);

const ProjSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    status: String,
    priority: String,
    budget: Number,
    spent: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    priority: String,
    status: String,
    dueDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [String],
  },
  { timestamps: true }
);

const ExpSchema = new mongoose.Schema(
  {
    description: String,
    category: String,
    amount: Number,
    date: Date,
    status: { type: String, default: 'Pending' },
    department: String,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

// Register models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Dept = mongoose.models.Department || mongoose.model('Department', DeptSchema);
const Emp = mongoose.models.Employee || mongoose.model('Employee', EmpSchema);
const Proj = mongoose.models.Project || mongoose.model('Project', ProjSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpSchema);

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 NexusCMS Database Seeder');
  console.log('────────────────────────────');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Dept.deleteMany({}),
    Emp.deleteMany({}),
    Proj.deleteMany({}),
    Task.deleteMany({}),
    Expense.deleteMany({}),
  ]);
  console.log('🗑  Cleared existing data\n');

  // ── 1. Users ──────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash('admin123', 12);
  const managerPw = await bcrypt.hash('manager123', 12);
  const employeePw = await bcrypt.hash('employee123', 12);

  const [adminUser, managerUser, employeeUser] = await User.insertMany([
    { name: 'Alexandra Chen', email: 'admin@nexuscms.com', password: adminPw, role: 'Admin', avatar: 'AC', isActive: true },
    { name: 'Marcus Johnson', email: 'manager@nexuscms.com', password: managerPw, role: 'Manager', avatar: 'MJ', isActive: true },
    { name: 'Sofia Rodriguez', email: 'employee@nexuscms.com', password: employeePw, role: 'Employee', avatar: 'SR', isActive: true },
  ]);

  console.log('👤 Users created:');
  console.log('   admin@nexuscms.com    → password: admin123    (Admin)');
  console.log('   manager@nexuscms.com  → password: manager123  (Manager)');
  console.log('   employee@nexuscms.com → password: employee123 (Employee)');

  // ── 2. Departments ────────────────────────────────────────────────────────
  const depts = await Dept.insertMany([
    { name: 'Engineering',  head: 'Alexandra Chen',   description: 'Core product development and infrastructure', budget: 850000, color: '#4F8EF7' },
    { name: 'Product',      head: 'Marcus Johnson',   description: 'Product strategy and roadmap management',     budget: 420000, color: '#2DD4A0' },
    { name: 'Design',       head: 'Sofia Rodriguez',  description: 'UI/UX design and brand identity',             budget: 310000, color: '#9B6FF5' },
    { name: 'Finance',      head: 'Zara Patel',       description: 'Financial planning and reporting',            budget: 280000, color: '#F59E0B' },
    { name: 'Marketing',    head: 'Noah Williams',    description: 'Growth marketing and brand communications',   budget: 390000, color: '#F04F5A' },
  ]);
  console.log(`\n🏢 Departments created: ${depts.length}`);

  // ── 3. Employees ──────────────────────────────────────────────────────────
  const employees = await Emp.insertMany([
    { name: 'Alexandra Chen',  email: 'a.chen@corp.com',      role: 'Admin',    department: depts[0]._id, salary: 120000, status: 'Active',   joinDate: new Date('2021-03-15'), avatar: 'AC', phone: '+1 555 010 0001', performance: 94 },
    { name: 'Marcus Johnson',  email: 'm.johnson@corp.com',   role: 'Manager',  department: depts[1]._id, salary: 105000, status: 'Active',   joinDate: new Date('2020-07-22'), avatar: 'MJ', phone: '+1 555 010 0002', performance: 88 },
    { name: 'Sofia Rodriguez', email: 's.rodriguez@corp.com', role: 'Employee', department: depts[2]._id, salary: 88000,  status: 'Active',   joinDate: new Date('2022-01-10'), avatar: 'SR', phone: '+1 555 010 0003', performance: 91 },
    { name: 'Liam Park',       email: 'l.park@corp.com',      role: 'Employee', department: depts[0]._id, salary: 95000,  status: 'Active',   joinDate: new Date('2021-11-05'), avatar: 'LP', phone: '+1 555 010 0004', performance: 87 },
    { name: 'Zara Patel',      email: 'z.patel@corp.com',     role: 'Manager',  department: depts[3]._id, salary: 110000, status: 'Active',   joinDate: new Date('2019-08-30'), avatar: 'ZP', phone: '+1 555 010 0005', performance: 96 },
    { name: 'Noah Williams',   email: 'n.williams@corp.com',  role: 'Employee', department: depts[4]._id, salary: 82000,  status: 'Inactive', joinDate: new Date('2023-02-14'), avatar: 'NW', phone: '+1 555 010 0006', performance: 72 },
    { name: 'Emma Thompson',   email: 'e.thompson@corp.com',  role: 'Employee', department: depts[2]._id, salary: 90000,  status: 'Active',   joinDate: new Date('2022-06-20'), avatar: 'ET', phone: '+1 555 010 0007', performance: 89 },
    { name: 'Kai Anderson',    email: 'k.anderson@corp.com',  role: 'Employee', department: depts[0]._id, salary: 98000,  status: 'Active',   joinDate: new Date('2021-09-12'), avatar: 'KA', phone: '+1 555 010 0008', performance: 93 },
  ]);
  console.log(`👥 Employees created: ${employees.length}`);

  // ── 4. Projects ───────────────────────────────────────────────────────────
  const projects = await Proj.insertMany([
    {
      title: 'Platform v3.0',
      description: 'Next-gen platform rebuild with microservices architecture',
      department: depts[0]._id,
      status: 'In Progress', priority: 'High',
      budget: 280000, spent: 142000, progress: 58,
      startDate: new Date('2024-01-15'), endDate: new Date('2024-08-30'),
      team: [employees[0]._id, employees[3]._id, employees[7]._id],
      createdBy: adminUser._id,
    },
    {
      title: 'Mobile App Launch',
      description: 'iOS & Android consumer app release',
      department: depts[1]._id,
      status: 'In Progress', priority: 'Critical',
      budget: 190000, spent: 167000, progress: 82,
      startDate: new Date('2024-02-01'), endDate: new Date('2024-06-15'),
      team: [employees[1]._id, employees[2]._id, employees[6]._id],
      createdBy: adminUser._id,
    },
    {
      title: 'Brand Refresh',
      description: 'Complete visual identity overhaul and brand guidelines',
      department: depts[2]._id,
      status: 'Completed', priority: 'Medium',
      budget: 65000, spent: 61000, progress: 100,
      startDate: new Date('2023-11-01'), endDate: new Date('2024-03-31'),
      team: [employees[2]._id, employees[6]._id],
      createdBy: adminUser._id,
    },
    {
      title: 'Q2 Marketing Campaign',
      description: 'Multi-channel growth campaign targeting SMB segment',
      department: depts[4]._id,
      status: 'Planning', priority: 'High',
      budget: 120000, spent: 8000, progress: 12,
      startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30'),
      team: [employees[5]._id],
      createdBy: adminUser._id,
    },
    {
      title: 'Financial Dashboard',
      description: 'Executive reporting and analytics platform',
      department: depts[3]._id,
      status: 'Review', priority: 'Medium',
      budget: 45000, spent: 38000, progress: 91,
      startDate: new Date('2024-01-20'), endDate: new Date('2024-05-01'),
      team: [employees[4]._id],
      createdBy: adminUser._id,
    },
  ]);
  console.log(`📐 Projects created: ${projects.length}`);

  // ── 5. Tasks ──────────────────────────────────────────────────────────────
  const tasks = await Task.insertMany([
    { title: 'API Gateway Implementation',  description: 'Set up Kong API gateway with rate limiting and auth',       project: projects[0]._id, assignee: employees[0]._id, priority: 'High',     status: 'In Progress', dueDate: new Date('2024-05-20'), createdBy: adminUser._id, tags: ['backend', 'infrastructure'] },
    { title: 'User Auth Redesign',           description: 'Redesign login/signup flows for better conversion',          project: projects[1]._id, assignee: employees[2]._id, priority: 'Critical', status: 'Done',        dueDate: new Date('2024-04-15'), createdBy: adminUser._id, tags: ['design', 'auth'] },
    { title: 'Database Migration',           description: 'Migrate PostgreSQL to distributed setup with sharding',       project: projects[0]._id, assignee: employees[3]._id, priority: 'High',     status: 'Todo',        dueDate: new Date('2024-06-01'), createdBy: adminUser._id, tags: ['database', 'backend'] },
    { title: 'Analytics Integration',        description: 'Integrate Mixpanel with custom event tracking',               project: projects[1]._id, assignee: employees[1]._id, priority: 'Medium',   status: 'In Progress', dueDate: new Date('2024-05-10'), createdBy: adminUser._id, tags: ['analytics'] },
    { title: 'Performance Audit',            description: 'Lighthouse and load testing report with remediation plan',    project: projects[0]._id, assignee: employees[7]._id, priority: 'Medium',   status: 'Todo',        dueDate: new Date('2024-05-25'), createdBy: adminUser._id, tags: ['performance'] },
    { title: 'Brand Guidelines Document',    description: 'Finalize comprehensive brand guidelines PDF and style guide', project: projects[2]._id, assignee: employees[6]._id, priority: 'Low',      status: 'Done',        dueDate: new Date('2024-03-20'), createdBy: adminUser._id, tags: ['design', 'docs'] },
    { title: 'Competitor Analysis',          description: 'Research and analyse top 10 competitors in the SMB space',   project: projects[3]._id, assignee: employees[5]._id, priority: 'Medium',   status: 'In Progress', dueDate: new Date('2024-04-30'), createdBy: adminUser._id, tags: ['research'] },
    { title: 'Revenue Dashboard Build',      description: 'Build executive revenue overview with drill-down charts',     project: projects[4]._id, assignee: employees[4]._id, priority: 'High',     status: 'Review',      dueDate: new Date('2024-04-25'), createdBy: adminUser._id, tags: ['dashboard', 'finance'] },
    { title: 'Push Notification System',     description: 'Implement push notifications for iOS and Android',           project: projects[1]._id, assignee: employees[7]._id, priority: 'High',     status: 'Todo',        dueDate: new Date('2024-05-30'), createdBy: adminUser._id, tags: ['mobile', 'backend'] },
    { title: 'Design System Component Lib',  description: 'Create reusable component library with Storybook docs',      project: projects[2]._id, assignee: employees[2]._id, priority: 'Medium',   status: 'Done',        dueDate: new Date('2024-03-15'), createdBy: adminUser._id, tags: ['design', 'frontend'] },
  ]);
  console.log(`✦  Tasks created: ${tasks.length}`);

  // ── 6. Expenses ───────────────────────────────────────────────────────────
  const expenses = await Expense.insertMany([
    { description: 'AWS Infrastructure Q2',      category: 'Technology',  amount: 28500, date: new Date('2024-04-01'), status: 'Approved', department: 'Engineering', submittedBy: adminUser._id   },
    { description: 'Figma & Design Tool Licenses', category: 'Software',  amount: 4200,  date: new Date('2024-04-03'), status: 'Approved', department: 'Design',       submittedBy: adminUser._id   },
    { description: 'Social Media Ad Budget',      category: 'Marketing',  amount: 18000, date: new Date('2024-04-05'), status: 'Pending',  department: 'Marketing',    submittedBy: adminUser._id   },
    { description: 'Q2 Team Building Event',      category: 'HR',         amount: 6800,  date: new Date('2024-04-08'), status: 'Approved', department: 'HR',           submittedBy: adminUser._id   },
    { description: 'Office Supplies & Stationery', category: 'Operations', amount: 1250,  date: new Date('2024-04-10'), status: 'Rejected', department: 'Operations',  submittedBy: managerUser._id },
    { description: 'KubeCon Conference Tickets',  category: 'Training',   amount: 9600,  date: new Date('2024-04-12'), status: 'Pending',  department: 'Engineering',  submittedBy: managerUser._id },
    { description: 'Salesforce CRM Annual License', category: 'Software', amount: 24000, date: new Date('2024-03-15'), status: 'Approved', department: 'Product',      submittedBy: adminUser._id   },
    { description: 'Business Travel - NYC Summit', category: 'Travel',    amount: 5400,  date: new Date('2024-04-18'), status: 'Pending',  department: 'Engineering',  submittedBy: adminUser._id   },
  ]);
  console.log(`💳 Expenses created: ${expenses.length}`);

  console.log('\n────────────────────────────');
  console.log('✅ Seeding complete!');
  console.log('\n📌 Quick-start login:');
  console.log('   URL:      http://localhost:3000/login');
  console.log('   Email:    admin@nexuscms.com');
  console.log('   Password: admin123');
  console.log('────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
