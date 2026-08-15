import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { fmtTime, initials } from '../../lib/util'
import { table, th, td, btnGhost, chip, StatTile, PageHeader } from './adminShared'
import { exportCsv, printPage, todayStamp } from '../../lib/exports'
import MapView from '../../components/MapView'

export default function AdminAttendance() {
  const { profile } = useAuth()
  const [employees, setEmployees] = useState([])
  const [rows, setRows] = useState([])
  const [loadErr, setLoadErr] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [view, setView] = useState('table')          // table | map
  const [statusFilter, setStatusFilter] = useState('all')      // all | present | late | absent | complete
  const [deptFilter, setDeptFilter] = useState('all')          // all | <position>
  const [search, setSearch] = useState('')
  const [sites, setSites] = useState([])

  const load = async () => {
    if (!profile?.org_id) return
    setLoadErr('')
    const today = new Date().toISOString().slice(0, 10)
    const [emp, att] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, avatar_url, position, employee_code, schedule, is_admin')
        .eq('org_id', profile.org_id)
        .eq('is_admin', false),
      supabase.from('attendance')
        .select('*, ot_hours, ot_approved, ot_approved_at, profile:profiles(full_name, avatar_url, position, employee_code, schedule, schedule_days, day_off), site:sites(name, lat, lng)')
        .eq('org_id', profile.org_id)
        .gte('work_date', addDays(today, -14))
        .order('work_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200),
    ])
    if (emp.error) setLoadErr(emp.error.message)
    if (att.error) setLoadErr(att.error.message)
    setEmployees(emp.data || [])
    // Compute OT for any row that has clock-in/out but no OT logged yet.
    // OT = hours over 8 per shift. Persist to DB so wizard sees it.
    const raw = att.data || []
    const needsOtWrite = []
    for (const r of raw) {
      const computed = r.hours ? Math.max(0, Number(r.hours) - 8) : 0
      if (computed > 0 && !r.ot_hours) {
        r.ot_hours = computed
        needsOtWrite.push({ id: r.id, ot_hours: computed })
      }
    }
    if (needsOtWrite.length) {
      for (const u of needsOtWrite) {
        await supabase.from('attendance').update({ ot_hours: u.ot_hours }).eq('id', u.id)
      }
    }
    setRows(raw)

    // Load sites once for the map view
    const { data: siteRows } = await supabase.from('sites')
      .select('id, name, lat, lng, radius_m').eq('org_id', profile.org_id)
    setSites(siteRows || [])
  }
  useEffect(() => { load() }, [profile?.org_id])

  // Filter helpers
  const rowStatus = (r) => {
    if (!r.clock_in) return 'absent'
    if (r.clock_out) return 'complete'
    const emp = employees.find((e) => e.id === r.profile_id)
    const s = parseScheduleStart(emp?.schedule) || { h: 8, m: 0 }
    const t = new Date(r.clock_in)
    return (t.getHours() * 60 + t.getMinutes()) > (s.h * 60 + s.m) ? 'late' : 'present'
  }

  const departments = useMemo(() => {
    const set = new Set()
    for (const e of employees) if (e.position) set.add(e.position)
    return [...set].sort()
  }, [employees])

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== 'all' && rowStatus(r) !== statusFilter) return false
      if (deptFilter !== 'all' && r.profile?.position !== deptFilter) return false
      if (q && !(
        (r.profile?.full_name || '').toLowerCase().includes(q) ||
        (r.profile?.employee_code || '').toLowerCase().includes(q)
      )) return false
      return true
    })
  }, [rows, statusFilter, deptFilter, search, employees])

  // Employees expected today but with no clock-in row.
  const today = new Date().toISOString().slice(0, 10)
  const todayDow = new Date().getDay()
  const absentToday = useMemo(() => {
    const clockedInIds = new Set(rows.filter((r) => r.work_date === today && r.clock_in).map((r) => r.profile_id))
    return employees.filter((e) => {
      const workDays = (e.schedule_days || '1,2,3,4,5').split(',').map(Number)
      return workDays.includes(todayDow) && !clockedInIds.has(e.id)
    })
  }, [rows, employees, today, todayDow])

  const approveOt = async (row) => {
    await supabase.from('attendance').update({
      ot_approved: true,
      ot_approved_at: new Date().toISOString(),
      ot_approved_by: profile?.id,
    }).eq('id', row.id)
    load()
  }
  const revokeOt = async (row) => {
    await supabase.from('attendance').update({
      ot_approved: false, ot_approved_at: null, ot_approved_by: null,
    }).eq('id', row.id)
    load()
  }

  const doExportCsv = () => {
    const headers = ['Employee', 'Employee ID', 'Position', 'Site', 'Date', 'Time In', 'Time Out', 'Hours', 'Status']
    const rows = visibleRows.map((r) => [
      r.profile?.full_name || '', r.profile?.employee_code || '',
      r.profile?.position || '', r.site?.name || '',
      r.work_date, r.clock_in || '', r.clock_out || '',
      r.hours || '', rowStatus(r),
    ])
    exportCsv(`attendance-${todayStamp()}.csv`, headers, rows)
  }

  // Today-only stats: who has actually clocked in today, and who is still absent
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayRows = rows.filter((r) => r.work_date === today)
    const clockedInIds = new Set(todayRows.filter((r) => r.clock_in).map((r) => r.profile_id))
    const present = clockedInIds.size
    const total = employees.length

    // Late = clock-in after that person's scheduled start (default 08:00 if unset)
    let lateCount = 0
    let lateMinutesTotal = 0
    for (const r of todayRows) {
      if (!r.clock_in) continue
      const emp = employees.find((e) => e.id === r.profile_id)
      const scheduleStart = parseScheduleStart(emp?.schedule) || { h: 8, m: 0 }
      const ci = new Date(r.clock_in)
      const scheduledMins = scheduleStart.h * 60 + scheduleStart.m
      const actualMins = ci.getHours() * 60 + ci.getMinutes()
      if (actualMins > scheduledMins) {
        lateCount++
        lateMinutesTotal += (actualMins - scheduledMins)
      }
    }

    const absent = Math.max(0, total - present)

    // Avg hours today (only closed shifts count toward the average)
    const closed = todayRows.filter((r) => r.hours)
    const avgHours = closed.length ? (closed.reduce((s, r) => s + Number(r.hours), 0) / closed.length) : 0

    return { total, present, lateCount, lateAvg: lateCount ? Math.round(lateMinutesTotal / lateCount) : 0, absent, avgHours }
  }, [rows, employees])

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Attendance"
        sub={`${stats.total} employees · ${stats.present} clocked in today`}
        actions={<>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            {['table', 'map'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{ padding: '6px 14px', border: 'none', background: view === v ? '#2563eb' : 'transparent', color: view === v ? '#fff' : '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >{v === 'table' ? '⊞ Table' : '▦ Map'}</button>
            ))}
          </div>
          <button onClick={load} style={btnGhost}>↻ Refresh</button>
          <button onClick={doExportCsv} style={btnGhost}>⬇ CSV</button>
          <button onClick={printPage} style={btnGhost}>📄 PDF</button>
        </>}
      />

      {loadErr && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>
          Couldn't load attendance: {loadErr}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <ClickableStat active={statusFilter === 'present'} onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
          label="PRESENT" value={stats.present} sub={`of ${stats.total} · click to filter`} accent="#22c55e" />
        <ClickableStat active={statusFilter === 'late'} onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
          label="LATE" value={stats.lateCount} sub={stats.lateCount ? `avg ${stats.lateAvg} min · click to filter` : 'nobody late'} accent="#f59e0b" />
        <ClickableStat active={statusFilter === 'absent'} onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
          label="ABSENT" value={stats.absent} sub={stats.absent ? 'click to filter' : 'All accounted for'} accent="#ef4444" />
        <ClickableStat label="AVG HOURS" value={stats.avgHours ? `${stats.avgHours.toFixed(1)}h` : '—'} sub="target: 8h" accent="#2563eb" />
      </div>

      {absentToday.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #FCA5A5', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Absent today</div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{absentToday.length} employees</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {absentToday.map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#FEE2E2', borderRadius: 999 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 9 }}>
                  {initials(e.full_name || '?')}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>{e.full_name}</span>
                <span style={{ fontSize: 10, color: '#b91c1c', opacity: .7 }}>· {e.employee_code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="complete">Complete</option>
          </select>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={selectStyle}>
            <option value="all">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{visibleRows.length} of {rows.length}</span>
        </div>
        {view === 'map' ? (
          <SiteMapView sites={sites} rows={visibleRows} />
        ) : (
        <table style={table}>
          <thead>
            <tr>
              {['EMPLOYEE','DATE','TIME IN','TIME OUT','HOURS','OT','STATUS','GPS',''].map((h, i) => <th key={i} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && <tr><td colSpan="9" style={{ ...td, textAlign: 'center', padding: 30, color: '#94a3b8' }}>No records match the current filters.</td></tr>}
            {visibleRows.map((r) => {
              const schedStart = parseScheduleStart(r.profile?.schedule) || { h: 8, m: 0 }
              const isLate = r.clock_in && (() => {
                const t = new Date(r.clock_in)
                return (t.getHours() * 60 + t.getMinutes()) > (schedStart.h * 60 + schedStart.m)
              })()
              const status = !r.clock_in
                ? { bg: '#FEE2E2', color: '#b91c1c', label: 'Absent' }
                : r.clock_out
                  ? { bg: '#DCFCE7', color: '#15803d', label: 'Complete' }
                  : isLate
                    ? { bg: '#FEF3C7', color: '#a16207', label: 'Late' }
                    : { bg: '#DCFCE7', color: '#15803d', label: 'On duty' }
              return (
                <tr key={r.id}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10 }}>
                        {initials(r.profile?.full_name || '?')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.profile?.full_name}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.profile?.position || 'Employee'} · {r.site?.name || 'Field'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{new Date(r.work_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{r.clock_in ? fmtTime(r.clock_in) : '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{r.clock_out ? fmtTime(r.clock_out) : '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{r.hours ? `${Number(r.hours).toFixed(1)}h` : '—'}</td>
                  <td style={td}>
                    {Number(r.ot_hours || 0) > 0 ? (
                      r.ot_approved ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={chip('#DCFCE7', '#15803d')}>✓ {Number(r.ot_hours).toFixed(1)}h</span>
                          <button onClick={() => revokeOt(r)} title="Revoke OT approval" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}>↺</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => approveOt(r)}
                          title="Approve OT for payroll"
                          style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #f59e0b', background: '#FEF3C7', color: '#a16207', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                        >✓ Approve {Number(r.ot_hours).toFixed(1)}h</button>
                      )
                    ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={td}><span style={chip(status.bg, status.color)}>● {status.label}</span></td>
                  <td style={td}><span style={{ color: '#2563eb', fontWeight: 600, fontSize: 11 }}>📍 {r.site?.name || 'Field'}</span></td>
                  <td style={td}>
                    <button
                      title="Edit attendance"
                      onClick={() => setEditing(r)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginRight: 6, fontSize: 15 }}
                    >✎</button>
                    <button
                      title="Delete attendance"
                      onClick={() => setDeleting(r)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 15 }}
                    >🗑</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        )}
      </div>

      {editing && <EditAttendanceModal row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {deleting && <DeleteAttendanceDialog row={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); load() }} />}
    </div>
  )
}

// ─── Edit + Delete for a single attendance row ───────────────────────────

function EditAttendanceModal({ row, onClose, onSaved }) {
  const [workDate, setWorkDate] = useState(row.work_date || '')
  const [clockIn, setClockIn] = useState(row.clock_in ? row.clock_in.slice(0, 16) : '')
  const [clockOut, setClockOut] = useState(row.clock_out ? row.clock_out.slice(0, 16) : '')
  const [notes, setNotes] = useState(row.notes || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const ci = clockIn ? new Date(clockIn).toISOString() : null
      const co = clockOut ? new Date(clockOut).toISOString() : null
      const hours = ci && co ? Math.max(0, (new Date(co) - new Date(ci)) / 3600000) : null
      const { error } = await supabase.from('attendance').update({
        work_date: workDate || null,
        clock_in: ci,
        clock_out: co,
        hours: hours != null ? Number(hours.toFixed(2)) : null,
        notes: notes || null,
      }).eq('id', row.id)
      if (error) throw error
      onSaved()
    } catch (e) { setErr(e.message || 'Update failed.') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Edit attendance</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          <b>{row.profile?.full_name || 'Employee'}</b> — {row.site?.name || 'Field'}
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>WORK DATE</span>
            <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} required style={inputStyle} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>CLOCK IN</span>
              <input type="datetime-local" value={clockIn} onChange={(e) => setClockIn(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>CLOCK OUT</span>
              <input type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} style={inputStyle} />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>ADMIN NOTES</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. Adjusted by admin after missed clock-out" style={{ ...inputStyle, resize: 'vertical' }} />
          </label>

          {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
            <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? .6 : 1 }}>{busy ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteAttendanceDialog({ row, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    setBusy(true); setErr('')
    try {
      const { error } = await supabase.from('attendance').delete().eq('id', row.id)
      if (error) throw error
      onDeleted()
    } catch (e) { setErr(e.message || 'Delete failed.') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚠</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Delete attendance</div>
        </div>
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 12 }}>
          Remove <b>{row.profile?.full_name || 'this'}</b>'s attendance for <b>{new Date(row.work_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</b>?
          This is permanent and cannot be undone.
        </div>
        {err && <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button
            onClick={submit}
            disabled={busy}
            style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .6 : 1 }}
          >{busy ? 'Deleting…' : 'Permanently delete'}</button>
        </div>
      </div>
    </div>
  )
}

function ClickableStat({ label, value, sub, accent, active, onClick }) {
  const clickable = typeof onClick === 'function'
  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      style={{
        display: 'block', textAlign: 'left', width: '100%',
        padding: 16, borderRadius: 14,
        background: '#fff',
        border: active ? `2px solid ${accent}` : '1px solid #e2e8f0',
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: active ? `0 6px 18px ${accent}33` : '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: .5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>
    </button>
  )
}

const inputStyle = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600 }
const selectStyle = { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer', outline: 'none' }
const ghostBtn = { padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
const primaryBtn = { padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }

// Parse "HH:MM-HH:MM" schedule string into a start time
function parseScheduleStart(s) {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) }
}

// Map view: grid of site cards with clock-in counts + optional Leaflet
function SiteMapView({ sites, rows }) {
  const [focus, setFocus] = useState(null)
  const today = new Date().toISOString().slice(0, 10)
  const counts = new Map()
  for (const r of rows) {
    if (r.work_date !== today || !r.clock_in) continue
    const sid = r.site_id || r.site?.name
    if (!sid) continue
    counts.set(sid, (counts.get(sid) || 0) + 1)
  }
  const focusSite = focus || sites.find((s) => s.lat && s.lng) || null

  if (sites.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
        No sites configured yet. Add sites in <b>GPS</b> to see them on the map.
      </div>
    )
  }

  return (
    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
        {sites.map((s) => {
          const active = focusSite && focusSite.id === s.id
          const n = counts.get(s.id) || 0
          return (
            <button
              key={s.id}
              onClick={() => setFocus(s)}
              style={{
                textAlign: 'left', padding: 12, borderRadius: 12,
                border: active ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: active ? '#eff6ff' : '#fff', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{s.name}</div>
                <span style={{ background: n ? '#DCFCE7' : '#f1f5f9', color: n ? '#15803d' : '#94a3b8', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>{n} in</span>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                {s.lat && s.lng ? `${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)}` : 'No coordinates'}
              </div>
            </button>
          )
        })}
      </div>
      <div>
        {focusSite && focusSite.lat && focusSite.lng ? (
          <MapView
            center={{ lat: Number(focusSite.lat), lng: Number(focusSite.lng) }}
            radiusM={focusSite.radius_m || 100}
            siteName={focusSite.name}
            height={520}
          />
        ) : (
          <div style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 16, color: '#94a3b8', fontSize: 12 }}>
            Select a site with coordinates to preview it on the map.
          </div>
        )}
      </div>
    </div>
  )
}

function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
