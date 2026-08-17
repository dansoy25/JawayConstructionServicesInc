import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { fmtDate, fmtTime } from '../../lib/util'
import { card, btnGhost, btnPrimary, PageHeader } from './adminShared'

const KIND_META = {
  task_assigned:          { icon: '📋', label: 'Task assigned',            tone: '#2563eb' },
  payslip_sent:           { icon: '💰', label: 'Payslip sent',             tone: '#16a34a' },
  payslip_requested:      { icon: '📨', label: 'Payslip request',          tone: '#f59e0b' },
  password_reset_request: { icon: '🔒', label: 'Password reset request',   tone: '#dc2626' },
  leave_decision:         { icon: '📅', label: 'Leave update',             tone: '#a855f7' },
  ot_approved:            { icon: '⏱',  label: 'Overtime approved',        tone: '#f97316' },
  default:                { icon: '🔔', label: 'Notification',              tone: '#64748b' },
}

export default function AdminNotifications() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const [rows, setRows] = useState([])

  const load = () => {
    if (!profile?.id) return
    supabase.from('notifications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setRows(data || []))
  }
  const markAllRead = async () => {
    if (!profile?.id) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() })
      .eq('profile_id', profile.id).is('read_at', null)
  }
  useEffect(() => {
    load(); markAllRead()
    // eslint-disable-next-line
  }, [profile?.id])

  const remove = async (id) => {
    await supabase.from('notifications').delete().eq('id', id)
    load()
  }
  const clearAll = async () => {
    if (!confirm('Clear every notification from your inbox?')) return
    await supabase.from('notifications').delete().eq('profile_id', profile.id)
    load()
  }
  const open = (n) => { if (n.link_to) nav(n.link_to) }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Notifications"
        sub={`${rows.length} in your inbox`}
        actions={<>
          <button onClick={load} style={btnGhost}>↻ Refresh</button>
          {rows.length > 0 && <button onClick={clearAll} style={{ ...btnGhost, color: '#dc2626', borderColor: 'rgba(220,38,38,.35)' }}>Clear all</button>}
        </>}
      />

      {rows.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          You're all caught up. Notifications appear here when employees request payslips, password resets, or when leave requests come in.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map((n) => {
            const meta = KIND_META[n.type] || KIND_META.default
            const isUnread = !n.read_at
            return (
              <div key={n.id}
                onClick={() => open(n)}
                style={{
                  ...card, padding: 14,
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  cursor: n.link_to ? 'pointer' : 'default',
                  borderColor: isUnread ? meta.tone : undefined,
                  boxShadow: isUnread ? `0 4px 12px ${meta.tone}22` : undefined,
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${meta.tone}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{n.title || meta.label}</div>
                    {isUnread && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: meta.tone, padding: '2px 8px', borderRadius: 999 }}>NEW</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>{n.message || '—'}</div>
                  {n.body && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, whiteSpace: 'pre-wrap' }}>{n.body}</div>}
                  {n.actor_name && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>from {n.actor_name}</div>}
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{fmtDate(n.created_at)} · {fmtTime(n.created_at)}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(n.id) }} title="Dismiss"
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', padding: 4 }}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
