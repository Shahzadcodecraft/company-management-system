'use client';

import { useState, useEffect } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useDepartments } from '@/lib/hooks/useApi';

const C = {
  accent: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)',
  danger: 'var(--danger)', purple: 'var(--purple)', text: 'var(--text)',
  textMuted: 'var(--text-muted)', surface: 'var(--surface)', border: 'var(--border)',
  bg: 'var(--bg)', surfaceHover: 'var(--surface-hover)', borderLight: 'var(--border-light)',
};

function getColor(v: string) {
  const m: Record<string, string> = { Active: C.success, Inactive: C.warning, Admin: C.danger, Manager: C.accent, Employee: C.purple };
  return m[v] || C.textMuted;
}

function Badge({ children }: { children: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: getColor(children), background: `${getColor(children)}18`,
      border: `1px solid ${getColor(children)}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: getColor(children) }} />
      {children}
    </span>
  );
}

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const colors = [C.accent, C.success, C.purple, C.warning, C.danger];
  const idx = ((initials.charCodeAt(0) || 65) + (initials.charCodeAt(1) || 65)) % colors.length;
  const color = colors[idx];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}33`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value > 90 ? C.success : value > 75 ? C.accent : C.warning;
  return (
    <div style={{ width: '100%', height: 5, background: C.border, borderRadius: 5 }}>
      <div style={{ height: '100%', width: `${value}%`, borderRadius: 5, background: color }} />
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }: any) {
  const [h, setH] = useState(false);
  const bg = { primary: h ? '#3B7AE8' : C.accent, ghost: h ? C.surfaceHover : 'transparent', danger: h ? '#D93F4A' : C.danger };
  const col = { primary: '#fff', ghost: C.text, danger: '#fff' };
  const pad = size === 'sm' ? '6px 12px' : '9px 18px';
  return (
    <button disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick}
      style={{ padding: pad, borderRadius: 9, border: variant === 'ghost' ? `1px solid ${C.border}` : 'none', background: (bg as any)[variant], color: (col as any)[variant], fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

const IS = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none', width: '100%' };

const EMPTY = { name: '', email: '', role: 'Employee', department: '', salary: '', status: 'Active', phone: '', performance: 85, joinDate: '', endDate: '' };

export default function EmployeesClient() {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'view'>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [isMobile, setIsMobile] = useState(false);
  const limit = 10;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const params: Record<string, string> = { page: String(page), limit: String(limit) };
  if (search) params.search = search;
  if (filterDept !== 'All') params.department = filterDept;

  const { data, isLoading } = useEmployees(params);
  const { data: deptData } = useDepartments();
  const createEmp = useCreateEmployee();
  const updateEmp = useUpdateEmployee(selected?._id || '');
  const deleteEmp = useDeleteEmployee();

  const employees = data?.employees || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const departments = deptData?.departments || [];

  const set = (k: string) => (v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleDeptChange(value: string) {
    setFilterDept(value);
    setPage(1);
  }

  function openAdd() { setForm(EMPTY); setSelected(null); setModal('add'); }
  function openEdit(e: any) { setSelected(e); setForm({ name: e.name, email: e.email, role: e.role, department: e.department?._id || e.department || '', salary: String(e.salary), status: e.status, phone: e.phone || '', performance: e.performance || 85, joinDate: e.joinDate ? new Date(e.joinDate).toISOString().split('T')[0] : '', endDate: e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : '' }); setModal('edit'); }
  function openView(e: any) { setSelected(e); setModal('view'); }

  async function handleSave() {
    const payload = { ...form, salary: parseFloat(form.salary) || 0, performance: parseInt(form.performance) || 85 };
    if (modal === 'add') {
      await createEmp.mutateAsync(payload);
    } else if (modal === 'edit' && selected) {
      await updateEmp.mutateAsync(payload);
    }
    setModal(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Search</label>
          <input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search by name or email..." style={{ ...IS, width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Department</label>
          <select value={filterDept} onChange={(e) => handleDeptChange(e.target.value)} style={IS}>
            <option value="All">All Departments</option>
            {departments.map((d: any) => <option key={d._id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <Btn onClick={openAdd}>+ Add Employee</Btn>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {[{ l: 'Total', v: total, c: C.accent }, { l: 'Active', v: data?.employees?.filter((e: any) => e.status === 'Active').length || 0, c: C.success }, { l: 'Inactive', v: data?.employees?.filter((e: any) => e.status !== 'Active').length || 0, c: C.danger }].map(s => (
          <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</span>
            <span style={{ fontSize: 12, color: C.textMuted }}>{s.l}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.textMuted }}>Page {page} of {totalPages || 1}</span>
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.textMuted }}>Loading employees...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans',sans-serif" }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Employee', 'Role', 'Department', 'Salary', 'Performance', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp: any, i: number) => (
                  <tr key={emp._id} style={{ borderBottom: i < employees.length - 1 ? `1px solid ${C.border}` : 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar initials={emp.avatar || emp.name?.slice(0, 2).toUpperCase() || 'EM'} size={36} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{emp.name}</div>
                          <div style={{ fontSize: 11, color: C.textMuted }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}><Badge>{emp.role}</Badge></td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: C.text }}>{emp.department?.name || emp.department || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>${(emp.salary || 0).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}><ProgressBar value={emp.performance || 85} /></div>
                        <span style={{ fontSize: 11, color: C.textMuted, width: 32 }}>{emp.performance || 85}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}><Badge>{emp.status}</Badge></td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn size="sm" variant="ghost" onClick={() => openView(emp)}>View</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(emp)}>Edit</Btn>
                        <Btn size="sm" variant="danger" onClick={() => deleteEmp.mutate(emp._id)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>No employees found. Add your first employee above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Btn
              key={p}
              size="sm"
              variant={p === page ? 'primary' : 'ghost'}
              onClick={() => setPage(p)}
            >{p}</Btn>
          ))}
          <Btn variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
        </div>
      )}
      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Employee' : 'Edit Employee'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Field label="Full Name"><input style={IS} value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Jane Doe" /></Field>
            <Field label="Email"><input style={IS} type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="jane@corp.com" /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Field label="Role">
              <select style={IS} value={form.role} onChange={(e) => set('role')(e.target.value)}>
                {['Admin', 'Manager', 'Employee'].map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select style={IS} value={form.department} onChange={(e) => set('department')(e.target.value)}>
                <option value="">Select department</option>
                {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Field label="Salary ($)"><input style={IS} type="number" value={form.salary} onChange={(e) => set('salary')(e.target.value)} placeholder="80000" /></Field>
            <Field label="Performance (0-100)"><input style={IS} type="number" min="0" max="100" value={form.performance} onChange={(e) => set('performance')(e.target.value)} placeholder="85" /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Field label="Status">
              <select style={IS} value={form.status} onChange={(e) => set('status')(e.target.value)}>
                {['Active', 'Inactive', 'On Leave'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Phone (optional)"><input style={IS} value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="+1 555 000 0000" /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Field label="Join Date"><input style={IS} type="date" value={form.joinDate} onChange={(e) => set('joinDate')(e.target.value)} /></Field>
            <Field label="End Date (optional)"><input style={IS} type="date" value={form.endDate} onChange={(e) => set('endDate')(e.target.value)} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={createEmp.isPending || updateEmp.isPending}>{createEmp.isPending || updateEmp.isPending ? 'Saving...' : (modal === 'add' ? 'Add Employee' : 'Save Changes')}</Btn>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title="Employee Profile">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Avatar initials={selected.avatar || selected.name?.slice(0, 2).toUpperCase() || 'EM'} size={isMobile ? 48 : 64} />
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: isMobile ? 18 : 20, fontWeight: 800, color: C.text }}>{selected.name}</h2>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: C.textMuted }}>{selected.email}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Badge>{selected.role}</Badge><Badge>{selected.status}</Badge></div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              {[
                ['Department', selected.department?.name || selected.department || '—'],
                ['Salary', `$${(selected.salary || 0).toLocaleString()}`],
                ['Join Date', selected.joinDate ? new Date(selected.joinDate).toLocaleDateString() : '—'],
                ['End Date', selected.endDate ? new Date(selected.endDate).toLocaleDateString() : '—'],
                ['Phone', selected.phone || '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ background: C.bg, borderRadius: 10, padding: '12px 16px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{v}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Performance Score</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{selected.performance || 85}%</span>
              </div>
              <div style={{ height: 8, background: C.border, borderRadius: 8 }}>
                <div style={{ height: '100%', width: `${selected.performance || 85}%`, borderRadius: 8, background: C.accent }} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
