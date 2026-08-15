import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { card, table, th, td, btnPrimary, btnGhost, StatTile, PageHeader } from './adminShared'
import { exportCsv, todayStamp } from '../../lib/exports'

function fmtUSD(n) { return `$${(Number(n) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) }

const PAGE_SIZE = 10

export default function AdminPayslips() {
  const { profile } = useAuth()
  const [employees, setEmployees] = useState([])
  const [payslips, setPayslips] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [ytdOpen, setYtdOpen] = useState(false)

  useEffect(() => {
    if (!profile?.org_id) return
    supabase.from('profiles')
      .select('id, full_name, employee_code, position, daily_rate, avatar_url')
      .eq('org_id', profile.org_id)
      .eq('is_admin', false)
      .order('full_name')
      .then(({ data }) => setEmployees(data || []))
    supabase.from('payslips')
      .select('id, profile_id, period_start, period_end, gross, net, status, created_at')
      .eq('org_id', profile.org_id)
      .order('period_end', { ascending: false })
      .then(({ data }) => setPayslips(data || []))
  }, [profile?.org_id])

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)

  // Aggregate per-employee payslip stats.
  const rows = useMemo(() => {
    const byEmp = new Map()
    for (const p of payslips) {
      const s = byEmp.get(p.profile_id) || { ytdGross: 0, ytdNet: 0, count: 0, last: null, pending: 0 }
      if (p.period_end >= yearStart) { s.ytdGross += Number(p.gross || 0); s.ytdNet += Number(p.net || 0) }
      s.count++
      if (!s.last || p.period_end > s.last.period_end) s.last = p
      if (p.status === 'pending' || p.status === 'requested') s.pending++
      byEmp.set(p.profile_id, s)
    }
    return employees.map((e) => {
      const s = byEmp.get(e.id) || { ytdGross: 0, ytdNet: 0, count: 0, last: null, pending: 0 }
      return { ...e, ...s }
    })
  }, [payslips, employees, yearStart])

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? rows.filter((r) => (r.full_name || '').toLowerCase().includes(q) || (r.employee_code || '').toLowerCase().includes(q))
      : rows
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE))
  const clampPage = Math.min(page, totalPages)
  const pageRows = visibleRows.slice((clampPage - 1) * PAGE_SIZE, clampPage * PAGE_SIZE)

  const totalPending = rows.reduce((s, r) => s + (r.pending || 0), 0)
  const sentThisPeriod = payslips.filter((p) => p.status === 'sent' && p.period_end >= yearStart).length
  const totalYtd = payslips.filter((p) => p.period_end >= yearStart).length
  const netPayoutYtd = payslips
    .filter((p) => p.period_end >= yearStart)
    .reduce((s, p) => s + Number(p.net || 0), 0)

  const doExportCsv = () => {
    exportCsv(
      `payslips-register-${todayStamp()}.csv`,
      ['Employee', 'Employee ID', 'Position', 'Rate', 'Last Net Pay', 'Last Period End', 'YTD Gross', 'YTD Net', 'Payslip Count'],
      visibleRows.map((r) => [
        r.full_name, r.employee_code, r.position || '',
        r.daily_rate || 0,
        r.last ? Number(r.last.net || 0) : 0,
        r.last ? r.last.period_end : '',
        r.ytdGross, r.ytdNet, r.count,
      ]),
    )
  }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Payslips"
        sub={`${employees.length} employees · ${payslips.length} payslips generated · ${totalPending} pending requests`}
        actions={<>
          <button onClick={doExportCsv} style={btnGhost}>⬇ CSV</button>
          <button onClick={() => setYtdOpen(true)} style={btnPrimary}>📊 View YTD</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="📥" label="PENDING REQUESTS" value={totalPending} sub="awaiting release" accent="#f59e0b" />
        <StatTile icon="✓" label="SENT THIS PERIOD" value={sentThisPeriod} sub={`year ${new Date().getFullYear()}`} accent="#22c55e" />
        <StatTile icon="📄" label="TOTAL YTD" value={totalYtd} sub={`generated in ${new Date().getFullYear()}`} accent="#2563eb" />
        <StatTile icon="💰" label="NET PAYOUT YTD" value={fmtUSD(netPayoutYtd)} sub="across all employees" accent="#a855f7" />
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Employee Payslip Register</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '6px 12px', width: 260 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search employees…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }}
              />
            </div>
          </div>
        </div>
        <table style={table}>
          <thead>
            <tr>{['EMPLOYEE','POSITION','RATE','LAST NET PAY','YTD GROSS','YTD NET','SLIPS','STATUS'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan="8" style={{ ...td, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                {employees.length === 0 ? 'No employees yet.' : 'No employees match this search.'}
              </td></tr>
            )}
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td style={{ ...td, fontWeight: 700 }}>{r.full_name} <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{r.employee_code}</div></td>
                <td style={td}>{r.position || '—'}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{Number(r.daily_rate) > 0 ? fmtUSD(r.daily_rate) : '—'}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.last ? fmtUSD(r.last.net) : '—'}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{fmtUSD(r.ytdGross)}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700 }}>{fmtUSD(r.ytdNet)}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.count}</td>
                <td style={td}>
                  {r.pending
                    ? <span style={{ background: '#FEF3C7', color: '#a16207', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800 }}>● {r.pending} pending</span>
                    : <span style={{ color: '#94a3b8', fontSize: 11 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pager page={clampPage} totalPages={totalPages} setPage={setPage} total={visibleRows.length} />
      </div>

      {ytdOpen && <YtdDialog payslips={payslips} employees={employees} onClose={() => setYtdOpen(false)} />}
    </div>
  )
}

function Pager({ page, totalPages, setPage, total }) {
  // Build a windowed list of page numbers around the current page (max 5).
  const window = 2
  const nums = []
  for (let i = Math.max(1, page - window); i <= Math.min(totalPages, page + window); i++) nums.push(i)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginTop: 12 }}>
      <div style={{ fontSize: 11, color: '#94a3b8' }}>{total} employees · page {page} of {totalPages}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
          style={{ ...btnGhost, padding: '6px 10px', opacity: page <= 1 ? .5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
        {nums.map((n) => (
          <button key={n} onClick={() => setPage(n)}
            style={n === page
              ? { ...btnPrimary, padding: '6px 12px' }
              : { ...btnGhost, padding: '6px 10px' }}
          >{n}</button>
        ))}
        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
          style={{ ...btnGhost, padding: '6px 10px', opacity: page >= totalPages ? .5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
      </div>
    </div>
  )
}

function YtdDialog({ payslips, employees, onClose }) {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  const rows = useMemo(() => {
    const map = new Map()
    for (const p of payslips) {
      if (p.period_end < yearStart) continue
      const s = map.get(p.profile_id) || { ytdGross: 0, ytdNet: 0, count: 0 }
      s.ytdGross += Number(p.gross || 0)
      s.ytdNet += Number(p.net || 0)
      s.count++
      map.set(p.profile_id, s)
    }
    return employees.map((e) => ({ ...e, ...(map.get(e.id) || { ytdGross: 0, ytdNet: 0, count: 0 }) }))
      .sort((a, b) => b.ytdNet - a.ytdNet)
  }, [payslips, employees, yearStart])

  const totalGross = rows.reduce((s, r) => s + r.ytdGross, 0)
  const totalNet = rows.reduce((s, r) => s + r.ytdNet, 0)

  const doExport = () => {
    exportCsv(
      `payslips-ytd-${new Date().getFullYear()}.csv`,
      ['Employee', 'Employee ID', 'Position', 'Payslip Count', 'YTD Gross', 'YTD Net'],
      rows.map((r) => [r.full_name, r.employee_code, r.position || '', r.count, r.ytdGross, r.ytdNet]),
    )
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Year-to-date payslips · {new Date().getFullYear()}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Since {fmtDate(yearStart)} · {payslips.filter((p) => p.period_end >= yearStart).length} payslips across {rows.length} employees</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 14, background: '#eff6ff', borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', letterSpacing: .4 }}>TOTAL YTD GROSS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{fmtUSD(totalGross)}</div>
          </div>
          <div style={{ padding: 14, background: '#f0fdf4', borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', letterSpacing: .4 }}>TOTAL YTD NET</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{fmtUSD(totalNet)}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
            <thead>
              <tr>{['EMPLOYEE', 'SLIPS', 'YTD GROSS', 'YTD NET'].map((h) => (
                <th key={h} style={{ ...th, position: 'sticky', top: 0, background: '#f8fafc' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...td, fontWeight: 700 }}>{r.full_name} <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', marginLeft: 6 }}>{r.employee_code}</span></td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{r.count}</td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{fmtUSD(r.ytdGross)}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(r.ytdNet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={doExport} style={btnGhost}>⬇ Export YTD CSV</button>
          <button onClick={onClose} style={btnPrimary}>Close</button>
        </div>
      </div>
    </div>
  )
}
