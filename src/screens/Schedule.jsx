import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

export default function Schedule() {
  const { profile, site } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const today = new Date()
  const [selected, setSelected] = useState(today.toISOString().slice(0, 10))
  const [shifts, setShifts] = useState([])

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  // 14-day picker
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return { iso: d.toISOString().slice(0, 10), d, day: d.toLocaleDateString('en', { weekday: 'short' }), num: d.getDate() }
  })

  useEffect(() => {
    if (!profile?.org_id) return
    const d = new Date(selected)
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    if (isWeekend) return setShifts([])
    setShifts([
      { id: 1, label: 'Morning Shift', location: site?.name || 'Main Office', start: '08:00 AM', end: '05:00 PM', status: 'scheduled', color: '#22c55e' },
      { id: 2, label: 'Lunch Break', location: '60 min · Auto-logged', start: '12:00 PM', end: '01:00 PM', status: 'break', color: '#f59e0b' },
      { id: 3, label: 'Team Standup', location: 'Room B · Daily sync', start: '02:00 PM', end: '02:30 PM', status: 'meeting', color: '#3b82f6' },
      { id: 4, label: 'Overtime (optional)', location: 'If available · Tap to opt-in', start: '06:00 PM', end: '08:00 PM', status: 'optional', color: '#a16207' },
    ])
  }, [selected, profile?.org_id, site?.name])

  const selectedDate = new Date(selected)
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <div>
          <div style={{ fontSize: 10, color: textMuted, fontWeight: 600, letterSpacing: .4 }}>{today.toLocaleDateString('en', { month: 'long', year: 'numeric' }).toUpperCase()}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>My Schedule</div>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,.3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {/* 14-day scroller — horizontally swipeable */}
      <div style={{ position: 'relative', marginLeft: -20, marginRight: -20 }}>
        <div
          id="day-scroller"
          style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            padding: '4px 20px 6px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
          className="scroll-hide"
        >
          {days.map((d) => {
            const active = d.iso === selected
            const isWknd = d.d.getDay() === 0 || d.d.getDay() === 6
            return (
              <button key={d.iso} onClick={() => setSelected(d.iso)} style={{
                minWidth: 52, padding: '10px 8px', borderRadius: 14,
                background: active ? 'linear-gradient(135deg,#2563eb,#0ea5e9)' : cardBg,
                border: active ? 'none' : cardBorder,
                color: active ? '#fff' : textPrimary,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                boxShadow: active ? '0 6px 18px rgba(37,99,235,.35)' : 'none',
                scrollSnapAlign: 'start', flexShrink: 0,
                position: 'relative',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, opacity: active ? .85 : .6 }}>{d.day}</div>
                <div style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{d.num}</div>
                {isWknd && !active && <div style={{ position: 'absolute', top: 4, right: 6, width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' }} />}
              </button>
            )
          })}
        </div>
        {/* Fade edge hint on right */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 32,
          background: `linear-gradient(90deg, transparent, ${dark ? '#111827' : '#f8fafc'})`,
          pointerEvents: 'none',
        }} />
        {/* Fade edge hint on left */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 20,
          background: `linear-gradient(90deg, ${dark ? '#111827' : '#f8fafc'}, transparent)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Selected date header */}
      <div style={{ marginTop: 14, fontSize: 12, color: textMuted, fontWeight: 600 }}>
        {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>

      {isWeekend ? (
        <div style={{ marginTop: 12, padding: 20, borderRadius: 18, background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 12, opacity: .85, fontWeight: 600 }}>{selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div style={{ fontSize: 32, fontWeight: 900, marginTop: 6 }}>Day off</div>
        </div>
      ) : (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shifts.map((s) => (
            <div key={s.id} style={{ display: 'flex', gap: 12 }}>
              <div style={{ minWidth: 52, textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: textPrimary }}>{s.start}</div>
                <div style={{ fontSize: 9, color: textMuted, marginTop: 2 }}>{s.end}</div>
              </div>
              <div style={{ width: 2, background: s.color, borderRadius: 1, minHeight: 40 }} />
              <div style={{ flex: 1, padding: 12, borderRadius: 12, background: cardBg, border: cardBorder }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{s.location}</div>
                  </div>
                  {s.status === 'scheduled' && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#15803d', background: '#DCFCE7', padding: '2px 8px', borderRadius: 999 }}>ON</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        <Link to="/leave" style={{ textDecoration: 'none', padding: '12px 14px', borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>Request time off</div>
            <div style={{ fontSize: 10, color: textMuted }}>File a leave request</div>
          </div>
          <div style={{ color: textMuted, fontSize: 14 }}>›</div>
        </Link>
        <Link to="/overtime" style={{ textDecoration: 'none', padding: '12px 14px', borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>Request overtime</div>
            <div style={{ fontSize: 10, color: textMuted }}>Log extra hours</div>
          </div>
          <div style={{ color: textMuted, fontSize: 14 }}>›</div>
        </Link>
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}
