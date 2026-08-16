import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

// Canonical Canadian deduction keys we render (any of these aliases are
// accepted from the stored deductions jsonb so the view keeps working if the
// admin's payroll module changes wording later).
const DED_LABELS = [
  { key: 'cpp', aliases: ['cpp', 'canada_pension_plan'], label: 'CPP (Canada Pension Plan)' },
  { key: 'ei', aliases: ['ei', 'employment_insurance'], label: 'EI (Employment Insurance)' },
  { key: 'federal_tax', aliases: ['federal_tax', 'federal_income_tax'], label: 'Federal Tax' },
  { key: 'provincial_tax', aliases: ['provincial_tax', 'state_income_tax'], label: 'Provincial Tax' },
]

function fmtCAD(n) {
  const v = Number(n) || 0
  return `$${v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Regina', month: 'short', day: 'numeric', year: 'numeric' })
}

// Pull a value from deductions jsonb tolerating any alias.
function deductionValue(deductions, aliases) {
  if (!deductions || typeof deductions !== 'object') return 0
  for (const a of aliases) {
    if (deductions[a] != null) return Number(deductions[a]) || 0
  }
  return 0
}

export default function Payslip() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [slips, setSlips] = useState([])
  const [selected, setSelected] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [pendingReq, setPendingReq] = useState(null)
  const [requesting, setRequesting] = useState(false)
  const [reqMsg, setReqMsg] = useState('')

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  const load = () => {
    if (!profile?.id) return
    setLoadErr('')
    // Only show slips the admin has explicitly sent to the employee.
    // Also fetch the admin's name via sent_by → profiles.
    supabase.from('payslips')
      .select('*, sender:profiles!payslips_sent_by_fkey(full_name)')
      .eq('profile_id', profile.id)
      .not('sent_at', 'is', null)
      .order('period_end', { ascending: false })
      .limit(24)
      .then(({ data, error }) => {
        if (error) {
          // If the FK alias fails (older schema), fall back to a plain select.
          supabase.from('payslips').select('*').eq('profile_id', profile.id)
            .not('sent_at', 'is', null).order('period_end', { ascending: false }).limit(24)
            .then(({ data: d2 }) => { setSlips(d2 || []); if ((d2 || []).length && !selected) setSelected(d2[0]) })
          return
        }
        setSlips(data || [])
        if ((data || []).length > 0 && !selected) setSelected(data[0])
      })
    supabase.from('payslip_requests')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => setPendingReq(data?.[0] || null))
  }
  // eslint-disable-next-line
  useEffect(load, [profile?.id])

  const requestPayslip = async () => {
    if (!profile?.id || !profile?.org_id) return
    setRequesting(true); setReqMsg('')
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    const { error } = await supabase.from('payslip_requests').insert({
      org_id: profile.org_id, profile_id: profile.id,
      period_start: monthStart, period_end: monthEnd,
    })
    if (error) setReqMsg(error.message)
    else { setReqMsg('Request sent to admin.'); load() }
    setRequesting(false)
  }

  const details = useMemo(() => {
    if (!selected) return null
    const earnings = selected.earnings || {}
    const rate = Number(earnings.rate_per_hour || 0)
    const regularHours = Number(earnings.regular_hours || selected.regular_hours || 0)
    const otHours = Number(earnings.ot_hours || selected.ot_hours || 0)
    const basic = Number(earnings.basic || (rate * regularHours))
    const overtime = Number(earnings.overtime || (rate * 1.5 * otHours))
    const gross = Number(selected.gross || (basic + overtime))
    const ded = DED_LABELS.map((d) => ({ label: d.label, key: d.key, value: deductionValue(selected.deductions, d.aliases) }))
    const totalDed = ded.reduce((s, d) => s + d.value, 0)
    const net = Number(selected.net || (gross - totalDed))
    return { rate, regularHours, otHours, basic, overtime, gross, ded, totalDed, net }
  }, [selected])

  const downloadPDF = () => window.print()

  const downloadCSV = () => {
    if (!selected || !details) return
    const rows = [
      ['Employee', profile.full_name || ''],
      ['Employee Code', profile.employee_code || ''],
      ['Pay Period Start', fmtDate(selected.period_start)],
      ['Pay Period End', fmtDate(selected.period_end)],
      [],
      ['EARNINGS'],
      ['Regular Hours', details.regularHours.toFixed(2)],
      ['OT Hours', details.otHours.toFixed(2)],
      ['Hourly Rate', details.rate.toFixed(2)],
      ['Basic Pay', details.basic.toFixed(2)],
      ['Overtime', details.overtime.toFixed(2)],
      ['Gross Pay', details.gross.toFixed(2)],
      [],
      ['DEDUCTIONS'],
      ...details.ded.map((d) => [d.label, d.value.toFixed(2)]),
      ['Total Deductions', details.totalDed.toFixed(2)],
      [],
      ['NET INCOME', details.net.toFixed(2)],
    ]
    const csv = rows.map((row) => row.map((cell) => {
      const s = String(cell ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payslip-${selected.period_end || 'export'}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Print styles: hide chrome, show only the payslip card */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          nav, .no-print { display: none !important; }
          .payslip-print { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ padding: '16px 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>Payslips</div>
        <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>Payroll issued by your admin</div>
      </div>

      {loadErr && (
        <div className="no-print" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
          Couldn't load payslips: {loadErr}
        </div>
      )}

      {pendingReq && (
        <div className="no-print" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.4)', color: '#f59e0b', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
          ⏱ Payslip request pending — admin will send it shortly.
        </div>
      )}

      {slips.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: textMuted, fontSize: 12, background: cardBg, borderRadius: 14, border: cardBorder }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📄</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>No payslips sent yet</div>
          <div style={{ marginBottom: 14 }}>Request a payslip and your admin will send the latest one back to you here.</div>
          {!pendingReq && (
            <button
              onClick={requestPayslip}
              disabled={requesting}
              style={{ padding: '10px 18px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#dc2626,#0f172a)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: requesting ? 'wait' : 'pointer', opacity: requesting ? .7 : 1 }}
            >{requesting ? 'Sending…' : '📨 Request payslip'}</button>
          )}
          {reqMsg && <div style={{ marginTop: 10, fontSize: 11 }}>{reqMsg}</div>}
        </div>
      ) : (
        <>
          {/* Period picker */}
          <div className="no-print" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
            {slips.map((s) => {
              const active = selected?.id === s.id
              return (
                <button key={s.id} onClick={() => setSelected(s)} style={{
                  minWidth: 130, padding: '10px 12px', borderRadius: 12,
                  background: active ? 'linear-gradient(135deg,#dc2626,#0f172a)' : cardBg,
                  border: active ? 'none' : cardBorder,
                  color: active ? '#fff' : textPrimary,
                  cursor: 'pointer', textAlign: 'left', flexShrink: 0,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, opacity: active ? .85 : .6 }}>PAY PERIOD</div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>{fmtDate(s.period_end)}</div>
                  <div style={{ fontSize: 10, opacity: active ? .85 : .6, marginTop: 2, fontFamily: 'monospace' }}>{fmtCAD(s.net)}</div>
                </button>
              )
            })}
          </div>

          {/* Selected payslip */}
          {details && (
            <div className="payslip-print" style={{ marginTop: 14, borderRadius: 16, background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,.08)', overflow: 'hidden' }}>
              {/* Header stripe */}
              <div style={{ padding: 18, background: 'linear-gradient(135deg,#0f172a,#dc2626)', color: '#fff' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, opacity: .85 }}>JAWAY CONSTRUCTION SERVICES INC.</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Payslip</div>
                <div style={{ fontSize: 12, opacity: .9, marginTop: 2 }}>{fmtDate(selected.period_start)} — {fmtDate(selected.period_end)}</div>
                {selected.sent_at && (
                  <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,.15)', fontSize: 10, fontWeight: 700, display: 'inline-block' }}>
                    ✓ Set & sent by {selected.sender?.full_name || 'admin'} · {fmtDate(selected.sent_at)}
                  </div>
                )}
              </div>

              <div style={{ padding: 18 }}>
                {/* Employee block */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, fontSize: 12 }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: .4 }}>EMPLOYEE</div>
                    <div style={{ fontWeight: 800, marginTop: 2 }}>{profile?.full_name}</div>
                    <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace' }}>{profile?.employee_code}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: .4 }}>PAYSLIP #</div>
                    <div style={{ fontWeight: 800, marginTop: 2, fontFamily: 'monospace' }}>{selected.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>

                {/* Earnings */}
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#64748b', marginBottom: 6 }}>EARNINGS</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
                  <tbody>
                    <Row label={`Regular pay (${details.regularHours}h @ ${fmtCAD(details.rate)}/hr)`} value={fmtCAD(details.basic)} />
                    {details.otHours > 0 && (
                      <Row label={`Overtime (${details.otHours}h @ 1.5x)`} value={fmtCAD(details.overtime)} />
                    )}
                    <Row label="Gross Pay" value={fmtCAD(details.gross)} bold total />
                  </tbody>
                </table>

                {/* Deductions */}
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#64748b', marginBottom: 6 }}>DEDUCTIONS</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
                  <tbody>
                    {details.ded.map((d) => (
                      <Row key={d.key} label={d.label} value={`− ${fmtCAD(d.value)}`} valueColor="#b91c1c" />
                    ))}
                    <Row label="Total Deductions" value={`− ${fmtCAD(details.totalDed)}`} bold total valueColor="#b91c1c" />
                  </tbody>
                </table>

                {/* Net */}
                <div style={{
                  padding: 16, borderRadius: 12,
                  background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
                  border: '2px solid #dc2626',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#7f1d1d', letterSpacing: 1 }}>NET INCOME</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{fmtCAD(details.net)}</div>
                </div>

                <div style={{ marginTop: 12, fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
                  This is a computer-generated payslip. No signature required.
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {details && (
            <>
              <div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={downloadPDF} style={btnFilled}>⬇ Download PDF</button>
                <button onClick={downloadCSV} style={btnOutline}>📊 Export CSV</button>
              </div>
              {!pendingReq && (
                <div className="no-print" style={{ marginTop: 10, textAlign: 'center' }}>
                  <button
                    onClick={requestPayslip}
                    disabled={requesting}
                    style={{ padding: '8px 16px', borderRadius: 999, border: '1px solid rgba(220,38,38,.4)', background: 'transparent', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: requesting ? 'wait' : 'pointer' }}
                  >{requesting ? 'Sending…' : '📨 Request another payslip'}</button>
                  {reqMsg && <div style={{ marginTop: 6, fontSize: 10, color: textMuted }}>{reqMsg}</div>}
                </div>
              )}
            </>
          )}
        </>
      )}

      <div style={{ height: 30 }} />
    </div>
  )
}

function Row({ label, value, bold, total, valueColor }) {
  return (
    <tr style={total ? { borderTop: '1px solid #e2e8f0' } : null}>
      <td style={{ padding: '7px 0', color: bold ? '#0f172a' : '#334155', fontWeight: bold ? 800 : 500 }}>{label}</td>
      <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: bold ? 900 : 700, color: valueColor || '#0f172a', fontFamily: 'monospace' }}>{value}</td>
    </tr>
  )
}

const btnFilled = {
  flex: 1, padding: '12px 16px', borderRadius: 12,
  background: 'linear-gradient(135deg,#dc2626,#0f172a)', color: '#fff', border: 'none',
  fontSize: 13, fontWeight: 800, cursor: 'pointer',
  boxShadow: '0 6px 18px rgba(220,38,38,.35)',
}
const btnOutline = {
  flex: 1, padding: '12px 16px', borderRadius: 12,
  background: 'transparent', color: '#dc2626',
  border: '1.5px solid rgba(220,38,38,.45)',
  fontSize: 13, fontWeight: 800, cursor: 'pointer',
}
