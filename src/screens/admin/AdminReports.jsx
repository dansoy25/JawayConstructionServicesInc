import { useState } from 'react'
import { card, btnPrimary, btnGhost, chip, PageHeader } from './adminShared'

const REPORTS = [
  { key: 'attendance', label: 'Attendance summary' },
  { key: 'payroll', label: 'Payroll register' },
  { key: 'expense', label: 'Expense by category' },
  { key: 'leave', label: 'Leave history' },
  { key: 'stat', label: 'Statutory remittance' },
  { key: 'inv', label: 'Inventory valuation' },
  { key: 'sales', label: 'Sales by branch' },
]

const DEPT_ROWS = [
  { d: 'Branch A', h: 14, hrs: 2684, att: '96.1%', bg: '#DCFCE7', color: '#15803d' },
  { d: 'Branch B', h: 11, hrs: 2089, att: '94.8%', bg: '#DCFCE7', color: '#15803d' },
  { d: 'Head Office', h: 9, hrs: 1712, att: '98.2%', bg: '#DCFCE7', color: '#15803d' },
  { d: 'Logistics', h: 6, hrs: 1148, att: '88.4%', bg: '#FEF3C7', color: '#a16207' },
  { d: 'Operations', h: 8, hrs: 1509, att: '91.7%', bg: '#DCFCE7', color: '#15803d' },
]

export default function AdminReports() {
  const [selected, setSelected] = useState('attendance')

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Reports"
        sub="Generate or schedule operational reports"
        actions={<>
          <button style={btnGhost}>⬇ Export CSV</button>
          <button style={btnPrimary}>📄 Export PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Report type</div>
          {REPORTS.map((r) => (
            <label key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', cursor: 'pointer', borderRadius: 8, background: selected === r.key ? '#eff6ff' : 'transparent' }}>
              <input type="checkbox" checked={selected === r.key} onChange={() => setSelected(r.key)} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{r.label}</span>
            </label>
          ))}

          <div style={{ marginTop: 20, fontSize: 11, fontWeight: 700, color: '#64748b' }}>Date range</div>
          <input type="text" value="Jun 1 — Jun 23, 2026" readOnly style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />

          <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#64748b' }}>Department</div>
          <select style={{ width: '100%', marginTop: 6, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}><option>All departments</option></select>

          <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: '#64748b' }}>Employees</div>
          <select style={{ width: '100%', marginTop: 6, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}><option>All employees</option></select>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Schedule this report</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Auto-email on schedule</div>
            </div>
            <div style={{ width: 40, height: 22, background: '#2563eb', borderRadius: 12, position: 'relative' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, right: 2 }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Frequency</div>
              <select style={{ width: '100%', marginTop: 4, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }}><option>Monthly</option></select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Send on</div>
              <select style={{ width: '100%', marginTop: 4, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }}><option>1st of month</option></select>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, color: '#64748b' }}>Email destinations</div>
          <input type="text" defaultValue="admin@jawayconstruction.ca, finance@" style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, padding: 12, background: '#eff6ff', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Attendance summary — preview</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Attendance metrics across all departments · Jun 1 — Jun 23, 2026</div>
            </div>
            <button style={btnGhost}>↻ Refresh</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
            {[{ l: 'TOTAL HOURS', v: '9,142' }, { l: 'AVG ATTENDANCE', v: '94.2%' }, { l: 'LATE INSTANCES', v: '38' }, { l: 'ABSENCES', v: '12' }].map((r) => (
              <div key={r.l}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: .5 }}>{r.l}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{r.v}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 140, background: '#f8fafc', borderRadius: 8, marginBottom: 16 }} />
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['DEPARTMENT','HEADCOUNT','HOURS','ATTENDANCE'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: 10, fontWeight: 800, color: '#64748b' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {DEPT_ROWS.map((r) => (
                <tr key={r.d} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>{r.d}</td>
                  <td style={{ padding: '10px 0' }}>{r.h}</td>
                  <td style={{ padding: '10px 0' }}>{r.hrs.toLocaleString()}</td>
                  <td style={{ padding: '10px 0' }}><span style={chip(r.bg, r.color)}>● {r.att}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
