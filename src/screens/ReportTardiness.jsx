import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate, fmtTime } from '../lib/util'

export default function ReportTardiness() {
  const { profile, site } = useAuth()
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
    ;(async () => {
      const from = new Date(); from.setDate(from.getDate() - 30)
      const { data } = await supabase.from('attendance').select('*').eq('profile_id', profile.id).gte('work_date', from.toISOString().slice(0, 10)).order('work_date', { ascending: false })
      const late = (data || []).filter((r) => {
        if (!r.clock_in) return false
        const t = new Date(r.clock_in)
        return t.getHours() > 8 || (t.getHours() === 8 && t.getMinutes() > 10)
      })
      setRows(late)
    })()
  }, [profile?.id])

  const totalMin = rows.reduce((s, r) => {
    const t = new Date(r.clock_in); const late = (t.getHours() - 8) * 60 + t.getMinutes() - 0
    return s + Math.max(0, late)
  }, 0)

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <Link to="/reports" style={{ textDecoration: 'none', border: cardBorder, background: cardBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>Tardiness</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero red card */}
      <div style={{ borderRadius: 20, padding: 18, background: 'linear-gradient(135deg,#fecaca,#f87171)', color: '#7f1d1d', boxShadow: '0 8px 24px rgba(239,68,68,.2)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .85 }}>This month</div>
        <div style={{ fontSize: 40, fontWeight: 900, marginTop: 4, letterSpacing: -1 }}>{rows.length}</div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>late arrivals</div>
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600 }}>{totalMin} min lost this month</div>
      </div>

      <div style={{ marginTop: 18, fontWeight: 800, fontSize: 14, color: textPrimary }}>Late entries</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 && (
          <div style={{ padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 12, color: textMuted }}>No late entries — great job!</div>
        )}
        {rows.map((r) => {
          const t = new Date(r.clock_in)
          const late = (t.getHours() - 8) * 60 + t.getMinutes()
          return (
            <div key={r.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{fmtDate(r.work_date)}</div>
                <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>Arrived {fmtTime(r.clock_in)} · {site?.name || 'Site'}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', background: '#FEE2E2', padding: '3px 10px', borderRadius: 999 }}>{late}m late</div>
            </div>
          )
        })}
      </div>

      {/* On-time streak */}
      <div style={{ marginTop: 16, padding: 14, borderRadius: 16, background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', color: '#14532d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .8 }}>On-time streak</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>14</div>
          <div style={{ fontSize: 10, fontWeight: 600 }}>consecutive days on time</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#15803d', background: '#fff', padding: '4px 12px', borderRadius: 999 }}>Active</div>
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}
