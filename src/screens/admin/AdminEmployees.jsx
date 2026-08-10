import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/util'
import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'

export default function AdminEmployees() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [attToday, setAttToday] = useState([])
  const [onLeaveToday, setOnLeaveToday] = useState(0)
  const [loadErr, setLoadErr] = useState('')

  const load = async () => {
    if (!profile?.org_id) return
    setLoadErr('')
    const today = new Date().toISOString().slice(0, 10)
    const [r, a, l] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, avatar_url, role, employee_code, is_admin, position, phone, schedule')
        .eq('org_id', profile.org_id)
        .order('full_name'),
      supabase.from('attendance')
        .select('profile_id, clock_out')
        .eq('org_id', profile.org_id)
        .eq('work_date', today),
      supabase.from('leave_requests')
        .select('profile_id')
        .eq('org_id', profile.org_id)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today),
    ])
    if (r.error) { setLoadErr(r.error.message); return }
    setRows(r.data || [])
    setAttToday(a.data || [])
    setOnLeaveToday((l.data || []).length)
  }
  useEffect(() => { load() }, [profile?.org_id])

  const nonAdmin = rows.filter((r) => !r.is_admin)
  const clockedInSet = new Set(attToday.filter((x) => !x.clock_out).map((x) => x.profile_id))
  const activeCount = nonAdmin.length
  const clockedInToday = nonAdmin.filter((r) => clockedInSet.has(r.id)).length
  const departments = new Set(nonAdmin.map((r) => r.position).filter(Boolean)).size

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Employees"
        sub={`${activeCount} active · ${onLeaveToday} on leave today · ${clockedInToday} clocked in`}
        actions={<>
          <button onClick={() => setShowAdd(true)} style={btnPrimary}>+ Add employee</button>
          <button onClick={load} style={btnGhost}>↻ Refresh</button>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
        </>}
      />

      {loadErr && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>
          Couldn't load employees: {loadErr}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="👤" label="ACTIVE" value={activeCount} sub="on the roster" accent="#22c55e" />
        <StatTile icon="⏱" label="CLOCKED IN" value={clockedInToday} sub="right now" accent="#2563eb" />
        <StatTile icon="🏖" label="ON LEAVE" value={onLeaveToday} sub="today" accent="#f59e0b" />
        <StatTile icon="🏢" label="DEPARTMENTS" value={departments} sub="unique positions" accent="#a855f7" />
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
              {['','EMPLOYEE','POSITION','ROLE','STATUS','LOGIN',''].map((h, i) => <th key={i} style={th}>{h}</th>)}
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
                <td style={td}>{r.position || '—'}</td>
                <td style={td}>{r.is_admin ? 'Admin' : 'Employee'}</td>
                <td style={td}><span style={chip('#DCFCE7', '#15803d')}>● Active</span></td>
                <td style={{ ...td, color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>{r.employee_code}</td>
                <td style={td}>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginRight: 8 }}>👁</button>
                  <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load() }} />}
    </div>
  )
}

function AddEmployeeModal({ onClose, onCreated }) {
  const [fullName, setFullName] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [shiftStart, setShiftStart] = useState('08:00')
  const [shiftEnd, setShiftEnd] = useState('17:00')
  const [isAdmin, setIsAdmin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) { setErr('Full name is required.'); return }
    if (pin && !/^\d{6}$/.test(pin)) { setErr('PIN must be exactly 6 digits.'); return }
    if (shiftStart && shiftEnd && shiftStart >= shiftEnd) { setErr('Shift end must be after shift start.'); return }
    setBusy(true); setErr('')
    try {
      const schedule = shiftStart && shiftEnd ? `${shiftStart}-${shiftEnd}` : null
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          full_name: fullName.trim(),
          employee_code: employeeCode.trim() || undefined,
          position: position.trim() || undefined,
          phone: phone.trim() || undefined,
          pin: pin || undefined,
          schedule: schedule || undefined,
          is_admin: isAdmin,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setErr(e.message || 'Failed to create employee.')
    }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        {!result ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Add employee</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>
              Employee will sign in with their <b>Employee ID</b> + <b>PIN</b> under company code <code>JAWAY-0026</code>.
            </div>

            <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
              <Field label="FULL NAME *" value={fullName} onChange={setFullName} placeholder="Juan Dela Cruz" autoFocus />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="EMPLOYEE ID" value={employeeCode} onChange={(v) => setEmployeeCode(v.toUpperCase())} placeholder="EMP-001 (auto if blank)" />
                <Field label="6-DIGIT PIN" value={pin} onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))} placeholder="Auto-generate if blank" mono />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="POSITION" value={position} onChange={setPosition} placeholder="e.g. Foreman" />
                <Field
                  label="PHONE (US)"
                  value={phone}
                  onChange={(v) => setPhone(formatUsPhone(v))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TimeField label="SHIFT START (CLOCK IN)" value={shiftStart} onChange={setShiftStart} />
                <TimeField label="SHIFT END (CLOCK OUT)" value={shiftEnd} onChange={setShiftEnd} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                Make this user an admin (can access /admin dashboard)
              </label>

              {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
                <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
                  {busy ? 'Creating…' : 'Create employee'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#DCFCE7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✓</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>Employee created</div>
            <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 18 }}>
              Give these credentials to <b>{result.full_name}</b>. The PIN is shown only once.
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'grid', gap: 10 }}>
              <Row label="Company Code" value={result.company_code} />
              <Row label="Employee ID" value={result.employee_code} />
              <Row label="PIN" value={result.pin} big />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button onClick={onCreated} style={btnPrimary}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, mono, autoFocus }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 4 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, fontFamily: mono ? 'monospace' : 'inherit',
          letterSpacing: mono ? 2 : 0,
          outline: 'none',
          color: '#0f172a',
          background: '#fff',
          fontWeight: 600,
        }}
      />
    </div>
  )
}

function Row({ label, value, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>{label}</div>
      <div style={{ fontSize: big ? 22 : 13, fontWeight: big ? 900 : 700, color: '#0f172a', fontFamily: 'monospace', letterSpacing: big ? 4 : 1 }}>{value}</div>
    </div>
  )
}

function TimeField({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 4 }}>{label}</div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, outline: 'none',
          color: '#0f172a', background: '#fff', fontWeight: 600,
        }}
      />
    </div>
  )
}

// Format any input as a US phone number: (XXX) XXX-XXXX. Leaves extra
// digits ignored so paste/type both feel natural.
function formatUsPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}
