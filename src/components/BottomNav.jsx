import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const ICONS = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>,
  attendance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 15l2 2 4-4"/></svg>,
  schedule: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  profile: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  leave: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v9l6 3"/><circle cx="12" cy="12" r="10"/><path d="M8 22h8"/></svg>,
}

const tabs = [
  { to: '/', key: 'home', label: 'Home', end: true },
  { to: '/attendance', key: 'attendance', label: 'Attendance' },
  { to: '/schedule', key: 'schedule', label: 'Schedule' },
  { to: '/profile', key: 'profile', label: 'Profile' },
  { to: '/leave', key: 'leave', label: 'Leave' },
]

export default function BottomNav() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return (
    <nav
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderRadius: '22px 22px 0 0',
        background: dark
          ? '#111827'
          : 'linear-gradient(180deg,rgba(255,255,255,.85),rgba(255,255,255,.95))',
        boxShadow: dark
          ? '0 -14px 32px rgba(59,130,246,.18),0 -6px 20px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04)'
          : '0 -8px 30px rgba(15,23,42,.08),inset 0 1px 0 rgba(255,255,255,.6),0 -1px 0 rgba(226,232,240,.6)',
        backdropFilter: 'blur(20px)',
        padding: '10px 14px calc(22px + env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', zIndex: 40,
      }}
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 0',
            color: isActive ? (dark ? '#3b82f6' : '#2563eb') : '#94a3b8',
            fontSize: 10, fontWeight: isActive ? 700 : 500, textDecoration: 'none',
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{
                width: 38, height: 28, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive
                  ? (dark ? '#3b82f6' : 'linear-gradient(135deg,#2563eb,#0ea5e9)')
                  : 'transparent',
                color: isActive ? '#fff' : (dark ? '#94a3b8' : '#94a3b8'),
                boxShadow: isActive
                  ? (dark
                      ? '0 6px 18px rgba(59,130,246,.55),0 0 0 1px rgba(96,165,250,.35),inset 0 1px 0 rgba(255,255,255,.25)'
                      : '0 4px 14px rgba(37,99,235,.35),inset 0 1px 0 rgba(255,255,255,.3)')
                  : 'none',
              }}>
                {ICONS[t.key]}
              </div>
              <span>{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
