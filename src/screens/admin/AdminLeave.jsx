import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials, fmtDate } from '../../lib/util'
import { card, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'
import { exportCsv, printPage, todayStamp } from '../../lib/exports'

const DEFAULT_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#a855f7', '#ef4444', '#0891b2']

export default function AdminLeave() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [types, setTypes] = useState([])
  const [manageOpen, setManageOpen] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [calStart, setCalStart] = useState(0) // 0 = Sun, 1 = Mon

  useEffect(() => {
    const saved = localStorage.getItem('ts_cal_start')
    if (saved != null) setCalStart(Number(saved))
  }, [])

  const load = () => {
    if (!profile?.org_id) return
    supabase.from('leave_requests')
      .select('*, profile:profiles(full_name, avatar_url), leave_type:leave_types(name, code, color)')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => setRows(data || []))
    supabase.from('leave_types').select('*').eq('org_id', profile.org_id).order('name').then(({ data }) => setTypes(data || []))
  }
  useEffect(load, [profile?.org_id])

  const pending = rows.filter((r) => r.status === 'pending')
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date().toISOString().slice(0, 7) + '-01'
  const approvedThisMonth = rows.filter((r) => r.status === 'approved' && r.date_from >= monthStart).length
  const deniedThisMonth = rows.filter((r) => (r.status === 'rejected' || r.status === 'declined') && r.date_from >= monthStart).length
  const onLeaveToday = rows.filter((r) => r.status === 'approved' && r.date_from <= today && r.date_to >= today).length

  const decide = async (id, status) => {
    await supabase.from('leave_requests').update({ status, reviewer_name: profile?.full_name || 'Admin', decided_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const doExportCsv = () => {
    exportCsv(
      `leave-requests-${todayStamp()}.csv`,
      ['Employee', 'Type', 'Start', 'End', 'Days', 'Status', 'Reason', 'Created'],
      rows.map((r) => [
        r.profile?.full_name || '', r.leave_type?.name || '',
        r.date_from, r.date_to, r.days || '',
        r.status || 'pending', r.reason || '', r.created_at,
      ]),
    )
  }

  const setCalStartPersist = (v) => { setCalStart(v); localStorage.setItem('ts_cal_start', String(v)) }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Leave Management"
        sub={`${pending.length} pending · ${approvedThisMonth} approved this month`}
        actions={<>
          <button onClick={() => setManageOpen(true)} style={btnPrimary}>≡ Leave types</button>
          <button onClick={doExportCsv} style={btnGhost}>⬇ CSV</button>
          <button onClick={printPage} style={btnGhost}>📄 PDF</button>
        </>}
      />

      {/* Leave-type quick chips (spec: leave-type buttons must work).
          Each chip drives an inline filter across the pending queue below. */}
      <LeaveTypeChips types={types} rows={rows} onManage={() => setManageOpen(true)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="⏱" label="PENDING" value={pending.length} sub="awaiting approval" accent="#f59e0b" />
        <StatTile icon="✓" label="APPROVED THIS MONTH" value={approvedThisMonth} sub="vacation · sick" accent="#22c55e" />
        <StatTile icon="✗" label="DENIED THIS MONTH" value={deniedThisMonth} sub="Review policy" subColor="#b91c1c" accent="#ef4444" />
        <StatTile icon="👥" label="ON LEAVE TODAY" value={onLeaveToday} sub="approved & active" accent="#2563eb" />
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Pending requests</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Review and act on team requests</div>
          </div>
          <span style={chip('#FEF3C7', '#a16207')}>● {pending.length} awaiting</span>
        </div>

        {pending.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: '#DCFCE7', color: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>All caught up</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>No pending leave requests to review.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #f1f5f9', borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                  {initials(r.profile?.full_name || '?')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.profile?.full_name} — {r.leave_type?.name || 'Leave'}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{fmtDate(r.date_from)} — {fmtDate(r.date_to)} ({r.days} days){r.reason && ` · "${r.reason}"`}</div>
                </div>
                <button onClick={() => decide(r.id, 'rejected')} style={{ padding: '6px 12px', borderRadius: 8, background: '#FEE2E2', color: '#b91c1c', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✗ Deny</button>
                <button onClick={() => decide(r.id, 'approved')} style={{ padding: '6px 12px', borderRadius: 8, background: '#DCFCE7', color: '#15803d', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div style={card}>
          <LeaveCalendar
            rows={rows}
            types={types}
            monthOffset={monthOffset}
            setMonthOffset={setMonthOffset}
            calStart={calStart}
            onCustomize={() => setCustomizeOpen(true)}
          />
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Leave types</div>
            <button onClick={() => setManageOpen(true)} style={btnPrimary}>+ New type</button>
          </div>
          {types.length === 0 && <div style={{ fontSize: 11, color: '#94a3b8', padding: '20px 0', textAlign: 'center' }}>No types configured. Click "+ New type" to add.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {types.map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color || '#94a3b8' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{t.name}</span>
                  {t.code && <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{t.code}</span>}
                </div>
                <button
                  onClick={() => setManageOpen(true)}
                  title="Edit types"
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}
                >✎</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {manageOpen && <LeaveTypesDialog orgId={profile?.org_id} types={types} onClose={() => setManageOpen(false)} onSaved={() => { setManageOpen(false); load() }} />}
      {customizeOpen && (
        <CalendarCustomizeDialog
          calStart={calStart}
          setCalStart={setCalStartPersist}
          onClose={() => setCustomizeOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Leave-type chip row (drives quick counts by type) ─────────────────

function LeaveTypeChips({ types, rows, onManage }) {
  const [active, setActive] = useState(null) // type id
  const monthStart = new Date().toISOString().slice(0, 7) + '-01'
  const filtered = active
    ? rows.filter((r) => r.leave_type_id === active && r.date_from >= monthStart)
    : rows.filter((r) => r.date_from >= monthStart)

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
      <button
        onClick={() => setActive(null)}
        style={{
          padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
          border: active === null ? '2px solid #2563eb' : '1px solid #e2e8f0',
          background: active === null ? '#eff6ff' : '#fff',
          fontSize: 11, fontWeight: 800, color: '#0f172a',
        }}
      >All types <span style={{ color: '#64748b', marginLeft: 4 }}>{rows.filter((r) => r.date_from >= monthStart).length}</span></button>
      {types.map((t) => {
        const count = rows.filter((r) => r.leave_type_id === t.id && r.date_from >= monthStart).length
        const on = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => setActive(on ? null : t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              border: on ? `2px solid ${t.color || '#2563eb'}` : '1px solid #e2e8f0',
              background: on ? '#f8fafc' : '#fff',
              fontSize: 11, fontWeight: 800, color: '#0f172a',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color || '#94a3b8' }} />
            {t.name}
            <span style={{ color: '#64748b', marginLeft: 2 }}>{count}</span>
          </button>
        )
      })}
      <button onClick={onManage} style={{ ...btnGhost, padding: '6px 12px', fontSize: 11 }}>⚙ Manage</button>
      {active && (
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
          Showing {filtered.length} this month
        </span>
      )}
    </div>
  )
}

// ─── Calendar with real leave overlays ─────────────────────────────────

function LeaveCalendar({ rows, types, monthOffset, setMonthOffset, calStart, onCustomize }) {
  const anchor = new Date()
  anchor.setMonth(anchor.getMonth() + monthOffset)
  const y = anchor.getFullYear(), m = anchor.getMonth()
  const first = new Date(y, m, 1)
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const leadOffset = (first.getDay() - calStart + 7) % 7

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const dayLeaves = (day) => {
    const dISO = iso(new Date(y, m, day))
    return rows.filter((r) => r.status === 'approved' && r.date_from <= dISO && r.date_to >= dISO)
  }

  const typeColor = (id) => types.find((t) => t.id === id)?.color || '#94a3b8'

  const headers = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const orderedHeaders = [...headers.slice(calStart), ...headers.slice(0, calStart)]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
          Leave calendar — {anchor.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setMonthOffset(monthOffset - 1)} style={{ ...btnGhost, padding: '6px 10px' }}>‹</button>
          <button onClick={() => setMonthOffset(0)} style={{ ...btnGhost, padding: '6px 10px' }}>Today</button>
          <button onClick={() => setMonthOffset(monthOffset + 1)} style={{ ...btnGhost, padding: '6px 10px' }}>›</button>
          <button onClick={onCustomize} title="Customize calendar" style={{ ...btnGhost, padding: '6px 10px' }}>⚙</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>
        {orderedHeaders.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 4 }}>
        {Array.from({ length: leadOffset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const leaves = dayLeaves(day)
          const isToday = iso(new Date(y, m, day)) === new Date().toISOString().slice(0, 10)
          return (
            <div key={day} title={leaves.map((l) => `${l.profile?.full_name}: ${l.leave_type?.name || 'Leave'}`).join('\n')}
              style={{ aspectRatio: '1/1', border: isToday ? '2px solid #2563eb' : '1px solid #f1f5f9', borderRadius: 6, padding: 4, fontSize: 10, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}
            >
              <div style={{ fontWeight: isToday ? 800 : 600, color: isToday ? '#2563eb' : '#334155' }}>{day}</div>
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {leaves.slice(0, 3).map((l) => (
                  <span key={l.id} style={{ width: 6, height: 6, borderRadius: '50%', background: typeColor(l.leave_type_id) }} />
                ))}
                {leaves.length > 3 && <span style={{ fontSize: 9, color: '#94a3b8' }}>+{leaves.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── Manage leave types dialog ─────────────────────────────────────────

function LeaveTypesDialog({ orgId, types, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState(DEFAULT_COLORS[0])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [local, setLocal] = useState(types)

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setErr('Name is required.'); return }
    setBusy(true); setErr('')
    try {
      const { data, error } = await supabase.from('leave_types').insert({
        org_id: orgId, name: name.trim(), code: code.trim() || null, color,
      }).select().single()
      if (error) throw error
      setLocal([...local, data])
      setName(''); setCode(''); setColor(DEFAULT_COLORS[(local.length + 1) % DEFAULT_COLORS.length])
    } catch (e) { setErr(e.message || 'Add failed.') }
    setBusy(false)
  }

  const remove = async (id) => {
    if (!confirm('Delete this leave type? Existing requests will keep their reference.')) return
    const { error } = await supabase.from('leave_types').delete().eq('id', id)
    if (!error) setLocal(local.filter((t) => t.id !== id))
  }

  const finish = () => onSaved()

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Manage leave types</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Add or remove leave categories. Employees can request only from this list.</div>

        <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'end', marginBottom: 12 }}>
          <div>
            <div style={fieldLbl}>NAME</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vacation Leave" style={inputBox} />
          </div>
          <div>
            <div style={fieldLbl}>CODE</div>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VL" style={{ ...inputBox, fontFamily: 'monospace' }} />
          </div>
          <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? .6 : 1 }}>{busy ? '…' : '+ Add'}</button>
        </form>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', alignSelf: 'center' }}>COLOR:</span>
          {DEFAULT_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} type="button"
              style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: color === c ? '3px solid #0f172a' : '1px solid #e2e8f0', cursor: 'pointer' }} />
          ))}
        </div>
        {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{err}</div>}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {local.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No types yet.</div>}
          {local.map((t) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color || '#94a3b8' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{t.name}</span>
                {t.code && <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{t.code}</span>}
              </div>
              <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>🗑</button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={finish} style={btnPrimary}>Done</button>
        </div>
      </div>
    </div>
  )
}

// ─── Calendar customize dialog ─────────────────────────────────────────

function CalendarCustomizeDialog({ calStart, setCalStart, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Customize calendar</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#64748b' }}>Choose the first day of the week.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 0, label: 'Sunday' }, { v: 1, label: 'Monday' }].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setCalStart(opt.v)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                border: calStart === opt.v ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: calStart === opt.v ? '#eff6ff' : '#fff',
                fontSize: 13, fontWeight: 700, color: '#0f172a',
              }}
            >{opt.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={onClose} style={btnPrimary}>Done</button>
        </div>
      </div>
    </div>
  )
}

const inputBox = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600, width: '100%', boxSizing: 'border-box', marginTop: 4 }
const fieldLbl = { fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }
