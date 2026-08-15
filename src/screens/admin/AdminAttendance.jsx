import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { fmtTime, initials } from '../../lib/util'
import { table, th, td, btnGhost, chip, StatTile, PageHeader } from './adminShared'

export default function AdminAttendance() {
  const { profile } = useAuth()
  const [employees, setEmployees] = useState([])
  const [rows, setRows] = useState([])
  const [loadErr, setLoadErr] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

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
        .select('*, profile:profiles(full_name, avatar_url, position, employee_code, schedule), site:sites(name)')
        .eq('org_id', profile.org_id)
        .gte('work_date', addDays(today, -14))
        .order('work_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200),
    ])
    if (emp.error) setLoadErr(emp.error.message)
    if (att.error) setLoadErr(att.error.message)
    setEmployees(emp.data || [])
    setRows(att.data || [])
  }
  useEffect(() => { load() }, [profile?.org_id])

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
            <button style={{ padding: '6px 14px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⊞ Table</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>▦ Map</button>
          </div>
          <button onClick={load} style={btnGhost}>↻ Refresh</button>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
        </>}
      />

      {loadErr && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>
          Couldn't load attendance: {loadErr}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile label="PRESENT" value={stats.present} sub={`of ${stats.total} employees`} accent="#22c55e" />
        <StatTile label="LATE" value={stats.lateCount} sub={stats.lateCount ? `avg ${stats.lateAvg} min late` : 'nobody late'} accent="#f59e0b" />
        <StatTile label="ABSENT" value={stats.absent} sub={stats.absent ? 'Needs follow-up' : 'All accounted for'} subColor={stats.absent ? '#b91c1c' : '#15803d'} accent="#ef4444" />
        <StatTile label="AVG HOURS" value={stats.avgHours ? `${stats.avgHours.toFixed(1)}h` : '—'} sub="target: 8h" accent="#2563eb" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search employees…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }} />
          </div>
          <button style={btnGhost}>All status</button>
          <button style={btnGhost}>All departments</button>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{rows.length} records</span>
        </div>
        <table style={table}>
          <thead>
            <tr>
              {['EMPLOYEE','DATE','TIME IN','TIME OUT','HOURS','STATUS','GPS',''].map((h, i) => <th key={i} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="7" style={{ ...td, textAlign: 'center', padding: 30, color: '#94a3b8' }}>No clock-in records yet. Employees will appear here once they clock in.</td></tr>}
            {rows.map((r) => {
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

const inputStyle = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600 }
const ghostBtn = { padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
const primaryBtn = { padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }

// Parse "HH:MM-HH:MM" schedule string into a start time
function parseScheduleStart(s) {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) }
}

function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
