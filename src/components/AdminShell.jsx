import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../lib/util'

const SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
    ],
  },
  {
    label: 'WORKFORCE',
    items: [
      { to: '/admin/attendance', label: 'Attendance', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
      { to: '/admin/employees', label: 'Employees', icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></> },
      { to: '/admin/tasks', label: 'Tasks', icon: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></> },
      { to: '/admin/leave', label: 'Leave Management', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></> },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { to: '/admin/payroll', label: 'Payroll', icon: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></> },
      { to: '/admin/payslips', label: 'Payslips', icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/admin/gps', label: 'GPS', icon: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></> },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: <><path d="M18 20V10M12 20V4M6 20v-6"/></> },
      { to: '/admin/settings', label: 'Settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></> },
    ],
  },
]

const CRUMB_LABEL = Object.fromEntries(SECTIONS.flatMap(s => s.items.map(i => [i.to, { label: i.label, section: s.label }])))

export default function AdminShell() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const nav = useNavigate()
  const current = CRUMB_LABEL[location.pathname] || { label: 'Dashboard', section: 'MAIN' }

  const doSignOut = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#f8fafc', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'linear-gradient(180deg,#0d1528 0%,#0b1220 100%)',
        color: '#e2e8f0',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,.04)',
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 20px 24px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: -.3 }}>
            Jaway Construction <span style={{ color: '#ef4444' }}>Services Inc.</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#94a3b8', marginTop: 4 }}>BUSINESS OPERATIONS</div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1.5, padding: '0 12px 8px' }}>{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                    textDecoration: 'none',
                    color: isActive ? '#60a5fa' : '#94a3b8',
                    background: isActive ? 'linear-gradient(90deg,rgba(37,99,235,.18),rgba(37,99,235,.06))' : 'transparent',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* User footer */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, flexShrink: 0 }}>
              {initials(profile?.full_name || 'JJ')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'Admin'}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Owner</div>
            </div>
            <button onClick={doSignOut} title="Sign out" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6, borderRadius: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>{current.section === 'MAIN' ? 'Main' : current.section === 'WORKFORCE' ? 'Workforce' : current.section === 'FINANCE' ? 'Finance' : current.section === 'OPERATIONS' ? 'Operations' : 'System'}</span>
            <span>›</span>
            <span style={{ color: '#0f172a', fontWeight: 800 }}>{current.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={iconBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            </button>
            <button style={iconBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button style={{ ...iconBtn, position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
              <span style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }} />
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', color: '#831843', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
              {initials(profile?.full_name || 'JJ')}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

const iconBtn = {
  width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9',
  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}
