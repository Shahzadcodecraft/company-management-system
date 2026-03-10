'use client';

import { useState, useEffect } from 'react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useDepartments } from '@/lib/hooks/useApi';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import 'jspdf';

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
const CATS = ['Technology', 'Software', 'Marketing', 'HR', 'Operations', 'Training', 'Travel', 'Other'];
const PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Partially Paid'];
const PAYMENT_METHODS = ['Card', 'Cash', 'Bank Transfer', 'Check', 'Digital Wallet', 'Other'];

function getStatusColor(s: string) { return ({ Approved: C.success, Pending: C.warning, Rejected: C.danger })[s] || C.textMuted; }
function fmtMoney(n: number) { if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`; if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`; return `$${n}`; }

function Badge({ label }: { label: string }) {
  const c = getStatusColor(label);
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color: c, background: `${c}18`, border: `1px solid ${c}30` }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />{label}</span>;
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }: any) {
  const [h, setH] = useState(false);
  const s: any = { primary: { bg: h ? '#3B7AE8' : C.accent, c: '#fff', b: 'none' }, ghost: { bg: h ? C.surfaceHover : 'transparent', c: C.text, b: `1px solid ${C.border}` }, success: { bg: C.success, c: '#fff', b: 'none' }, danger: { bg: C.danger, c: '#fff', b: 'none' } };
  const vs = s[variant] || s.primary;
  return <button disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} style={{ padding: size === 'sm' ? '5px 10px' : '9px 18px', borderRadius: 9, border: vs.b, background: vs.bg, color: vs.c, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{children}</button>;
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

const EMPTY = { description: '', category: 'Technology', amount: '', date: new Date().toISOString().slice(0, 10), department: 'Engineering', notes: '', paymentStatus: 'Unpaid', paymentMethod: 'Card', paidAt: '', receiptNumber: '', vendor: '' };

export default function FinanceClient() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const params: Record<string, string> = {};
  if (filterStatus !== 'All') params.status = filterStatus;

  const { data: expenses = [], isLoading } = useExpenses(params);
  const { data: deptsData, isLoading: isLoadingDepts } = useDepartments();
  const departments = deptsData?.departments || [];
  const create = useCreateExpense();
  const updateExp = useUpdateExpense(updatingId || '');
  const delExpense = useDeleteExpense();

  const expArr: any[] = Array.isArray(expenses) ? expenses : [];
  
  // Filter by date range
  const filteredExpenses = expArr.filter((exp: any) => {
    const expDate = exp.date?.slice(0, 10);
    if (dateFrom && expDate < dateFrom) return false;
    if (dateTo && expDate > dateTo) return false;
    return true;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE) || 1;
  const paginatedExpenses = filteredExpenses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  
  const totalApproved = filteredExpenses.filter((e) => e.status === 'Approved').reduce((s: number, e: any) => s + e.amount, 0);
  const totalPending = filteredExpenses.filter((e) => e.status === 'Pending').reduce((s: number, e: any) => s + e.amount, 0);
  const totalAll = filteredExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  const set = (k: string) => (v: string) => setForm((p: any) => ({ ...p, [k]: v }));
  const Label = ({ text }: any) => <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{text}</label>;

  async function handleSave() {
    const payload: any = { 
      description: form.description,
      category: form.category,
      amount: parseFloat(form.amount) || 0,
      date: form.date,
      department: form.department,
      paymentStatus: form.paymentStatus,
      paymentMethod: form.paymentMethod,
    };
    // Only send paidAt if it has a value
    if (form.paidAt) {
      payload.paidAt = form.paidAt;
    }
    // Add optional fields if they have values
    if (form.receiptNumber) payload.receiptNumber = form.receiptNumber;
    if (form.vendor) payload.vendor = form.vendor;
    if (form.notes) payload.notes = form.notes;
    
    await create.mutateAsync(payload);
    setModal(false);
    setForm(EMPTY);
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    setTimeout(() => updateExp.mutate({ status }), 0);
  }

  function downloadCSV(data = filteredExpenses) {
    if (data.length === 0) return alert('No expenses to download');
    const csvData = data.map((exp: any) => ({
      Description: exp.description,
      Category: exp.category,
      Department: exp.department,
      Amount: exp.amount,
      Date: exp.date?.slice(0, 10),
      Status: exp.status,
      PaymentStatus: exp.paymentStatus || 'Unpaid',
      PaymentMethod: exp.paymentMethod || '-',
      PaidAt: exp.paidAt?.slice(0, 10) || '-',
      ReceiptNumber: exp.receiptNumber || '-',
      Vendor: exp.vendor || '-',
      Notes: exp.notes || '-',
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateLabel = dateFrom || dateTo ? `_${dateFrom || 'start'}_${dateTo || 'end'}` : '';
    link.download = `expenses${dateLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  function downloadPDF(data = filteredExpenses) {
    if (data.length === 0) return alert('No expenses to download');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Expense Report', 14, 20);
    doc.setFontSize(10);
    const dateLabel = dateFrom || dateTo ? `Period: ${dateFrom || 'Start'} to ${dateTo || 'End'}` : `Generated: ${new Date().toLocaleDateString()}`;
    doc.text(dateLabel, 14, 30);
    
    let y = 45;
    const pageHeight = doc.internal.pageSize.height;
    
    data.forEach((exp: any, i: number) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      (doc as any).setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${exp.description}`, 14, y);
      y += 6;
      (doc as any).setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Category: ${exp.category} | Dept: ${exp.department} | Amount: $${exp.amount} | Status: ${exp.status}`, 14, y);
      y += 5;
      doc.text(`Payment: ${exp.paymentStatus || 'Unpaid'} | Method: ${exp.paymentMethod || '-'} | Date: ${exp.date?.slice(0, 10)}`, 14, y);
      y += 10;
    });
    
    const fileDateLabel = dateFrom || dateTo ? `_${dateFrom || 'start'}_${dateTo || 'end'}` : '';
    doc.save(`expenses${fileDateLabel}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function downloadSinglePDF(expense: any) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Expense Receipt', 14, 20);
    doc.setFontSize(10);
    doc.text(`ID: ${expense._id}`, 14, 30);
    
    let y = 45;
    doc.setFontSize(12);
    (doc as any).setFont('helvetica', 'bold');
    doc.text('Description:', 14, y);
    (doc as any).setFont('helvetica', 'normal');
    doc.text(expense.description, 60, y);
    y += 10;
    
    const fields = [
      ['Category', expense.category],
      ['Department', expense.department],
      ['Amount', `$${expense.amount}`],
      ['Date', expense.date?.slice(0, 10)],
      ['Status', expense.status],
      ['Payment Status', expense.paymentStatus || 'Unpaid'],
      ['Payment Method', expense.paymentMethod || '-'],
      ['Paid Date', expense.paidAt?.slice(0, 10) || '-'],
      ['Receipt Number', expense.receiptNumber || '-'],
      ['Vendor', expense.vendor || '-'],
      ['Notes', expense.notes || '-'],
    ];
    
    fields.forEach(([label, value]) => {
      (doc as any).setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, y);
      (doc as any).setFont('helvetica', 'normal');
      doc.text(String(value), 60, y);
      y += 8;
    });
    
    doc.save(`expense_${expense._id}_${expense.date?.slice(0, 10)}.pdf`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Total Expenses', v: fmtMoney(totalAll), c: C.accent, i: '💳' },
          { l: 'Approved', v: fmtMoney(totalApproved), c: C.success, i: '✓' },
          { l: 'Pending', v: fmtMoney(totalPending), c: C.warning, i: '⏳' },
          { l: 'Total Items', v: expArr.length, c: C.purple, i: '📋' },
        ].map((s) => (
          <div key={s.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text }}>{s.v}</h2>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.c}22`, border: `1px solid ${s.c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.i}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Expense Requests</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>From:</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...IS, width: 'auto', padding: '6px 10px', fontSize: 11 }} />
              <span style={{ fontSize: 11, color: C.textMuted }}>To:</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...IS, width: 'auto', padding: '6px 10px', fontSize: 11 }} />
              {(dateFrom || dateTo) && <Btn size="sm" variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕ Clear</Btn>}
            </div>
            <Btn size="sm" variant="ghost" onClick={() => downloadCSV()}>📄 CSV</Btn>
            <Btn size="sm" variant="ghost" onClick={() => downloadPDF()}>📕 PDF</Btn>
            {['All', 'Approved', 'Pending', 'Rejected'].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, background: filterStatus === s ? C.accent : 'transparent', color: filterStatus === s ? '#fff' : C.textMuted, border: `1px solid ${filterStatus === s ? 'transparent' : C.border}`, transition: 'all 0.15s' }}>{s}</button>
            ))}
            <Btn size="sm" onClick={() => { setForm(EMPTY); setModal(true); }}>+ Add</Btn>
          </div>
        </div>

        {isLoading ? <div style={{ padding: 48, textAlign: 'center', color: C.textMuted }}>Loading expenses...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Description', 'Category', 'Dept', 'Amount', 'Date', 'Status', 'Payment', 'Method', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((exp: any, i: number) => (
                  <tr key={exp._id} style={{ borderBottom: i < paginatedExpenses.length - 1 ? `1px solid ${C.border}` : 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{exp.description}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{exp.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{exp.department}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{fmtMoney(exp.amount)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{exp.date?.slice(0, 10)}</td>
                    <td style={{ padding: '12px 16px' }}><Badge label={exp.status} /></td>
                    <td style={{ padding: '12px 16px' }}><Badge label={exp.paymentStatus || 'Unpaid'} /></td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{exp.paymentMethod || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {exp.status === 'Pending' ? (
                          <>
                            <Btn size="sm" variant="success" onClick={() => updateStatus(exp._id, 'Approved')}>Approve</Btn>
                            <Btn size="sm" variant="danger" onClick={() => updateStatus(exp._id, 'Rejected')}>Reject</Btn>
                          </>
                        ) : <span style={{ fontSize: 11, color: C.textMuted }}>Processed</span>}
                        <Btn size="sm" variant="ghost" onClick={() => downloadSinglePDF(exp)}>Download</Btn>
                        <Btn size="sm" variant="danger" onClick={() => { if (confirm('Delete this expense?')) delExpense.mutate(exp._id); }}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedExpenses.length === 0 && <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>No expenses found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
            <Btn size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</Btn>
            <span style={{ fontSize: 13, color: C.textMuted }}>
              Page {page} of {totalPages} ({filteredExpenses.length} total)
            </span>
            <Btn size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</Btn>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Expense">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><Label text="Description" /><input style={IS} value={form.description} onChange={(e) => set('description')(e.target.value)} placeholder="Cloud infrastructure costs" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Category" /><select style={IS} value={form.category} onChange={(e) => set('category')(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><Label text="Department" /><select style={IS} value={form.department} onChange={(e) => set('department')(e.target.value)} disabled={isLoadingDepts}>{isLoadingDepts ? <option>Loading...</option> : departments.map((d: any) => <option key={d._id} value={d.name}>{d.name}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Amount ($)" /><input style={IS} type="number" value={form.amount} onChange={(e) => set('amount')(e.target.value)} placeholder="1500" /></div>
            <div><Label text="Date" /><input style={IS} type="date" value={form.date} onChange={(e) => set('date')(e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Payment Status" /><select style={IS} value={form.paymentStatus} onChange={(e) => set('paymentStatus')(e.target.value)}>{PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><Label text="Payment Method" /><select style={IS} value={form.paymentMethod} onChange={(e) => set('paymentMethod')(e.target.value)}>{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Paid Date (optional)" /><input style={IS} type="date" value={form.paidAt} onChange={(e) => set('paidAt')(e.target.value)} /></div>
            <div><Label text="Receipt Number (optional)" /><input style={IS} value={form.receiptNumber} onChange={(e) => set('receiptNumber')(e.target.value)} placeholder="INV-001" /></div>
          </div>
          <div><Label text="Vendor/Supplier (optional)" /><input style={IS} value={form.vendor} onChange={(e) => set('vendor')(e.target.value)} placeholder="Amazon Web Services" /></div>
          <div><Label text="Notes (optional)" /><input style={IS} value={form.notes} onChange={(e) => set('notes')(e.target.value)} placeholder="Additional details..." /></div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={create.isPending}>{create.isPending ? 'Submitting...' : 'Submit Expense'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
