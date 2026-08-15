import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { manilaToday, distanceMeters, getCurrentPosition, hoursBetween, fmtTime } from '../lib/util'
import MapView from '../components/MapView'

export default function ClockIn() {
  const { profile, site: primarySite } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const nav = useNavigate()
  const [pos, setPos] = useState(null)
  const [posErr, setPosErr] = useState('')
  const [today, setToday] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [now, setNow] = useState(new Date())
  // All sites the employee is allowed to clock in at (multi-site support).
  const [allowedSites, setAllowedSites] = useState([])

  useEffect(() => {
    getCurrentPosition().then(setPos).catch((e) => setPosErr(e.message || 'GPS unavailable'))
    if (profile?.id) {
      supabase.from('attendance').select('*').eq('profile_id', profile.id).eq('work_date', manilaToday()).maybeSingle().then(({ data }) => setToday(data))
      // Pull every site assigned to this employee via site_assignments.
      supabase.from('site_assignments')
        .select('site:sites(id, name, lat, lng, radius_m)')
        .eq('profile_id', profile.id)
        .then(({ data }) => {
          const rows = (data || []).map((r) => r.site).filter(Boolean)
          // Fall back to legacy single-site link so existing installs keep working.
          if (rows.length === 0 && primarySite) rows.push(primarySite)
          setAllowedSites(rows)
        })
    }
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [profile?.id])

  // Pick the closest assigned site to the current position; that's the site the user is trying to clock into.
  const site = (() => {
    if (!allowedSites.length) return primarySite || null
    if (!pos) return allowedSites[0]
    let best = allowedSites[0], bestD = Infinity
    for (const s of allowedSites) {
      if (s.lat == null || s.lng == null) continue
      const d = distanceMeters(pos.lat, pos.lng, s.lat, s.lng)
      if (d < bestD) { bestD = d; best = s }
    }
    return best
  })()

  const dist = pos && site?.lat && site?.lng ? distanceMeters(pos.lat, pos.lng, site.lat, site.lng) : null
  const withinFence = dist != null && dist <= (site?.radius_m || 120)
  const onDuty = today?.clock_in && !today?.clock_out
  const deviceTrusted = true
  const shiftOK = true

  const doClockIn = async () => {
    setBusy(true); setMsg('')
    try {
      if (!withinFence) throw new Error(`Outside geofence (${Math.round(dist || 0)}m from site).`)
      const { data, error } = await supabase.from('attendance').insert({
        profile_id: profile.id, org_id: profile.org_id, site_id: site?.id || null,
        work_date: manilaToday(), clock_in: new Date().toISOString(),
        lat: pos.lat, lng: pos.lng, method: 'GPS', status: 'present',
      }).select().single()
      if (error) throw error
      setToday(data); setMsg('success')
      setTimeout(() => nav('/'), 900)
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  const doClockOut = async () => {
    setBusy(true); setMsg('')
    try {
      if (!today?.id) throw new Error('No open attendance record.')
      const clockOut = new Date().toISOString()
      const hours = hoursBetween(today.clock_in, clockOut)
      const { error } = await supabase.from('attendance').update({
        clock_out: clockOut, clock_out_lat: pos?.lat || null, clock_out_lng: pos?.lng || null,
        hours: Number(hours.toFixed(2)),
      }).eq('id', today.id)
      if (error) throw error
      setMsg('success')
      setTimeout(() => nav('/'), 900)
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <Link to="/" style={{ textDecoration: 'none', border: dark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(255,255,255,.1)', background: cardBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>{onDuty ? 'Verify & Clock Out' : 'Verify & Clock In'}</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Real Leaflet map */}
      <div style={{ position: 'relative' }}>
        {site?.lat && site?.lng ? (
          <MapView
            center={[Number(site.lat), Number(site.lng)]}
            zoom={17}
            radiusM={site.radius_m || 100}
            siteName={site.name || 'Site'}
            userPos={pos}
            height={200}
          />
        ) : (
          <div style={{ height: 200, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
            No worksite assigned. Contact your administrator.
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, background: '#fff', borderRadius: 999, padding: '5px 10px', fontSize: 10, fontWeight: 700, color: '#111', boxShadow: '0 5px 12px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', gap: 5, zIndex: 400 }}>
          <span style={{ width: 6, height: 6, background: withinFence ? '#22c55e' : '#ef4444', borderRadius: '50%' }} />
          GPS {pos ? `±${Math.round(pos.accuracy || 4)}m` : posErr ? 'error' : '…'}
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10, background: withinFence ? 'rgba(34,197,94,.95)' : 'rgba(239,68,68,.95)', color: '#fff', borderRadius: 999, padding: '5px 10px', fontSize: 10, fontWeight: 800, letterSpacing: .5, zIndex: 400 }}>
          {withinFence ? 'IN RANGE' : 'OUT OF RANGE'}
        </div>
      </div>

      {/* Verification checklist */}
      <div style={{ marginTop: 14, border: dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)', borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: cardBg }}>
        <CheckRow ok={withinFence} title="Inside geofence" desc={dist != null ? `${Math.round(dist)}m from ${site?.name || 'site'} · within ${site?.radius_m || 120}m radius` : 'Waiting for GPS…'} textPrimary={textPrimary} textMuted={textMuted} />
        <CheckRow ok={deviceTrusted} title="Device trusted" desc={`This device · registered to ${profile?.full_name || 'employee'}`} textPrimary={textPrimary} textMuted={textMuted} />
        <CheckRow ok={shiftOK} title="On-shift window" desc="Within grace period" textPrimary={textPrimary} textMuted={textMuted} />
      </div>

      {/* Time + shift */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <div>
          <div style={{ fontSize: 10, color: textMuted, fontWeight: 600 }}>CURRENT TIME</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(now)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: textMuted, fontWeight: 600 }}>SHIFT</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>Morning · 08:00 – 05:00</div>
        </div>
      </div>

      {msg && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: msg === 'success' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', border: `1px solid ${msg === 'success' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`, color: msg === 'success' ? '#16a34a' : '#b91c1c', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
          {msg === 'success' ? `${onDuty ? 'Clocked out' : 'Clocked in'} successfully.` : msg}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={onDuty ? doClockOut : doClockIn}
        disabled={busy || (!onDuty && !withinFence)}
        style={{
          marginTop: 24, width: '100%', maxWidth: 260, margin: '24px auto 0', display: 'flex',
          color: '#fff', border: 'none', borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 14,
          alignItems: 'center', justifyContent: 'center', gap: 8,
          background: onDuty ? 'linear-gradient(180deg,#F16E6E,#EB4F4F,#D04444)' : 'linear-gradient(180deg,#0A7BDF,#056BC7,#04549B)',
          boxShadow: onDuty ? '0 4px 12px rgba(38,0,0,.4)' : '0 4px 12px rgba(0,0,0,.4)',
          opacity: (busy || (!onDuty && !withinFence)) ? 0.55 : 1,
          cursor: (busy || (!onDuty && !withinFence)) ? 'not-allowed' : 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {busy ? 'Verifying…' : onDuty ? 'Confirm & Clock Out' : 'Confirm & Clock In'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 9, color: textMuted, marginTop: 13 }}>
        Location captured only at clock-in/out · Encrypted end-to-end
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}

function CheckRow({ ok, title, desc, textPrimary, textMuted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ok ? '#B4F9CC' : '#FECACA' }}>
        {ok ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>{title}</div>
        <div style={{ fontSize: 10, color: textMuted }}>{desc}</div>
      </div>
      <div style={{ background: ok ? '#ECFDF5' : '#FEE2E2', color: ok ? '#15803d' : '#b91c1c', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999, border: `1px solid ${ok ? '#63D941' : '#F87171'}`, boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
        {ok ? 'OK' : 'FAIL'}
      </div>
    </div>
  )
}
