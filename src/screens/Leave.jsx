import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate } from '../lib/util'

export default function Leave() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [types, setTypes] = useState([])
  const [balances, setBalances] = useState([])
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [typeId, setTypeId] = useState('')
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'
  const inputBg = dark ? 'rgba(255,255,255,.04)' : '#fff'

  const load = async () => {
    if (!profile?.id) return
    const { data: t } = await supabase.from('leave_types').select('*').eq('org_id', profile.org_id).not('code', 'ilike', 'OT')
    setTypes(t || [])
    const { data: b } = await supabase.from('leave_balances').select('*, leave_type:leave_types(*)').eq('profile_id', profile.id)
    setBalances(b || [])
    const { data: r } = await supabase.from('leave_requests').select('*, leave_type:leave_types(*)').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(10)
    setRequests(r || [])
    if (t?.[0]) setTypeId(t[0].id)
  }
  useEffect(() => { load() }, [profile?.id])

  const totalDays = balances.reduce((s, b) => s + Number(b.total || 0), 0)
  const usedDays = balances.reduce((s, b) => s + Number(b.used || 0), 0)
  const remaining = totalDays - usedDays

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg('')
    try {
      const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1
      const { error } = await supabase.from('leave_requests').insert({
        profile_id: profile.id, org_id: profile.org_id, leave_type_id: typeId,
        start_date: start, end_date: end, days, reason, status: 'pending',
      })
      if (error) throw error
      setMsg('Request submitted.')
      setShowForm(false); setReason(''); load()
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  const statusChip = (s) => {
    const cfg = { approved: { bg: '#DCFCE7', color: '#15803d', label: 'Approved' }, pending: { bg: '#FEF3C7', color: '#a16207', label: 'Pending' }, rejected: { bg: '#FEE2E2', color: '#b91c1c', label: 'Declined' }, declined: { bg: '#FEE2E2', color: '#b91c1c', label: 'Declined' } }[s] || { bg: '#F1F5F9', color: '#64748b', label: s || '—' }
    return <div style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 10px', borderRadius: 999 }}>{cfg.label}</div>
  }

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>Leave</div>
        <button onClick={() => setShowForm((v) => !v)} style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 6px rgba(0,0,0,.15)' }}>
          {showForm ? 'Cancel' : '+ Request'}
        </button>
      </div>

      {/* Balance hero */}
      <div style={{ borderRadius: 20, padding: 16, background: 'linear-gradient(135deg,#334155,#1E293B)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize: 11, opacity: .9, fontWeight: 600 }}>Available Balance</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{remaining}</div>
          <div style={{ fontSize: 12, opacity: .85 }}>of {totalDays || 15} days remaining</div>
        </div>
        <div style={{ marginTop: 10, height: 6, background: 'rgba(255,255,255,.25)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: totalDays ? `${(remaining / totalDays) * 100}%` : '47%', height: '100%', background: '#fff' }} />
        </div>
      </div>

      {/* Balance breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
        {balances.slice(0, 3).map((b, i) => (
          <div key={i} style={{ padding: 10, borderRadius: 12, background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: ['#16a34a', '#2563eb', '#a16207'][i] }}>{Number(b.total || 0) - Number(b.used || 0)}</div>
            <div style={{ fontSize: 9, color: textMuted, fontWeight: 600 }}>{b.leave_type?.label || 'Leave'}</div>
          </div>
        ))}
        {balances.length === 0 && (
          <>
            <div style={{ padding: 10, borderRadius: 12, background: cardBg, border: cardBorder, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>7</div>
              <div style={{ fontSize: 9, color: textMuted, fontWeight: 600 }}>Vacation</div>
            </div>
            <div style={{ padding: 10, borderRadius: 12, background: cardBg, border: cardBorder, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#2563eb' }}>5</div>
              <div style={{ fontSize: 9, color: textMuted, fontWeight: 600 }}>Sick</div>
            </div>
            <div style={{ padding: 10, borderRadius: 12, background: cardBg, border: cardBorder, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#a16207' }}>2</div>
              <div style={{ fontSize: 9, color: textMuted, fontWeight: 600 }}>Emergency</div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ marginTop: 14, padding: 14, borderRadius: 16, background: cardBg, border: cardBorder, display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>LEAVE TYPE</span>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} required style={{ padding: '10px 12px', border: cardBorder, borderRadius: 10, background: inputBg, color: textPrimary, fontSize: 13 }}>
              {types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>START</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required style={{ padding: '10px 12px', border: cardBorder, borderRadius: 10, background: inputBg, color: textPrimary, fontSize: 13 }} />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>END</span>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required style={{ padding: '10px 12px', border: cardBorder, borderRadius: 10, background: inputBg, color: textPrimary, fontSize: 13 }} />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: textMuted }}>REASON</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="2" style={{ padding: '10px 12px', border: cardBorder, borderRadius: 10, background: inputBg, color: textPrimary, fontSize: 13, resize: 'vertical' }} />
          </label>
          {msg && <div style={{ fontSize: 11, fontWeight: 600, color: msg.includes('submitted') ? '#16a34a' : '#b91c1c' }}>{msg}</div>}
          <button type="submit" disabled={busy} style={{ padding: '12px 0', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      )}

      {/* My Requests */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: textPrimary }}>My Requests</div>
        <div style={{ fontSize: 11, color: textMuted }}>View all ›</div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {requests.length === 0 && (
          <div style={{ padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 12, color: textMuted }}>No leave requests yet.</div>
        )}
        {requests.map((r) => (
          <div key={r.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, boxShadow: '0 2px 6px rgba(15,23,42,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{r.leave_type?.label || 'Leave'}</div>
              {statusChip(r.status)}
            </div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{fmtDate(r.start_date)} – {fmtDate(r.end_date)} · {r.days} day{r.days > 1 ? 's' : ''}</div>
            {r.reason && <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>{r.reason}</div>}
          </div>
        ))}
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}
