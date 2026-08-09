import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'

const RUNS = [
  { period: 'Jun 16 — 30, 2026', pay: 'Jul 5, 2026', emp: 46, gross: 892400, net: 782140, ytd: 4489850, status: 'draft' },
  { period: 'Jun 1 — 15, 2026', pay: 'Jun 20, 2026', emp: 46, gross: 889200, net: 780310, ytd: 3707710, status: 'completed' },
  { period: 'May 16 — 31, 2026', pay: 'Jun 5, 2026', emp: 45, gross: 872100, net: 765840, ytd: 2927400, status: 'completed' },
  { period: 'May 1 — 15, 2026', pay: 'May 20, 2026', emp: 45, gross: 868500, net: 762290, ytd: 2161560, status: 'completed' },
  { period: 'Apr 16 — 30, 2026', pay: 'May 5, 2026', emp: 44, gross: 849600, net: 745120, ytd: 1399270, status: 'completed' },
]

export default function AdminPayroll() {
  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Payroll"
        sub="Semi-monthly · next cutoff Jun 30, 2026"
        actions={<>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            <button style={{ padding: '6px 14px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Current</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Period</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Month</button>
          </div>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
          <button style={btnPrimary}>📊 View YTD</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="💰" label="NET PAY" value="$782,140" sub="Jun 16–30 period" accent="#22c55e" />
        <StatTile icon="💵" label="GROSS PAY" value="$892,400" sub="basic + OT + allow" accent="#2563eb" />
        <StatTile icon="⊝" label="DEDUCTIONS" value="$110,260" sub="SSS + PH + HDMF + tax" accent="#ef4444" />
        <StatTile icon="👥" label="EMPLOYEES" value="46" sub="on this payroll" accent="#a855f7" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button style={btnPrimary}>▶ Run payroll</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Payroll runs</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnGhost}>2026</button>
            <button style={btnGhost}>All status</button>
          </div>
        </div>
        <table style={table}>
          <thead>
            <tr>{['PERIOD','PAY DATE','EMPLOYEES','GROSS','NET','YTD NET','STATUS',''].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {RUNS.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, fontWeight: 600 }}>{r.period}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.pay}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.emp}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>${r.gross.toLocaleString()}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700 }}>${r.net.toLocaleString()}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>${r.ytd.toLocaleString()}</td>
                <td style={td}>{r.status === 'draft' ? <span style={chip('#F1F5F9', '#334155')}>● Draft</span> : <span style={chip('#DCFCE7', '#15803d')}>● Completed</span>}</td>
                <td style={td}>
                  {r.status === 'draft' ? <button style={{ ...btnPrimary, padding: '4px 10px', fontSize: 10 }}>Process</button> : <button style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>View</button>}
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 6 }}>⬇</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Statutory configuration</div>
            <button style={btnGhost}>↗ Open in Settings</button>
          </div>
          {[
            { label: 'Federal Income Tax', value: '4.5%' },
            { label: 'Employment Insurance', value: '1.66%' },
            { label: 'Canada Pension Plan', value: '5.95%' },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ color: '#334155' }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Pay schedule</div>
          {[
            { label: 'Frequency', value: 'Semi-monthly' },
            { label: 'Cut-off dates', value: '15th & end of month' },
            { label: 'Pay-out dates', value: '5th & 20th' },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ color: '#334155' }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
