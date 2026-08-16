import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate } from '../lib/util'

export default function Overtime() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [rows, setRows] = useState([])
  const [autoOt, setAutoOt] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [hours, setHours] = useState('2')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  const load = async () => {
    if (!profile?.id) return
    const { data: ot } = await supabase.from('leave_types').select('id, code').ilike('code', 'ot').maybeSingle()
    if (ot) {
      const { data } = await supabase.from('leave_requests').select('*').eq('profile_id', profile.id).eq('leave_type_id', ot.id).order('created_at', { ascending: false }).limit(20)
      setRows(data || [])
    } else {
      setRows([])
    }
    // Auto-detected OT from attendance rows (>8h shift). Show admin approval status.
    const { data: att } = await supabase.from('attendance')
      .select('id, work_date, ot_hours, ot_approved, ot_approved_at')
      .eq('profile_id', profile.id)
      .gt('ot_hours', 0)
      .order('work_date', { ascending: false })
      .limit(20)
    setAutoOt(att || [])
  }
  useEffect(() => { load() }, [profile?.id])

  const approvedAutoHours = autoOt.filter((r) => r.ot_approved).reduce((s, r) => s + Number(r.ot_hours || 0), 0)
  const pendingAutoHours = autoOt.filter((r) => !r.ot_approved).reduce((s, r) => s + Number(r.ot_hours || 0), 0)

  const totalReq = rows.reduce((s, r) => s + (Number(r.days) || 0), 0)
  const totalApproved = rows.filter((r) => r.status === 'approved').reduce((s, r) => s + Number(r.days || 0), 0)
  const totalPending = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + Number(r.days || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      let { data: ot } = await supabase.from('leave_types').select('id').ilike('code', 'ot').maybeSingle()
      if (!ot) {
        const { data: created } = await supabase.from('leave_types').insert({ code: 'OT', name: 'Overtime', org_id: profile.org_id }).select().single()
        ot = created
      }
      const { error } = await supabase.from('leave_requests').insert({
        profile_id: profile.id, org_id: profile.org_id, leave_type_id: ot.id,
        date_from: date, date_to: date, days: Number(hours) / 8, reason, status: 'pending',
      })
      if (error) throw error
      setMsg('Request submitted.')
      setShowForm(false); setReason(''); load()
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <Link to="/" style={{ textDecoration: 'none', border: cardBorder, background: cardBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>Overtime</div>
        <div style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>{new Date().toLocaleDateString('en-CA', { timeZone: 'America/Regina', month: 'short', year: 'numeric' })} ▾</div>
      </div>

      {/* Hero card */}
      <div style={{ borderRadius: 20, padding: 18, background: 'linear-gradient(135deg,#fde68a,#fbbf24)', color: '#78350f', boxShadow: '0 8px 24px rgba(245,158,11,.25)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#78350f', opacity: .8 }}>Total overtime requested</div>
        <div style={{ fontSize: 36, fontWeight: 900, marginTop: 4, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>
          {Math.floor(totalReq * 8)}h {Math.round(((totalReq * 8) % 1) * 60)}m
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 11, fontWeight: 700 }}>
          <span>{Math.round(totalApproved * 8)}h approved</span>
          <span>·</span>
          <span>{Math.round(totalPending * 8)}h pending</span>
        </div>
      </div>

      {/* Auto-detected OT from clock in/out — admin approves/revokes */}
      {autoOt.length > 0 && (
        <>
          <div style={{ marginTop: 18, fontWeight: 800, fontSize: 14, color: textPrimary }}>
            OT from clock-outs
            <span style={{ marginLeft: 8, fontSize: 10, color: textMuted, fontWeight: 600 }}>
              {approvedAutoHours.toFixed(1)}h approved · {pendingAutoHours.toFixed(1)}h pending
            </span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {autoOt.slice(0, 5).map((r) => (
              <div key={r.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{fmtDate(r.work_date)}</div>
                  <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{Number(r.ot_hours).toFixed(1)}h over standard shift</div>
                </div>
                {r.ot_approved
                  ? <span style={{ fontSize: 10, fontWeight: 800, color: '#15803d', background: '#DCFCE7', padding: '4px 10px', borderRadius: 999 }}>✓ Approved by admin</span>
                  : <span style={{ fontSize: 10, fontWeight: 800, color: '#a16207', background: '#FEF3C7', padding: '4px 10px', borderRadius: 999 }}>⏱ Awaiting admin</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent overtime requests */}
      <div style={{ marginTop: 18, fontWeight: 800, fontSize: 14, color: textPrimary }}>Recent overtime requests</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 && (
          <div style={{ padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 12, color: textMuted }}>No overtime requests yet.</div>
        )}
        {rows.slice(0, 5).map((r) => (
          <div key={r.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 6px rgba(15,23,42,.05)' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{fmtDate(r.date_from)}</div>
              <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{Math.round((r.days || 0) * 8 * 60)} min · {r.reason || 'No reason'}</div>
            </div>
            <StatusPill status={r.status} />
          </div>
        ))}
      </div>

      {/* Submit button */}
      <button onClick={() => setShowForm((v) => !v)} style={{
        marginTop: 20, width: '100%',
        background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', border: 'none',
        borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 800,
        boxShadow: '0 8px 20px rgba(37,99,235,.35)', cursor: 'pointer',
      }}>
        {showForm ? 'Cancel' : 'Request Overtime Approval'}
      </button>

      {showForm && (
        <form onSubmit={submit} style={{ marginTop: 12, padding: 14, borderRadius: 16, background: cardBg, border: cardBorder, display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>DATE</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
              style={{ padding: '10px 12px', border: cardBorder, borderRadius: 10, background: dark ? 'rgba(255,255,255,.04)' : '#fff', color: textPrimary, fontSize: 13 }} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>HOURS</span>
            <input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} required
              style={{ padding: '10px 12px', border: cardBorder, borderRadius: 10, background: dark ? 'rgba(255,255,255,.04)' : '#fff', color: textPrimary, fontSize: 13 }} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>REASON</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="2"
              style={{ padding: '10px 12px', border: cardBorder, borderRadius: 10, background: dark ? 'rgba(255,255,255,.04)' : '#fff', color: textPrimary, fontSize: 13, resize: 'vertical' }} />
          </label>
          {msg && <div style={{ fontSize: 11, fontWeight: 600, color: msg.includes('submitted') ? '#16a34a' : '#b91c1c' }}>{msg}</div>}
          <button type="submit" disabled={busy} style={{ padding: '12px 0', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      )}

      <div style={{ height: 30 }} />
    </div>
  )
}

function StatusPill({ status }) {
  const cfg = {
    approved: { bg: '#DCFCE7', color: '#15803d', label: 'Approved' },
    pending: { bg: '#FEF3C7', color: '#a16207', label: 'Pending' },
    rejected: { bg: '#FEE2E2', color: '#b91c1c', label: 'Declined' },
    declined: { bg: '#FEE2E2', color: '#b91c1c', label: 'Declined' },
  }[status] || { bg: '#F1F5F9', color: '#64748b', label: status || '—' }
  return <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: 999 }}>{cfg.label}</span>
}
