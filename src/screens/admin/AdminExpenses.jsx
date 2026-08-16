import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'
import { exportCsv, printPage, todayStamp } from '../../lib/exports'

const CATEGORIES = [
  { key: 'fuel', label: 'Fuel', color: '#f97316' },
  { key: 'materials', label: 'Materials', color: '#2563eb' },
  { key: 'tools', label: 'Tools & Equipment', color: '#a855f7' },
  { key: 'meals', label: 'Meals', color: '#22c55e' },
  { key: 'lodging', label: 'Lodging', color: '#0891b2' },
  { key: 'travel', label: 'Travel', color: '#eab308' },
  { key: 'office', label: 'Office / Admin', color: '#64748b' },
  { key: 'other', label: 'Other', color: '#94a3b8' },
]

function fmtUSD(n) { return `$${(Number(n) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function catCfg(k) { return CATEGORIES.find((c) => c.key === k) || CATEGORIES[CATEGORIES.length - 1] }

export default function AdminExpenses() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const load = () => {
    if (!profile?.org_id) return
    supabase.from('expenses')
      .select('*').eq('org_id', profile.org_id)
      .order('spent_on', { ascending: false })
      .limit(500)
      .then(({ data }) => setRows(data || []))
  }
  useEffect(load, [profile?.org_id])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (dateFrom && r.spent_on < dateFrom) return false
      if (dateTo && r.spent_on > dateTo) return false
      if (q && !(
        (r.description || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        String(r.amount || '').includes(q)
      )) return false
      return true
    })
  }, [rows, search, dateFrom, dateTo, categoryFilter])

  const totals = useMemo(() => {
    const t = { all: 0, byCat: {}, monthly: 0 }
    const monthStart = new Date().toISOString().slice(0, 7) + '-01'
    for (const r of rows) {
      const amt = Number(r.amount || 0)
      t.all += amt
      t.byCat[r.category] = (t.byCat[r.category] || 0) + amt
      if (r.spent_on >= monthStart) t.monthly += amt
    }
    return t
  }, [rows])

  const deleteRow = async (r) => {
    if (!confirm('Delete this receipt?')) return
    await supabase.from('expenses').delete().eq('id', r.id)
    load()
  }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Receipts / Expenses"
        sub={`${rows.length} receipts · ${fmtUSD(totals.all)} total`}
        actions={<>
          <button onClick={() => setAddOpen(true)} style={btnPrimary}>+ Add receipt</button>
          <button onClick={load} style={btnGhost}>↻ Refresh</button>
          <button onClick={() => exportCsv(
            `expenses-${todayStamp()}.csv`,
            ['Date', 'Category', 'Amount', 'Description', 'Receipt URL'],
            filteredRows.map((r) => [r.spent_on, r.category, r.amount, r.description || '', r.receipt_url || ''])
          )} style={btnGhost}>⬇ CSV</button>
          <button onClick={printPage} style={btnGhost}>📄 PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="💵" label="TOTAL" value={fmtUSD(totals.all)} sub={`${rows.length} receipts`} accent="#2563eb" />
        <StatTile icon="📅" label="THIS MONTH" value={fmtUSD(totals.monthly)} sub={new Date().toLocaleDateString('en-CA', { timeZone: 'America/Regina', month: 'long' })} accent="#22c55e" />
        <StatTile icon="🏷" label="CATEGORIES" value={Object.keys(totals.byCat).length} sub="in use" accent="#a855f7" />
        <StatTile icon="🖼" label="WITH PHOTO" value={rows.filter((r) => r.receipt_url).length} sub={`of ${rows.length}`} accent="#f59e0b" />
      </div>

      {/* Category breakdown bars */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Spending by category</div>
        {CATEGORIES.filter((c) => totals.byCat[c.key]).length === 0 && <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: 12 }}>No receipts yet.</div>}
        {CATEGORIES.filter((c) => totals.byCat[c.key]).map((c) => {
          const amt = totals.byCat[c.key]
          const pct = totals.all > 0 ? (amt / totals.all) * 100 : 0
          return (
            <div key={c.key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.label}</span>
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtUSD(amt)} <span style={{ color: '#94a3b8' }}>· {pct.toFixed(0)}%</span></span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: 3 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Search + date-range + category filter bar */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, category, amount…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>✕</button>}
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" title="From date"
          style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#334155', background: '#fff', fontWeight: 600 }} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" title="To date"
          style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#334155', background: '#fff', fontWeight: 600 }} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#334155', background: '#fff', fontWeight: 700 }}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setCategoryFilter('all') }}
          style={{ ...btnGhost, padding: '8px 12px', fontSize: 11 }}>Clear</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>All receipts</div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{filteredRows.length} of {rows.length}</div>
        </div>
        <table style={table}>
          <thead>
            <tr>{['DATE', 'CATEGORY', 'AMOUNT', 'DESCRIPTION', 'PHOTO', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && <tr><td colSpan="6" style={{ ...td, textAlign: 'center', padding: 30, color: '#94a3b8' }}>{rows.length === 0 ? 'No receipts yet. Click "+ Add receipt".' : 'No receipts match your filters.'}</td></tr>}
            {filteredRows.map((r) => {
              const c = catCfg(r.category)
              return (
                <tr key={r.id}>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{r.spent_on}</td>
                  <td style={td}><span style={chip('#f1f5f9', c.color)}>● {c.label}</span></td>
                  <td style={{ ...td, fontFamily: 'monospace', fontWeight: 800 }}>{fmtUSD(r.amount)}</td>
                  <td style={{ ...td, color: '#334155' }}>{r.description || '—'}</td>
                  <td style={td}>
                    {r.receipt_url
                      ? <button onClick={() => setViewing(r)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14 }}>🖼 View</button>
                      : <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>}
                  </td>
                  <td style={td}>
                    <button onClick={() => deleteRow(r)} title="Delete" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {addOpen && <AddExpenseModal orgId={profile?.org_id} uploadedBy={profile?.id} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load() }} />}
      {viewing && (
        <div onClick={() => setViewing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <img src={viewing.receipt_url} alt="receipt" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.5)' }} />
        </div>
      )}
    </div>
  )
}

function AddExpenseModal({ orgId, uploadedBy, onClose, onSaved }) {
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState('materials')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const onPick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setErr('Please choose an image.'); return }
    if (f.size > 5 * 1024 * 1024) { setErr('Image must be under 5MB.'); return }
    setErr(''); setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { setErr('Enter an amount.'); return }
    setBusy(true); setErr('')
    try {
      let receiptUrl = null
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const up = await supabase.storage.from('receipts').upload(path, file, { contentType: file.type, upsert: false })
        if (up.error) throw up.error
        const { data: pub } = supabase.storage.from('receipts').getPublicUrl(path)
        receiptUrl = pub.publicUrl
      }
      const { error } = await supabase.from('expenses').insert({
        org_id: orgId,
        spent_on: spentOn,
        category, amount: Number(amount),
        description: description.trim() || null,
        receipt_url: receiptUrl,
        created_by: uploadedBy || null,
      })
      if (error) throw error
      onSaved()
    } catch (e) {
      // Surface the raw error so schema-cache and RLS issues are obvious.
      setErr(`Save failed: ${e.message || e}`)
    }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Add receipt / expense</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={fieldLbl}>DATE</span>
              <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} style={inputBox} />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={fieldLbl}>CATEGORY</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputBox}>
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={fieldLbl}>AMOUNT ($)</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', paddingLeft: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>$</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal"
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, background: 'transparent' }} />
            </div>
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={fieldLbl}>DESCRIPTION</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="e.g. Cement bags for site 3"
              style={{ ...inputBox, resize: 'vertical' }} />
          </label>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={fieldLbl}>RECEIPT PHOTO</span>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 16px', borderRadius: 12,
              border: '2px dashed #cbd5e1', background: '#f8fafc',
              color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {file ? `📎 ${file.name}` : '📷 Upload receipt photo'}
              <input type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
            </label>
            {file && (
              <button type="button" onClick={() => { setFile(null); setPreview(null) }}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 700, textAlign: 'left' }}>
                ✕ Remove photo
              </button>
            )}
            {preview && (
              <div style={{ marginTop: 8, padding: 10, background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
                <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8 }} />
              </div>
            )}
          </div>
          {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? .6 : 1 }}>{busy ? 'Saving…' : 'Save receipt'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputBox = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600, width: '100%', boxSizing: 'border-box' }
const fieldLbl = { fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }
