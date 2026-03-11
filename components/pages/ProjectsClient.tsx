'use client';

import { useState, useEffect } from 'react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, useDepartments, useActivities, useSettings } from '@/lib/hooks/useApi';

const C = { accent: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', purple: 'var(--purple)', text: 'var(--text)', textMuted: 'var(--text-muted)', surface: 'var(--surface)', border: 'var(--border)', bg: 'var(--bg)', borderLight: 'var(--border-light)', surfaceHover: 'var(--surface-hover)' };
const IS = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none', width: '100%' };

function getStatusColor(s: string) { return ({ 'Planning': C.warning, 'In Progress': C.accent, 'Review': C.purple, 'Completed': C.success, 'On Hold': C.textMuted })[s] || C.textMuted; }
function getPriorityColor(p: string) { return ({ 'Low': C.textMuted, 'Medium': C.warning, 'High': C.danger, 'Critical': '#FF1A2E' })[p] || C.textMuted; }
function fmtMoney(n: number, currency = 'PKR') {
  const symbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  return n >= 1000 ? `${symbol}${(n / 1000).toFixed(0)}K` : `${symbol}${n}`;
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}30`, whiteSpace: 'nowrap' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />{label}</span>;
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }: any) {
  const [h, setH] = useState(false);
  const styles: any = { primary: { bg: h ? '#3B7AE8' : C.accent, c: '#fff', b: 'none' }, ghost: { bg: h ? C.surfaceHover : 'transparent', c: C.text, b: `1px solid ${C.border}` }, danger: { bg: C.danger, c: '#fff', b: 'none' } };
  const s = styles[variant];
  return <button disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} style={{ padding: size === 'sm' ? '5px 10px' : '9px 18px', borderRadius: 9, border: s.b, background: s.bg, color: s.c, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{children}</button>;
}

function Modal({ open, onClose, title, children, width = 540 }: any) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 20, width: '100%', maxWidth: width, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  const icons: Record<string, string> = {
    created: '🆕',
    updated: '✏️',
    deleted: '🗑️',
    status_changed: '🔄',
    budget_updated: '💰',
    progress_updated: '📊',
    assigned: '👤',
    commented: '💬',
  };
  return <span>{icons[action] || '📝'}</span>;
}

function getActionColor(action: string) {
  const colors: Record<string, string> = {
    created: C.success,
    updated: C.accent,
    deleted: C.danger,
    status_changed: C.warning,
    budget_updated: C.purple,
    progress_updated: C.accent,
  };
  return colors[action] || C.textMuted;
}

const EMPTY = { title: '', description: '', department: '', status: 'Planning', priority: 'Medium', budget: '', spent: '0', revenue: '0', progress: '0', startDate: '', endDate: '' };
const STATUSES = ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function ProjectsClient() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [isMobile, setIsMobile] = useState(false);
  const { data: settingsData } = useSettings();
  const currency = settingsData?.settings?.currency || 'PKR';
  const currencySymbol = currency === 'PKR' ? '₨' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const params: Record<string, string> = {};
  if (filterStatus !== 'All') params.status = filterStatus;

  const { data, isLoading } = useProjects(params);
  const { data: deptsData } = useDepartments();
  const depts = deptsData?.departments || [];
  const create = useCreateProject();
  const update = useUpdateProject(selected?._id || '');
  const isUpdateEnabled = !!selected?._id;
  const del = useDeleteProject();
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities('Project', selected?._id);
  const activities = activitiesData?.activities || [];

  const projects = data?.projects || [];
  const set = (k: string) => (v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  function openEdit(p: any) { setSelected(p); setForm({ title: p.title, description: p.description, department: p.department?._id || '', status: p.status, priority: p.priority, budget: String(p.budget), spent: String(p.spent || 0), revenue: String(p.revenue || 0), progress: String(p.progress || 0), startDate: p.startDate?.slice(0, 10) || '', endDate: p.endDate?.slice(0, 10) || '' }); setModal(true); }
  function openView(p: any) { setSelected(p); setViewModal(true); }
  function openAdd() { setSelected(null); setForm(EMPTY); setModal(true); }

  async function handleSave() {
    console.log('handleSave - form.revenue:', form.revenue, 'type:', typeof form.revenue);
    
    const payload = { 
      ...form, 
      budget: parseFloat(form.budget) || 0, 
      spent: parseFloat(form.spent) || 0, 
      revenue: parseFloat(form.revenue) || 0,
      progress: parseInt(form.progress) || 0,
    };
    
    console.log('handleSave - payload:', payload);
    
    try {
      if (selected) {
        await update.mutateAsync(payload);
        console.log('Project updated successfully');
      } else {
        await create.mutateAsync(payload);
        console.log('Project created successfully');
      }
      setModal(false);
    } catch (error: any) {
      console.error('handleSave error:', error);
      alert('Failed to save project: ' + (error.message || 'Unknown error'));
    }
  }

  const Label = ({ text }: any) => <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{text}</label>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {['All', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, background: filterStatus === s ? C.accent : C.surfaceHover, color: filterStatus === s ? '#fff' : C.textMuted, border: `1px solid ${filterStatus === s ? 'transparent' : C.border}`, transition: 'all 0.15s' }}>{s}</button>
        ))}
        <div style={{ flex: 1 }} />
        <Btn onClick={openAdd}>+ New Project</Btn>
      </div>

      {isLoading ? <div style={{ padding: 60, textAlign: 'center', color: C.textMuted }}>Loading projects...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {projects.map((p: any) => {
            const budgetPct = p.budget > 0 ? (p.spent / p.budget) * 100 : 0;
            return (
              <div key={p._id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge label={p.status} color={getStatusColor(p.status)} />
                    <Badge label={p.priority} color={getPriorityColor(p.priority)} />
                  </div>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: C.text }}>{p.title}</h3>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{p.description || 'No description'}</p>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.textMuted }}>Progress</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.progress || 0}%</span>
                  </div>
                  <div style={{ height: 7, background: C.border, borderRadius: 7, marginBottom: 12 }}>
                    <div style={{ height: '100%', width: `${p.progress || 0}%`, borderRadius: 7, background: (p.progress || 0) >= 100 ? C.success : (p.progress || 0) > 50 ? C.accent : C.warning, transition: 'width 0.6s ease' }} />
                  </div>
                  
                  {/* Budget & Revenue Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                    <div style={{ background: C.bg, borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>Budget</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{fmtMoney(p.spent || 0, currency)} / {fmtMoney(p.budget || 0, currency)}</div>
                      <div style={{ fontSize: 10, color: budgetPct > 90 ? C.danger : C.textMuted, marginTop: 2 }}>{Math.round(budgetPct)}% used</div>
                    </div>
                    <div style={{ background: `${C.success}10`, borderRadius: 8, padding: 10, border: `1px solid ${C.success}30` }}>
                      <div style={{ fontSize: 10, color: C.success, marginBottom: 4 }}>Revenue</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.success }}>{fmtMoney(p.revenue || 0, currency)}</div>
                      {p.revenue > 0 && p.budget > 0 && (
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                          {((p.revenue / p.budget) * 100).toFixed(0)}% of budget
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ height: 4, background: C.border, borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, budgetPct)}%`, borderRadius: 4, background: budgetPct > 90 ? C.danger : budgetPct > 70 ? C.warning : C.success }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{p.department?.name || '—'} · {p.startDate?.slice(0, 10)} → {p.endDate?.slice(0, 10)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn size="sm" variant="ghost" onClick={() => openView(p)}>View</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del.mutate(p._id)}>✕</Btn>
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: C.textMuted, fontSize: 13 }}>No projects found. Create your first project.</div>}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={selected ? 'Edit Project' : 'New Project'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><Label text="Title" /><input style={IS} value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="Project Name" /></div>
          <div><Label text="Description" /><input style={IS} value={form.description} onChange={(e) => set('description')(e.target.value)} placeholder="Brief description..." /></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Department" />
              <select style={IS} value={form.department} onChange={(e) => set('department')(e.target.value)}>
                <option value="">Select dept</option>
                {(depts as any[]).map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div><Label text="Status" />
              <select style={IS} value={form.status} onChange={(e) => set('status')(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text={`Budget (${currencySymbol})`} /><input style={IS} type="number" value={form.budget} onChange={(e) => set('budget')(e.target.value)} placeholder="100000" /></div>
            <div><Label text={`Spent (${currencySymbol})`} /><input style={IS} type="number" value={form.spent} onChange={(e) => set('spent')(e.target.value)} placeholder="0" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text={`Revenue (${currencySymbol})`} /><input style={IS} type="number" value={form.revenue} onChange={(e) => set('revenue')(e.target.value)} placeholder="0" /></div>
            <div><Label text="Progress (0-100%)" /><input style={IS} type="number" min="0" max="100" value={form.progress} onChange={(e) => set('progress')(e.target.value)} placeholder="0" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Start Date" /><input style={IS} type="date" value={form.startDate} onChange={(e) => set('startDate')(e.target.value)} /></div>
            <div><Label text="End Date" /><input style={IS} type="date" value={form.endDate} onChange={(e) => set('endDate')(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? 'Saving...' : 'Save Project'}</Btn>
          </div>
        </div>
      </Modal>

      {/* View Modal with Activity Tracking */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title={selected ? selected.title : 'Project Details'} width={640}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Project Details */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Status</div>
                <Badge label={selected.status} color={getStatusColor(selected.status)} />
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Priority</div>
                <Badge label={selected.priority} color={getPriorityColor(selected.priority)} />
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Department</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selected.department?.name || '—'}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Budget</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fmtMoney(selected.budget || 0, currency)}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Spent: {fmtMoney(selected.spent || 0, currency)}</div>
              </div>
              <div style={{ background: `${C.success}10`, borderRadius: 12, padding: 16, border: `1px solid ${C.success}30` }}>
                <div style={{ fontSize: 11, color: C.success, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Revenue</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.success }}>{fmtMoney(selected.revenue || 0, currency)}</div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity Timeline</h4>
              {activitiesLoading ? (
                <div style={{ padding: 20, textAlign: 'center', color: C.textMuted }}>Loading activities...</div>
              ) : activities.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: C.textMuted, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  No activities recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflow: 'auto' }}>
                  {activities.map((activity: any, i: number) => (
                    <div key={activity._id || i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${getActionColor(activity.action)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        <ActivityIcon action={activity.action} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: getActionColor(activity.action), textTransform: 'capitalize' }}>
                            {activity.action.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 11, color: C.textMuted }}>by {activity.performedByName}</span>
                        </div>
                        <div style={{ fontSize: 13, color: C.text }}>{activity.details?.message || 'No details'}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                          {new Date(activity.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
