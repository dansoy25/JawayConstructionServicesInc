import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function Reports() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  const items = [
    { to: '/reports/tardiness', label: 'Tardiness', desc: 'Late arrivals & minutes lost', iconBg: '#FEF3C7', iconColor: '#a16207', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
    { to: '/reports/punctuality', label: 'Punctuality', desc: 'On-time rate this month', iconBg: '#DCFCE7', iconColor: '#16a34a', icon: <polyline points="20 6 9 17 4 12"/> },
    { to: '/reports/locations', label: 'Locations', desc: 'Where you clocked in', iconBg: '#DBEAFE', iconColor: '#2563eb', icon: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></> },
    { to: '/reports/payslip', label: 'Request payslip', desc: 'View & request past pay periods', iconBg: '#EDE9FE', iconColor: '#7c3aed', icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    { to: '/reports/tasks', label: 'Tasks', desc: 'Assigned work items', iconBg: '#CFFAFE', iconColor: '#0891b2', icon: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></> },
  ]

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <Link to="/" style={{ textDecoration: 'none', border: cardBorder, background: cardBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>Reports</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it) => (
          <Link key={it.to} to={it.to} style={{ textDecoration: 'none', padding: 14, borderRadius: 16, background: cardBg, border: cardBorder, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 6px rgba(15,23,42,.05)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: it.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={it.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{it.icon}</svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary }}>{it.label}</div>
              <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>{it.desc}</div>
            </div>
            <div style={{ color: textMuted, fontSize: 16 }}>›</div>
          </Link>
        ))}
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}
