'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  budget_alert: '💰',
  employee_joined: '👤',
  task_completed: '✅',
  task_assigned: '📋',
  expense_pending: '💳',
  project_created: '📐',
  project_completed: '🎉',
  deadline_approaching: '⏰',
};

const typeColors: Record<string, string> = {
  budget_alert: 'var(--warning)',
  employee_joined: 'var(--success)',
  task_completed: 'var(--success)',
  task_assigned: 'var(--accent)',
  expense_pending: 'var(--warning)',
  project_created: 'var(--accent)',
  project_completed: 'var(--purple)',
  deadline_approaching: 'var(--danger)',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const router = useRouter();
  const LIMIT = 20;

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const unreadParam = filter === 'unread' ? '&unread=true' : '';
      const res = await fetch(`/api/notifications?limit=${LIMIT}&page=${page}${unreadParam}&generate=false`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      if (data.success) {
        if (page === 1) {
          setNotifications(data.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.data.notifications]);
        }
        setHasMore(data.data.notifications.length === LIMIT);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    try {
      const res = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAll' }),
      });
      if (res.ok) {
        setNotifications([]);
        toast.success('All notifications cleared');
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

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

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px 0' }}>
            Notifications
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No unread notifications'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✓ Mark all read
            </button>
          )}
          <button
            onClick={clearAll}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--danger)',
              background: 'transparent',
              color: 'var(--danger)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            🗑 Clear all
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <button
          onClick={() => { setFilter('all'); setPage(1); }}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: filter === 'all' ? 'var(--accent)' : 'transparent',
            color: filter === 'all' ? '#fff' : 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => { setFilter('unread'); setPage(1); }}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: filter === 'unread' ? 'var(--accent)' : 'transparent',
            color: filter === 'unread' ? '#fff' : 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && page === 1 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No notifications</div>
            <div style={{ fontSize: 14 }}>
              {filter === 'unread' ? 'You have no unread notifications' : 'You have no notifications yet'}
            </div>
          </div>
        ) : (
          <>
            {filteredNotifications.map((n) => {
              const icon = typeIcons[n.type] || '🔔';
              const color = typeColors[n.type] || 'var(--accent)';
              return (
                <div
                  key={n._id}
                  onClick={() => { if (!n.read) markAsRead(n._id); }}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: n.read ? 'var(--surface)' : 'var(--accent)08',
                    border: `1px solid ${n.read ? 'var(--border)' : 'var(--accent)33'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 16,
                    transition: 'all 0.15s ease',
                    opacity: n.read ? 0.85 : 1,
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {!n.read && (
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: color,
                          flexShrink: 0,
                        }} />
                      )}
                      <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text)',
                      }}>
                        {n.title}
                      </span>
                      {n.priority === 'high' && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          background: 'var(--danger)22',
                          color: 'var(--danger)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}>
                          High
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      margin: '0 0 8px 0',
                      lineHeight: 1.5,
                    }}>
                      {n.message}
                    </p>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <span>{formatTimeAgo(n.createdAt)}</span>
                      {n.entityType && (
                        <>
                          <span>•</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'var(--surface-hover)',
                            fontSize: 11,
                          }}>
                            {n.entityType}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'var(--accent)',
                          color: '#fff',
                          fontSize: 12,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Mark read
                      </button>
                    )}
                    {n.entityId && n.entityType && (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/${n.entityType?.toLowerCase()}s`); }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          fontSize: 12,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 13,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
