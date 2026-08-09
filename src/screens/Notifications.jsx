import { useEffect, useState } from 'react'
import { ScreenHeader } from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate, fmtTime } from '../lib/util'

export default function Notifications() {
  const { profile, refreshProfile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [rows, setRows] = useState([])
  const [enabled, setEnabled] = useState(!!profile?.notifications_enabled)

  useEffect(() => {
    if (!profile?.org_id) return
    supabase.from('notifications').select('*').eq('org_id', profile.org_id).order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setRows(data || []))
  }, [profile?.org_id])

  useEffect(() => { setEnabled(!!profile?.notifications_enabled) }, [profile])

  const togglePref = async () => {
    const next = !enabled
    setEnabled(next)
    await supabase.from('profiles').update({ notifications_enabled: next }).eq('id', profile.id)
    refreshProfile()
  }

  return (
    <div style={{ padding: '8px 20px 0' }}>
      <ScreenHeader title="Notifications" back="/profile" />
      <div style={{ marginTop: 8, padding: 12, borderRadius: 14, background: dark ? 'rgba(255,255,255,.04)' : '#fff', border: `1px solid ${dark ? 'rgba(148,163,184,.15)' : '#eef0f4'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: dark ? '#e2e8f0' : '#0f172a' }}>Push notifications</div>
          <div style={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b' }}>Alerts for schedule, approvals, payroll</div>
        </div>
        <button onClick={togglePref} style={{ width: 46, height: 26, borderRadius: 999, background: enabled ? '#22c55e' : '#cbd5e1', position: 'relative', border: 'none' }}>
          <div style={{ position: 'absolute', top: 3, left: enabled ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
        </button>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, fontWeight: 800, letterSpacing: .3, color: dark ? '#94a3b8' : '#475569' }}>RECENT</div>
      <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
        {rows.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: dark ? '#94a3b8' : '#64748b', fontSize: 12 }}>No notifications yet.</div>}
        {rows.map((n) => (
          <div key={n.id} style={{ padding: 12, borderRadius: 14, background: dark ? 'rgba(255,255,255,.04)' : '#fff', border: `1px solid ${dark ? 'rgba(148,163,184,.15)' : '#eef0f4'}` }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: dark ? '#e2e8f0' : '#0f172a' }}>{n.type || 'Notification'}</div>
            <div style={{ fontSize: 12, color: dark ? '#cbd5e1' : '#334155', marginTop: 2 }}>{n.message || n.actor_name || '—'}</div>
            <div style={{ fontSize: 10, color: dark ? '#94a3b8' : '#94a3b8', marginTop: 4 }}>{fmtDate(n.created_at)} · {fmtTime(n.created_at)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
