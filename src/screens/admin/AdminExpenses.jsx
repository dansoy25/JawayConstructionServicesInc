import { card, table, th, td, btnPrimary, btnGhost, chip, PageHeader } from './adminShared'

const EXPENSES = [
  { date: 'Jun 23', cat: 'Fuel', catBg: '#DBEAFE', catColor: '#2563eb', desc: 'Diesel — delivery van LRZ-2241', amt: '$1,240.00', by: 'Carlo V.', status: 'Pending', statusBg: '#FEF3C7', statusColor: '#a16207' },
  { date: 'Jun 22', cat: 'Supplies', catBg: '#EDE9FE', catColor: '#7c3aed', desc: 'Office paper, toner cartridges', amt: '$3,890.00', by: 'Nicole M.', status: 'Approved', statusBg: '#DCFCE7', statusColor: '#15803d' },
  { date: 'Jun 21', cat: 'Utilities', catBg: '#DCFCE7', catColor: '#16a34a', desc: 'Meralco — June bill', amt: '$18,420.00', by: 'Ana R.', status: 'Approved', statusBg: '#DCFCE7', statusColor: '#15803d' },
  { date: 'Jun 20', cat: 'Repairs', catBg: '#FEF3C7', catColor: '#a16207', desc: 'Aircon servicing — Branch B', amt: '$4,500.00', by: 'Ramon L.', status: 'Approved', statusBg: '#DCFCE7', statusColor: '#15803d' },
  { date: 'Jun 19', cat: 'Fuel', catBg: '#DBEAFE', catColor: '#2563eb', desc: 'Gasoline — service vehicle', amt: '$980.00', by: 'Carlo V.', status: 'Denied', statusBg: '#FEE2E2', statusColor: '#b91c1c' },
  { date: 'Jun 18', cat: 'Other', catBg: '#F1F5F9', catColor: '#64748b', desc: 'Coffee & pantry refill', amt: '$1,820.00', by: 'Ana R.', status: 'Approved', statusBg: '#DCFCE7', statusColor: '#15803d' },
]

export default function AdminExpenses() {
  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Expenses"
        sub="June 2026 total: $82,140"
        actions={<>
          <button style={btnPrimary}>+ Add expense</button>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
        </>}
      />

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button style={btnGhost}>All categories</button>
        <button style={btnGhost}>Any status</button>
        <button style={btnGhost}>📅 This month</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>28 expenses</span>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        <table style={table}>
          <thead><tr>{['DATE','CATEGORY','DESCRIPTION','AMOUNT','SUBMITTED BY','STATUS','RECEIPT',''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {EXPENSES.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: 'monospace' }}>{r.date}</td>
                <td style={td}><span style={chip(r.catBg, r.catColor)}>{r.cat}</span></td>
                <td style={{ ...td, fontWeight: 600, color: '#0f172a' }}>{r.desc}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700 }}>{r.amt}</td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 9 }}>{r.by.split(' ').map(x=>x[0]).join('')}</span>
                    <span style={{ fontSize: 11 }}>{r.by}</span>
                  </div>
                </td>
                <td style={td}><span style={chip(r.statusBg, r.statusColor)}>● {r.status}</span></td>
                <td style={td}><button style={{ ...btnGhost, padding: '4px 8px' }}>📄</button></td>
                <td style={td}>⋯</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Monthly breakdown</div>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
              <button style={{ padding: '4px 10px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>June</button>
              <button style={{ padding: '4px 10px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>YTD</button>
            </div>
          </div>
          <div style={{ height: 200, background: '#f8fafc', borderRadius: 8, marginBottom: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
            {['Salaries','Ops','Utilities','Supplies','Fuel','Repairs','Other'].map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Top categories</div>
          {[{ l: 'Utilities', v: '$18,420', c: '#2563eb', p: 100 }, { l: 'Supplies', v: '$12,140', c: '#a855f7', p: 70 }, { l: 'Repairs', v: '$8,200', c: '#f59e0b', p: 45 }, { l: 'Fuel', v: '$4,920', c: '#22c55e', p: 28 }].map((r) => (
            <div key={r.l} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#334155' }}><span style={{ display: 'inline-block', width: 8, height: 8, background: r.c, marginRight: 6 }} />{r.l}</span>
                <span style={{ fontWeight: 700 }}>{r.v}</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ width: `${r.p}%`, height: '100%', background: r.c, borderRadius: 3 }} /></div>
            </div>
          ))}
          <button style={{ ...btnGhost, width: '100%', marginTop: 8, justifyContent: 'center' }}>⬇ Download report PDF</button>
        </div>
      </div>
    </div>
  )
}
