import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { manilaToday, initials } from '../lib/util'

export default function Team() {
  const { profile, site } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [members, setMembers] = useState([])
  const [onDutyIds, setOnDutyIds] = useState(new Set())
  const [dutiesById, setDutiesById] = useState({}) // profile_id -> [siteNames]

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  useEffect(() => {
    if (!profile?.org_id) return
    ;(async () => {
      // Only show teammates assigned to the same site the current user is on.
      // If the current user has no site assigned, fall back to org-wide.
      let q = supabase
        .from('profiles')
        .select('id, full_name, avatar_url, position, employee_code, site_id')
        .eq('org_id', profile.org_id)
        .eq('is_admin', false)
        .order('full_name')
        .limit(30)
      if (profile.site_id) q = q.eq('site_id', profile.site_id)
      const { data: ppl } = await q
      setMembers(ppl || [])

      const { data: att } = await supabase
        .from('attendance')
        .select('profile_id, clock_out')
        .eq('org_id', profile.org_id)
        .eq('work_date', manilaToday())
      setOnDutyIds(new Set((att || []).filter((r) => !r.clock_out).map((r) => r.profile_id)))

      // Duties = each teammate's assigned worksite names.
      const ids = (ppl || []).map((p) => p.id)
      if (ids.length) {
        const { data: assigns } = await supabase
          .from('site_assignments')
          .select('profile_id, site:sites(name)')
          .in('profile_id', ids)
        const map = {}
        for (const a of assigns || []) {
          if (!a.site?.name) continue
          ;(map[a.profile_id] ||= []).push(a.site.name)
        }
        setDutiesById(map)
      }
    })()
  }, [profile?.org_id, profile?.site_id])

  const total = members.length
  const onDutyCount = members.filter((m) => onDutyIds.has(m.id)).length

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <Link to="/" style={{ textDecoration: 'none', border: cardBorder, background: cardBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>Team · {site?.name || 'Main Office'}</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero */}
      <div style={{ borderRadius: 20, padding: 18, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', boxShadow: '0 8px 24px rgba(34,197,94,.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>{onDutyCount} / {total}</div>
          <div style={{ fontSize: 11, opacity: .9, fontWeight: 600, marginTop: 2 }}>On duty right now</div>
          <div style={{ fontSize: 10, opacity: .8, marginTop: 4 }}>Real-time status · {site?.name || 'Main Office'}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: .5 }}>● LIVE</div>
      </div>

      <div style={{ marginTop: 18, fontWeight: 800, fontSize: 14, color: textPrimary }}>Team members</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.length === 0 && (
          <div style={{ padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 12, color: textMuted }}>No team members yet.</div>
        )}
        {members.map((m) => {
          const onDuty = onDutyIds.has(m.id)
          const duties = dutiesById[m.id] || []
          return (
            <div key={m.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', alignItems: 'flex-start', gap: 12, boxShadow: '0 2px 6px rgba(15,23,42,.05)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, overflow: 'hidden', flexShrink: 0 }}>
                {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(m.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>{m.full_name}</div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                    color: onDuty ? '#15803d' : textMuted,
                    background: onDuty ? '#DCFCE7' : (dark ? 'rgba(255,255,255,.06)' : '#f1f5f9'),
                  }}>{onDuty ? '● On duty' : 'Off'}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: dark ? '#93c5fd' : '#2563eb', marginTop: 2 }}>
                  {m.position || 'Employee'}
                </div>
                {duties.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {duties.map((d, i) => (
                      <span key={i} style={{ fontSize: 9, fontWeight: 700, color: dark ? '#e2e8f0' : '#334155', background: dark ? 'rgba(255,255,255,.06)' : '#f1f5f9', padding: '2px 7px', borderRadius: 999 }}>📍 {d}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ height: 30 }} />
    </div>
  )
}
