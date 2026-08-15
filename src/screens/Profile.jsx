import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { initials } from '../lib/util'

function fmtUSD(n) { return `$${(Number(n) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }

export default function Profile() {
  const { profile, signOut } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const nav = useNavigate()

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  const doSignOut = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 4px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>Profile</div>
      </div>

      {/* Header card — read-only, no image upload (admin-managed) */}
      <div style={{ borderRadius: 20, padding: 20, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: '#fff', textAlign: 'center', boxShadow: '0 8px 24px rgba(37,99,235,.25)' }}>
        <div style={{
          width: 78, height: 78, borderRadius: '50%',
          background: 'linear-gradient(135deg,#60a5fa,#0ea5e9)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 26, margin: '0 auto',
          boxShadow: '0 6px 18px rgba(0,0,0,.3)',
          border: '3px solid rgba(255,255,255,.2)',
        }}>
          {initials(profile?.full_name || 'EM')}
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{profile?.full_name || 'Employee'}</div>
        <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>{profile?.position || 'Employee'} · #{profile?.employee_code || 'EMP-000'}</div>
      </div>

      {/* Stat row */}
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <StatTile bg={cardBg} border={cardBorder} label="Attendance" value="22" color="#2563eb" textPrimary={textPrimary} textMuted={textMuted} />
        <StatTile bg={cardBg} border={cardBorder} label="On-time" value="98%" color="#16a34a" textPrimary={textPrimary} textMuted={textMuted} />
        <StatTile bg={cardBg} border={cardBorder} label="OT hours" value="36" color="#a16207" textPrimary={textPrimary} textMuted={textMuted} />
      </div>

      {/* Compensation card — read-only, admin-configured */}
      <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: cardBg, border: cardBorder }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>Compensation</div>
        <PayRow label="Hourly rate" value={Number(profile?.daily_rate) > 0 ? `${fmtUSD(profile?.daily_rate)}/hr` : 'Not set'} textPrimary={textPrimary} textMuted={textMuted} />
        <PayRow label="CPP deduction" value={fmtUSD(profile?.cpp_amount)} textPrimary={textPrimary} textMuted={textMuted} />
        <PayRow label="EI deduction" value={fmtUSD(profile?.ei_amount)} textPrimary={textPrimary} textMuted={textMuted} />
        <PayRow label="Federal tax" value={fmtUSD(profile?.federal_tax_amount)} textPrimary={textPrimary} textMuted={textMuted} />
        <PayRow label="Provincial tax" value={fmtUSD(profile?.provincial_tax_amount)} textPrimary={textPrimary} textMuted={textMuted} last />
        <div style={{ marginTop: 8, fontSize: 10, color: textMuted, fontStyle: 'italic' }}>Set by your admin. Contact them if anything looks wrong.</div>
      </div>

      {/* Schedule card — days worked + days off */}
      <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: cardBg, border: cardBorder }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>Weekly schedule</div>
        <DayGrid label="Work days" days={profile?.schedule_days || '1,2,3,4,5'} on="#22c55e" textPrimary={textPrimary} textMuted={textMuted} />
        <div style={{ height: 8 }} />
        <DayGrid label="Days off" days={profile?.day_off || '0,6'} on="#f59e0b" textPrimary={textPrimary} textMuted={textMuted} />
      </div>

      {/* Menu */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MenuRow to="/profile/personal" icon={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>} iconBg="#DBEAFE" iconColor="#2563eb" label="Personal information" desc="Name, phone, avatar" cardBg={cardBg} border={cardBorder} textPrimary={textPrimary} textMuted={textMuted} />
        <MenuRow to="/profile/security" icon={<><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/></>} iconBg="#EDE9FE" iconColor="#7c3aed" label="Security & access" desc="Change password" cardBg={cardBg} border={cardBorder} textPrimary={textPrimary} textMuted={textMuted} />
        <MenuRow to="/notifications" icon={<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></>} iconBg="#FEF3C7" iconColor="#a16207" label="Notifications" desc="Recent alerts & prefs" cardBg={cardBg} border={cardBorder} textPrimary={textPrimary} textMuted={textMuted} />
      </div>

      {/* Smaller, centered Log Out button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
        <button onClick={doSignOut} style={{
          padding: '8px 22px', borderRadius: 999,
          background: 'transparent', color: '#ef4444',
          border: '1.5px solid rgba(239,68,68,.45)',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log Out
        </button>
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}

function PayRow({ label, value, textPrimary, textMuted, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: last ? 'none' : '1px dashed rgba(148,163,184,.2)' }}>
      <span style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, color: textPrimary, fontWeight: 800, fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

const DAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
function DayGrid({ label, days, on, textPrimary, textMuted }) {
  const set = new Set(String(days || '').split(',').map(Number).filter((n) => !isNaN(n)))
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: .4, marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {DAY_ABBR.map((abbr, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: set.has(i) ? on : 'transparent',
            color: set.has(i) ? '#fff' : textMuted,
            border: set.has(i) ? 'none' : '1px solid rgba(148,163,184,.3)',
            fontSize: 11, fontWeight: 800,
          }}>{abbr}</div>
        ))}
      </div>
    </div>
  )
}

function StatTile({ bg, border, label, value, color, textPrimary, textMuted }) {
  return (
    <div style={{ padding: 12, borderRadius: 14, background: bg, border, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: textMuted, marginTop: 2, letterSpacing: .3 }}>{label}</div>
    </div>
  )
}

function MenuRow({ to, icon, iconBg, iconColor, label, desc, cardBg, border, textPrimary, textMuted }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', padding: 12, borderRadius: 14, background: cardBg, border, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{label}</div>
        <div style={{ fontSize: 10, color: textMuted, marginTop: 1 }}>{desc}</div>
      </div>
      <div style={{ color: textMuted, fontSize: 14 }}>›</div>
    </Link>
  )
}
