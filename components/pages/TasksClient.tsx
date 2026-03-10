'use client';

import { useState, useEffect } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useEmployees, useProjects } from '@/lib/hooks/useApi';
import toast from 'react-hot-toast';

const C = { accent: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', purple: 'var(--purple)', text: 'var(--text)', textMuted: 'var(--text-muted)', surface: 'var(--surface)', border: 'var(--border)', bg: 'var(--bg)', borderLight: 'var(--border-light)', surfaceHover: 'var(--surface-hover)' };
const IS = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none', width: '100%' };

const COLUMNS = [
  { id: 'Todo', label: 'To Do', color: C.textMuted },
  { id: 'In Progress', label: 'In Progress', color: C.accent },
  { id: 'Review', label: 'Review', color: C.warning },
  { id: 'Done', label: 'Done', color: C.success },
];

function getPriColor(p: string) { return ({ Low: C.textMuted, Medium: C.warning, High: C.danger, Critical: '#FF1A2E' })[p] || C.textMuted; }

function Avatar({ text, size = 26 }: { text: string; size?: number }) {
  const colors = [C.accent, C.success, C.purple, C.warning];
  const c = colors[(text.charCodeAt(0) || 0) % colors.length];
  return <div style={{ width: size, height: size, borderRadius: '50%', background: `${c}33`, border: `1.5px solid ${c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: c, flexShrink: 0 }}>{text.slice(0, 2).toUpperCase()}</div>;
}

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }: any) {
  const [h, setH] = useState(false);
  const styles: any = { primary: { bg: h ? '#3B7AE8' : C.accent, c: '#fff', b: 'none' }, ghost: { bg: h ? C.surfaceHover : 'transparent', c: C.text, b: `1px solid ${C.border}` } };
  const s = styles[variant] || styles.primary;
  return <button disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} style={{ padding: size === 'sm' ? '5px 10px' : '9px 18px', borderRadius: 9, border: s.b, background: s.bg, color: s.c, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{children}</button>;
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

const EMPTY = { title: '', description: '', project: '', assignee: '', priority: 'Medium', status: 'Todo', dueDate: '' };

function ViewTaskModal({ task, open, onClose }: any) {
  if (!open || !task) return null;
  const assignee = task.assignee;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Task Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: getPriColor(task.priority), background: `${getPriColor(task.priority)}18`, padding: '4px 12px', borderRadius: 20 }}>{task.priority}</span>
            <span style={{ fontSize: 12, color: C.textMuted }}>{task.status}</span>
          </div>
          <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{task.title}</h2>
          {task.description && (
            <div style={{ background: C.bg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{task.description}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{task.project?.title || task.project || '—'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: C.bg, borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignee</p>
            <div style={{ flex: 1 }} />
            {assignee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar text={assignee.name || assignee.avatar || 'EM'} size={28} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{assignee.name || 'Employee'}</span>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: C.textMuted }}>Unassigned</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksClient() {
  const [viewTask, setViewTask] = useState<any>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: tasks = [], isLoading } = useTasks();
  const { data: empData } = useEmployees();
  const { data: projData } = useProjects();
  const create = useCreateTask();
  const del = useDeleteTask();

  const employees = empData?.employees || [];
  const projects = projData?.projects || [];
  const tasksArr: any[] = Array.isArray(tasks) ? tasks : [];

  // Per-task update hook needs id - use a wrapper
  const [movingId, setMovingId] = useState<string | null>(null);
  const moveTask = useUpdateTask(movingId || '');

  const set = (k: string) => (v: string) => setForm((p: any) => ({ ...p, [k]: v }));
  const Label = ({ text }: any) => <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{text}</label>;

  function handleDrop(colId: string) {
    if (dragging) {
      setMovingId(dragging);
      setTimeout(() => {
        moveTask.mutate({ status: colId });
        toast.success('Task moved', { duration: 1500 });
      }, 0);
    }
    setDragging(null);
    setDragOver(null);
  }

  async function handleSave() {
    await create.mutateAsync(form);
    setModal(false);
    setForm(EMPTY);
  }

  if (isLoading) return <div style={{ padding: 60, textAlign: 'center', color: C.textMuted }}>Loading tasks...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 20 }}>
          {COLUMNS.map((c) => {
            const count = tasksArr.filter((t) => t.status === c.id).length;
            return <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} /><span style={{ fontSize: 12, color: C.textMuted }}>{c.label}</span><span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{count}</span></div>;
          })}
        </div>
        <Btn onClick={() => { setForm(EMPTY); setModal(true); }}>+ New Task</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 14, alignItems: 'start', overflowX: isMobile ? 'auto' : 'visible' }}>
        {COLUMNS.map((col) => {
          const colTasks = tasksArr.filter((t) => t.status === col.id);
          const isOver = dragOver === col.id;
          return (
            <div key={col.id} onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }} onDrop={() => handleDrop(col.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: C.surface, borderRadius: 10, border: `1px solid ${isOver ? col.color : C.border}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>{col.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.color, background: `${col.color}22`, padding: '1px 8px', borderRadius: 20 }}>{colTasks.length}</span>
              </div>

              <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', gap: 10, background: isOver ? `${col.color}08` : 'transparent', borderRadius: 12, padding: isOver ? 8 : 0, border: `1px solid ${isOver ? col.color + '44' : 'transparent'}`, transition: 'all 0.2s' }}>
                {colTasks.map((task: any) => {
                  const isDrag = dragging === task._id;
                  const assignee = task.assignee;
                  return (
                    <div key={task._id} draggable onDragStart={() => setDragging(task._id)} onDragEnd={() => { setDragging(null); setDragOver(null); }} onClick={() => setViewTask(task)}
                      style={{ background: isDrag ? C.bg : C.surface, border: `1px solid ${isDrag ? col.color + '66' : C.border}`, borderRadius: 12, padding: 14, cursor: 'grab', opacity: isDrag ? 0.5 : 1, transition: 'all 0.15s', height: 160, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: getPriColor(task.priority), background: `${getPriColor(task.priority)}18`, padding: '2px 8px', borderRadius: 20 }}>{task.priority}</span>
                        <button onClick={(e) => { e.stopPropagation(); del.mutate(task._id); }} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 13 }}>✕</button>
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.4, flexShrink: 0 }}>{task.title}</p>
                      {task.description && (
                        <div style={{ flex: 1, overflowY: 'auto', margin: '0 0 8px' }}>
                          <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.5, wordBreak: 'break-word' }}>{task.description}</p>
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, flexShrink: 0 }}>{task.project?.title || task.project}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginTop: 'auto' }}>
                        {assignee && <Avatar text={assignee.name || assignee.avatar || 'EM'} size={24} />}
                        <span style={{ fontSize: 10, color: C.textMuted }}>Due {task.dueDate?.slice(0, 10)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ViewTaskModal task={viewTask} open={!!viewTask} onClose={() => setViewTask(null)} />

      <Modal open={modal} onClose={() => setModal(false)} title="New Task">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><Label text="Title" /><input style={IS} value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="Task title" /></div>
          <div><Label text="Description" /><input style={IS} value={form.description} onChange={(e) => set('description')(e.target.value)} placeholder="Details..." /></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <div><Label text="Project" />
              <select style={IS} value={form.project} onChange={(e) => set('project')(e.target.value)}>
                <option value="">Select project</option>
                {projects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
            <div><Label text="Assignee" />
              <select style={IS} value={form.assignee} onChange={(e) => set('assignee')(e.target.value)}>
                <option value="">Select assignee</option>
                {employees.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
            <div><Label text="Priority" />
              <select style={IS} value={form.priority} onChange={(e) => set('priority')(e.target.value)}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><Label text="Status" />
              <select style={IS} value={form.status} onChange={(e) => set('status')(e.target.value)}>
                {['Todo', 'In Progress', 'Review', 'Done'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><Label text="Due Date" /><input style={IS} type="date" value={form.dueDate} onChange={(e) => set('dueDate')(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={create.isPending}>{create.isPending ? 'Saving...' : 'Create Task'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
