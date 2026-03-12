'use client';

import { useState, useEffect } from 'react';
import { useEmployees, useProjects, useTasks, useExpenses, useSettings, useInvestors, useSalaries } from '@/lib/hooks/useApi';
import { jsPDF } from 'jspdf';

const C = { accent: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', purple: 'var(--purple)', text: 'var(--text)', textMuted: 'var(--text-muted)', surface: 'var(--surface)', border: 'var(--border)', bg: 'var(--bg)', surfaceHover: 'var(--surface-hover)' };

function ProgressBar({ value, color = C.accent }: { value: number; color?: string }) {
  return <div style={{ width: '100%', height: 6, background: C.border, borderRadius: 6 }}><div style={{ height: '100%', width: `${Math.min(100, value)}%`, borderRadius: 6, background: color }} /></div>;
}

function Badge({ label }: { label: string }) {
  const m: Record<string, string> = { Active: C.success, Completed: C.success, Done: C.success, 'In Progress': C.accent, Review: C.accent, Planning: C.warning, Pending: C.warning, Inactive: C.warning, High: C.danger, Critical: C.danger, Medium: C.warning, Low: C.textMuted };
  const c = m[label] || C.textMuted;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: c, background: `${c}18`, border: `1px solid ${c}30` }}>{label}</span>;
}

export default function ReportsClient() {
  const [activeReport, setActiveReport] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const { data: empData } = useEmployees({ limit: '100' });
  const { data: projData } = useProjects({ limit: '100' });
  const { data: tasksData } = useTasks();
  const { data: expData } = useExpenses({ limit: '100' });
  const { data: settingsData } = useSettings();
  const { data: invData } = useInvestors();
  const { data: salaryData } = useSalaries({ limit: '100' });
  const currency = settingsData?.settings?.currency || 'PKR';
  const currencySymbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const employees = empData?.employees || [];
  const projects = projData?.projects || [];
  const tasks: any[] = Array.isArray(tasksData) ? tasksData : [];
  const expenses: any[] = Array.isArray(expData) ? expData : [];
  const investors: any[] = invData?.investors || [];
  const salaries: any[] = Array.isArray(salaryData) ? salaryData : [];

  const totalBudget = projects.reduce((s: number, p: any) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s: number, p: any) => s + (p.spent || 0), 0);
  const avgPerf = employees.length > 0 ? employees.reduce((s: number, e: any) => s + (e.performance || 85), 0) / employees.length : 0;
  const totalExpAmt = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalInvestments = investors.reduce((s: number, i: any) => s + (i.investmentAmount || 0), 0);
  const totalSalaries = salaries.reduce((s: number, sal: any) => s + (sal.totalAmount || 0), 0);
  const totalPaidSalaries = salaries.reduce((s: number, sal: any) => s + (sal.paidAmount || 0), 0);
  const totalPendingSalaries = totalSalaries - totalPaidSalaries;

  const REPORTS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'employees', label: 'Workforce', icon: '👥' },
    { id: 'projects', label: 'Projects', icon: '📐' },
    { id: 'salary', label: 'Salary', icon: '💵' },
    { id: 'finance', label: 'Financial', icon: '💰' },
    { id: 'investors', label: 'Investors', icon: '🤝' },
  ];

  function downloadCSV() {
    const timestamp = new Date().toISOString().slice(0, 10);
    let rows: string[][] = [];
    let filename = '';

    switch (activeReport) {
      case 'employees':
        rows = [
          ['Name', 'Email', 'Role', 'Department', 'Salary', 'Status', 'Performance'],
          ...employees.map((e: any) => [
            e.name, e.email, e.role, e.department?.name || '', String(e.salary), e.status, String(e.performance || 85)
          ])
        ];
        filename = `workforce_report_${timestamp}.csv`;
        break;
      case 'projects':
        rows = [
          ['Title', 'Status', 'Priority', 'Budget', 'Spent', 'Progress', 'Start Date', 'End Date'],
          ...projects.map((p: any) => [
            p.title, p.status, p.priority, String(p.budget || 0), String(p.spent || 0), String(p.progress || 0),
            p.startDate?.slice(0, 10) || '', p.endDate?.slice(0, 10) || ''
          ])
        ];
        filename = `projects_report_${timestamp}.csv`;
        break;
      case 'finance':
        rows = [
          ['Description', 'Category', 'Department', 'Amount', 'Date', 'Status'],
          ...expenses.map((e: any) => [
            e.description, e.category, e.department, String(e.amount || 0), e.date?.slice(0, 10) || '', e.status
          ])
        ];
        filename = `financial_report_${timestamp}.csv`;
        break;
      case 'salary':
        rows = [
          ['Employee', 'Month', 'Year', 'Base Salary', 'Bonus', 'Deductions', 'Total Amount', 'Paid Amount', 'Remaining', 'Status', 'Payment Method'],
          ...salaries.map((s: any) => [
            s.employee?.name || '', String(s.month), String(s.year), String(s.baseSalary || 0), String(s.bonus || 0), String(s.deductions || 0),
            String(s.totalAmount || 0), String(s.paidAmount || 0), String((s.totalAmount || 0) - (s.paidAmount || 0)), s.status, s.paymentMethod || ''
          ])
        ];
        filename = `salary_report_${timestamp}.csv`;
        break;
      case 'investors':
        rows = [
          ['Name', 'Email', 'Company', 'Investment Amount', 'Investment Date', 'Type', 'Payment Method', 'Status'],
          ...investors.map((i: any) => [
            i.name, i.email, i.company || '', String(i.investmentAmount || 0), i.investmentDate?.slice(0, 10) || '', i.investmentType || 'Other', i.paymentMethod || '', i.isActive ? 'Active' : 'Inactive'
          ])
        ];
        filename = `investors_report_${timestamp}.csv`;
        break;
      case 'overview':
      default:
        rows = [
          ['Metric', 'Value'],
          ['Total Employees', String(employees.length)],
          ['Average Performance', `${avgPerf.toFixed(1)}%`],
          ['Active Projects', String(projects.filter((p: any) => p.status === 'In Progress').length)],
          ['Total Budget', `${currency} ${totalBudget.toLocaleString()}`],
          ['Budget Used', `${currency} ${totalSpent.toLocaleString()}`],
          ['Total Expenses', `${currency} ${totalExpAmt.toLocaleString()}`]
        ];
        filename = `overview_report_${timestamp}.csv`;
    }

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const timestamp = new Date().toISOString().slice(0, 10);
    let filename = '';
    let y = 20;

    doc.setFontSize(18);
    (doc as any).setFont('helvetica', 'bold');

    switch (activeReport) {
      case 'employees':
        doc.text('Workforce Report', 14, y);
        filename = `workforce_report_${timestamp}.pdf`;
        break;
      case 'projects':
        doc.text('Projects Report', 14, y);
        filename = `projects_report_${timestamp}.pdf`;
        break;
      case 'finance':
        doc.text('Financial Report', 14, y);
        filename = `financial_report_${timestamp}.pdf`;
        break;
      case 'salary':
        doc.text('Salary Report', 14, y);
        filename = `salary_report_${timestamp}.pdf`;
        break;
      case 'investors':
        doc.text('Investors Report', 14, y);
        filename = `investors_report_${timestamp}.pdf`;
        break;
      case 'overview':
      default:
        doc.text('Overview Report', 14, y);
        filename = `overview_report_${timestamp}.pdf`;
    }

    doc.setFontSize(10);
    (doc as any).setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, y + 8);
    y += 20;

    switch (activeReport) {
      case 'employees':
        employees.forEach((e: any, i: number) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          (doc as any).setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${e.name}`, 14, y);
          y += 6;
          (doc as any).setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const salary = (e.salary || 0).toLocaleString();
          doc.text(`Role: ${e.role} | Dept: ${e.department?.name || '-'} | Salary: ${currency} ${salary} | Performance: ${e.performance || 85}% | Status: ${e.status}`, 14, y);
          y += 10;
        });
        break;
      case 'projects':
        projects.forEach((p: any, i: number) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          (doc as any).setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${p.title}`, 14, y);
          y += 6;
          (doc as any).setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`Status: ${p.status} | Priority: ${p.priority} | Progress: ${p.progress || 0}%`, 14, y);
          y += 5;
          const budget = (p.budget || 0).toLocaleString();
          const spent = (p.spent || 0).toLocaleString();
          doc.text(`Budget: ${currency} ${budget} | Spent: ${currency} ${spent}`, 14, y);
          y += 10;
        });
        break;
      case 'finance':
        expenses.forEach((e: any, i: number) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          (doc as any).setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${e.description}`, 14, y);
          y += 6;
          (doc as any).setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const amount = (e.amount || 0).toLocaleString();
          doc.text(`Category: ${e.category} | Dept: ${e.department} | Amount: ${currency} ${amount} | Status: ${e.status}`, 14, y);
          y += 5;
          doc.text(`Date: ${e.date?.slice(0, 10) || '-'}`, 14, y);
          y += 10;
        });
        break;
      case 'salary':
        salaries.forEach((s: any, i: number) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          (doc as any).setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${s.employee?.name || 'Unknown'}`, 14, y);
          y += 6;
          (doc as any).setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const totalAmt = (s.totalAmount || 0).toLocaleString();
          const paidAmt = (s.paidAmount || 0).toLocaleString();
          const remaining = ((s.totalAmount || 0) - (s.paidAmount || 0)).toLocaleString();
          doc.text(`Period: ${s.month}/${s.year} | Base: ${currency} ${(s.baseSalary || 0).toLocaleString()} | Bonus: ${currency} ${(s.bonus || 0).toLocaleString()} | Deductions: ${currency} ${(s.deductions || 0).toLocaleString()}`, 14, y);
          y += 5;
          doc.text(`Total: ${currency} ${totalAmt} | Paid: ${currency} ${paidAmt} | Remaining: ${currency} ${remaining} | Status: ${s.status}`, 14, y);
          y += 10;
        });
        break;
      case 'investors':
        investors.forEach((inv: any, i: number) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          (doc as any).setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${inv.name}`, 14, y);
          y += 6;
          (doc as any).setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const amount = (inv.investmentAmount || 0).toLocaleString();
          doc.text(`Email: ${inv.email} | Company: ${inv.company || '-'} | Amount: ${currency} ${amount}`, 14, y);
          y += 5;
          doc.text(`Type: ${inv.investmentType || 'Other'} | Date: ${inv.investmentDate?.slice(0, 10) || '-'} | Status: ${inv.isActive ? 'Active' : 'Inactive'}`, 14, y);
          y += 10;
        });
        break;
      case 'overview':
      default:
        doc.setFontSize(12);
        const tBudget = totalBudget.toLocaleString();
        const tSpent = totalSpent.toLocaleString();
        const tExp = totalExpAmt.toLocaleString();
        const metrics = [
          ['Total Employees', String(employees.length)],
          ['Average Performance', `${avgPerf.toFixed(1)}%`],
          ['Active Projects', String(projects.filter((p: any) => p.status === 'In Progress').length)],
          ['Total Budget', `${currency} ${tBudget}`],
          ['Budget Used', `${currency} ${tSpent} (${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%)`],
          ['Total Expenses', `${currency} ${tExp}`]
        ];
        metrics.forEach(([label, value]) => {
          (doc as any).setFont('helvetica', 'bold');
          doc.text(`${label}:`, 14, y);
          (doc as any).setFont('helvetica', 'normal');
          doc.text(value, 70, y);
          y += 10;
        });
    }

    doc.save(filename);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {REPORTS.map((r) => (
          <button key={r.id} onClick={() => setActiveReport(r.id)} style={{
            padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            background: activeReport === r.id ? `${C.accent}22` : C.surface,
            color: activeReport === r.id ? C.accent : C.textMuted,
            border: `1px solid ${activeReport === r.id ? C.accent + '44' : C.border}`,
            transition: 'all 0.15s',
          }}><span>{r.icon}</span>{r.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={downloadCSV}
            style={{ padding: '9px 16px', borderRadius: 10, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>📄 Export CSV</button>
          <button onClick={downloadPDF}
            style={{ padding: '9px 16px', borderRadius: 10, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>📕 Export PDF</button>
        </div>
      </div>

      {activeReport === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Employees', v: employees.length, c: C.accent },
              { l: 'Avg Performance', v: `${avgPerf.toFixed(1)}%`, c: C.success },
              { l: 'Active Projects', v: projects.filter((p: any) => p.status === 'In Progress').length, c: C.warning },
              { l: 'Budget Used', v: totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : '—', c: C.purple },
            ].map((s) => (
              <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: s.c }}>{s.v}</h2>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.text }}>Project Progress Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {projects.slice(0, 5).map((p: any) => (
                  <div key={p._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.title}</span>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{p.progress || 0}%</span>
                    </div>
                    <ProgressBar value={p.progress || 0} color={(p.progress || 0) >= 100 ? C.success : (p.progress || 0) > 50 ? C.accent : C.warning} />
                  </div>
                ))}
                {projects.length === 0 && <p style={{ color: C.textMuted, fontSize: 13 }}>No projects yet</p>}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.text }}>Expense Summary</h3>
              {['Technology', 'Software', 'Marketing', 'HR', 'Operations'].map((cat, i) => {
                const catTotal = expenses.filter((e: any) => e.category === cat).reduce((s: number, e: any) => s + e.amount, 0);
                const pct = totalExpAmt > 0 ? (catTotal / totalExpAmt) * 100 : 0;
                const colors = [C.accent, C.success, C.warning, C.purple, C.danger];
                return catTotal > 0 ? (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{cat}</span>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{currencySymbol}{catTotal.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={pct} color={colors[i]} />
                  </div>
                ) : null;
              })}
              {expenses.length === 0 && <p style={{ color: C.textMuted, fontSize: 13 }}>No expense data</p>}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.text }}>Salary Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Total Salaries', value: `${currencySymbol}${totalSalaries.toLocaleString()}`, color: C.accent },
                  { label: 'Paid Amount', value: `${currencySymbol}${totalPaidSalaries.toLocaleString()}`, color: C.success },
                  { label: 'Pending Amount', value: `${currencySymbol}${totalPendingSalaries.toLocaleString()}`, color: totalPendingSalaries > 0 ? C.warning : C.success }
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: C.textMuted }}>{item.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
                {salaries.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: C.textMuted }}>Payment Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{totalSalaries > 0 ? Math.round((totalPaidSalaries / totalSalaries) * 100) : 0}%</span>
                    </div>
                    <div style={{ marginTop: 8 }}><ProgressBar value={totalSalaries > 0 ? (totalPaidSalaries / totalSalaries) * 100 : 0} color={C.success} /></div>
                  </div>
                )}
                {salaries.length === 0 && <p style={{ color: C.textMuted, fontSize: 13 }}>No salary data</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'employees' && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Employee Performance Report</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: C.bg }}>
                {['Name', 'Department', 'Role', 'Salary', 'Performance', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {employees.map((emp: any, i: number) => (
                  <tr key={emp._id} style={{ borderBottom: i < employees.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{emp.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{emp.department?.name || emp.department || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><Badge label={emp.role} /></td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{currencySymbol}{(emp.salary || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}><ProgressBar value={emp.performance || 85} color={(emp.performance || 85) > 90 ? C.success : C.accent} /></div>
                        <span style={{ fontSize: 11, color: C.textMuted }}>{emp.performance || 85}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><Badge label={emp.status} /></td>
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>No employees found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.map((p: any) => (
            <div key={p._id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: C.text }}>{p.title}</h4>
                  <div style={{ display: 'flex', gap: 8 }}><Badge label={p.status} /><Badge label={p.priority} /></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{p.progress || 0}%</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>complete</div>
                </div>
              </div>
              <ProgressBar value={p.progress || 0} color={(p.progress || 0) >= 100 ? C.success : (p.progress || 0) > 50 ? C.accent : C.warning} />
              <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
                {[['Budget', `${currencySymbol}${(p.budget || 0).toLocaleString()}`], ['Spent', `${currencySymbol}${(p.spent || 0).toLocaleString()}`], ['Start', p.startDate?.slice(0, 10) || '—'], ['End', p.endDate?.slice(0, 10) || '—']].map(([l, v]) => (
                  <span key={l} style={{ fontSize: 11, color: C.textMuted }}><strong style={{ color: C.text }}>{l}:</strong> {v}</span>
                ))}
              </div>
            </div>
          ))}
          {projects.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: C.textMuted }}>No projects found</div>}
        </div>
      )}

      {activeReport === 'finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { l: 'Total Expenses', v: `${currencySymbol}${totalExpAmt.toLocaleString()}`, c: C.danger },
              { l: 'Approved', v: `${currencySymbol}${expenses.filter((e: any) => e.status === 'Approved').reduce((s: number, e: any) => s + e.amount, 0).toLocaleString()}`, c: C.success },
              { l: 'Pending', v: `${currencySymbol}${expenses.filter((e: any) => e.status === 'Pending').reduce((s: number, e: any) => s + e.amount, 0).toLocaleString()}`, c: C.warning },
            ].map((s) => (
              <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.c }}>{s.v}</h2>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>All Expense Records</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: C.bg }}>
                {['Description', 'Category', 'Department', 'Amount', 'Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {expenses.map((exp: any, i: number) => (
                  <tr key={exp._id} style={{ borderBottom: i < expenses.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{exp.description}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: C.textMuted }}>{exp.category}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: C.textMuted }}>{exp.department}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{currencySymbol}{(exp.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: C.textMuted }}>{exp.date?.slice(0, 10)}</td>
                    <td style={{ padding: '11px 16px' }}><Badge label={exp.status} /></td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>No expenses recorded</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'salary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Total Salaries', v: salaries.length, c: C.accent },
              { l: 'Total Amount', v: `${currencySymbol}${totalSalaries.toLocaleString()}`, c: C.warning },
              { l: 'Paid Amount', v: `${currencySymbol}${totalPaidSalaries.toLocaleString()}`, c: C.success },
              { l: 'Pending', v: `${currencySymbol}${totalPendingSalaries.toLocaleString()}`, c: C.danger },
            ].map((s) => (
              <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.c }}>{s.v}</h2>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>All Salary Records</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: C.bg }}>
                  {['Employee', 'Period', 'Base Salary', 'Bonus', 'Deductions', 'Total', 'Paid', 'Remaining', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {salaries.map((s: any, i: number) => (
                    <tr key={s._id} style={{ borderBottom: i < salaries.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{s.employee?.name || '—'}</td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: C.textMuted }}>{s.month}/{s.year}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: C.text }}>{currencySymbol}{(s.baseSalary || 0).toLocaleString()}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: C.success }}>+{currencySymbol}{(s.bonus || 0).toLocaleString()}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: C.danger }}>-{currencySymbol}{(s.deductions || 0).toLocaleString()}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: C.accent }}>{currencySymbol}{(s.totalAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: C.success }}>{currencySymbol}{(s.paidAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: ((s.totalAmount || 0) - (s.paidAmount || 0)) > 0 ? C.warning : C.success }}>{currencySymbol}{((s.totalAmount || 0) - (s.paidAmount || 0)).toLocaleString()}</td>
                      <td style={{ padding: '11px 16px' }}><Badge label={s.status} /></td>
                    </tr>
                  ))}
                  {salaries.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>No salary records found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'investors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Total Investors', v: investors.length, c: C.accent },
              { l: 'Active Investors', v: investors.filter((i: any) => i.isActive).length, c: C.success },
              { l: 'Total Investments', v: `${currencySymbol}${totalInvestments.toLocaleString()}`, c: C.warning },
              { l: 'Avg Investment', v: investors.length > 0 ? `${currencySymbol}${Math.round(totalInvestments / investors.length).toLocaleString()}` : '—', c: C.purple },
            ].map((s) => (
              <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.c }}>{s.v}</h2>
              </div>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>All Investor Records</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: C.bg }}>
                {['Name', 'Email', 'Company', 'Amount', 'Date', 'Type', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {investors.map((inv: any, i: number) => (
                  <tr key={inv._id} style={{ borderBottom: i < investors.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{inv.name}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: C.textMuted }}>{inv.email}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: C.textMuted }}>{inv.company || '—'}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: C.accent }}>{currencySymbol}{(inv.investmentAmount || 0).toLocaleString()}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: C.textMuted }}>{inv.investmentDate?.slice(0, 10) || '—'}</td>
                    <td style={{ padding: '11px 16px' }}><Badge label={inv.investmentType || 'Other'} /></td>
                    <td style={{ padding: '11px 16px' }}><Badge label={inv.isActive ? 'Active' : 'Inactive'} /></td>
                  </tr>
                ))}
                {investors.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>No investors found</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
