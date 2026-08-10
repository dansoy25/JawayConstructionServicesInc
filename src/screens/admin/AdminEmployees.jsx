import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/util'
import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'

export default function AdminEmployees() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [attToday, setAttToday] = useState([])
  const [onLeaveToday, setOnLeaveToday] = useState(0)
  const [loadErr, setLoadErr] = useState('')

  const load = async () => {
    if (!profile?.org_id) return
    setLoadErr('')
    const today = new Date().toISOString().slice(0, 10)
    const [r, a, l] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, avatar_url, employee_code, is_admin, position, phone, schedule, daily_rate')
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
              {['','EMPLOYEE','POSITION','RATE','ROLE','STATUS','LOGIN',''].map((h, i) => <th key={i} style={th}>{h}</th>)}
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
                <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700 }}>
                  {Number(r.daily_rate) > 0 ? `$${Number(r.daily_rate).toFixed(2)}/hr` : <span style={{ color: '#94a3b8', fontWeight: 400 }}>—</span>}
                </td>
                <td style={td}>{r.is_admin ? 'Admin' : 'Employee'}</td>
                <td style={td}><span style={chip('#DCFCE7', '#15803d')}>● Active</span></td>
                <td style={{ ...td, color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>{r.employee_code}</td>
                <td style={td}>
                  <button
                    title="Edit employee"
                    onClick={() => setEditing(r)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginRight: 6, fontSize: 15 }}
                  >✎</button>
                  <button
                    title={r.id === profile?.id
                      ? "You can't delete your own account. Ask another admin to remove you."
                      : `Delete ${r.full_name}`}
                    onClick={() => r.id !== profile?.id && setDeleting(r)}
                    disabled={r.id === profile?.id}
                    style={{
                      background: 'none', border: 'none',
                      color: r.id === profile?.id ? '#cbd5e1' : '#ef4444',
                      cursor: r.id === profile?.id ? 'not-allowed' : 'pointer',
                      fontSize: 15,
                    }}
                  >🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load() }} />}
      {editing && <EditEmployeeModal employee={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {deleting && <DeleteEmployeeDialog employee={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); load() }} />}
    </div>
  )
}

function AddEmployeeModal({ onClose, onCreated }) {
  const [fullName, setFullName] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [shiftStart, setShiftStart] = useState('08:00')
  const [shiftEnd, setShiftEnd] = useState('17:00')
  const [loginAs, setLoginAs] = useState('employee') // 'employee' | 'admin'
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
          daily_rate: hourlyRate ? Number(hourlyRate) : undefined,
          is_admin: loginAs === 'admin',
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <RateField label="HOURLY RATE ($/HR)" value={hourlyRate} onChange={setHourlyRate} />
                <SelectField
                  label="LOGIN AS"
                  value={loginAs}
                  onChange={setLoginAs}
                  options={[
                    { value: 'employee', label: 'Employee app (mobile PIN)' },
                    { value: 'admin', label: 'Admin dashboard (desktop)' },
                  ]}
                />
              </div>

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

function RateField({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', paddingLeft: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>$</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          inputMode="decimal"
          style={{
            flex: 1, boxSizing: 'border-box',
            padding: '10px 12px', border: 'none', outline: 'none',
            fontSize: 13, fontFamily: 'monospace', fontWeight: 700,
            color: '#0f172a', background: 'transparent',
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', paddingRight: 12 }}>/ hour</span>
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 4 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
          fontSize: 13, outline: 'none',
          color: '#0f172a', background: '#fff', fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
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

// ─── Edit employee modal ──────────────────────────────────────────────

function EditEmployeeModal({ employee, onClose, onSaved }) {
  const [fullName, setFullName] = useState(employee.full_name || '')
  const [position, setPosition] = useState(employee.position || '')
  const [phone, setPhone] = useState(employee.phone || '')
  const [hourlyRate, setHourlyRate] = useState(employee.daily_rate ? String(employee.daily_rate) : '')
  const [loginAs, setLoginAs] = useState(employee.is_admin ? 'admin' : 'employee')
  const initialSched = parseSchedule(employee.schedule)
  const [shiftStart, setShiftStart] = useState(initialSched.start)
  const [shiftEnd, setShiftEnd] = useState(initialSched.end)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Reset password / PIN
  const [showResetPin, setShowResetPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [resetErr, setResetErr] = useState('')
  const [resetResult, setResetResult] = useState(null) // { new_pin }
  const isAdminAccount = loginAs === 'admin'

  const doResetPin = async () => {
    setResetErr(''); setResetResult(null)
    if (newPin) {
      if (isAdminAccount) {
        if (newPin.length < 6) { setResetErr('Admin password must be at least 6 characters.'); return }
      } else if (!/^\d{6}$/.test(newPin)) {
        setResetErr('PIN must be exactly 6 digits.'); return
      }
    }
    setResetBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('reset-employee-pin', {
        body: { id: employee.id, pin: newPin || undefined },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setResetResult(data)
      setNewPin('')
    } catch (e) { setResetErr(e.message || 'Reset failed.') }
    setResetBusy(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) { setErr('Full name is required.'); return }
    if (shiftStart && shiftEnd && shiftStart >= shiftEnd) { setErr('Shift end must be after shift start.'); return }
    setBusy(true); setErr('')
    try {
      const schedule = shiftStart && shiftEnd ? `${shiftStart}-${shiftEnd}` : null
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim(),
        position: position.trim() || null,
        phone: phone.trim() || null,
        schedule,
        daily_rate: hourlyRate ? Number(hourlyRate) : 0,
        is_admin: loginAs === 'admin',
      }).eq('id', employee.id)
      if (error) throw error
      onSaved()
    } catch (e) { setErr(e.message || 'Update failed.') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Edit employee</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>
          <b>{employee.employee_code}</b> · Login ID and PIN can only be changed by creating a new account.
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <Field label="FULL NAME *" value={fullName} onChange={setFullName} autoFocus />
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <RateField label="HOURLY RATE ($/HR)" value={hourlyRate} onChange={setHourlyRate} />
            <SelectField
              label="LOGIN AS"
              value={loginAs}
              onChange={setLoginAs}
              options={[
                { value: 'employee', label: 'Employee app (mobile PIN)' },
                { value: 'admin', label: 'Admin dashboard (desktop)' },
              ]}
            />
          </div>

          {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}

          {/* Reset PIN / password section */}
          <div style={{ marginTop: 4, padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            {!showResetPin && !resetResult && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                    {isAdminAccount ? 'Password' : 'PIN'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Supabase stores {isAdminAccount ? 'passwords' : 'PINs'} as one-way encrypted hashes — the current value can't be read back. Reset to issue a new one.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetPin(true)}
                  style={{ ...btnGhost, padding: '8px 14px', fontSize: 11, flexShrink: 0 }}
                >
                  🔑 Reset {isAdminAccount ? 'password' : 'PIN'}
                </button>
              </div>
            )}

            {showResetPin && !resetResult && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  Reset {isAdminAccount ? 'password' : 'PIN'} for {employee.full_name}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 4 }}>
                      NEW {isAdminAccount ? 'PASSWORD (min 6 chars)' : 'PIN (6 digits, auto if blank)'}
                    </div>
                    <input
                      type="text"
                      value={newPin}
                      onChange={(e) => setNewPin(isAdminAccount ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder={isAdminAccount ? 'Enter a strong password' : 'Auto-generate'}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: 13, fontFamily: 'monospace', outline: 'none',
                        color: '#0f172a', background: '#fff', fontWeight: 700, letterSpacing: 2,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={doResetPin}
                    disabled={resetBusy}
                    style={{ ...btnPrimary, padding: '10px 14px', fontSize: 12, opacity: resetBusy ? 0.6 : 1 }}
                  >{resetBusy ? '…' : 'Apply'}</button>
                  <button
                    type="button"
                    onClick={() => { setShowResetPin(false); setNewPin(''); setResetErr('') }}
                    style={{ ...btnGhost, padding: '10px 12px', fontSize: 11 }}
                  >Cancel</button>
                </div>
                {resetErr && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 11, fontWeight: 600 }}>{resetErr}</div>
                )}
              </div>
            )}

            {resetResult && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#DCFCE7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✓</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                    New {resetResult.is_admin ? 'password' : 'PIN'} set. Copy it now — you can't view it again.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    flex: 1, padding: '12px 16px', background: '#fff',
                    border: '2px solid #22c55e', borderRadius: 8,
                    fontSize: resetResult.is_admin ? 15 : 22,
                    fontFamily: 'monospace', fontWeight: 900, color: '#0f172a',
                    letterSpacing: resetResult.is_admin ? 1 : 6, textAlign: 'center',
                  }}>{resetResult.new_pin}</div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(resetResult.new_pin)}
                    style={{ ...btnGhost, padding: '10px 14px', fontSize: 12 }}
                  >📋 Copy</button>
                  <button
                    type="button"
                    onClick={() => { setResetResult(null); setShowResetPin(false) }}
                    style={{ ...btnGhost, padding: '10px 14px', fontSize: 12 }}
                  >Done</button>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                  Give this to <b>{resetResult.full_name}</b> ({resetResult.employee_code}). They can sign in immediately with the new {resetResult.is_admin ? 'password' : 'PIN'}; their old one no longer works.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function parseSchedule(s) {
  if (!s || typeof s !== 'string') return { start: '08:00', end: '17:00' }
  const m = s.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/)
  return m ? { start: m[1], end: m[2] } : { start: '08:00', end: '17:00' }
}

// ─── Delete confirmation dialog ───────────────────────────────────────

function DeleteEmployeeDialog({ employee, onClose, onDeleted }) {
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const expected = employee.employee_code || employee.full_name

  const submit = async () => {
    if (confirm.trim().toUpperCase() !== String(expected).toUpperCase()) {
      setErr(`Type "${expected}" to confirm.`); return
    }
    setBusy(true); setErr('')
    try {
      const { data, error } = await supabase.functions.invoke('delete-employee', {
        body: { id: employee.id },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      onDeleted()
    } catch (e) { setErr(e.message || 'Delete failed.') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEE2E2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚠</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Delete employee</div>
        </div>
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 14 }}>
          This permanently removes <b>{employee.full_name}</b> ({employee.employee_code}). Their login, profile, past attendance links, and payslip records will be affected. This can't be undone.
        </div>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: .4, marginBottom: 4 }}>
          Type <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, color: '#0f172a' }}>{expected}</code> to confirm:
        </div>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoFocus
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #FCA5A5', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600, letterSpacing: 1 }}
        />

        {err && <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            style={{
              padding: '10px 16px', borderRadius: 10, border: 'none',
              background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 800,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
            }}
          >{busy ? 'Deleting…' : 'Permanently delete'}</button>
        </div>
      </div>
    </div>
  )
}
