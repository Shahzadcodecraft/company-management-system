'use client';

import { useState, useEffect } from 'react';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useSettings } from '@/lib/hooks/useApi';

const C = { accent: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', purple: 'var(--purple)', text: 'var(--text)', textMuted: 'var(--text-muted)', surface: 'var(--surface)', border: 'var(--border)', bg: 'var(--bg)', borderLight: 'var(--border-light)', surfaceHover: 'var(--surface-hover)' };
const DEPT_COLORS = [C.accent, C.success, C.purple, C.warning, C.danger];
const IS = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none', width: '100%' };

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }: any) {
  const [h, setH] = useState(false);
  const styles: any = { primary: { bg: h ? '#3B7AE8' : C.accent, c: '#fff', b: 'none' }, ghost: { bg: h ? C.surfaceHover : 'transparent', c: C.text, b: `1px solid ${C.border}` }, danger: { bg: h ? '#D93F4A' : C.danger, c: '#fff', b: 'none' } };
  const s = styles[variant];
  return <button disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} style={{ padding: size === 'sm' ? '6px 12px' : '9px 18px', borderRadius: 9, border: s.b, background: s.bg, color: s.c, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>{children}</button>;
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

const EMPTY = { name: '', head: '', description: '', budget: '' };

export default function DepartmentsClient() {
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const LIMIT = 10;

  const { data: settingsData } = useSettings();
  const currency = settingsData?.settings?.currency || 'PKR';
  const currencySymbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  
  function fmtMoney(n: number) {
    return n >= 1000 ? `${currencySymbol}${Math.round(n / 1000)}K` : `${currencySymbol}${n}`;
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data, isLoading } = useDepartments({ page: String(page), limit: String(LIMIT) });
  const departments = data?.departments || [];
  const pagination = data?.pagination;
  const create = useCreateDepartment();
  const update = useUpdateDepartment(selected?._id);
  const del = useDeleteDepartment();

  const set = (k: string) => (v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  function openEdit(d: any) { setSelected(d); setForm({ name: d.name, head: d.head, description: d.description, budget: String(d.budget) }); setModal(true); }
  function openAdd() { setSelected(null); setForm(EMPTY); setModal(true); }

  async function handleSave() {
    const payload = { ...form, budget: parseFloat(form.budget) || 0 };
    if (selected) {
      await (update as any).mutateAsync(payload);
    } else {
      await create.mutateAsync(payload);
    }
    setModal(false); setSelected(null);
  }

  if (isLoading) return <div style={{ color: C.textMuted, padding: 60, textAlign: 'center' }}>Loading departments...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={openAdd}>+ New Department</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {(departments as any[]).map((d: any, i: number) => {
          const color = DEPT_COLORS[i % DEPT_COLORS.length];
          return (
            <div key={d._id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏢</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(d)}>Edit</Btn>
                  <Btn size="sm" variant="danger" onClick={() => del.mutate(d._id)}>✕</Btn>
                </div>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: C.text }}>{d.name}</h3>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{d.description || 'No description'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
                {[['Head', d.head?.split(' ')[0] || '—'], ['Staff', d.employeeCount ?? 0], ['Budget', fmtMoney(d.budget || 0)]].map(([l, v]) => (
                  <div key={l} style={{ background: C.bg, borderRadius: 8, padding: '8px 10px', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {departments.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: C.textMuted, fontSize: 13 }}>No departments yet. Create your first department.</div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
          <Btn variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</Btn>
          <span style={{ fontSize: 13, color: C.textMuted }}>
            Page {page} of {pagination.totalPages}
          </span>
          <Btn variant="ghost" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</Btn>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={selected ? 'Edit Department' : 'New Department'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Department Name</label><input style={IS} value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Engineering" /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Department Head</label><input style={IS} value={form.head} onChange={(e) => set('head')(e.target.value)} placeholder="Jane Doe" /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description</label><input style={IS} value={form.description} onChange={(e) => set('description')(e.target.value)} placeholder="Department overview..." /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Annual Budget ({currencySymbol})</label><input style={IS} type="number" value={form.budget} onChange={(e) => set('budget')(e.target.value)} placeholder="500000" /></div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={create.isPending}>{create.isPending ? 'Saving...' : 'Save Department'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
