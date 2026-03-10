'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import toast from 'react-hot-toast';
import { useTheme } from '@/components/ThemeProvider';

const COLORS = {
  bg: '#0A0B0F', surface: '#111318', surfaceHover: '#161B22',
  border: '#1E2430', borderLight: '#252D3A',
  accent: '#4F8EF7', accentHover: '#3B7AE8', accentGlow: 'rgba(79,142,247,0.15)',
  success: '#2DD4A0', warning: '#F59E0B', danger: '#F04F5A', purple: '#9B6FF5',
  text: '#E8ECF2', textMuted: '#6B7A99', textDim: '#3A4560',
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡', section: null },
  { href: '/dashboard/employees', label: 'Employees', icon: '👥', section: 'Organization' },
  { href: '/dashboard/departments', label: 'Departments', icon: '🏢', section: 'Organization' },
  { href: '/dashboard/projects', label: 'Projects', icon: '📐', section: 'Work' },
  { href: '/dashboard/tasks', label: 'Tasks', icon: '✦', section: 'Work' },
  { href: '/dashboard/finance', label: 'Finance', icon: '💳', section: 'Finance' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📊', section: 'Finance' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙', section: 'System' },
];

function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  const colors = ['var(--accent)', 'var(--success)', 'var(--purple)', 'var(--warning)', 'var(--danger)'];
  const idx = ((initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0)) % colors.length;
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

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'var(--surface-hover)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '8px 10px',
        cursor: 'pointer',
        color: 'var(--text)',
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--accent)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface-hover)';
        e.currentTarget.style.color = 'var(--text)';
      }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}

export default function DashboardShell({ children, session }: { children: React.ReactNode; session: Session }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const user = session.user as any;
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const sections = [...new Set(NAV_ITEMS.map((n) => n.section))];

  async function handleSignOut() {
    await signOut({ redirect: false });
    toast.success('Signed out successfully');
    router.replace('/login');
  }

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetch('/api/notifications?limit=10');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Mark all notifications as read
  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen, fetchNotifications]);

  // Get icon and color based on notification type
  const getNotificationStyle = (type: string) => {
    const styles: Record<string, { icon: string; color: string }> = {
      budget_alert: { icon: '💰', color: 'var(--warning)' },
      employee_joined: { icon: '👤', color: 'var(--success)' },
      task_completed: { icon: '✅', color: 'var(--success)' },
      task_assigned: { icon: '📋', color: 'var(--accent)' },
      expense_pending: { icon: '💳', color: 'var(--warning)' },
      project_created: { icon: '📐', color: 'var(--accent)' },
      project_completed: { icon: '🎉', color: 'var(--purple)' },
      deadline_approaching: { icon: '⏰', color: 'var(--danger)' },
    };
    return styles[type] || { icon: '🔔', color: 'var(--accent)' };
  };

  // Format relative time
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown="notifications"]')) {
        setNotificationsOpen(false);
      }
      if (!target.closest('[data-dropdown="profile"]')) {
        setProfileMenuOpen(false);
      }
      if (!target.closest('[data-dropdown="usermenu"]')) {
        setUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 72 : 240,
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden',
      }} className="hide-mobile">
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 18px' : '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, minHeight: 72 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #4F8EF7, #9B6FF5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
          }}>⬡</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>NexusCMS</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Enterprise Suite</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
          {sections.map((section) => {
            const items = NAV_ITEMS.filter((n) => n.section === section);
            return (
              <div key={String(section)} style={{ marginBottom: 8 }}>
                {!collapsed && section && (
                  <p style={{ margin: '12px 8px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{section}</p>
                )}
                {items.map((item) => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <button key={item.href}
                      onClick={() => router.push(item.href)}
                      title={collapsed ? item.label : undefined}
                      style={{
                        width: '100%', padding: collapsed ? '10px 0' : '10px 12px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: 10, cursor: 'pointer',
                        background: active ? 'linear-gradient(90deg, var(--accent)22, var(--accent)11)' : 'none',
                        border: active ? '1px solid var(--accent)33' : '1px solid transparent',
                        color: active ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: active ? 700 : 500, fontSize: 13,
                        transition: 'all 0.15s ease', marginBottom: 2,
                      }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                      {!collapsed && active && <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div data-dropdown="usermenu" style={{ padding: collapsed ? '12px 8px' : '12px 14px', borderTop: '1px solid var(--border)', position: 'relative' }}>
          <button onClick={() => setUserMenu(!userMenu)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10,
            padding: collapsed ? '6px 4px' : '6px 8px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'background 0.15s',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Avatar initials={initials} size={34} />
            {!collapsed && (
              <div style={{ overflow: 'hidden', flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user?.role || 'Employee'}</div>
              </div>
            )}
          </button>

          {userMenu && !collapsed && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 10, right: 10,
              background: 'var(--surface)', border: '1px solid var(--border-light)',
              borderRadius: 12, padding: 6, boxShadow: '0 -8px 32px var(--shadow-color)',
              zIndex: 50,
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              {[
                { label: 'Profile Settings', icon: '👤', action: () => { router.push('/dashboard/settings'); setUserMenu(false); } },
                { label: 'Sign Out', icon: '🚪', action: handleSignOut, danger: true },
              ].map((item) => (
                <button key={item.label} onClick={item.action} style={{
                  width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8,
                  color: item.danger ? 'var(--danger)' : 'var(--text)',
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  textAlign: 'left', transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
          onClick={() => setMobileMenuOpen(false)}
          className="hide-desktop"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: mobileMenuOpen ? 0 : -260,
          width: 260,
          height: '100vh',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 101,
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        className="hide-desktop"
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>NexusCMS</div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 24,
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>
        <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
          {sections.map((section) => {
            const items = NAV_ITEMS.filter((n) => n.section === section);
            return (
              <div key={String(section)} style={{ marginBottom: 8 }}>
                {section && (
                  <p style={{ margin: '12px 8px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{section}</p>
                )}
                {items.map((item) => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <button key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        width: '100%', padding: '10px 12px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        borderRadius: 10, cursor: 'pointer',
                        background: active ? 'linear-gradient(90deg, var(--accent)22, var(--accent)11)' : 'none',
                        border: active ? '1px solid var(--accent)33' : '1px solid transparent',
                        color: active ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: active ? 700 : 500, fontSize: 13,
                        transition: 'all 0.15s ease', marginBottom: 2,
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.label}</span>
                      {active && <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setUserMenu(!userMenu)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10,
            padding: '6px 8px',
          }}>
            <Avatar initials={initials} size={34} />
            <div style={{ overflow: 'hidden', flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user?.role || 'Employee'}</div>
            </div>
          </button>
          {userMenu && (
            <div style={{ marginTop: 8, padding: 6, background: 'var(--surface-hover)', borderRadius: 8 }}>
              <button onClick={handleSignOut} style={{
                width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8,
                color: 'var(--danger)',
                fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                textAlign: 'left',
              }}>
                <span>🚪</span>Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <button onClick={() => setCollapsed((c) => !c)} className="hide-mobile" style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 18, padding: 6, borderRadius: 8, display: 'flex', lineHeight: 1,
          }}>☰</button>

          <button onClick={() => setMobileMenuOpen(true)} className="hide-desktop" style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 18, padding: 6, borderRadius: 8, display: 'flex', lineHeight: 1,
          }}>☰</button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {NAV_ITEMS.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification bell */}
          <div data-dropdown="notifications" style={{ position: 'relative' }}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              style={{
                background: notificationsOpen ? 'var(--accent)' : 'var(--surface-hover)', 
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 10px', cursor: 'pointer', 
                color: notificationsOpen ? '#fff' : 'var(--text)', fontSize: 16,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!notificationsOpen) {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!notificationsOpen) {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text)';
                }
              }}
              title="Notifications"
            >🔔</button>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%',
                background: 'var(--danger)', fontSize: 10, fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--surface)',
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
            
            {notificationsOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 360, background: 'var(--surface)', border: '1px solid var(--border-light)',
                borderRadius: 12, padding: '12px 0', boxShadow: '0 8px 32px var(--shadow-color)',
                zIndex: 100,
              }}>
                <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      disabled={loadingNotifications}
                      style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >Mark all read</button>
                  )}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {loadingNotifications ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                      <div>No notifications yet</div>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const style = getNotificationStyle(n.type);
                      return (
                        <div 
                          key={n._id} 
                          onClick={() => { if (!n.read) markAsRead(n._id); }}
                          style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid var(--border)', 
                            cursor: 'pointer', 
                            background: n.read ? 'transparent' : 'var(--accent)08',
                            opacity: n.read ? 0.7 : 1,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ 
                              width: 32, height: 32, borderRadius: 8, 
                              background: `${style.color}22`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, flexShrink: 0,
                            }}>{style.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ 
                                  width: 6, height: 6, borderRadius: '50%', 
                                  background: n.read ? 'transparent' : style.color,
                                  flexShrink: 0,
                                }} />
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{n.title}</div>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{formatTimeAgo(n.createdAt)}</div>
                            </div>
                            {n.priority === 'high' && (
                              <span style={{ 
                                padding: '2px 6px', borderRadius: 4, fontSize: 10, 
                                background: 'var(--danger)22', color: 'var(--danger)',
                                fontWeight: 600,
                              }}>HIGH</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div style={{ padding: '12px 16px 0', borderTop: '1px solid var(--border)' }}>
                    <button 
                      onClick={() => { router.push('/dashboard/notifications'); setNotificationsOpen(false); }}
                      style={{ width: '100%', padding: '8px', textAlign: 'center', fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}
                    >View all notifications</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div data-dropdown="profile" className="hide-mobile" style={{ position: 'relative' }}>
            <button 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, borderRadius: '50%' }}
            >
              <Avatar initials={initials} size={36} />
            </button>
            
            {profileMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                width: 220, background: 'var(--surface)', border: '1px solid var(--border-light)',
                borderRadius: 12, padding: 8, boxShadow: '0 8px 32px var(--shadow-color)',
                zIndex: 100,
              }}>
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role || 'Employee'}</div>
                </div>
                {[
                  { label: 'Profile Settings', icon: '👤', action: () => { router.push('/dashboard/settings'); setProfileMenuOpen(false); } },
                  { label: 'Help & Support', icon: '❓', action: () => { setProfileMenuOpen(false); } },
                  { label: 'Sign Out', icon: '🚪', action: () => { handleSignOut(); setProfileMenuOpen(false); }, danger: true },
                ].map((item) => (
                  <button key={item.label} onClick={item.action} style={{
                    width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                    background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8,
                    color: item.danger ? 'var(--danger)' : 'var(--text)',
                    fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
