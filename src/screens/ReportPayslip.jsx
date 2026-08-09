import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { currency } from '../lib/util'

export default function ReportPayslip() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [past, setPast] = useState([])
  const [period, setPeriod] = useState('current')
  const [delivery, setDelivery] = useState('inapp')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState('')

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'
  const inputBg = dark ? 'rgba(255,255,255,.04)' : '#fff'

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('payslips').select('*').eq('profile_id', profile.id).order('period_end', { ascending: false }).limit(10).then(({ data }) => setPast(data || []))
  }, [profile?.id])

  const submit = (e) => {
    e.preventDefault()
    setMsg('Request submitted — you will receive your payslip shortly.')
    setReason('')
  }

  const chip = (active) => ({
    padding: '10px 14px', borderRadius: 10,
    background: active ? 'linear-gradient(135deg,#2563eb,#0ea5e9)' : (dark ? 'rgba(255,255,255,.06)' : '#f1f5f9'),
    color: active ? '#fff' : textPrimary, fontSize: 12, fontWeight: 700,
    border: 'none', cursor: 'pointer', flex: 1,
  })

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <Link to="/reports" style={{ textDecoration: 'none', border: cardBorder, background: cardBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>Request Payslip</div>
        <div style={{ width: 36 }} />
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: .4, marginBottom: 6 }}>PAYROLL PERIOD</div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: cardBorder, borderRadius: 12, background: inputBg, color: textPrimary, fontSize: 13, fontWeight: 600 }}>
            <option value="current">Current period — 2nd cutoff</option>
            <option value="prev">Previous — 1st cutoff</option>
            <option value="last-month">Last month — full</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: .4, marginBottom: 6 }}>DELIVERY METHOD</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setDelivery('inapp')} style={chip(delivery === 'inapp')}>In-app view</button>
            <button type="button" onClick={() => setDelivery('email')} style={chip(delivery === 'email')}>Email copy</button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: .4, marginBottom: 6 }}>REASON (optional)</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Bank loan requirement" rows="3"
            style={{ width: '100%', padding: '12px 14px', border: cardBorder, borderRadius: 12, background: inputBg, color: textPrimary, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        {msg && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', color: '#16a34a', fontSize: 12, fontWeight: 600 }}>{msg}</div>}

        <button type="submit" style={{
          width: '100%', background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', border: 'none',
          borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 800,
          boxShadow: '0 8px 20px rgba(37,99,235,.35)', cursor: 'pointer',
        }}>Submit Payslip Request</button>
      </form>

      {/* Previous requests */}
      <div style={{ marginTop: 20, fontWeight: 800, fontSize: 14, color: textPrimary }}>Previous requests</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {past.length === 0 && (
          <div style={{ padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 12, color: textMuted }}>No prior payslip requests.</div>
        )}
        {past.slice(0, 5).map((p) => (
          <div key={p.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{p.period_start} — {p.period_end}</div>
              <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>Net: {currency(p.net_pay || 0)}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', background: '#DCFCE7', padding: '3px 10px', borderRadius: 999 }}>Ready</div>
          </div>
        ))}
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}
