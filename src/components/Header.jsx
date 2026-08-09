import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { initials } from '../lib/util'
import Icon from './Icon'

export function TopBar({ subtitle = 'Good morning' }) {
  const nav = useNavigate()
  const { theme, toggle } = useTheme()
  const { profile } = useAuth()
  const dark = theme === 'dark'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 2px', marginTop: 45 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, letterSpacing: -.5, boxShadow: '0 4px 12px rgba(0,0,0,.26)' }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
          ) : initials(profile?.full_name || 'You')}
        </div>
        <div>
          <div style={{ fontSize: 10, color: dark ? '#94a3b8' : '#64748b', fontWeight: 600, letterSpacing: .3 }}>{subtitle}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: dark ? '#e2e8f0' : '#334155', lineHeight: 1.1 }}>
            {profile?.full_name || 'Employee'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => nav('/notifications')}
          style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${dark ? '#1f2937' : '#e2e8f0'}`, background: dark ? '#111827' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 2px 6px rgba(15,23,42,.06)', color: dark ? '#e2e8f0' : '#334155' }}
        >
          <Icon name="bell" size={16} />
          <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, background: '#ef4444', border: '1.5px solid #fff', borderRadius: '50%' }} />
        </button>
        <button
          onClick={toggle}
          title="Switch theme"
          style={{ position: 'relative', width: 66, height: 38, borderRadius: 19, border: `1px solid ${dark ? '#1f2937' : '#e2e8f0'}`, background: dark ? '#0f172a' : '#f1f5f9', padding: 0, cursor: 'pointer', boxShadow: 'inset 0 1px 3px rgba(15,23,42,.06)' }}
        >
          <div style={{ position: 'absolute', top: 3, [dark ? 'left' : 'right']: 3, width: 30, height: 30, borderRadius: '50%', background: dark ? 'linear-gradient(135deg,#334155,#0f172a)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,.35)' }}>
            <Icon name={dark ? 'moon' : 'sun'} size={15} />
          </div>
        </button>
      </div>
    </div>
  )
}

export function ScreenHeader({ title, back = -1, right = null }) {
  const nav = useNavigate()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 45, padding: '10px 2px' }}>
      <button
        onClick={() => nav(back)}
        style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${dark ? '#1f2937' : '#e2e8f0'}`, background: dark ? '#111827' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#e2e8f0' : '#334155' }}
      >
        <Icon name="back" size={16} />
      </button>
      <div style={{ flex: 1, fontSize: 17, fontWeight: 800, color: dark ? '#e2e8f0' : '#0f172a' }}>{title}</div>
      {right}
    </div>
  )
}
