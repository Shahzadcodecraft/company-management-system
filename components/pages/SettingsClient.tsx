'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useSettings, useUpdateSettings, useChangePassword } from '@/lib/hooks/useApi';

function Toggle({ value, onChange, disabled = false }: { value: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <div onClick={disabled ? undefined : onChange} style={{ width: 44, height: 24, borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer', background: value ? C.accent : C.border, opacity: disabled ? 0.6 : 1, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
  );
}

const C = { accent: 'var(--accent)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', text: 'var(--text)', textMuted: 'var(--text-muted)', surface: 'var(--surface)', border: 'var(--border)', bg: 'var(--bg)', surfaceHover: 'var(--surface-hover)', borderLight: 'var(--border-light)' };
const IS = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: 'none', width: '100%' };

export default function SettingsClient() {
  const { data: session, update: updateSession } = useSession();
  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoize initial values so they never change after first render
  const initialName = useMemo(() => session?.user?.name || settingsData?.profile?.name || '', [session?.user?.name, settingsData?.profile?.name]);
  const initialCompanyName = useMemo(() => settingsData?.settings?.companyName || 'NexusCorp Inc.', [settingsData?.settings?.companyName]);

  // Use refs for text inputs to avoid cursor jumping issues
  const nameRef = useRef<HTMLInputElement>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const companyNameRef = useRef<HTMLInputElement>(null);

  // State for non-text settings only
  const [timezone, setTimezone] = useState('UTC-5');
  const [currency, setCurrency] = useState('USD');
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [auditLog, setAuditLog] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30 minutes');
  const [initialized, setInitialized] = useState(false);

  // Initialize form values when data loads (only once)
  useEffect(() => {
    if (settingsData && !initialized) {
      // Only set non-text state, text inputs use defaultValue
      setTimezone(settingsData.settings?.timezone || 'UTC-5');
      setCurrency(settingsData.settings?.currency || 'USD');
      setNotifications(settingsData.settings?.notifications ?? true);
      setEmailAlerts(settingsData.settings?.emailAlerts ?? true);
      setTwoFA(settingsData.settings?.twoFA ?? false);
      setAuditLog(settingsData.settings?.auditLog ?? true);
      setSessionTimeout(settingsData.settings?.sessionTimeout || '30 minutes');
      
      setInitialized(true);
    }
  }, [settingsData, initialized]);


  function toggleNotifications() {
    const newValue = !notifications;
    setNotifications(newValue);
    updateSettings.mutate({ settings: { notifications: newValue } });
  }
  function toggleEmailAlerts() {
    const newValue = !emailAlerts;
    setEmailAlerts(newValue);
    updateSettings.mutate({ settings: { emailAlerts: newValue } });
  }
  function toggleAuditLog() {
    const newValue = !auditLog;
    setAuditLog(newValue);
    updateSettings.mutate({ settings: { auditLog: newValue } });
  }
  function toggleTwoFA() {
    const newValue = !twoFA;
    setTwoFA(newValue);
    updateSettings.mutate({ settings: { twoFA: newValue } });
  }

  async function saveProfile() {
    const name = nameRef.current?.value || '';
    const currentPassword = currentPasswordRef.current?.value || '';
    const newPassword = newPasswordRef.current?.value || '';
    const confirmPassword = confirmPasswordRef.current?.value || '';

    // Validate password change if fields are filled
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        toast.error('Please enter your current password');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
      
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });
      
      // Clear password fields
      if (currentPasswordRef.current) currentPasswordRef.current.value = '';
      if (newPasswordRef.current) newPasswordRef.current.value = '';
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = '';
    }

    // Update profile name if changed
    if (name !== settingsData?.profile?.name) {
      await updateSettings.mutateAsync({
        profile: { name }
      });
      await updateSession({ name });
    }

    toast.success('Profile updated successfully');
  }

  function saveSettings() {
    const companyName = companyNameRef.current?.value || 'NexusCorp Inc.';
    updateSettings.mutate({
      settings: {
        companyName,
        timezone,
        currency,
        sessionTimeout,
      }
    });
  }

  function resetDefaults() {
    if (companyNameRef.current) companyNameRef.current.value = 'NexusCorp Inc.';
    setTimezone('UTC-5');
    setCurrency('USD');
    setNotifications(true);
    setEmailAlerts(true);
    setTwoFA(false);
    setAuditLog(true);
    setSessionTimeout('30 minutes');
    
    updateSettings.mutate({
      settings: {
        companyName: 'NexusCorp Inc.',
        timezone: 'UTC-5',
        currency: 'USD',
        notifications: true,
        emailAlerts: true,
        twoFA: false,
        auditLog: true,
        sessionTimeout: '30 minutes',
      }
    });
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.text, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>
    </div>
  );

  const Row = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  const Label = ({ text }: { text: string }) => <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{text}</label>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700, fontFamily: "'DM Sans',sans-serif" }}>
      {/* Profile */}
      <Section title="👤 Profile Settings">
        <div>
          <Label text="Display Name" />
          <input ref={nameRef} style={IS} defaultValue={initialName} placeholder="Your full name" />
        </div>
        <div style={{ background: C.bg, borderRadius: 10, padding: '12px 16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 13, color: C.text }}>{session?.user?.email || settingsData?.profile?.email || '—'}</div>
        </div>
        <div style={{ background: C.bg, borderRadius: 10, padding: '12px 16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Role</div>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700 }}>{(session?.user as any)?.role || settingsData?.profile?.role || 'Employee'}</div>
        </div>
        <div>
          <Label text="Current Password" />
          <input ref={currentPasswordRef} style={IS} type="password" placeholder="Enter current password to change" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <Label text="New Password" />
            <input ref={newPasswordRef} style={IS} type="password" placeholder="New password" />
          </div>
          <div>
            <Label text="Confirm New Password" />
            <input ref={confirmPasswordRef} style={IS} type="password" placeholder="Confirm new password" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={saveProfile} 
            disabled={updateSettings.isPending || changePassword.isPending}
            style={{ padding: '9px 20px', borderRadius: 10, background: C.accent, color: '#fff', border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: (updateSettings.isPending || changePassword.isPending) ? 'not-allowed' : 'pointer', opacity: (updateSettings.isPending || changePassword.isPending) ? 0.7 : 1 }}
          >
            {(updateSettings.isPending || changePassword.isPending) ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </Section>

      {/* Company */}
      <Section title="🏢 Company Settings">
        <Row label="Company Name" desc="Displayed throughout the platform">
          <input ref={companyNameRef} style={{ ...IS, maxWidth: 240 }} defaultValue={initialCompanyName} placeholder="Company name" />
        </Row>
        <Row label="Timezone" desc="Used for scheduling and reports">
          <select style={{ ...IS, maxWidth: 160 }} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {['UTC-8', 'UTC-7', 'UTC-6', 'UTC-5', 'UTC-4', 'UTC+0', 'UTC+1', 'UTC+2', 'UTC+5', 'UTC+8'].map(t => <option key={t}>{t}</option>)}
          </select>
        </Row>
        <Row label="Currency" desc="Default currency for finance module">
          <select style={{ ...IS, maxWidth: 120 }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].map(c => <option key={c}>{c}</option>)}
          </select>
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="🔔 Notifications">
        <Row label="Push Notifications" desc="In-app alerts for tasks and updates"><Toggle value={notifications} onChange={toggleNotifications} disabled={updateSettings.isPending} /></Row>
        <Row label="Email Alerts" desc="Receive notifications via email"><Toggle value={emailAlerts} onChange={toggleEmailAlerts} disabled={updateSettings.isPending} /></Row>
        <Row label="Audit Logging" desc="Track all admin actions in the system"><Toggle value={auditLog} onChange={toggleAuditLog} disabled={updateSettings.isPending} /></Row>
      </Section>

      {/* Security */}
      <Section title="🔒 Security">
        <Row label="Two-Factor Authentication" desc="Extra layer of account security"><Toggle value={twoFA} onChange={toggleTwoFA} disabled={updateSettings.isPending} /></Row>
        <Row label="Session Timeout" desc="Auto-logout after inactivity">
          <select style={{ ...IS, maxWidth: 160 }} value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)}>
            {['15 minutes', '30 minutes', '1 hour', '2 hours', '8 hours'].map(t => <option key={t}>{t}</option>)}
          </select>
        </Row>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 20 }}>
        <button 
          onClick={resetDefaults} 
          disabled={updateSettings.isPending}
          style={{ padding: '9px 20px', borderRadius: 10, background: 'transparent', border: `1px solid ${C.border}`, color: C.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: updateSettings.isPending ? 'not-allowed' : 'pointer', opacity: updateSettings.isPending ? 0.7 : 1 }}
        >
          Reset Defaults
        </button>
        <button 
          onClick={saveSettings} 
          disabled={updateSettings.isPending}
          style={{ padding: '9px 20px', borderRadius: 10, background: C.accent, color: '#fff', border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: updateSettings.isPending ? 'not-allowed' : 'pointer', opacity: updateSettings.isPending ? 0.7 : 1 }}
        >
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
