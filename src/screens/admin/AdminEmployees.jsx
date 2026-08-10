import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/util'
import { card, table, th, td, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'
import MapView from '../../components/MapView'

export default function AdminEmployees() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])
  const [showAdd, setShowAdd] = useState(false)

  const load = () => {
    if (!profile?.org_id) return
    supabase.from('profiles').select('id, full_name, avatar_url, role, employee_code, is_admin, position').eq('org_id', profile.org_id).order('full_name').then(({ data }) => setRows(data || []))
  }
  useEffect(() => { load() }, [profile?.org_id])

  const active = rows.filter((r) => !r.is_admin).length
  const departments = new Set(rows.map((r) => r.role)).size

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Employees"
        sub={`${active} active · 3 on leave · 2 pending invite`}
        actions={<>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            <button style={{ padding: '6px 14px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Today</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Week</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Month</button>
          </div>
          <button onClick={() => setShowAdd(true)} style={btnPrimary}>+ Add employee</button>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="👤" label="ACTIVE" value={active} sub="clocked in today" accent="#22c55e" />
        <StatTile icon="🏖" label="ON LEAVE" value="3" sub="returning Thu" accent="#f59e0b" />
        <StatTile icon="✉" label="PENDING" value="2" sub="Action needed" subColor="#b91c1c" accent="#2563eb" />
        <StatTile icon="🏢" label="DEPARTMENTS" value={departments || 6} sub="3 branches" accent="#a855f7" />
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

      {/* Worksites / GPS geofences */}
      <div style={{ marginTop: 24 }}>
        <SitesPanel orgId={profile?.org_id} />
      </div>

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load() }} />}
    </div>
  )
}

function SitesPanel({ orgId }) {
  const [sites, setSites] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

  const load = () => {
    if (!orgId) return
    supabase.from('sites').select('*').eq('org_id', orgId).order('name').then(({ data }) => setSites(data || []))
  }
  useEffect(() => { load() }, [orgId])

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Worksites & GPS geofences</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Employees can only clock in when they're inside the geofence of their assigned site.</div>
        </div>
        <button onClick={() => setAdding(true)} style={btnPrimary}>+ Add site</button>
      </div>

      {sites.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No worksites yet. Click <b>+ Add site</b> to create one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14, padding: 14 }}>
          {sites.map((s) => (
            <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
              <MapView
                center={[Number(s.lat), Number(s.lng)]}
                radiusM={s.radius_m || 100}
                siteName={s.name}
                height={160}
              />
              <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                      {Number(s.lat).toFixed(5)}, {Number(s.lng).toFixed(5)} · {s.radius_m || 100}m
                    </div>
                  </div>
                  <button onClick={() => setEditing(s)} style={{ ...btnGhost, padding: '6px 10px', fontSize: 11 }}>Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <SiteEditorModal site={editing} orgId={orgId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {adding && <SiteEditorModal site={null} orgId={orgId} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
    </div>
  )
}

function SiteEditorModal({ site, orgId, onClose, onSaved }) {
  const isNew = !site
  const [name, setName] = useState(site?.name || '')
  const [lat, setLat] = useState(site?.lat || 14.5995)
  const [lng, setLng] = useState(site?.lng || 120.9842)
  const [radius, setRadius] = useState(site?.radius_m || 100)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const useMyLocation = () => {
    if (!navigator.geolocation) return setErr('Geolocation not supported by this browser.')
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(p.coords.latitude); setLng(p.coords.longitude) },
      (e) => setErr(e.message || 'Could not get your location.')
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setErr('Site name is required.'); return }
    setBusy(true); setErr('')
    try {
      const payload = { name: name.trim(), lat: Number(lat), lng: Number(lng), radius_m: Number(radius) || 100 }
      if (isNew) {
        const { error } = await supabase.from('sites').insert({ ...payload, org_id: orgId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('sites').update(payload).eq('id', site.id)
        if (error) throw error
      }
      onSaved()
    } catch (e) { setErr(e.message || 'Save failed.') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{isNew ? 'Add worksite' : 'Edit worksite'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          Click anywhere on the map to move the pin. Employees within the blue circle can clock in.
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <MapView
              center={[Number(lat), Number(lng)]}
              radiusM={Number(radius)}
              siteName={name || 'New site'}
              height={280}
              editable
              onChange={({ lat: la, lng: lo }) => { setLat(la); setLng(lo) }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="SITE NAME *" value={name} onChange={setName} placeholder="ACME HQ" autoFocus />
            <Field label={`GEOFENCE RADIUS: ${radius}m`} value={radius} onChange={(v) => setRadius(v.replace(/\D/g, ''))} placeholder="100" mono />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="LATITUDE" value={String(lat)} onChange={(v) => setLat(v)} mono />
            <Field label="LONGITUDE" value={String(lng)} onChange={(v) => setLng(v)} mono />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 4 }}>&nbsp;</div>
              <button type="button" onClick={useMyLocation} style={{ ...btnGhost, width: '100%', padding: '10px 12px', fontSize: 11 }}>📍 Use my location</button>
            </div>
          </div>

          {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : (isNew ? 'Create site' : 'Save changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddEmployeeModal({ onClose, onCreated }) {
  const [fullName, setFullName] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) { setErr('Full name is required.'); return }
    if (pin && !/^\d{6}$/.test(pin)) { setErr('PIN must be exactly 6 digits.'); return }
    setBusy(true); setErr('')
    try {
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          full_name: fullName.trim(),
          employee_code: employeeCode.trim() || undefined,
          position: position.trim() || undefined,
          phone: phone.trim() || undefined,
          pin: pin || undefined,
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
                <Field label="PHONE" value={phone} onChange={setPhone} placeholder="+63 917 …" />
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
