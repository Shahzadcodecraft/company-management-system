'use client';

import { useState, useEffect } from 'react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useDepartments, useSettings, useInvestors, useCreateInvestor, useUpdateInvestor, useDeleteInvestor } from '@/lib/hooks/useApi';
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
function fmtMoney(n: number, currency = 'PKR') {
  const symbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  if (n >= 1000000) return `${symbol}${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${symbol}${(n / 1000).toFixed(0)}K`;
  return `${symbol}${n}`;
}

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

const EMPTY = { description: '', category: 'Technology', amount: '', date: new Date().toISOString().slice(0, 10), department: 'Engineering', notes: '', paymentStatus: 'Unpaid', paymentMethod: 'Card', paidAt: '', receiptNumber: '', vendor: '', receiptImage: '' };
const EMPTY_INVESTOR = { 
  name: '', 
  email: '', 
  phone: '', 
  company: '', 
  investmentAmount: '',
  investmentDate: new Date().toISOString().slice(0, 10),
  investmentType: 'Other',
  returnTerms: '',
  paymentMethod: 'Bank Transfer',
  investmentPurpose: '',
  image: '',
  notes: '' 
};

export default function FinanceClient() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Investor management state
  const [activeTab, setActiveTab] = useState<'expenses' | 'investors'>('expenses');
  const [investorModal, setInvestorModal] = useState(false);
  const [investorForm, setInvestorForm] = useState<any>(EMPTY_INVESTOR);
  const [editingInvestorId, setEditingInvestorId] = useState<string | null>(null);
  const [investorImagePreview, setInvestorImagePreview] = useState<string | null>(null);
  const [viewingInvestorImage, setViewingInvestorImage] = useState<string | null>(null);
  
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

  const { data: expenses = [], isLoading } = useExpenses(params);
  const { data: deptsData, isLoading: isLoadingDepts } = useDepartments();
  const { data: investorsData, isLoading: isLoadingInvestors } = useInvestors();
  const departments = deptsData?.departments || [];
  const investors = investorsData?.investors || [];
  const financeSummary = investorsData?.summary || {};
  const create = useCreateExpense();
  const updateExp = useUpdateExpense(updatingId || '');
  const delExpense = useDeleteExpense();
  const createInvestor = useCreateInvestor();
  const updateInvestor = useUpdateInvestor(editingInvestorId || '');
  const deleteInvestor = useDeleteInvestor();

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
    if (form.receiptImage) payload.receiptImage = form.receiptImage;
    
    await create.mutateAsync(payload);
    setModal(false);
    setForm(EMPTY);
    setImagePreview(null);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setForm((p: any) => ({ ...p, receiptImage: base64 }));
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview(null);
    setForm((p: any) => ({ ...p, receiptImage: '' }));
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
      HasReceiptImage: exp.receiptImage ? 'Yes' : 'No',
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
      const amount = (exp.amount || 0).toLocaleString();
      doc.text(`Category: ${exp.category} | Dept: ${exp.department} | Amount: ${currency} ${amount} | Status: ${exp.status}`, 14, y);
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
    
    const amount = (expense.amount || 0).toLocaleString();
    const fields = [
      ['Category', expense.category],
      ['Department', expense.department],
      ['Amount', `${currency} ${amount}`],
      ['Date', expense.date?.slice(0, 10)],
      ['Status', expense.status],
      ['Payment Status', expense.paymentStatus || 'Unpaid'],
      ['Payment Method', expense.paymentMethod || '-'],
      ['Paid Date', expense.paidAt?.slice(0, 10) || '-'],
      ['Receipt Number', expense.receiptNumber || '-'],
      ['Vendor', expense.vendor || '-'],
      ['Notes', expense.notes || '-'],
      ['Receipt Image', expense.receiptImage ? 'Yes (view in app)' : 'No'],
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

  // Investor PDF download functions
  function downloadInvestorsPDF(data = investors) {
    if (data.length === 0) return alert('No investors to download');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Investor Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    let y = 45;
    const pageHeight = doc.internal.pageSize.height;
    
    data.forEach((inv: any, i: number) => {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      (doc as any).setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${inv.name}`, 14, y);
      y += 6;
      (doc as any).setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const amount = inv.investmentAmount?.toLocaleString() || '0';
      doc.text(`Email: ${inv.email} | Company: ${inv.company || '-'} | Amount: ${currency} ${amount}`, 14, y);
      y += 5;
      doc.text(`Type: ${inv.investmentType || 'Other'} | Date: ${inv.investmentDate?.slice(0, 10) || '-'} | Status: ${inv.isActive ? 'Active' : 'Inactive'}`, 14, y);
      y += 10;
    });
    
    doc.save(`investors_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function downloadSingleInvestorPDF(investor: any) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Investor Details', 14, 20);
    doc.setFontSize(10);
    doc.text(`ID: ${investor._id}`, 14, 30);
    
    let y = 45;
    doc.setFontSize(12);
    (doc as any).setFont('helvetica', 'bold');
    doc.text('Name:', 14, y);
    (doc as any).setFont('helvetica', 'normal');
    doc.text(investor.name, 60, y);
    y += 10;
    
    const amount = investor.investmentAmount?.toLocaleString() || '0';
    const fields = [
      ['Email', investor.email],
      ['Phone', investor.phone || '-'],
      ['Company', investor.company || '-'],
      ['Investment Amount', `${currency} ${amount}`],
      ['Investment Date', investor.investmentDate?.slice(0, 10) || '-'],
      ['Investment Type', investor.investmentType || 'Other'],
      ['Payment Method', investor.paymentMethod || '-'],
      ['Return Terms', investor.returnTerms || '-'],
      ['Investment Purpose', investor.investmentPurpose || '-'],
      ['Status', investor.isActive ? 'Active' : 'Inactive'],
      ['Notes', investor.notes || '-'],
    ];
    
    fields.forEach(([label, value]) => {
      (doc as any).setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, y);
      (doc as any).setFont('helvetica', 'normal');
      doc.text(String(value), 60, y);
      y += 8;
    });
    
    doc.save(`investor_${investor.name.replace(/\s+/g, '_')}_${investor.investmentDate?.slice(0, 10) || new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // Investor handlers
  async function handleSaveInvestor() {
    const payload = {
      name: investorForm.name,
      email: investorForm.email,
      phone: investorForm.phone || undefined,
      company: investorForm.company || undefined,
      investmentAmount: parseFloat(investorForm.investmentAmount) || 0,
      investmentDate: investorForm.investmentDate || new Date().toISOString(),
      investmentType: investorForm.investmentType || 'Other',
      returnTerms: investorForm.returnTerms || undefined,
      paymentMethod: investorForm.paymentMethod || undefined,
      investmentPurpose: investorForm.investmentPurpose || undefined,
      image: investorForm.image || undefined,
      notes: investorForm.notes || undefined,
    };

    if (editingInvestorId) {
      await updateInvestor.mutateAsync(payload);
    } else {
      await createInvestor.mutateAsync(payload);
    }
    setInvestorModal(false);
    setInvestorForm(EMPTY_INVESTOR);
    setInvestorImagePreview(null);
    setEditingInvestorId(null);
  }

  function handleEditInvestor(investor: any) {
    setEditingInvestorId(investor._id);
    setInvestorForm({
      name: investor.name || '',
      email: investor.email || '',
      phone: investor.phone || '',
      company: investor.company || '',
      investmentAmount: investor.investmentAmount?.toString() || '',
      investmentDate: investor.investmentDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      investmentType: investor.investmentType || 'Other',
      returnTerms: investor.returnTerms || '',
      paymentMethod: investor.paymentMethod || 'Bank Transfer',
      investmentPurpose: investor.investmentPurpose || '',
      image: investor.image || '',
      notes: investor.notes || '',
    });
    setInvestorImagePreview(investor.image || null);
    setInvestorModal(true);
  }

  function handleDeleteInvestor(id: string) {
    if (confirm('Are you sure you want to delete this investor?')) {
      deleteInvestor.mutate(id);
    }
  }

  async function handleToggleInvestorStatus(investor: any) {
    setEditingInvestorId(investor._id);
    setTimeout(async () => {
      await updateInvestor.mutateAsync({
        isActive: !investor.isActive,
      });
      setEditingInvestorId(null);
    }, 0);
  }

  function handleInvestorImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setInvestorImagePreview(base64);
      setInvestorForm((p: any) => ({ ...p, image: base64 }));
    };
    reader.readAsDataURL(file);
  }

  function clearInvestorImage() {
    setInvestorImagePreview(null);
    setInvestorForm((p: any) => ({ ...p, image: '' }));
  }

  const setInvestor = (k: string) => (v: string) => setInvestorForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'expenses' ? C.accent : 'transparent',
            color: activeTab === 'expenses' ? '#fff' : C.textMuted,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          💳 Expenses
        </button>
        <button
          onClick={() => setActiveTab('investors')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: activeTab === 'investors' ? C.accent : 'transparent',
            color: activeTab === 'investors' ? '#fff' : C.textMuted,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          💰 Investors ({investors.length})
        </button>
      </div>

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <>
          {/* Expense Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Total Expenses', v: fmtMoney(totalAll, currency), c: C.accent, i: '💳' },
              { l: 'Approved', v: fmtMoney(totalApproved, currency), c: C.success, i: '✓' },
              { l: 'Pending', v: fmtMoney(totalPending, currency), c: C.warning, i: '⏳' },
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

          {/* Expenses Table */}
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
                      {['Description', 'Category', 'Dept', 'Amount', 'Date', 'Status', 'Payment', 'Method', 'Receipt', 'Actions'].map(h => (
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
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{fmtMoney(exp.amount, currency)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{exp.date?.slice(0, 10)}</td>
                        <td style={{ padding: '12px 16px' }}><Badge label={exp.status} /></td>
                        <td style={{ padding: '12px 16px' }}><Badge label={exp.paymentStatus || 'Unpaid'} /></td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{exp.paymentMethod || '-'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {exp.receiptImage ? (
                            <button 
                              onClick={() => setViewingReceipt(exp.receiptImage)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, borderRadius: 6, transition: 'all 0.15s' }}
                              title="View receipt"
                              onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceHover}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >📷</button>
                          ) : (
                            <span style={{ fontSize: 12, color: C.textMuted }}>-</span>
                          )}
                        </td>
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
                    {paginatedExpenses.length === 0 && <tr><td colSpan={10} style={{ padding: 48, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>No expenses found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
                <Btn size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</Btn>
                <span style={{ fontSize: 13, color: C.textMuted }}>Page {page} of {totalPages} ({filteredExpenses.length} total)</span>
                <Btn size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</Btn>
              </div>
            )}
          </div>
        </>
      )}

      {/* Investors Tab */}
      {activeTab === 'investors' && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Investor Management</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn size="sm" variant="ghost" onClick={() => downloadInvestorsPDF()}>📕 PDF All</Btn>
              <Btn size="sm" onClick={() => { setInvestorForm(EMPTY_INVESTOR); setEditingInvestorId(null); setInvestorModal(true); }}>+ Add Investor</Btn>
            </div>
          </div>

          {isLoadingInvestors ? <div style={{ padding: 48, textAlign: 'center', color: C.textMuted }}>Loading investors...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {['Photo', 'Name', 'Email', 'Company', 'Amount', 'Date', 'Type', 'Method', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investors.map((inv: any, i: number) => (
                    <tr key={inv._id} style={{ borderBottom: i < investors.length - 1 ? `1px solid ${C.border}` : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px' }}>
                        {inv.image ? (
                          <img 
                            src={inv.image} 
                            alt={inv.name}
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setViewingInvestorImage(inv.image)}
                          />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{inv.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{inv.email}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{inv.company || '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.accent }}>{fmtMoney(inv.investmentAmount, currency)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{inv.investmentDate?.slice(0, 10) || '-'}</td>
                      <td style={{ padding: '12px 16px' }}><Badge label={inv.investmentType || 'Other'} /></td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMuted }}>{inv.paymentMethod || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 4, 
                          padding: '3px 10px', 
                          borderRadius: 20, 
                          fontSize: 11, 
                          fontWeight: 600, 
                          color: inv.isActive ? C.success : C.textMuted, 
                          background: inv.isActive ? `${C.success}18` : `${C.textMuted}18`, 
                          border: `1px solid ${inv.isActive ? `${C.success}30` : `${C.textMuted}30`}` 
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: inv.isActive ? C.success : C.textMuted }} />
                          {inv.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn size="sm" variant="ghost" onClick={() => downloadSingleInvestorPDF(inv)}>PDF</Btn>
                          <Btn size="sm" variant={inv.isActive ? 'danger' : 'success'} onClick={() => handleToggleInvestorStatus(inv)}>
                            {inv.isActive ? 'Deactivate' : 'Activate'}
                          </Btn>
                          <Btn size="sm" variant="ghost" onClick={() => handleEditInvestor(inv)}>Edit</Btn>
                          <Btn size="sm" variant="danger" onClick={() => handleDeleteInvestor(inv._id)}>Delete</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {investors.length === 0 && <tr><td colSpan={10} style={{ padding: 48, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>No investors found. Add your first investor to start tracking investments.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Expense">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><Label text="Description" /><input style={IS} value={form.description} onChange={(e) => set('description')(e.target.value)} placeholder="Cloud infrastructure costs" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Category" /><select style={IS} value={form.category} onChange={(e) => set('category')(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><Label text="Department" /><select style={IS} value={form.department} onChange={(e) => set('department')(e.target.value)} disabled={isLoadingDepts}>{isLoadingDepts ? <option>Loading...</option> : departments.map((d: any) => <option key={d._id} value={d.name}>{d.name}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text={`Amount (${currencySymbol})`} /><input style={IS} type="number" value={form.amount} onChange={(e) => set('amount')(e.target.value)} placeholder="1500" /></div>
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
          
          {/* Receipt Image Upload */}
          <div>
            <Label text="Payment Receipt (optional)" />
            <div style={{ border: `2px dashed ${imagePreview ? C.success : C.border}`, borderRadius: 12, padding: 20, background: imagePreview ? `${C.success}10` : C.bg, transition: 'all 0.2s' }}>
              {!imagePreview ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: C.textMuted }}>Upload receipt image to validate payment</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload">
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      padding: '8px 16px', 
                      borderRadius: 8, 
                      background: C.accent, 
                      color: '#fff', 
                      fontSize: 12, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}>Choose File</span>
                  </label>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: C.textMuted }}>JPG, PNG, GIF up to 5MB</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={imagePreview} 
                    alt="Receipt preview" 
                    style={{ 
                      width: '100%', 
                      maxHeight: 200, 
                      objectFit: 'contain', 
                      borderRadius: 8,
                      border: `1px solid ${C.border}`
                    }} 
                  />
                  <button
                    onClick={clearImage}
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: C.danger,
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: C.success, textAlign: 'center' }}>✓ Receipt image uploaded</p>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={create.isPending}>{create.isPending ? 'Submitting...' : 'Submit Expense'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Investor Modal */}
      <Modal open={investorModal} onClose={() => setInvestorModal(false)} title={editingInvestorId ? 'Edit Investor' : 'Add Investor'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><Label text="Name" /><input style={IS} value={investorForm.name} onChange={(e) => setInvestor('name')(e.target.value)} placeholder="John Smith" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Email" /><input style={IS} type="email" value={investorForm.email} onChange={(e) => setInvestor('email')(e.target.value)} placeholder="john@example.com" /></div>
            <div><Label text="Phone (optional)" /><input style={IS} value={investorForm.phone} onChange={(e) => setInvestor('phone')(e.target.value)} placeholder="+1 234 567 8900" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Company (optional)" /><input style={IS} value={investorForm.company} onChange={(e) => setInvestor('company')(e.target.value)} placeholder="Acme Corp" /></div>
            <div><Label text={`Investment Amount (${currencySymbol})`} /><input style={IS} type="number" value={investorForm.investmentAmount} onChange={(e) => setInvestor('investmentAmount')(e.target.value)} placeholder="100000" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Investment Date" /><input style={IS} type="date" value={investorForm.investmentDate} onChange={(e) => setInvestor('investmentDate')(e.target.value)} /></div>
            <div><Label text="Investment Type" /><select style={IS} value={investorForm.investmentType} onChange={(e) => setInvestor('investmentType')(e.target.value)}>{['Equity', 'Loan', 'Convertible Note', 'Grant', 'Other'].map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Payment Method (optional)" /><select style={IS} value={investorForm.paymentMethod} onChange={(e) => setInvestor('paymentMethod')(e.target.value)}>{['Bank Transfer', 'Cash', 'Check', 'Digital Wallet', 'Other'].map(m => <option key={m}>{m}</option>)}</select></div>
            <div><Label text="Return Terms (optional)" /><input style={IS} value={investorForm.returnTerms} onChange={(e) => setInvestor('returnTerms')(e.target.value)} placeholder="10% equity or 5% interest" /></div>
          </div>
          <div><Label text="Investment Purpose (optional)" /><input style={IS} value={investorForm.investmentPurpose} onChange={(e) => setInvestor('investmentPurpose')(e.target.value)} placeholder="Product development, marketing, etc." /></div>
          
          {/* Investor Image Upload */}
          <div>
            <Label text="Investor Photo (optional)" />
            <div style={{ border: `2px dashed ${investorImagePreview ? C.success : C.border}`, borderRadius: 12, padding: 20, background: investorImagePreview ? `${C.success}10` : C.bg, transition: 'all 0.2s' }}>
              {!investorImagePreview ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: C.textMuted }}>Upload investor photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInvestorImageUpload}
                    style={{ display: 'none' }}
                    id="investor-image-upload"
                  />
                  <label htmlFor="investor-image-upload">
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      padding: '8px 16px', 
                      borderRadius: 8, 
                      background: C.accent, 
                      color: '#fff', 
                      fontSize: 12, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}>Choose File</span>
                  </label>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: C.textMuted }}>JPG, PNG, GIF up to 5MB</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={investorImagePreview} 
                    alt="Investor preview" 
                    style={{ 
                      width: '100%', 
                      maxHeight: 200, 
                      objectFit: 'contain', 
                      borderRadius: 8,
                      border: `1px solid ${C.border}`
                    }} 
                  />
                  <button
                    onClick={clearInvestorImage}
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: C.danger,
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: C.success, textAlign: 'center' }}>✓ Photo uploaded</p>
                </div>
              )}
            </div>
          </div>
          
          <div><Label text="Notes (optional)" /><input style={IS} value={investorForm.notes} onChange={(e) => setInvestor('notes')(e.target.value)} placeholder="Additional information..." /></div>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setInvestorModal(false)}>Cancel</Btn>
            <Btn onClick={handleSaveInvestor} disabled={createInvestor.isPending || updateInvestor.isPending}>
              {(createInvestor.isPending || updateInvestor.isPending) ? 'Saving...' : (editingInvestorId ? 'Update Investor' : 'Add Investor')}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Receipt Image Viewer Modal */}
      <Modal open={!!viewingReceipt} onClose={() => setViewingReceipt(null)} title="Payment Receipt">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {viewingReceipt && (
            <img 
              src={viewingReceipt} 
              alt="Payment receipt" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '60vh', 
                objectFit: 'contain', 
                borderRadius: 12,
                border: `1px solid ${C.border}`
              }} 
            />
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <Btn variant="ghost" onClick={() => setViewingReceipt(null)}>Close</Btn>
            <Btn onClick={() => {
              if (viewingReceipt) {
                const link = document.createElement('a');
                link.href = viewingReceipt;
                link.download = `receipt_${new Date().toISOString().slice(0, 10)}.png`;
                link.click();
              }
            }}>Download Receipt</Btn>
          </div>
        </div>
      </Modal>

      {/* Investor Image Viewer Modal */}
      <Modal open={!!viewingInvestorImage} onClose={() => setViewingInvestorImage(null)} title="Investor Photo">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {viewingInvestorImage && (
            <img 
              src={viewingInvestorImage} 
              alt="Investor" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '60vh', 
                objectFit: 'contain', 
                borderRadius: 12,
                border: `1px solid ${C.border}`
              }} 
            />
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <Btn variant="ghost" onClick={() => setViewingInvestorImage(null)}>Close</Btn>
            <Btn onClick={() => {
              if (viewingInvestorImage) {
                const link = document.createElement('a');
                link.href = viewingInvestorImage;
                link.download = `investor_${new Date().toISOString().slice(0, 10)}.png`;
                link.click();
              }
            }}>Download Photo</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
