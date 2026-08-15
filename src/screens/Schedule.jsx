import { useEffect, useState } from 'react'
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

    // Read the employee's own schedule from profile ("HH:MM-HH:MM"),
    // falling back to 08:00-17:00 if not set.
    const sched = parseSchedule(profile?.schedule)
    const shiftStart = fmt12h(sched.start)
    const shiftEnd = fmt12h(sched.end)

    // Auto-insert a 1-hour lunch halfway through the shift
    const startMin = timeToMinutes(sched.start)
    const endMin = timeToMinutes(sched.end)
    const midMin = Math.floor((startMin + endMin) / 2 - 30)
    const lunchStart = minutesToTime(midMin)
    const lunchEnd = minutesToTime(midMin + 60)

    setShifts([
      { id: 1, label: 'Shift', location: site?.name || 'Main Office', start: shiftStart, end: shiftEnd, status: 'scheduled', color: '#22c55e' },
      { id: 2, label: 'Lunch Break', location: '60 min · Auto-logged', start: fmt12h(lunchStart), end: fmt12h(lunchEnd), status: 'break', color: '#f59e0b' },
      { id: 3, label: 'Overtime (optional)', location: 'If available · Tap to opt-in', start: fmt12h(sched.end), end: fmt12h(minutesToTime(endMin + 120)), status: 'optional', color: '#a16207' },
    ])
  }, [selected, profile?.org_id, profile?.schedule, site?.name])

  const selectedDate = new Date(selected)
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ padding: '16px 4px' }}>
        <div style={{ fontSize: 10, color: textMuted, fontWeight: 600, letterSpacing: .4 }}>{today.toLocaleDateString('en', { month: 'long', year: 'numeric' }).toUpperCase()}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>My Schedule</div>
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

      {/* Leave section — moved from standalone nav to live inside Schedule */}
      <LeaveSection dark={dark} cardBg={cardBg} cardBorder={cardBorder} textPrimary={textPrimary} textMuted={textMuted} />

      <div style={{ height: 30 }} />
    </div>
  )
}

// Parse "HH:MM-HH:MM" schedule; falls back to 08:00-17:00
function parseSchedule(s) {
  if (typeof s === "string") {
    const m = s.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/)
    if (m) return { start: m[1], end: m[2] }
  }
  return { start: "08:00", end: "17:00" }
}

function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(mins) {
  const total = ((mins % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function fmt12h(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number)
  const pad = String(m || 0).padStart(2, "0")
  if (h === 0) return `12:${pad} AM`
  if (h < 12) return `${h}:${pad} AM`
  if (h === 12) return `12:${pad} PM`
  return `${h - 12}:${pad} PM`
}

// ─── Leave section (moved here from the top-level /leave route) ──────────

function LeaveSection({ dark, cardBg, cardBorder, textPrimary, textMuted }) {
  const { profile } = useAuth()
  const [types, setTypes] = useState([])
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [typeId, setTypeId] = useState('')
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!profile?.id) return
    const [t, r] = await Promise.all([
      supabase.from('leave_types').select('*').eq('org_id', profile.org_id).not('code', 'ilike', 'OT'),
      supabase.from('leave_requests').select('*, leave_type:leave_types(*)').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(10),
    ])
    setTypes(t.data || [])
    setRequests(r.data || [])
    if ((t.data || []).length && !typeId) setTypeId(t.data[0].id)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [profile?.id])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1)
      const { error } = await supabase.from('leave_requests').insert({
        profile_id: profile.id, org_id: profile.org_id, leave_type_id: typeId,
        start_date: start, end_date: end, days, reason, status: 'pending',
      })
      if (error) throw error
      setMsg('Request submitted — pending admin approval.')
      setShowForm(false); setReason(''); load()
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  const statusChip = (s) => {
    const cfg = {
      approved: { bg: '#DCFCE7', color: '#15803d', label: 'Approved' },
      pending:  { bg: '#FEF3C7', color: '#a16207', label: 'Pending' },
      rejected: { bg: '#FEE2E2', color: '#b91c1c', label: 'Declined' },
      declined: { bg: '#FEE2E2', color: '#b91c1c', label: 'Declined' },
    }[s] || { bg: '#F1F5F9', color: '#64748b', label: s || '—' }
    return <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: 999 }}>{cfg.label}</span>
  }

  const inputBg = dark ? 'rgba(255,255,255,.04)' : '#fff'
  const inputStyle = { padding: '10px 12px', border: cardBorder, borderRadius: 10, background: inputBg, color: textPrimary, fontSize: 13 }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary }}>Leave</div>
          <div style={{ fontSize: 10, color: textMuted, marginTop: 1 }}>Request time off — admin reviews</div>
        </div>
        <button onClick={() => setShowForm((v) => !v)} style={{
          background: 'linear-gradient(135deg,#dc2626,#0f172a)', color: '#fff', border: 'none',
          padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 6px rgba(220,38,38,.3)',
        }}>{showForm ? 'Cancel' : '+ Request leave'}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ marginTop: 8, padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>LEAVE TYPE</span>
            {types.length ? (
              <select value={typeId} onChange={(e) => setTypeId(e.target.value)} required style={inputStyle}>
                {types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            ) : (
              <input value="Vacation" readOnly style={inputStyle} />
            )}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>START</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>END</span>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required style={inputStyle} />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>REASON</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="2" style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          {msg && <div style={{ fontSize: 11, fontWeight: 600, color: msg.includes('submitted') ? '#16a34a' : '#b91c1c' }}>{msg}</div>}
          <button type="submit" disabled={busy || (!typeId && !types.length)} style={{
            padding: '12px 0', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#dc2626,#0f172a)', color: '#fff',
            fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: busy ? 0.6 : 1,
          }}>{busy ? 'Submitting…' : 'Submit request'}</button>
        </form>
      )}

      {/* My requests */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {requests.length === 0 ? (
          <div style={{ padding: 12, borderRadius: 12, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 11, color: textMuted }}>
            No leave requests yet. Tap <b>+ Request leave</b> to file one.
          </div>
        ) : requests.map((r) => (
          <div key={r.id} style={{ padding: 10, borderRadius: 12, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{r.leave_type?.label || 'Leave'}</div>
              {statusChip(r.status)}
            </div>
            <div style={{ fontSize: 10, color: textMuted, marginTop: 3 }}>
              {new Date(r.start_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
              {' — '}
              {new Date(r.end_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
              {` · ${r.days} day${r.days > 1 ? 's' : ''}`}
            </div>
            {r.reason && <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{r.reason}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
