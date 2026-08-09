import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'

export default function AdminPayslips() {
  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Payslips"
        sub="22 employees · 132 payslips generated · 3 pending requests"
        actions={<>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            <button style={{ padding: '6px 14px', border: 'none', background: '#fff', color: '#0f172a', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>All ()</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Pending ()</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sent ()</button>
          </div>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnPrimary}>📊 View YTD</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="📥" label="PENDING REQUESTS" value="" sub="awaiting release" accent="#f59e0b" />
        <StatTile icon="✓" label="SENT THIS PERIOD" value="46" sub="Jun 1 – 15, 2026" accent="#22c55e" />
        <StatTile icon="📄" label="TOTAL YTD" value="132" sub="generated in 2026" accent="#2563eb" />
        <StatTile icon="💰" label="NET PAYOUT YTD" value="$4.49M" sub="across all employees" accent="#a855f7" />
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Employee Payslip Register</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '6px 12px', width: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search employees…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }} />
            </div>
            <button style={btnGhost}>▼ Filter</button>
          </div>
        </div>
        <table style={table}>
          <thead>
            <tr>{['EMPLOYEE','POSITION','RATE','LAST NET PAY','YTD GROSS','YTD NET','REQUEST STATUS','ACTIONS'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            <tr><td colSpan="8" style={{ ...td, padding: 40, textAlign: 'center', color: '#94a3b8' }}>Showing of employees</td></tr>
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 12 }}>
          <button style={{ ...btnGhost, padding: '6px 10px' }}>Prev</button>
          <button style={{ ...btnPrimary, padding: '6px 12px' }}>1</button>
          <button style={{ ...btnGhost, padding: '6px 10px' }}>2</button>
          <button style={{ ...btnGhost, padding: '6px 10px' }}>3</button>
          <button style={{ ...btnGhost, padding: '6px 10px' }}>Next</button>
        </div>
      </div>
    </div>
  )
}
