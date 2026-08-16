import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate, fmtTime } from '../lib/util'

export default function Attendance() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [rows, setRows] = useState([])

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('attendance').select('*').eq('profile_id', profile.id).order('work_date', { ascending: false }).limit(60).then(({ data }) => setRows(data || []))
  }, [profile?.id])

  // Monthly aggregate
  const now = new Date()
  const monthRows = rows.filter((r) => new Date(r.work_date).getMonth() === now.getMonth())
  const present = monthRows.filter((r) => r.clock_in).length
  const late = monthRows.filter((r) => {
    if (!r.clock_in) return false
    const t = new Date(r.clock_in); return t.getHours() > 8 || (t.getHours() === 8 && t.getMinutes() > 10)
  }).length
  const absent = Math.max(0, 22 - present)

  // Bar chart weekly hours
  const weekly = [0, 0, 0, 0].map((_, wi) => {
    const wRows = rows.slice(wi * 5, wi * 5 + 5)
    return wRows.reduce((s, r) => s + (Number(r.hours) || 0), 0)
  })
  const maxWeek = Math.max(1, ...weekly)

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>Attendance</div>
        <div style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>{now.toLocaleDateString('en-CA', { timeZone: 'America/Regina', month: 'short', year: 'numeric' })} ▾</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        <StatCard color="#16a34a" bg="linear-gradient(135deg,#dcfce7,#86efac)" label="PRESENT" value={present} textPrimary={textPrimary} />
        <StatCard color="#a16207" bg="linear-gradient(135deg,#fef3c7,#fde047)" label="LATE" value={late} textPrimary={textPrimary} />
        <StatCard color="#b91c1c" bg="linear-gradient(135deg,#fee2e2,#fecaca)" label="ABSENT" value={absent} textPrimary={textPrimary} />
      </div>

      {/* Weekly hours chart */}
      <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>Weekly Hours</div>
          <div style={{ fontSize: 10, color: textMuted, fontWeight: 700 }}>Target 40h</div>
        </div>
        <div style={{ marginTop: 12, height: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          {weekly.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', height: `${Math.max(6, (v / maxWeek) * 90)}px`, background: v > 0 ? 'linear-gradient(180deg,#22c55e,#16a34a)' : 'rgba(148,163,184,.3)', borderRadius: 8 }} />
              <div style={{ fontSize: 9, color: textMuted, fontWeight: 600 }}>W{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent log */}
      <div style={{ marginTop: 16, fontWeight: 800, fontSize: 14, color: textPrimary }}>Recent Log</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 && (
          <div style={{ padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 12, color: textMuted }}>No attendance records yet.</div>
        )}
        {rows.slice(0, 10).map((r) => {
          const isLate = r.clock_in && new Date(r.clock_in).getHours() >= 8 && new Date(r.clock_in).getMinutes() > 10
          const tag = !r.clock_in ? { bg: '#FEE2E2', color: '#b91c1c', label: 'Absent' } : isLate ? { bg: '#FEF3C7', color: '#a16207', label: 'Late' } : { bg: '#DCFCE7', color: '#15803d', label: 'On time' }
          return (
            <div key={r.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{fmtDate(r.work_date)}</div>
                <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>
                  {r.clock_in ? `${fmtTime(r.clock_in)} – ${r.clock_out ? fmtTime(r.clock_out) : 'now'}` : 'No clock-in'}{r.hours ? ` · ${Number(r.hours).toFixed(1)}h` : ''}
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: tag.color, background: tag.bg, padding: '3px 10px', borderRadius: 999 }}>{tag.label}</div>
            </div>
          )
        })}
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}

function StatCard({ bg, color, label, value, textPrimary }) {
  return (
    <div style={{ padding: 12, borderRadius: 14, background: bg, boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -1 }}>{String(value).padStart(2, '0')}</div>
      <div style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: .5 }}>{label}</div>
    </div>
  )
}
