import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/util'
import { btnPrimary, btnGhost, PageHeader } from './adminShared'
import MapView from '../../components/MapView'

export default function AdminGps() {
  const { profile } = useAuth()
  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="GPS worksites"
        sub="Employees can only clock in when they're inside the geofence of their assigned site."
      />
      <SitesPanel orgId={profile?.org_id} />
    </div>
  )
}

function SitesPanel({ orgId }) {
  const [sites, setSites] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    if (!orgId) return
    supabase.from('sites').select('*').eq('org_id', orgId).order('name').then(({ data }) => setSites(data || []))
  }
  useEffect(() => { load() }, [orgId])

  const doDelete = async () => {
    if (!deleting) return
    await supabase.from('profiles').update({ site_id: null }).eq('site_id', deleting.id)
    await supabase.from('sites').delete().eq('id', deleting.id)
    setDeleting(null)
    load()
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Worksites & geofences <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginLeft: 6 }}>{sites.length}</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={btnGhost}>↻ Refresh</button>
          <button onClick={() => setAdding(true)} style={btnPrimary}>+ Add site</button>
        </div>
      </div>

      {sites.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No worksites yet. Click <b>+ Add site</b> to create one.</div>
      ) : (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sites.map((s) => (
            <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', background: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DBEAFE', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{s.name}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                  {Number(s.lat).toFixed(5)}, {Number(s.lng).toFixed(5)} · {s.radius_m || 100}m radius
                </div>
              </div>
              <button onClick={() => setEditing(s)} style={{ ...btnGhost, padding: '6px 12px', fontSize: 11 }}>✎ Edit</button>
              <button
                onClick={() => setDeleting(s)}
                title="Delete site"
                style={{ padding: '6px 12px', fontSize: 11, borderRadius: 8, border: '1px solid #FCA5A5', background: '#fff', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}
              >🗑 Delete</button>
            </div>
          ))}
        </div>
      )}

      {editing && <SiteEditorModal site={editing} orgId={orgId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {adding && <SiteEditorModal site={null} orgId={orgId} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
      {deleting && (
        <div onClick={() => setDeleting(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚠</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Delete "{deleting.name}"?</div>
            </div>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 14 }}>
              Any employees assigned to this site will be unassigned. This can't be undone.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleting(null)} style={btnGhost}>Cancel</button>
              <button onClick={doDelete} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Permanently delete</button>
            </div>
          </div>
        </div>
      )}
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

  // Geocoding search state (OpenStreetMap Nominatim — no key required)
  const [addressQuery, setAddressQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [employees, setEmployees] = useState([])
  const [assigned, setAssigned] = useState(new Set())
  const [initialAssigned, setInitialAssigned] = useState(new Set())

  useEffect(() => {
    if (!orgId) return
    supabase.from('profiles')
      .select('id, full_name, employee_code, site_id, is_admin')
      .eq('org_id', orgId)
      .eq('is_admin', false)
      .order('full_name')
      .then(({ data }) => {
        const rows = data || []
        setEmployees(rows)
        if (site) {
          const preAssigned = new Set(rows.filter((p) => p.site_id === site.id).map((p) => p.id))
          setAssigned(preAssigned)
          setInitialAssigned(preAssigned)
        }
      })
  }, [orgId, site?.id])

  const toggleAssign = (id) => {
    setAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const searchAddress = async (e) => {
    e?.preventDefault?.()
    const q = addressQuery.trim()
    if (!q) return
    setSearching(true); setErr(''); setSearchResults([])
    try {
      // Nominatim public geocoder. Free and no key; keep query volume low.
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const data = await res.json()
      setSearchResults(data || [])
      if (!data?.length) setErr('No matches. Try a more specific address.')
    } catch (e) { setErr(e.message || 'Address search failed.') }
    setSearching(false)
  }

  const pickResult = (r) => {
    setLat(Number(r.lat)); setLng(Number(r.lon))
    if (!name.trim()) setName(r.display_name.split(',')[0])
    setSearchResults([])
    setAddressQuery(r.display_name)
  }

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
      let siteId = site?.id
      if (isNew) {
        const { data, error } = await supabase.from('sites').insert({ ...payload, org_id: orgId }).select().single()
        if (error) throw error
        siteId = data.id
      } else {
        const { error } = await supabase.from('sites').update(payload).eq('id', site.id)
        if (error) throw error
      }
      const toAssign = [...assigned].filter((id) => !initialAssigned.has(id))
      const toUnassign = [...initialAssigned].filter((id) => !assigned.has(id))
      if (toAssign.length) {
        const { error } = await supabase.from('profiles').update({ site_id: siteId }).in('id', toAssign)
        if (error) throw error
      }
      if (toUnassign.length) {
        const { error } = await supabase.from('profiles').update({ site_id: null }).in('id', toUnassign)
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
          <div style={{ position: 'relative', zIndex: 2000 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAddress())}
                  placeholder="Search address, e.g. 1234 King St W, Toronto"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13 }}
                />
                {addressQuery && (
                  <button type="button" onClick={() => { setAddressQuery(''); setSearchResults([]) }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>✕</button>
                )}
              </div>
              <button type="button" onClick={searchAddress} disabled={searching} style={{ ...btnGhost, padding: '10px 14px', fontSize: 12, opacity: searching ? .6 : 1 }}>
                {searching ? 'Searching…' : '🔍 Find'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: 46, left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 2100, maxHeight: 260, overflowY: 'auto' }}>
                {searchResults.map((r) => (
                  <button key={`${r.place_id}`} type="button" onClick={() => pickResult(r)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 12, color: '#0f172a' }}>
                    📍 {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <MapView
            center={[Number(lat), Number(lng)]}
            radiusM={Number(radius)}
            siteName={name || 'New site'}
            height={280}
            editable
            onChange={({ lat: la, lng: lo }) => { setLat(la); setLng(lo) }}
          />

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

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>
                ASSIGNED EMPLOYEES ({assigned.size} of {employees.length})
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setAssigned(new Set(employees.map((e) => e.id)))} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Select all</button>
                <span style={{ color: '#cbd5e1' }}>·</span>
                <button type="button" onClick={() => setAssigned(new Set())} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, maxHeight: 180, overflowY: 'auto', background: '#f8fafc' }}>
              {employees.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No employees yet.</div>
              ) : (
                employees.map((emp) => {
                  const isOn = assigned.has(emp.id)
                  const conflictingSite = emp.site_id && emp.site_id !== site?.id
                  return (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: isOn ? '#eff6ff' : 'transparent' }}>
                      <input type="checkbox" checked={isOn} onChange={() => toggleAssign(emp.id)} style={{ width: 16, height: 16 }} />
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 9, flexShrink: 0 }}>
                        {initials(emp.full_name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{emp.full_name}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                          {emp.employee_code}{conflictingSite && !isOn ? ' · assigned elsewhere' : ''}
                        </div>
                      </div>
                    </label>
                  )
                })
              )}
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
          letterSpacing: mono ? 2 : 0, outline: 'none',
          color: '#0f172a', background: '#fff', fontWeight: 600,
        }}
      />
    </div>
  )
}
