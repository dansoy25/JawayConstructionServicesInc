import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { card, btnPrimary, btnGhost, chip, PageHeader } from './adminShared'
import { exportCsv, printPage, todayStamp } from '../../lib/exports'

const REPORTS = [
  { key: 'attendance', label: 'Attendance summary' },
  { key: 'payroll', label: 'Payroll register' },
  { key: 'leave', label: 'Leave history' },
  { key: 'employees', label: 'Employee roster' },
]

function fmtUSD(n) { return `$${(Number(n) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function isoNDaysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
function isoToday() { return new Date().toISOString().slice(0, 10) }

export default function AdminReports() {
  const { profile } = useAuth()
  const [selected, setSelected] = useState('attendance')
  const [rangeFrom, setRangeFrom] = useState(isoNDaysAgo(30))
  const [rangeTo, setRangeTo] = useState(isoToday())
  const [departments, setDepartments] = useState([])
  const [department, setDepartment] = useState('all')

  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [payrollRuns, setPayrollRuns] = useState([])
  const [leaveRows, setLeaveRows] = useState([])
  const [loading, setLoading] = useState(false)

  const loadAll = () => {
    if (!profile?.org_id) return
    setLoading(true)
    Promise.all([
      supabase.from('profiles')
        .select('id, full_name, employee_code, position, daily_rate, is_admin')
        .eq('org_id', profile.org_id),
      supabase.from('attendance')
        .select('profile_id, work_date, clock_in, clock_out, hours, site:sites(name)')
        .eq('org_id', profile.org_id)
        .gte('work_date', rangeFrom).lte('work_date', rangeTo),
      supabase.from('payroll_runs')
        .select('*').eq('org_id', profile.org_id)
        .gte('period_end', rangeFrom).lte('period_end', rangeTo)
        .order('period_end', { ascending: false }),
      supabase.from('leave_requests')
        .select('*, profile:profiles(full_name), leave_type:leave_types(name)')
        .eq('org_id', profile.org_id)
        .gte('date_from', rangeFrom).lte('date_to', rangeTo)
        .order('date_from', { ascending: false }),
    ]).then(([e, a, r, l]) => {
      const emps = (e.data || []).filter((p) => !p.is_admin)
      setEmployees(emps)
      setAttendance(a.data || [])
      setPayrollRuns(r.data || [])
      setLeaveRows(l.data || [])
      const depts = [...new Set(emps.map((x) => x.position).filter(Boolean))].sort()
      setDepartments(depts)
      setLoading(false)
    })
  }
  useEffect(loadAll, [profile?.org_id, rangeFrom, rangeTo])

  const filteredEmployees = useMemo(() => (
    department === 'all' ? employees : employees.filter((e) => e.position === department)
  ), [employees, department])
  const filteredEmpIds = useMemo(() => new Set(filteredEmployees.map((e) => e.id)), [filteredEmployees])

  const attForDept = useMemo(() => attendance.filter((a) => filteredEmpIds.has(a.profile_id)), [attendance, filteredEmpIds])

  // Attendance per department for the department table
  const deptTable = useMemo(() => {
    const rows = departments.map((d) => {
      const empIds = new Set(employees.filter((e) => e.position === d).map((e) => e.id))
      const hrs = attendance.filter((a) => empIds.has(a.profile_id)).reduce((s, a) => s + Number(a.hours || 0), 0)
      const workDays = new Set(attendance.filter((a) => empIds.has(a.profile_id)).map((a) => a.work_date)).size
      const expected = empIds.size * (workDays || 1)
      const present = attendance.filter((a) => empIds.has(a.profile_id) && a.clock_in).length
      const rate = expected > 0 ? Math.round((present / expected) * 100) : 100
      return { d, headcount: empIds.size, hours: hrs, attendance: rate }
    })
    return rows.filter((r) => r.headcount > 0)
  }, [departments, employees, attendance])

  const attendanceStats = useMemo(() => {
    const totalHours = attForDept.reduce((s, a) => s + Number(a.hours || 0), 0)
    const workDays = new Set(attForDept.map((a) => a.work_date)).size
    const expected = filteredEmployees.length * (workDays || 1)
    const present = attForDept.filter((a) => a.clock_in).length
    const avgAttendance = expected > 0 ? Math.round((present / expected) * 100) : 100
    const lateInstances = attForDept.filter((a) => {
      if (!a.clock_in) return false
      const t = new Date(a.clock_in)
      return (t.getHours() * 60 + t.getMinutes()) > (8 * 60)
    }).length
    const absences = Math.max(0, expected - present)
    return { totalHours, avgAttendance, lateInstances, absences }
  }, [attForDept, filteredEmployees])

  // Payroll totals
  const payrollTotals = useMemo(() => (
    payrollRuns.reduce((t, r) => ({
      gross: t.gross + Number(r.gross || 0),
      deductions: t.deductions + Number(r.deductions || 0),
      net: t.net + Number(r.net || 0),
      count: t.count + 1,
    }), { gross: 0, deductions: 0, net: 0, count: 0 })
  ), [payrollRuns])

  const doExportCsv = () => {
    const stamp = todayStamp()
    if (selected === 'attendance') {
      exportCsv(`report-attendance-${stamp}.csv`,
        ['Employee', 'Position', 'Work Date', 'Clock In', 'Clock Out', 'Hours', 'Site'],
        attForDept.map((a) => {
          const emp = filteredEmployees.find((e) => e.id === a.profile_id)
          return [emp?.full_name || '', emp?.position || '', a.work_date, a.clock_in || '', a.clock_out || '', a.hours || '', a.site?.name || '']
        }))
    } else if (selected === 'payroll') {
      exportCsv(`report-payroll-${stamp}.csv`,
        ['Period Start', 'Period End', 'Employees', 'Gross', 'Deductions', 'Net', 'Status'],
        payrollRuns.map((r) => [r.period_start, r.period_end, r.employee_count, r.gross, r.deductions, r.net, r.status]))
    } else if (selected === 'leave') {
      exportCsv(`report-leave-${stamp}.csv`,
        ['Employee', 'Type', 'From', 'To', 'Days', 'Status'],
        leaveRows.map((l) => [l.profile?.full_name || '', l.leave_type?.name || '', l.date_from, l.date_to, l.days || '', l.status || '']))
    } else if (selected === 'employees') {
      exportCsv(`report-employees-${stamp}.csv`,
        ['Employee ID', 'Full Name', 'Position', 'Hourly Rate'],
        filteredEmployees.map((e) => [e.employee_code, e.full_name, e.position || '', e.daily_rate || 0]))
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Reports"
        sub="Generate operational reports across attendance, payroll, and leave"
        actions={<>
          <button onClick={doExportCsv} style={btnGhost}>⬇ Export CSV</button>
          <button onClick={printPage} style={btnPrimary}>📄 Export PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Report type</div>
          {REPORTS.map((r) => (
            <label key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', cursor: 'pointer', borderRadius: 8, background: selected === r.key ? '#eff6ff' : 'transparent' }}>
              <input type="radio" name="report" checked={selected === r.key} onChange={() => setSelected(r.key)} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{r.label}</span>
            </label>
          ))}

          <div style={{ marginTop: 20, fontSize: 11, fontWeight: 700, color: '#64748b' }}>From</div>
          <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />

          <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#64748b' }}>To</div>
          <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />

          <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#64748b' }}>Department</div>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}>
            <option value="all">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={loadAll} style={btnGhost}>↻ Refresh</button>
            <button onClick={doExportCsv} style={btnPrimary}>⬇ Export</button>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, padding: 12, background: '#eff6ff', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{REPORTS.find((r) => r.key === selected)?.label} — preview</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {new Date(rangeFrom).toLocaleDateString('en-CA', { timeZone: 'America/Regina' })} → {new Date(rangeTo).toLocaleDateString('en-CA', { timeZone: 'America/Regina' })}
                {department !== 'all' && ` · ${department}`}
              </div>
            </div>
            {loading && <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>Loading…</span>}
          </div>

          {selected === 'attendance' && <AttendanceReport stats={attendanceStats} deptTable={deptTable} />}
          {selected === 'payroll' && <PayrollReport totals={payrollTotals} runs={payrollRuns} />}
          {selected === 'leave' && <LeaveReport rows={leaveRows} />}
          {selected === 'employees' && <EmployeesReport employees={filteredEmployees} />}
        </div>
      </div>
    </div>
  )
}

function AttendanceReport({ stats, deptTable }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { l: 'TOTAL HOURS', v: stats.totalHours.toFixed(1) },
          { l: 'AVG ATTENDANCE', v: `${stats.avgAttendance}%` },
          { l: 'LATE INSTANCES', v: stats.lateInstances },
          { l: 'ABSENCES', v: stats.absences },
        ].map((r) => (
          <div key={r.l}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: .5 }}>{r.l}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{r.v}</div>
          </div>
        ))}
      </div>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['DEPARTMENT', 'HEADCOUNT', 'HOURS', 'ATTENDANCE'].map((h) => (
            <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: 10, fontWeight: 800, color: '#64748b' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {deptTable.length === 0 && (
            <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No data in this range.</td></tr>
          )}
          {deptTable.map((r) => {
            const good = r.attendance >= 92
            return (
              <tr key={r.d} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 0', fontWeight: 600 }}>{r.d}</td>
                <td style={{ padding: '10px 0' }}>{r.headcount}</td>
                <td style={{ padding: '10px 0' }}>{r.hours.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                <td style={{ padding: '10px 0' }}>
                  <span style={chip(good ? '#DCFCE7' : '#FEF3C7', good ? '#15803d' : '#a16207')}>● {r.attendance}%</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

function PayrollReport({ totals, runs }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { l: 'RUNS', v: totals.count },
          { l: 'GROSS', v: fmtUSD(totals.gross) },
          { l: 'DEDUCTIONS', v: fmtUSD(totals.deductions) },
          { l: 'NET', v: fmtUSD(totals.net) },
        ].map((r) => (
          <div key={r.l}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: .5 }}>{r.l}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{r.v}</div>
          </div>
        ))}
      </div>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['PERIOD', 'EMPLOYEES', 'GROSS', 'DEDUCTIONS', 'NET'].map((h) => (
            <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: 10, fontWeight: 800, color: '#64748b' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {runs.length === 0 && <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No payroll runs in this range.</td></tr>}
          {runs.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 0', fontWeight: 600 }}>{r.period_start} — {r.period_end}</td>
              <td style={{ padding: '10px 0' }}>{r.employee_count}</td>
              <td style={{ padding: '10px 0' }}>{fmtUSD(r.gross)}</td>
              <td style={{ padding: '10px 0', color: '#b91c1c' }}>-{fmtUSD(r.deductions)}</td>
              <td style={{ padding: '10px 0', fontWeight: 800 }}>{fmtUSD(r.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function LeaveReport({ rows }) {
  const approved = rows.filter((r) => r.status === 'approved').length
  const pending = rows.filter((r) => r.status === 'pending').length
  const denied = rows.filter((r) => r.status === 'rejected' || r.status === 'declined').length
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { l: 'APPROVED', v: approved },
          { l: 'PENDING', v: pending },
          { l: 'DENIED', v: denied },
        ].map((r) => (
          <div key={r.l}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: .5 }}>{r.l}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{r.v}</div>
          </div>
        ))}
      </div>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['EMPLOYEE', 'TYPE', 'FROM', 'TO', 'DAYS', 'STATUS'].map((h) => (
            <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: 10, fontWeight: 800, color: '#64748b' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No leave requests in this range.</td></tr>}
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 0', fontWeight: 600 }}>{r.profile?.full_name || '—'}</td>
              <td style={{ padding: '10px 0' }}>{r.leave_type?.name || '—'}</td>
              <td style={{ padding: '10px 0' }}>{r.date_from}</td>
              <td style={{ padding: '10px 0' }}>{r.date_to}</td>
              <td style={{ padding: '10px 0' }}>{r.days || '—'}</td>
              <td style={{ padding: '10px 0' }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function EmployeesReport({ employees }) {
  return (
    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
      <thead>
        <tr>{['EMPLOYEE ID', 'NAME', 'POSITION', 'HOURLY RATE'].map((h) => (
          <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: 10, fontWeight: 800, color: '#64748b' }}>{h}</th>
        ))}</tr>
      </thead>
      <tbody>
        {employees.length === 0 && <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No employees match this filter.</td></tr>}
        {employees.map((e) => (
          <tr key={e.id} style={{ borderTop: '1px solid #f1f5f9' }}>
            <td style={{ padding: '10px 0', fontFamily: 'monospace' }}>{e.employee_code}</td>
            <td style={{ padding: '10px 0', fontWeight: 700 }}>{e.full_name}</td>
            <td style={{ padding: '10px 0' }}>{e.position || '—'}</td>
            <td style={{ padding: '10px 0', fontFamily: 'monospace' }}>{Number(e.daily_rate) > 0 ? fmtUSD(e.daily_rate) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
