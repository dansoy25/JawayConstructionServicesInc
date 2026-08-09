import { card, table, th, td, btnPrimary, btnGhost, chip, PageHeader } from './adminShared'

export default function AdminSales() {
  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Sales"
        sub={`Today · ${new Date().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`}
        actions={<>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            <button style={{ padding: '6px 14px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Today</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Week</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Month</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Custom</button>
          </div>
          <button style={btnPrimary}>+ New sale</button>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <SalesTile label="REVENUE" value="$12,480" sub="Avg $693 / tx" color="#2563eb" />
        <SalesTile label="TRANSACTIONS" value="18" sub="Gross today: $13,140" color="#22c55e" />
        <SalesTile label="AVG. DISCOUNT" value="4.2%" sub="Discounts: $524" color="#f59e0b" />
        <SalesTile label="RETURNS" value="1" sub="$340 refunded" color="#ef4444" foot="Tax collected: $1,412" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Revenue this week</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Mon — Sun</div>
          </div>
          <div style={{ height: 140, background: '#f8fafc', borderRadius: 8, marginBottom: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>By payment method</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="120" height="120" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#e2e8f0" strokeWidth="6"/>
              {[
                { color: '#2563eb', pct: 45, off: 0 },
                { color: '#22c55e', pct: 30, off: 45 },
                { color: '#f59e0b', pct: 15, off: 75 },
                { color: '#a855f7', pct: 10, off: 90 },
              ].map((s) => <circle key={s.color} cx="21" cy="21" r="15.9" fill="transparent" stroke={s.color} strokeWidth="6" strokeDasharray={`${s.pct} ${100 - s.pct}`} strokeDashoffset={-s.off} transform="rotate(-90 21 21)"/>)}
            </svg>
            <div style={{ flex: 1, display: 'grid', gap: 6, fontSize: 12 }}>
              {[{ l: 'Cash', v: '45%', c: '#2563eb' }, { l: 'GCash', v: '30%', c: '#22c55e' }, { l: 'Maya', v: '15%', c: '#f59e0b' }, { l: 'Card', v: '10%', c: '#a855f7' }].map((r) => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: r.c }} />{r.l}</div>
                  <span style={{ fontWeight: 700 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>By branch</div>
          {[{ b: 'HQ Makati', v: '$5,240', c: '#2563eb', p: 100 }, { b: 'Branch A', v: '$4,180', c: '#22c55e', p: 80 }, { b: 'Branch B', v: '$3,060', c: '#f59e0b', p: 60 }].map((r) => (
            <div key={r.b} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#334155' }}><span style={{ display: 'inline-block', width: 8, height: 8, background: r.c, marginRight: 6 }} />{r.b}</span>
                <span style={{ fontWeight: 700 }}>{r.v}</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ width: `${r.p}%`, height: '100%', background: r.c, borderRadius: 3 }} /></div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Tax collected</div>
          {[{ l: 'Gross sales', v: '$13,140' }, { l: 'VAT (12%)', v: '$1,412' }, { l: 'Discounts given', v: '−$524', c: '#ef4444' }].map((r) => (
            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ color: '#334155' }}>{r.l}</span>
              <span style={{ fontWeight: 700, color: r.c || '#0f172a' }}>{r.v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 13, fontWeight: 800 }}>
            <span style={{ color: '#0f172a' }}>Net after tax & discounts</span>
            <span style={{ color: '#2563eb' }}>$10,618.86</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SalesTile({ label, value, sub, foot, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: `2px solid ${color}22`, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 6, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{sub}</div>
      <div style={{ marginTop: 8, height: 20, background: 'linear-gradient(90deg, transparent, ' + color + '22)', borderRadius: 4 }} />
      {foot && <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{foot}</div>}
    </div>
  )
}
