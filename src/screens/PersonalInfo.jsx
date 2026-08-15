import { ScreenHeader } from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// Read-only view — all fields are set by the admin in the web dashboard.
// Employees can no longer edit their profile; ask admin to fix anything wrong.
export default function PersonalInfo() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div style={{ padding: '8px 20px 0' }}>
      <ScreenHeader title="Personal information" back="/profile" />
      <div style={{ marginTop: 8, padding: 14, borderRadius: 16, background: dark ? 'rgba(255,255,255,.04)' : '#fff', border: `1px solid ${dark ? 'rgba(148,163,184,.15)' : '#eef0f4'}`, display: 'grid', gap: 10 }}>
        <Row label="Full name" value={profile?.full_name || '—'} dark={dark} />
        <Row label="Employee ID" value={profile?.employee_code || '—'} dark={dark} mono />
        <Row label="Position" value={profile?.position || '—'} dark={dark} />
        <Row label="Phone" value={profile?.phone || '—'} dark={dark} />
        <Row label="Work schedule" value={profile?.schedule || '—'} dark={dark} />
      </div>
      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: dark ? 'rgba(59,130,246,.12)' : '#eff6ff', border: `1px solid ${dark ? 'rgba(59,130,246,.3)' : '#bfdbfe'}`, fontSize: 11, color: dark ? '#93c5fd' : '#1e40af' }}>
        ℹ These details are managed by your admin. If any of them are incorrect, contact your admin — they'll update it from the web dashboard.
      </div>
      <div style={{ height: 30 }} />
    </div>
  )
}

function Row({ label, value, dark, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px dashed ${dark ? 'rgba(148,163,184,.2)' : '#e2e8f0'}` }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: dark ? '#94a3b8' : '#475569' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: dark ? '#e2e8f0' : '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}
