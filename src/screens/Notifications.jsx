import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate, fmtTime } from '../lib/util'

// Icon + label for each notification kind we insert from the code base.
const KIND_META = {
  task_assigned:     { icon: '📋', label: 'New task assigned',      tone: '#2563eb' },
  payslip_sent:      { icon: '💰', label: 'Payslip ready',           tone: '#16a34a' },
  payslip_requested: { icon: '📨', label: 'Payslip request',         tone: '#f59e0b' },
  leave_decision:    { icon: '📅', label: 'Leave update',            tone: '#a855f7' },
  ot_approved:       { icon: '⏱',  label: 'Overtime approved',       tone: '#f97316' },
  default:           { icon: '🔔', label: 'Notification',             tone: '#64748b' },
}

export default function Notifications() {
  const { profile, refreshProfile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const nav = useNavigate()
  const [rows, setRows] = useState([])
  const [enabled, setEnabled] = useState(!!profile?.notifications_enabled)

  const load = () => {
    if (!profile?.id) return
    // Owner-scoped read (with an org fallback for older rows that had no profile_id).
    supabase.from('notifications')
      .select('*')
      .or(`profile_id.eq.${profile.id},and(profile_id.is.null,org_id.eq.${profile.org_id})`)
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => setRows(data || []))
  }

  // Mark everything unread as read the moment the screen opens.
  const markAllRead = async () => {
    if (!profile?.id) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() })
      .eq('profile_id', profile.id).is('read_at', null)
  }

  useEffect(() => {
    load()
    markAllRead()
    // eslint-disable-next-line
  }, [profile?.id])

  useEffect(() => { setEnabled(!!profile?.notifications_enabled) }, [profile])

  const togglePref = async () => {
    const next = !enabled
    setEnabled(next)
    await supabase.from('profiles').update({ notifications_enabled: next }).eq('id', profile.id)
    refreshProfile()
  }

  const remove = async (id) => {
    await supabase.from('notifications').delete().eq('id', id)
    load()
  }

  const open = (n) => {
    if (n.link_to) nav(n.link_to)
  }

  return (
    <div style={{ padding: '8px 20px 0' }}>
      <ScreenHeader title="Notifications" back="/profile" />
      <div style={{ marginTop: 8, padding: 12, borderRadius: 14, background: dark ? 'rgba(255,255,255,.04)' : '#fff', border: `1px solid ${dark ? 'rgba(148,163,184,.15)' : '#eef0f4'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: dark ? '#e2e8f0' : '#0f172a' }}>Push notifications</div>
          <div style={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b' }}>Alerts for tasks, payslips, and approvals</div>
        </div>
        <button onClick={togglePref} style={{ width: 46, height: 26, borderRadius: 999, background: enabled ? '#22c55e' : '#cbd5e1', position: 'relative', border: 'none' }}>
          <div style={{ position: 'absolute', top: 3, left: enabled ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
        </button>
      </div>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: .3, color: dark ? '#94a3b8' : '#475569' }}>RECENT</div>
        {rows.length > 0 && (
          <button onClick={load} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
        )}
      </div>
      <div style={{ marginTop: 8, display: 'grid', gap: 8, paddingBottom: 30 }}>
        {rows.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: dark ? '#94a3b8' : '#64748b', fontSize: 12, background: dark ? 'rgba(255,255,255,.03)' : '#fff', borderRadius: 14, border: `1px dashed ${dark ? 'rgba(148,163,184,.2)' : '#e2e8f0'}` }}>
            You're all caught up.
          </div>
        )}
        {rows.map((n) => {
          const meta = KIND_META[n.type] || KIND_META.default
          const isUnread = !n.read_at
          return (
            <div key={n.id} style={{
              padding: 12, borderRadius: 14,
              background: dark ? 'rgba(255,255,255,.04)' : '#fff',
              border: `1px solid ${isUnread ? meta.tone : (dark ? 'rgba(148,163,184,.15)' : '#eef0f4')}`,
              display: 'flex', gap: 12, alignItems: 'flex-start',
              boxShadow: isUnread ? `0 4px 12px ${meta.tone}22` : 'none',
              cursor: n.link_to ? 'pointer' : 'default',
            }}
              onClick={() => open(n)}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${meta.tone}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: dark ? '#e2e8f0' : '#0f172a' }}>{n.title || meta.label}</div>
                  {isUnread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.tone, flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 12, color: dark ? '#cbd5e1' : '#334155', marginTop: 2 }}>{n.message || '—'}</div>
                {n.body && <div style={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b', marginTop: 4, whiteSpace: 'pre-wrap' }}>{n.body}</div>}
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>{fmtDate(n.created_at)} · {fmtTime(n.created_at)}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); remove(n.id) }} title="Dismiss" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
