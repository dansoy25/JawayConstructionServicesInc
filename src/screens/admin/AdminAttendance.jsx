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
              {['EMPLOYEE','DATE','TIME IN','TIME OUT','HOURS','STATUS','GPS'].map((h) => <th key={h} style={th}>{h}</th>)}
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
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

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
