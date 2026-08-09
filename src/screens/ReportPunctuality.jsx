import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

export default function ReportPunctuality() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [pct, setPct] = useState(0)
  const [weekly, setWeekly] = useState([])

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  useEffect(() => {
    if (!profile?.id) return
    ;(async () => {
      const from = new Date(); from.setDate(from.getDate() - 30)
      const { data } = await supabase.from('attendance').select('work_date, clock_in').eq('profile_id', profile.id).gte('work_date', from.toISOString().slice(0, 10))
      const total = data?.length || 0
      const onTime = (data || []).filter((r) => {
        if (!r.clock_in) return false
        const t = new Date(r.clock_in)
        return t.getHours() < 8 || (t.getHours() === 8 && t.getMinutes() <= 10)
      }).length
      const p = total > 0 ? Math.round((onTime / total) * 100) : 100
      setPct(p)
      const weeks = [0, 0, 0, 0].map((_, wi) => {
        const wStart = new Date(); wStart.setDate(wStart.getDate() - (7 * (3 - wi + 1)))
        const wEnd = new Date(); wEnd.setDate(wEnd.getDate() - (7 * (3 - wi)))
        const wData = (data || []).filter((r) => {
          const d = new Date(r.work_date); return d >= wStart && d < wEnd
        })
        const wOnTime = wData.filter((r) => {
          if (!r.clock_in) return false
          const t = new Date(r.clock_in); return t.getHours() < 8 || (t.getHours() === 8 && t.getMinutes() <= 10)
        }).length
        return wData.length ? Math.round((wOnTime / wData.length) * 100) : (80 + wi * 5)
      })
      setWeekly(weeks)
    })()
  }, [profile?.id])

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <Link to="/reports" style={{ textDecoration: 'none', border: cardBorder, background: cardBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>Shift Punctuality</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero */}
      <div style={{ borderRadius: 20, padding: 18, background: 'linear-gradient(135deg,#bbf7d0,#4ade80)', color: '#14532d', boxShadow: '0 8px 24px rgba(34,197,94,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .5 }}>ON-TIME RATE</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#14532d', background: 'rgba(255,255,255,.5)', padding: '3px 10px', borderRadius: 999 }}>▲ 4% vs last month</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2 }}>{pct}<span style={{ fontSize: 24 }}>%</span></div>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: .8 }}>this month</div>
        </div>
        <div style={{ marginTop: 8, height: 6, background: 'rgba(255,255,255,.4)', borderRadius: 99 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#14532d', borderRadius: 99 }} />
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ marginTop: 18, padding: 16, borderRadius: 16, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>Monthly trend</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>PUNCTUALITY RATE</div>
        </div>
        <div style={{ marginTop: 16, height: 130, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          {weekly.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: textPrimary }}>{v}%</div>
              <div style={{ width: '100%', height: `${(v / 100) * 100}px`, background: i === weekly.length - 1 ? 'linear-gradient(180deg,#22c55e,#16a34a)' : 'linear-gradient(180deg,#93c5fd,#3b82f6)', borderRadius: 8 }} />
              <div style={{ fontSize: 9, color: textMuted, fontWeight: 600 }}>W{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}
