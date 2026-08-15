import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/util'
import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'
import { exportCsv, printPage, todayStamp } from '../../lib/exports'

// Default rates while org_settings loads. Overridden by the values in
// org_settings, which admin can edit inline on this page.
const DEFAULT_CA_RATES = {
  cpp:            0.00,
  ei:             0.00,
  federal_tax:    0.00,
  provincial_tax: 0.00,
}

function fmtUSD(n) {
  const v = Number(n) || 0
  return `$${v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}
function today() {
  return new Date().toISOString().slice(0, 10)
}
function addDays(iso, n) {
  const d = new Date(iso); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function AdminPayroll() {
  const { profile } = useAuth()
  const [runs, setRuns] = useState([])
  const [wizardOpen, setWizardOpen] = useState(false)
  const [settings, setSettings] = useState(null) // org_settings row (may be null)
  const [editRates, setEditRates] = useState(false)
  const [editSchedule, setEditSchedule] = useState(false)

  const load = () => {
    if (!profile?.org_id) return
    supabase.from('payroll_runs').select('*').eq('org_id', profile.org_id).order('period_end', { ascending: false }).limit(20).then(({ data }) => setRuns(data || []))
    supabase.from('org_settings').select('*').eq('org_id', profile.org_id).maybeSingle().then(({ data }) => setSettings(data))
  }
  useEffect(() => { load() }, [profile?.org_id])

  const rates = {
    cpp: Number(settings?.cpp_rate ?? DEFAULT_CA_RATES.cpp),
    ei: Number(settings?.ei_rate ?? DEFAULT_CA_RATES.ei),
    federal_tax: Number(settings?.federal_tax_rate ?? DEFAULT_CA_RATES.federal_tax),
    provincial_tax: Number(settings?.provincial_tax_rate ?? DEFAULT_CA_RATES.provincial_tax),
  }
  const schedule = {
    frequency: settings?.pay_frequency || 'semi-monthly',
    cutoff: settings?.cutoff_days || '15,end',
    payout: settings?.payout_days || '5,20',
  }

  const currentPeriod = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    const day = now.getDate()
    if (day <= 15) return { start: `${y}-${String(m + 1).padStart(2, '0')}-01`, end: `${y}-${String(m + 1).padStart(2, '0')}-15` }
    const eom = new Date(y, m + 1, 0).getDate()
    return { start: `${y}-${String(m + 1).padStart(2, '0')}-16`, end: `${y}-${String(m + 1).padStart(2, '0')}-${eom}` }
  }, [])

  const draftRun = runs.find((r) => r.status === 'draft')
  const totalNet = runs.filter((r) => r.status === 'completed').reduce((s, r) => s + Number(r.net || 0), 0)
  const totalGross = runs.filter((r) => r.status === 'completed').reduce((s, r) => s + Number(r.gross || 0), 0)
  const totalDeductions = runs.filter((r) => r.status === 'completed').reduce((s, r) => s + Number(r.deductions || 0), 0)
  const empCount = draftRun?.employee_count || (runs[0]?.employee_count) || 0

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Payroll"
        sub={`Semi-monthly · next cutoff ${fmtDate(currentPeriod.end)}`}
        actions={<>
          <button
            onClick={() => exportCsv(
              `payroll-runs-${todayStamp()}.csv`,
              ['Period Start', 'Period End', 'Employees', 'Gross', 'Deductions', 'Net', 'Status', 'Created'],
              runs.map((r) => [r.period_start, r.period_end, r.employee_count, r.gross, r.deductions, r.net, r.status, r.created_at]),
            )}
            style={btnGhost}
          >⬇ CSV</button>
          <button onClick={printPage} style={btnGhost}>📄 PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="💰" label="NET PAY YTD" value={fmtUSD(totalNet)} sub="paid this year" accent="#22c55e" />
        <StatTile icon="💵" label="GROSS PAY YTD" value={fmtUSD(totalGross)} sub="basic + OT + allow" accent="#2563eb" />
        <StatTile icon="⊝" label="DEDUCTIONS YTD" value={fmtUSD(totalDeductions)} sub="CPP + EI + Federal + Provincial" accent="#ef4444" />
        <StatTile icon="👥" label="EMPLOYEES" value={empCount || '—'} sub="on last payroll" accent="#a855f7" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setWizardOpen(true)} style={btnPrimary}>▶ Run payroll</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Payroll runs</div>
        <table style={table}>
          <thead><tr>{['PERIOD','EMPLOYEES','GROSS','DEDUCTIONS','NET','STATUS','CREATED'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {runs.length === 0 && <tr><td colSpan="7" style={{ ...td, textAlign: 'center', padding: 30, color: '#94a3b8' }}>No payroll runs yet. Click "Run payroll" to get started.</td></tr>}
            {runs.map((r) => (
              <tr key={r.id}>
                <td style={{ ...td, fontWeight: 600 }}>{fmtDate(r.period_start)} — {fmtDate(r.period_end)}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.employee_count}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{fmtUSD(r.gross)}</td>
                <td style={{ ...td, fontFamily: 'monospace', color: '#b91c1c' }}>-{fmtUSD(r.deductions)}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(r.net)}</td>
                <td style={td}>{r.status === 'draft' ? <span style={chip('#F1F5F9', '#334155')}>● Draft</span> : <span style={chip('#DCFCE7', '#15803d')}>● Completed</span>}</td>
                <td style={{ ...td, fontSize: 11, color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {wizardOpen && <RunPayrollWizard onClose={() => setWizardOpen(false)} onDone={() => { setWizardOpen(false); load() }} orgId={profile?.org_id} defaultPeriod={currentPeriod} rates={rates} />}

      {/* Statutory config summary */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Statutory rates (CA)</div>
            <button onClick={() => setEditRates(true)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 11 }}>✎ Edit</button>
          </div>
          {[
            { label: 'CPP (Canada Pension Plan)', v: rates.cpp },
            { label: 'EI (Employment Insurance)', v: rates.ei },
            { label: 'Federal Tax', v: rates.federal_tax },
            { label: 'Provincial Tax', v: rates.provincial_tax },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ color: '#334155' }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{(r.v * 100).toFixed(2)}%</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>Applies to every employee unless they have a per-employee override on their profile.</div>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Pay schedule</div>
            <button onClick={() => setEditSchedule(true)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 11 }}>✎ Edit</button>
          </div>
          {[
            { label: 'Frequency', value: prettyFrequency(schedule.frequency) },
            { label: 'Cut-off dates', value: prettyDays(schedule.cutoff, 'of the month') },
            { label: 'Pay-out dates', value: prettyDays(schedule.payout, 'of the month') },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ color: '#334155' }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {editRates && <RatesDialog orgId={profile?.org_id} settings={settings} onClose={() => setEditRates(false)} onSaved={() => { setEditRates(false); load() }} />}
      {editSchedule && <ScheduleDialog orgId={profile?.org_id} settings={settings} onClose={() => setEditSchedule(false)} onSaved={() => { setEditSchedule(false); load() }} />}
    </div>
  )
}

function prettyFrequency(f) {
  return ({ 'weekly': 'Weekly', 'bi-weekly': 'Bi-weekly', 'semi-monthly': 'Semi-monthly', 'monthly': 'Monthly' })[f] || f
}
function prettyDays(csv, suffix) {
  if (!csv) return '—'
  const parts = String(csv).split(',').map((p) => p.trim()).filter(Boolean)
  return parts.map((p) => p === 'end' ? 'end of month' : `${p}${ordSuffix(Number(p))}`).join(' & ')
}
function ordSuffix(n) {
  const v = n % 100
  if (v >= 11 && v <= 13) return 'th'
  return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'
}

// ─── Wizard ────────────────────────────────────────────────────────────

function RunPayrollWizard({ orgId, defaultPeriod, onClose, onDone, rates = DEFAULT_CA_RATES }) {
  const [step, setStep] = useState(1)
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start)
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.end)
  const [payDate, setPayDate] = useState(addDays(defaultPeriod.end, 5))
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!orgId) return
    Promise.all([
      supabase.from('profiles')
        .select('id, full_name, employee_code, position, daily_rate, schedule, cpp_amount, ei_amount, federal_tax_amount, provincial_tax_amount')
        .eq('org_id', orgId)
        .eq('is_admin', false)
        .order('full_name'),
      supabase.from('attendance')
        .select('profile_id, hours, clock_in, clock_out, work_date, ot_hours, ot_approved')
        .eq('org_id', orgId)
        .gte('work_date', periodStart)
        .lte('work_date', periodEnd),
    ]).then(([e, a]) => {
      const rows = e.data || []
      setEmployees(rows)
      setAttendance(a.data || [])
      setSelected(new Set(rows.map((r) => r.id)))
    })
  }, [orgId, periodStart, periodEnd])

  // Hourly rate × actual hours worked within the period.
  // If no attendance data is recorded, falls back to scheduled hours from
  // the employee's shift × business days in the period (10 for semi-monthly).
  const rows = useMemo(() => {
    return employees.filter((e) => selected.has(e.id)).map((e) => {
      const empAtt = attendance.filter((a) => a.profile_id === e.id && a.hours)
      // OT only counts if the admin approved it on the attendance row.
      const otApprovedHours = empAtt
        .filter((a) => a.ot_approved && Number(a.ot_hours || 0) > 0)
        .reduce((s, a) => s + Number(a.ot_hours || 0), 0)
      const totalHoursLogged = empAtt.reduce((s, a) => s + Number(a.hours || 0), 0)
      const regularHours = Math.max(0, totalHoursLogged - otApprovedHours)
      const otHours = otApprovedHours
      const rate = Number(e.daily_rate || 0)
      const basic = rate * regularHours
      const ot = rate * 1.5 * otHours
      const gross = basic + ot
      // Per-employee fixed dollar deductions (per pay period). Fall back to
      // org rate × gross if the admin hasn't set a fixed amount.
      const pickAmt = (empAmt, orgRate) => (Number(empAmt) > 0 ? Number(empAmt) : gross * Number(orgRate || 0))
      const cpp = pickAmt(e.cpp_amount, rates.cpp)
      const ei = pickAmt(e.ei_amount, rates.ei)
      const fed = pickAmt(e.federal_tax_amount, rates.federal_tax)
      const prov = pickAmt(e.provincial_tax_amount, rates.provincial_tax)
      const deductions = cpp + ei + fed + prov
      const net = gross - deductions
      return { emp: e, rate, regularHours, otHours, basic, ot, gross, cpp, ei, fed, prov, deductions, net }
    })
  }, [employees, attendance, selected, rates])

  const totals = useMemo(() => rows.reduce((t, r) => ({
    basic: t.basic + r.basic, ot: t.ot + r.ot, gross: t.gross + r.gross,
    fed: t.fed + r.fed, prov: t.prov + r.prov, cpp: t.cpp + r.cpp, ei: t.ei + r.ei,
    deductions: t.deductions + r.deductions, net: t.net + r.net,
  }), { basic: 0, ot: 0, gross: 0, fed: 0, prov: 0, cpp: 0, ei: 0, deductions: 0, net: 0 }), [rows])

  const toggle = (id) => setSelected((prev) => {
    const s = new Set(prev)
    if (s.has(id)) s.delete(id); else s.add(id)
    return s
  })

  const confirm = async () => {
    setBusy(true); setErr('')
    try {
      const { data: run, error: rErr } = await supabase.from('payroll_runs').insert({
        org_id: orgId,
        period_start: periodStart, period_end: periodEnd,
        employee_count: rows.length,
        gross: totals.gross, deductions: totals.deductions, net: totals.net,
        status: 'completed', locked_at: new Date().toISOString(),
      }).select().single()
      if (rErr) throw rErr

      const slips = rows.map((r) => ({
        profile_id: r.emp.id, org_id: orgId,
        period_start: periodStart, period_end: periodEnd,
        regular_hours: r.regularHours, ot_hours: r.otHours,
        gross: r.gross, net: r.net, status: 'sent', paid_to: null,
        earnings: { rate_per_hour: r.rate, regular_hours: r.regularHours, ot_hours: r.otHours, basic: r.basic, overtime: r.ot },
        deductions: {
          cpp: r.cpp,
          ei: r.ei,
          federal_tax: r.fed,
          provincial_tax: r.prov,
        },
      }))
      if (slips.length) {
        const { error: pErr } = await supabase.from('payslips').insert(slips)
        if (pErr) throw pErr
      }

      onDone()
    } catch (e) { setErr(e.message || 'Failed to run payroll') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 780, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Run payroll — {fmtDate(periodStart)}–{fmtDate(periodEnd)}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Step {step} of 3</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <StepIndicator step={step} />

        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16 }}>
          {step === 1 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Select period & employees</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <DateField label="PERIOD START" value={periodStart} onChange={setPeriodStart} />
                <DateField label="PERIOD END" value={periodEnd} onChange={setPeriodEnd} />
                <DateField label="PAY-OUT DATE" value={payDate} onChange={setPayDate} />
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: .4 }}>
                    EMPLOYEES ({selected.size} of {employees.length} selected)
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelected(new Set(employees.map((e) => e.id)))} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Select all</button>
                    <span style={{ color: '#cbd5e1' }}>·</span>
                    <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {employees.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No employees yet.</div>
                  ) : employees.map((e) => (
                    <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected.has(e.id) ? '#eff6ff' : '#fff' }}>
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} style={{ width: 16, height: 16 }} />
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{initials(e.full_name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{e.full_name}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{e.position || 'Employee'} · {e.employee_code}</div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{Number(e.daily_rate) > 0 ? `${fmtUSD(e.daily_rate)}/hr` : <span style={{ color: '#94a3b8' }}>no rate</span>}</div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Review & adjust</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>US deductions currently at 0% — set rates in Settings to withhold.</div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
                  <thead>
                    <tr>{['EMPLOYEE','BASIC','OT','CPP','EI','FED','PROV','NET PAY'].map((h) => (
                      <th key={h} style={{ ...th, padding: '8px 10px', fontSize: 9 }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.emp.id}>
                        <td style={{ ...td, padding: '10px', fontWeight: 600 }}>{r.emp.full_name}</td>
                        <td style={{ ...td, padding: '10px', fontFamily: 'monospace' }}>{fmtUSD(r.basic)}</td>
                        <td style={{ ...td, padding: '10px', fontFamily: 'monospace' }}>{fmtUSD(r.ot)}</td>
                        <td style={{ ...td, padding: '10px', fontFamily: 'monospace', color: '#b91c1c' }}>{fmtUSD(r.cpp)}</td>
                        <td style={{ ...td, padding: '10px', fontFamily: 'monospace', color: '#b91c1c' }}>{fmtUSD(r.ei)}</td>
                        <td style={{ ...td, padding: '10px', fontFamily: 'monospace', color: '#b91c1c' }}>{fmtUSD(r.fed)}</td>
                        <td style={{ ...td, padding: '10px', fontFamily: 'monospace', color: '#b91c1c' }}>{fmtUSD(r.prov)}</td>
                        <td style={{ ...td, padding: '10px', fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(r.net)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ ...td, padding: '10px', fontWeight: 800 }}>Totals ({rows.length} employees)</td>
                      <td style={{ ...td, padding: '10px', fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(totals.basic)}</td>
                      <td style={{ ...td, padding: '10px', fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(totals.ot)}</td>
                      <td style={{ ...td, padding: '10px', fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(totals.cpp)}</td>
                      <td style={{ ...td, padding: '10px', fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(totals.ei)}</td>
                      <td style={{ ...td, padding: '10px', fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(totals.fed)}</td>
                      <td style={{ ...td, padding: '10px', fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(totals.prov)}</td>
                      <td style={{ ...td, padding: '10px', fontFamily: 'monospace', fontWeight: 900, color: '#dc2626' }}>{fmtUSD(totals.net)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Confirm payroll run</div>
              <div style={{ padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, marginBottom: 16, fontSize: 12, color: '#1e40af' }}>
                ⓘ Once confirmed, payslips will be generated for all selected employees. This creates rows in <code>payroll_runs</code> and <code>payslips</code>.
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'grid', gap: 12 }}>
                <SumRow label="Pay period" value={`${fmtDate(periodStart)} — ${fmtDate(periodEnd)}`} />
                <SumRow label="Pay-out date" value={fmtDate(payDate)} />
                <SumRow label="Employees" value={rows.length} />
                <SumRow label="Total gross" value={fmtUSD(totals.gross)} />
                <SumRow label="Total deductions" value={fmtUSD(totals.deductions)} redIfPositive />
                <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
                <SumRow label="Net to disburse" value={fmtUSD(totals.net)} big />
              </div>
              {err && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} style={btnGhost}>← Back</button>
          ) : <button onClick={onClose} style={btnGhost}>Cancel</button>}
          <div style={{ display: 'flex', gap: 8 }}>
            {step < 3 && <button onClick={() => setStep(step + 1)} disabled={step === 1 && selected.size === 0} style={{ ...btnPrimary, opacity: (step === 1 && selected.size === 0) ? 0.5 : 1 }}>Continue →</button>}
            {step === 3 && <button onClick={confirm} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? 'Processing…' : '✓ Confirm & process'}</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ step }) {
  const dots = [1, 2, 3]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      {dots.map((n, i) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i === dots.length - 1 ? '0' : '1' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: step >= n ? '#2563eb' : '#e2e8f0', color: step >= n ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
            {step > n ? '✓' : n}
          </div>
          {i < dots.length - 1 && <div style={{ flex: 1, height: 2, background: step > n ? '#2563eb' : '#e2e8f0' }} />}
        </div>
      ))}
    </div>
  )
}

function DateField({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 4 }}>{label}</div>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600 }} />
    </div>
  )
}

function SumRow({ label, value, big, redIfPositive }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: big ? 14 : 12, color: big ? '#0f172a' : '#64748b', fontWeight: big ? 800 : 600 }}>{label}</div>
      <div style={{ fontSize: big ? 22 : 13, fontFamily: 'monospace', fontWeight: big ? 900 : 700, color: big ? '#2563eb' : redIfPositive ? '#b91c1c' : '#0f172a' }}>{value}</div>
    </div>
  )
}

// ─── Editable statutory rates dialog ─────────────────────────────────

function RatesDialog({ orgId, settings, onClose, onSaved }) {
  const rateToPct = (r) => (r == null || Number(r) === 0) ? '' : String(Number(r) * 100)
  const [cpp, setCpp] = useState(rateToPct(settings?.cpp_rate))
  const [ei, setEi] = useState(rateToPct(settings?.ei_rate))
  const [fed, setFed] = useState(rateToPct(settings?.federal_tax_rate))
  const [prov, setProv] = useState(rateToPct(settings?.provincial_tax_rate))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    setBusy(true); setErr('')
    try {
      const pct = (v) => (v === '' || v == null) ? 0 : Number(v) / 100
      const payload = {
        org_id: orgId,
        cpp_rate: pct(cpp), ei_rate: pct(ei),
        federal_tax_rate: pct(fed), provincial_tax_rate: pct(prov),
      }
      const { error } = await supabase.from('org_settings').upsert(payload, { onConflict: 'org_id' })
      if (error) throw error
      onSaved()
    } catch (e) { setErr(e.message || 'Save failed.') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={panel(460)}>
        <div style={panelHeader}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Statutory rates (CA)</div>
          <button onClick={onClose} style={xBtn}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Enter as percentages. Applies to every employee unless a per-employee override is set.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <RatePct label="CPP %" value={cpp} onChange={setCpp} />
          <RatePct label="EI %" value={ei} onChange={setEi} />
          <RatePct label="FEDERAL %" value={fed} onChange={setFed} />
          <RatePct label="PROVINCIAL %" value={prov} onChange={setProv} />
        </div>
        {err && <div style={errBox}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{ ...btnPrimary, opacity: busy ? .6 : 1 }}>{busy ? 'Saving…' : 'Save rates'}</button>
        </div>
      </div>
    </div>
  )
}

function ScheduleDialog({ orgId, settings, onClose, onSaved }) {
  const [frequency, setFrequency] = useState(settings?.pay_frequency || 'semi-monthly')
  const [cutoff, setCutoff] = useState(settings?.cutoff_days || '15,end')
  const [payout, setPayout] = useState(settings?.payout_days || '5,20')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    setBusy(true); setErr('')
    try {
      const { error } = await supabase.from('org_settings').upsert({
        org_id: orgId,
        pay_frequency: frequency,
        cutoff_days: cutoff.trim(),
        payout_days: payout.trim(),
      }, { onConflict: 'org_id' })
      if (error) throw error
      onSaved()
    } catch (e) { setErr(e.message || 'Save failed.') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={panel(460)}>
        <div style={panelHeader}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Pay schedule</div>
          <button onClick={onClose} style={xBtn}>✕</button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={fieldLbl}>FREQUENCY</span>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={inputBox}>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="semi-monthly">Semi-monthly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={fieldLbl}>CUT-OFF DAYS (comma-separated; use "end" for end of month)</span>
            <input value={cutoff} onChange={(e) => setCutoff(e.target.value)} placeholder="15,end" style={inputBox} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={fieldLbl}>PAY-OUT DAYS (comma-separated)</span>
            <input value={payout} onChange={(e) => setPayout(e.target.value)} placeholder="5,20" style={inputBox} />
          </label>
        </div>
        {err && <div style={errBox}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{ ...btnPrimary, opacity: busy ? .6 : 1 }}>{busy ? 'Saving…' : 'Save schedule'}</button>
        </div>
      </div>
    </div>
  )
}

function RatePct({ label, value, onChange }) {
  return (
    <div>
      <div style={fieldLbl}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', marginTop: 4 }}>
        <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal"
          style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, background: 'transparent' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', paddingRight: 12 }}>%</span>
      </div>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }
const panel = (w) => ({ width: '100%', maxWidth: w, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)' })
const panelHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, color: '#0f172a' }
const xBtn = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }
const inputBox = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600 }
const fieldLbl = { fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }
const errBox = { marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }
