import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/util'
import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'

export default function AdminEmployees() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!profile?.org_id) return
    supabase.from('profiles').select('id, full_name, avatar_url, role, employee_code, is_admin').eq('org_id', profile.org_id).order('full_name').then(({ data }) => setRows(data || []))
  }, [profile?.org_id])

  const active = rows.filter((r) => !r.is_admin).length
  const departments = new Set(rows.map((r) => r.role)).size

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Employees"
        sub={`${active} active · 3 on leave · 2 pending invite`}
        actions={<>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            <button style={{ padding: '6px 14px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Today</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Week</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Month</button>
          </div>
          <button style={btnPrimary}>+ Add employee</button>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="👤" label="ACTIVE" value={active} sub="clocked in today" accent="#22c55e" />
        <StatTile icon="🏖" label="ON LEAVE" value="3" sub="returning Thu" accent="#f59e0b" />
        <StatTile icon="✉" label="PENDING" value="2" sub="Action needed" subColor="#b91c1c" accent="#2563eb" />
        <StatTile icon="🏢" label="DEPARTMENTS" value={departments || 6} sub="3 branches" accent="#a855f7" />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search by name, ID, or email…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }} />
          </div>
          <button style={btnGhost}>All departments</button>
          <button style={btnGhost}>All status</button>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{rows.length} employees</span>
        </div>
        <table style={table}>
          <thead>
            <tr>
              {['','EMPLOYEE','POSITION','DEPARTMENT','STATUS','CONTACT',''].map((h, i) => <th key={i} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}><input type="checkbox" /></td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10 }}>
                      {initials(r.full_name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.full_name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{r.employee_code}</div>
                    </div>
                  </div>
                </td>
                <td style={td}>{r.role || 'Employee'}</td>
                <td style={td}>{r.is_admin ? 'Admin' : 'Operations'}</td>
                <td style={td}><span style={chip('#DCFCE7', '#15803d')}>● Active</span></td>
                <td style={{ ...td, color: '#2563eb', fontSize: 11 }}>{r.employee_code?.toLowerCase()}@jawayconstruction.ca</td>
                <td style={td}>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginRight: 8 }}>👁</button>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
