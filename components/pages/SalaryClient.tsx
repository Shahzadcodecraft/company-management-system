'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSalaries, useCreateSalary, useUpdateSalary, useDeleteSalary, useEmployees, useSettings } from '@/lib/hooks/useApi';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';

const C = { 
  accent: 'var(--accent)', 
  success: 'var(--success)', 
  warning: 'var(--warning)', 
  danger: 'var(--danger)', 
  purple: 'var(--purple)', 
  text: 'var(--text)', 
  textMuted: 'var(--text-muted)', 
  surface: 'var(--surface)', 
  border: 'var(--border)', 
  bg: 'var(--bg)', 
  borderLight: 'var(--border-light)', 
  surfaceHover: 'var(--surface-hover)' 
};

const IS = { 
  background: C.bg, 
  border: `1px solid ${C.border}`, 
  borderRadius: 10, 
  padding: '10px 14px', 
  color: C.text, 
  fontFamily: "'DM Sans',sans-serif", 
  fontSize: 13, 
  outline: 'none', 
  width: '100%' 
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Check', 'Digital Wallet'];
const STATUS_OPTIONS = ['All', 'Pending', 'Partially Paid', 'Paid'];

function getStatusColor(s: string) {
  return ({ Paid: C.success, 'Partially Paid': C.warning, Pending: C.danger })[s] || C.textMuted;
}

function fmtMoney(n: number, currency = 'PKR') {
  const symbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  if (n >= 1000000) return `${symbol}${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${symbol}${(n / 1000).toFixed(0)}K`;
  return `${symbol}${n.toLocaleString()}`;
}

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const colors = [C.accent, C.success, C.purple, C.warning, C.danger];
  const idx = ((initials.charCodeAt(0) || 65) + (initials.charCodeAt(1) || 65)) % colors.length;
  const color = colors[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}88, ${color}44)`,
      border: `2px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color, flexShrink: 0,
    }}>{initials}</div>
  );
}

function Badge({ label }: { label: string }) {
  const c = getStatusColor(label);
  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 4, 
      padding: '3px 10px', 
      borderRadius: 20, 
      fontSize: 11, 
      fontWeight: 600, 
      color: c, 
      background: `${c}18`, 
      border: `1px solid ${c}30` 
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
      {label}
    </span>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }: any) {
  const [h, setH] = useState(false);
  const s: any = { 
    primary: { bg: h ? '#3B7AE8' : C.accent, c: '#fff', b: 'none' }, 
    ghost: { bg: h ? C.surfaceHover : 'transparent', c: C.text, b: `1px solid ${C.border}` }, 
    success: { bg: C.success, c: '#fff', b: 'none' }, 
    danger: { bg: C.danger, c: '#fff', b: 'none' } 
  };
  const vs = s[variant] || s.primary;
  return (
    <button 
      disabled={disabled} 
      onMouseEnter={() => setH(true)} 
      onMouseLeave={() => setH(false)} 
      onClick={onClick} 
      style={{ 
        padding: size === 'sm' ? '5px 10px' : '9px 18px', 
        borderRadius: 9, 
        border: vs.b, 
        background: vs.bg, 
        color: vs.c, 
        fontFamily: "'DM Sans',sans-serif", 
        fontSize: 12, 
        fontWeight: 600, 
        cursor: 'pointer', 
        transition: 'all 0.15s', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 6 
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 1000, 
        background: 'rgba(0,0,0,0.75)', 
        backdropFilter: 'blur(4px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 20 
      }} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ 
        background: C.surface, 
        border: `1px solid ${C.borderLight}`, 
        borderRadius: 20, 
        width: '100%', 
        maxWidth: 520, 
        maxHeight: '85vh', 
        display: 'flex', 
        flexDirection: 'column', 
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '18px 24px', 
          borderBottom: `1px solid ${C.border}` 
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

const EMPTY = { 
  employee: '', 
  month: new Date().getMonth() + 1, 
  year: new Date().getFullYear(), 
  baseSalary: '', 
  bonus: '0', 
  deductions: '0', 
  totalAmount: '', 
  paidAmount: '0', 
  status: 'Pending',
  paymentMethod: 'Bank Transfer',
  paidAt: '',
  transactionId: '',
  notes: '' 
};

export default function SalaryClient() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));
  const [filterEmployee, setFilterEmployee] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');
  
  const { data: settingsData } = useSettings();
  const currency = settingsData?.settings?.currency || 'PKR';
  const currencySymbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const params: Record<string, string> = {};
  if (filterStatus !== 'All') params.status = filterStatus;
  if (filterMonth) params.month = filterMonth;
  if (filterYear) params.year = filterYear;
  if (filterEmployee) params.employee = filterEmployee;

  const { data: salaries = [], isLoading } = useSalaries(params);
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees();
  const employees = employeesData?.employees || [];
  const create = useCreateSalary();
  const updateSalary = useUpdateSalary(updatingId || '');
  const updatePayment = useUpdateSalary(payModal || '');
  const deleteSalary = useDeleteSalary();

  const salaryArr: any[] = Array.isArray(salaries) ? salaries : [];

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = salaryArr.length;
    const pending = salaryArr.filter((s) => s.status === 'Pending').length;
    const partiallyPaid = salaryArr.filter((s) => s.status === 'Partially Paid').length;
    const paid = salaryArr.filter((s) => s.status === 'Paid').length;
    
    const totalAmount = salaryArr.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalPaid = salaryArr.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalPending = totalAmount - totalPaid;
    
    return { total, pending, partiallyPaid, paid, totalAmount, totalPaid, totalPending };
  }, [salaryArr]);

  // Pagination
  const totalPages = Math.ceil(salaryArr.length / ITEMS_PER_PAGE) || 1;
  const paginatedSalaries = salaryArr.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const set = (k: string) => (v: string) => setForm((p: any) => ({ ...p, [k]: v }));
  
  const Label = ({ text }: any) => (
    <label style={{ 
      fontSize: 11, 
      fontWeight: 700, 
      color: C.textMuted, 
      letterSpacing: '0.06em', 
      textTransform: 'uppercase', 
      display: 'block', 
      marginBottom: 6 
    }}>
      {text}
    </label>
  );

  // Calculate total amount when baseSalary, bonus, or deductions change
  useEffect(() => {
    const base = parseFloat(form.baseSalary) || 0;
    const bonus = parseFloat(form.bonus) || 0;
    const deductions = parseFloat(form.deductions) || 0;
    const total = base + bonus - deductions;
    setForm((p: any) => ({ ...p, totalAmount: total > 0 ? String(total) : '0' }));
  }, [form.baseSalary, form.bonus, form.deductions]);

  async function handleSave() {
    const payload = {
      employee: form.employee,
      month: parseInt(form.month),
      year: parseInt(form.year),
      baseSalary: parseFloat(form.baseSalary) || 0,
      bonus: parseFloat(form.bonus) || 0,
      deductions: parseFloat(form.deductions) || 0,
      totalAmount: parseFloat(form.totalAmount) || 0,
      paidAmount: parseFloat(form.paidAmount) || 0,
      paymentMethod: form.paymentMethod,
      notes: form.notes || undefined,
    };
    
    if (updatingId) {
      await updateSalary.mutateAsync(payload);
    } else {
      await create.mutateAsync(payload);
    }
    
    setModal(false);
    setForm(EMPTY);
    setUpdatingId(null);
  }

  async function handlePayment(salary: any) {
    const paidAmount = parseFloat(form.paidAmount) || 0;
    const totalAmount = salary.totalAmount;
    
    const newPaidAmount = Math.min(salary.paidAmount + paidAmount, totalAmount);
    
    await updatePayment.mutateAsync({
      paidAmount: newPaidAmount,
      paidAt: new Date().toISOString(),
      transactionId: form.transactionId || undefined,
      paymentMethod: form.paymentMethod,
    });
    
    setPayModal(null);
    setForm((p: any) => ({ ...p, paidAmount: '0', transactionId: '' }));
  }

  function downloadCSV(data = salaryArr) {
    if (data.length === 0) return alert('No salary records to download');
    const csvData = data.map((s: any) => ({
      'Employee Name': s.employee?.name || 'N/A',
      'Email': s.employee?.email || 'N/A',
      'Department': s.employee?.department?.name || s.employee?.department || 'N/A',
      'Month': MONTHS[s.month - 1],
      'Year': s.year,
      'Base Salary': s.baseSalary,
      'Bonus': s.bonus,
      'Deductions': s.deductions,
      'Total Amount': s.totalAmount,
      'Paid Amount': s.paidAmount,
      'Remaining': s.totalAmount - s.paidAmount,
      'Status': s.status,
      'Payment Method': s.paymentMethod || '-',
      'Paid Date': s.paidAt?.slice(0, 10) || '-',
      'Transaction ID': s.transactionId || '-',
      'Notes': s.notes || '-',
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `salaries_${filterMonth || 'all'}_${filterYear || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  function downloadPDF(data = salaryArr) {
    if (data.length === 0) return alert('No salary records to download');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Salary Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${MONTHS[parseInt(filterMonth) - 1] || 'All Months'} ${filterYear || 'All Years'}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    
    let y = 50;
    const pageHeight = doc.internal.pageSize.height;
    
    data.forEach((s: any, i: number) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      (doc as any).setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${s.employee?.name || 'N/A'}`, 14, y);
      y += 6;
      (doc as any).setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const total = (s.totalAmount || 0).toLocaleString();
      const paid = (s.paidAmount || 0).toLocaleString();
      doc.text(
        `Dept: ${s.employee?.department?.name || s.employee?.department || 'N/A'} | ` +
        `Month: ${MONTHS[s.month - 1]} ${s.year} | ` +
        `Total: ${currency} ${total} | ` +
        `Paid: ${currency} ${paid} | ` +
        `Status: ${s.status}`, 
        14, y
      );
      y += 10;
    });
    
    doc.save(`salaries_${filterMonth || 'all'}_${filterYear || 'all'}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  async function downloadSalaryPDF(salaryId: string, employeeName: string) {
    try {
      const response = await fetch(`/api/salaries/${salaryId}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary-slip-${employeeName?.replace(/\s+/g, '-') || 'employee'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download PDF. Please try again.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Total Salaries', v: summary.total, c: C.accent, i: '💰' },
          { l: 'Paid', v: summary.paid, c: C.success, i: '✓' },
          { l: 'Partially Paid', v: summary.partiallyPaid, c: C.warning, i: '⏳' },
          { l: 'Pending', v: summary.pending, c: C.danger, i: '⏸' },
        ].map((s) => (
          <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text }}>{s.v}</h2>
              </div>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: `${s.c}22`, 
                border: `1px solid ${s.c}33`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 18 
              }}>
                {s.i}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Amount Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { l: 'Total Amount', v: fmtMoney(summary.totalAmount, currency), c: C.accent },
          { l: 'Total Paid', v: fmtMoney(summary.totalPaid, currency), c: C.success },
          { l: 'Total Pending', v: fmtMoney(summary.totalPending, currency), c: C.danger },
        ].map((s) => (
          <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</h3>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 20px', 
          borderBottom: `1px solid ${C.border}`, 
          flexWrap: 'wrap', 
          gap: 12 
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Salary Records</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Month Filter */}
            <select 
              style={{ ...IS, width: 'auto', padding: '6px 10px', fontSize: 11 }} 
              value={filterMonth} 
              onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>

            {/* Year Filter */}
            <select 
              style={{ ...IS, width: 'auto', padding: '6px 10px', fontSize: 11 }} 
              value={filterYear} 
              onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
            >
              <option value="">All Years</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Employee Filter */}
            <select 
              style={{ ...IS, width: 'auto', padding: '6px 10px', fontSize: 11 }} 
              value={filterEmployee} 
              onChange={(e) => { setFilterEmployee(e.target.value); setPage(1); }}
              disabled={isLoadingEmployees}
            >
              <option value="">All Employees</option>
              {employees.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>

            <Btn size="sm" variant="ghost" onClick={() => downloadCSV()}>📄 CSV</Btn>
            <Btn size="sm" variant="ghost" onClick={() => downloadPDF()}>📕 PDF</Btn>
            
            {STATUS_OPTIONS.map((s) => (
              <button 
                key={s} 
                onClick={() => { setFilterStatus(s); setPage(1); }} 
                style={{ 
                  padding: '5px 12px', 
                  borderRadius: 8, 
                  cursor: 'pointer', 
                  fontFamily: "'DM Sans',sans-serif", 
                  fontSize: 11, 
                  fontWeight: 600, 
                  background: filterStatus === s ? C.accent : 'transparent', 
                  color: filterStatus === s ? '#fff' : C.textMuted, 
                  border: `1px solid ${filterStatus === s ? 'transparent' : C.border}`, 
                  transition: 'all 0.15s' 
                }}
              >
                {s}
              </button>
            ))}
            
            <Btn size="sm" onClick={() => { setForm(EMPTY); setModal(true); }}>+ Add Salary</Btn>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: C.textMuted }}>Loading salaries...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Employee', 'Month/Year', 'Base Salary', 'Bonus', 'Deductions', 'Total', 'Paid', 'Remaining', 'Status', 'Actions'].map(h => (
                    <th 
                      key={h} 
                      style={{ 
                        padding: '10px 16px', 
                        textAlign: 'left', 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: C.textMuted, 
                        letterSpacing: '0.06em', 
                        textTransform: 'uppercase', 
                        borderBottom: `1px solid ${C.border}`, 
                        whiteSpace: 'nowrap' 
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedSalaries.map((salary: any, i: number) => {
                  const remaining = salary.totalAmount - salary.paidAmount;
                  return (
                    <tr 
                      key={salary._id} 
                      style={{ borderBottom: i < paginatedSalaries.length - 1 ? `1px solid ${C.border}` : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar initials={salary.employee?.avatar || salary.employee?.name?.slice(0, 2).toUpperCase() || 'EM'} size={36} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{salary.employee?.name || 'N/A'}</div>
                            <div style={{ fontSize: 11, color: C.textMuted }}>{salary.employee?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>
                        {MONTHS[salary.month - 1]} {salary.year}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>{fmtMoney(salary.baseSalary, currency)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.success }}>+{fmtMoney(salary.bonus, currency)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.danger }}>-{fmtMoney(salary.deductions, currency)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{fmtMoney(salary.totalAmount, currency)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.success }}>{fmtMoney(salary.paidAmount, currency)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: remaining > 0 ? C.danger : C.success }}>
                        {fmtMoney(remaining, currency)}
                      </td>
                      <td style={{ padding: '12px 16px' }}><Badge label={salary.status} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {salary.status !== 'Paid' && (
                            <Btn 
                              size="sm" 
                              variant="success" 
                              onClick={() => { 
                                setPayModal(salary._id); 
                                setForm((p: any) => ({ ...p, paidAmount: String(remaining), paymentMethod: salary.paymentMethod || 'Bank Transfer' }));
                              }}
                            >
                              Pay
                            </Btn>
                          )}
                          <Btn 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => downloadSalaryPDF(salary._id, salary.employee?.name)}
                          >
                            PDF
                          </Btn>
                          <Btn 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => { 
                              setUpdatingId(salary._id);
                              setForm({
                                employee: salary.employee?._id || '',
                                month: salary.month,
                                year: salary.year,
                                baseSalary: String(salary.baseSalary),
                                bonus: String(salary.bonus),
                                deductions: String(salary.deductions),
                                totalAmount: String(salary.totalAmount),
                                paidAmount: String(salary.paidAmount),
                                status: salary.status,
                                paymentMethod: salary.paymentMethod || 'Bank Transfer',
                                notes: salary.notes || '',
                              });
                              setModal(true);
                            }}
                          >
                            Edit
                          </Btn>
                          <Btn 
                            size="sm" 
                            variant="danger" 
                            onClick={() => { 
                              if (confirm('Delete this salary record?')) deleteSalary.mutate(salary._id); 
                            }}
                          >
                            Delete
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedSalaries.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: 48, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                      No salary records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 12, 
            padding: '16px 20px', 
            borderTop: `1px solid ${C.border}` 
          }}>
            <Btn size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</Btn>
            <span style={{ fontSize: 13, color: C.textMuted }}>
              Page {page} of {totalPages} ({salaryArr.length} total)
            </span>
            <Btn size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</Btn>
          </div>
        )}
      </div>

      {/* Add/Edit Salary Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setUpdatingId(null); setForm(EMPTY); }} title={updatingId ? 'Edit Salary Record' : 'Add Salary Record'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div>
              <Label text="Employee" />
              <select 
                style={IS} 
                value={form.employee} 
                onChange={(e) => set('employee')(e.target.value)}
                disabled={updatingId || isLoadingEmployees}
              >
                <option value="">Select Employee</option>
                {employees.map((e: any) => <option key={e._id} value={e._id}>{e.name} - {e.email}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <Label text="Month" />
                <select style={IS} value={form.month} onChange={(e) => set('month')(e.target.value)}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <Label text="Year" />
                <select style={IS} value={form.year} onChange={(e) => set('year')(e.target.value)}>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <Label text={`Base Salary (${currencySymbol})`} />
              <input 
                style={IS} 
                type="number" 
                value={form.baseSalary} 
                onChange={(e) => set('baseSalary')(e.target.value)} 
                placeholder="50000" 
              />
            </div>
            <div>
              <Label text={`Bonus (${currencySymbol})`} />
              <input 
                style={IS} 
                type="number" 
                value={form.bonus} 
                onChange={(e) => set('bonus')(e.target.value)} 
                placeholder="0" 
              />
            </div>
            <div>
              <Label text={`Deductions (${currencySymbol})`} />
              <input 
                style={IS} 
                type="number" 
                value={form.deductions} 
                onChange={(e) => set('deductions')(e.target.value)} 
                placeholder="0" 
              />
            </div>
          </div>

          <div style={{ 
            background: C.bg, 
            border: `1px solid ${C.border}`, 
            borderRadius: 10, 
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 13, color: C.textMuted }}>Total Amount</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>
              {fmtMoney(parseFloat(form.totalAmount) || 0, currency)}
            </span>
          </div>

          <div>
            <Label text="Notes (optional)" />
            <input 
              style={IS} 
              value={form.notes} 
              onChange={(e) => set('notes')(e.target.value)} 
              placeholder="Additional notes..." 
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => { setModal(false); setUpdatingId(null); setForm(EMPTY); }}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={create.isPending || updateSalary.isPending || !form.employee}>
              {create.isPending || updateSalary.isPending ? 'Saving...' : (updatingId ? 'Update Record' : 'Create Record')}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal 
        open={!!payModal} 
        onClose={() => { setPayModal(null); setForm((p: any) => ({ ...p, paidAmount: '0', transactionId: '' })); }} 
        title="Make Payment"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(() => {
            const salary = salaryArr.find((s) => s._id === payModal);
            if (!salary) return null;
            const remaining = salary.totalAmount - salary.paidAmount;
            return (
              <>
                <div style={{ background: C.bg, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: C.textMuted }}>Employee</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{salary.employee?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: C.textMuted }}>Period</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{MONTHS[salary.month - 1]} {salary.year}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: C.textMuted }}>Total Amount</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fmtMoney(salary.totalAmount, currency)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: C.textMuted }}>Already Paid</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.success }}>{fmtMoney(salary.paidAmount, currency)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                    <span style={{ fontSize: 13, color: C.textMuted }}>Remaining</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C.danger }}>{fmtMoney(remaining, currency)}</span>
                  </div>
                </div>

                <div>
                  <Label text={`Payment Amount (${currencySymbol})`} />
                  <input 
                    style={IS} 
                    type="number" 
                    value={form.paidAmount} 
                    onChange={(e) => set('paidAmount')(e.target.value)} 
                    placeholder={String(remaining)}
                    max={remaining}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textMuted }}>Max: {fmtMoney(remaining, currency)}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <div>
                    <Label text="Payment Method" />
                    <select style={IS} value={form.paymentMethod} onChange={(e) => set('paymentMethod')(e.target.value)}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label text="Transaction ID (optional)" />
                    <input 
                      style={IS} 
                      value={form.transactionId} 
                      onChange={(e) => set('transactionId')(e.target.value)} 
                      placeholder="TXN-12345" 
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                  <Btn variant="ghost" onClick={() => { setPayModal(null); setForm((p: any) => ({ ...p, paidAmount: '0', transactionId: '' })); }}>Cancel</Btn>
                  <Btn onClick={() => handlePayment(salary)} disabled={updatePayment.isPending || !form.paidAmount || parseFloat(form.paidAmount) <= 0}>
                    {updatePayment.isPending ? 'Processing...' : 'Confirm Payment'}
                  </Btn>
                </div>
              </>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
