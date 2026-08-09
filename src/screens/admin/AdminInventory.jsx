import { card, table, th, td, btnPrimary, btnGhost, chip, PageHeader } from './adminShared'

const ITEMS = [
  { item: 'San Mig Light — 330ml', sku: 'SM-LT-330', cat: 'Beverages', stock: 248, reorder: 50, price: 38.0, status: 'In Stock', bg: '#DCFCE7', color: '#15803d' },
  { item: 'Marlboro Red — pack', sku: 'MR-RD-20', cat: 'Tobacco', stock: 12, reorder: 20, price: 165.0, status: 'Low Stock', bg: '#FEF3C7', color: '#a16207' },
  { item: 'Coca-Cola — 1.5L', sku: 'CC-15L', cat: 'Beverages', stock: 86, reorder: 40, price: 78.0, status: 'In Stock', bg: '#DCFCE7', color: '#15803d' },
  { item: 'Lucky Me Pancit Canton', sku: 'LM-PC-80', cat: 'Food', stock: 0, reorder: 30, price: 14.0, status: 'Out of Stock', bg: '#FEE2E2', color: '#b91c1c' },
  { item: 'Bear Brand Powder — 300g', sku: 'BB-300', cat: 'Food', stock: 142, reorder: 60, price: 142.5, status: 'In Stock', bg: '#DCFCE7', color: '#15803d' },
  { item: 'Surf Powder — 1kg', sku: 'SF-1KG', cat: 'Household', stock: 8, reorder: 25, price: 168.0, status: 'Low Stock', bg: '#FEF3C7', color: '#a16207' },
  { item: 'Datu Puti Soy Sauce — 1L', sku: 'DP-SY-1L', cat: 'Condiments', stock: 62, reorder: 20, price: 84.0, status: 'In Stock', bg: '#DCFCE7', color: '#15803d' },
]

export default function AdminInventory() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ background: 'linear-gradient(135deg,#065f46,#047857)', borderRadius: 16, padding: 20, color: '#fff', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, opacity: .85 }}>📦 INVENTORY VALUATION · YTD</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 8, letterSpacing: -1 }}>$1,842,300</div>
          <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>1,284 items across 3 branches</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-block', textAlign: 'left', marginRight: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, opacity: .85 }}>MOVEMENTS YTD</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>4,286</div>
          </div>
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, opacity: .85 }}>TURNOVER</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>2.4×</div>
          </div>
        </div>
      </div>

      <PageHeader
        title="Inventory"
        sub="1,284 items · 7 below reorder level"
        actions={<><button style={btnPrimary}>+ Add item</button><button style={btnGhost}>📄 PDF</button><button style={btnGhost}>⬇ CSV</button></>}
      />

      <div style={{ background: '#FEF9C3', border: '1px solid #FBBF24', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#78350f' }}>⚠ 7 items are at or below their reorder level</div>
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>Reorder soon to avoid stockouts. Click any low-stock row below to view details.</div>
        </div>
        <button style={{ ...btnGhost, borderColor: '#FBBF24', color: '#78350f' }}>View low stock</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search by name or SKU…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }} />
        </div>
        <button style={btnGhost}>All categories ▾</button>
        <button style={btnGhost}>All status ▾</button>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>1,284 items</span>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <table style={table}>
          <thead><tr>{['ITEM','SKU','CATEGORY','IN STOCK','REORDER LEVEL','UNIT PRICE','STATUS',''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {ITEMS.map((r, i) => (
              <tr key={i}>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📦</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.item}</span>
                  </div>
                </td>
                <td style={{ ...td, fontFamily: 'monospace', color: '#64748b' }}>{r.sku}</td>
                <td style={td}>{r.cat}</td>
                <td style={{ ...td, fontWeight: 800, color: '#0f172a' }}>{r.stock}</td>
                <td style={{ ...td, color: '#64748b' }}>{r.reorder}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>${r.price.toFixed(2)}</td>
                <td style={td}><span style={chip(r.bg, r.color)}>● {r.status}</span></td>
                <td style={td}>⋯</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Stock movements</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Recent changes to inventory</div>
          </div>
          <button style={btnGhost}>⬇ Export CSV</button>
        </div>
      </div>
    </div>
  )
}
