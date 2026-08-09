import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { manilaToday, fmtTime, initials } from '../../lib/util'
import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'

export default function AdminAttendance() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!profile?.org_id) return
    supabase.from('attendance').select('*, profile:profiles(full_name, avatar_url, role), site:sites(name)').eq('org_id', profile.org_id).order('created_at', { ascending: false }).limit(40).then(({ data }) => setRows(data || []))
  }, [profile?.org_id])

  const present = rows.filter((r) => r.clock_in).length
  const late = rows.filter((r) => r.clock_in && new Date(r.clock_in).getHours() >= 8 && new Date(r.clock_in).getMinutes() > 10).length
  const absent = Math.max(0, 8 - present)

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Attendance"
        sub={`${rows.length} employees · ${present} clocked in today`}
        actions={<>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            <button style={{ padding: '6px 14px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⊞ Table</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>▦ Map</button>
          </div>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile label="PRESENT" value={present} sub={`of ${rows.length} employees`} accent="#22c55e" />
        <StatTile label="LATE" value={late} sub={`avg ${late * 4} min late`} accent="#f59e0b" />
        <StatTile label="ABSENT" value={absent} sub="Needs follow-up" subColor="#b91c1c" accent="#ef4444" />
        <StatTile label="AVG HOURS" value="8.7h" sub="target: 8h" accent="#2563eb" />
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
            {rows.length === 0 && <tr><td colSpan="7" style={{ ...td, textAlign: 'center', padding: 30, color: '#94a3b8' }}>No records</td></tr>}
            {rows.map((r) => {
              const isLate = r.clock_in && new Date(r.clock_in).getHours() >= 8 && new Date(r.clock_in).getMinutes() > 10
              const status = !r.clock_in ? { bg: '#FEE2E2', color: '#b91c1c', label: 'Absent' } : r.clock_out ? { bg: '#DCFCE7', color: '#15803d', label: 'Verified' } : isLate ? { bg: '#FEF3C7', color: '#a16207', label: 'Late' } : { bg: '#DCFCE7', color: '#15803d', label: 'Active' }
              return (
                <tr key={r.id}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10 }}>
                        {initials(r.profile?.full_name || '?')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.profile?.full_name}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.profile?.role || 'Employee'} · {r.site?.name || 'Site'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{new Date(r.work_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td>
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
