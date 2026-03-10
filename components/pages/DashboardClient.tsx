'use client';

import { useDashboard } from '@/lib/hooks/useApi';
import { useState, useEffect, useMemo } from 'react';

const C = {
  accent: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)',
  danger: 'var(--danger)', purple: 'var(--purple)',
  text: 'var(--text)', textMuted: 'var(--text-muted)',
  surface: 'var(--surface)', border: 'var(--border)', bg: 'var(--bg)',
};

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, ...style }}>
      {children}
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }: { title: string; value: string | number; icon: string; color: string; subtitle?: string }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</p>
          <h2 style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>{value}</h2>
          {subtitle && <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{subtitle}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${color}22`, border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>{icon}</div>
      </div>
    </Card>
  );
}

function ProgressBar({ value, color = C.accent }: { value: number; color?: string }) {
  return (
    <div style={{ width: '100%', height: 6, background: C.border, borderRadius: 6 }}>
      <div style={{ height: '100%', width: `${Math.min(100, value)}%`, borderRadius: 6, background: color, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function DashboardClient() {
  const { data, isLoading, error } = useDashboard();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let rafId: number;
    const checkMobile = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setIsMobile(window.innerWidth <= 768));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'var(--dashboard-loading-height)', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: `3px solid var(--border)`, borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading dashboard data...</span>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 60, color: C.danger }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
      <p style={{ fontSize: 14 }}>Failed to load dashboard. Check your MongoDB connection.</p>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>{(error as Error).message}</p>
    </div>
  );

  const stats = data?.stats || {};
  const taskDist = data?.taskDistribution || [];
  const empByDept = data?.empByDept || [];
  const performanceByDept = data?.performanceByDept || [];
  const recentProjects = data?.recentProjects || [];

  const taskStatusMap = useMemo(() => {
    const map: Record<string, number> = {};
    taskDist.forEach((t: any) => { map[t._id] = t.count; });
    return map;
  }, [taskDist]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard title="Total Employees" value={stats.totalEmployees || 0} icon="👥" color={C.accent} subtitle={`${stats.activeEmployees || 0} active`} />
        <StatCard title="Active Projects" value={stats.activeProjects || 0} icon="📐" color={C.success} subtitle={`${stats.totalProjects || 0} total`} />
        <StatCard title="Pending Tasks" value={stats.pendingTasks || 0} icon="✦" color={C.warning} subtitle={`${stats.doneTasks || 0} completed`} />
        <StatCard title="Approved Expenses" value={fmt(stats.approvedExpensesTotal || 0)} icon="💳" color={C.purple} subtitle={`${stats.pendingExpenses || 0} pending`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 16 }}>
        {/* Active Projects */}
        <Card>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.text }}>Active Projects</h3>
          {recentProjects.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>No active projects yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recentProjects.map((p: any) => (
                <div key={p._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.title}</span>
                    <span style={{ fontSize: 12, color: C.textMuted }}>{p.progress || 0}%</span>
                  </div>
                  <ProgressBar value={p.progress || 0} color={(p.progress || 0) > 80 ? C.success : (p.progress || 0) > 40 ? C.accent : C.warning} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{p.department?.name || p.department || '—'}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${C.accent}22`, color: C.accent }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Task Distribution */}
        <Card>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.text }}>Task Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'To Do', key: 'Todo', color: C.textMuted },
              { label: 'In Progress', key: 'In Progress', color: C.accent },
              { label: 'Review', key: 'Review', color: C.warning },
              { label: 'Done', key: 'Done', color: C.success },
            ].map(({ label, key, color }) => {
              const count = taskStatusMap[key] || 0;
              const total = stats.totalTasks || 1;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: C.text }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{count}</span>
                  </div>
                  <ProgressBar value={(count / total) * 100} color={color} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Departments */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Card>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.text }}>Staff by Department</h3>
          {empByDept.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>No department data yet</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {empByDept.map((d: any, i: number) => {
                const colors = [C.accent, C.success, C.purple, C.warning, C.danger];
                const color = colors[i % colors.length];
                return (
                  <div key={d._id || i} style={{
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: 16, borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4 }}>{d.count}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{d.name}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.text }}>Performance by Department</h3>
          {performanceByDept.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>No performance data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {performanceByDept.map((d: any, i: number) => {
                const perf = d.avgPerformance || 0;
                const color = perf >= 90 ? C.success : perf >= 75 ? C.accent : C.warning;
                return (
                  <div key={d._id || i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.name}</span>
                        <span style={{ fontSize: 11, color: C.textMuted }}>({d.count} employees)</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{perf}%</span>
                    </div>
                    <ProgressBar value={perf} color={color} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
