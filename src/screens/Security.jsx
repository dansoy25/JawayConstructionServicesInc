import { useEffect, useState } from 'react'
import { ScreenHeader } from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate, fmtTime } from '../lib/util'

// Password/PIN self-service is intentionally removed. Employees request a
// reset here and an admin performs the actual reset from the Employees page.
// Every request also fans out a notification to every admin in the org.
export default function Security() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState(null) // most-recent unfulfilled request
  const [past, setPast] = useState([])

  const load = async () => {
    if (!profile?.id) return
    // Latest 5 password-reset notifications this employee has fired,
    // read back from the notifications table where profile_id = admin_id
    // and metadata->>requested_by = current user. Simple: we filter by type.
    const { data } = await supabase.from('notifications')
      .select('*')
      .eq('type', 'password_reset_request')
      .eq('org_id', profile.org_id)
      .contains('metadata', { requested_by: profile.id })
      .order('created_at', { ascending: false })
      .limit(5)
    const rows = data || []
    setPast(rows)
    setPending(rows.find((r) => !r.read_at) || null)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [profile?.id])

  const submit = async (e) => {
    e.preventDefault()
    if (!profile?.org_id || !profile?.id) return
    setBusy(true); setMsg('')
    try {
      const { data: admins, error: adminErr } = await supabase.from('profiles')
        .select('id').eq('org_id', profile.org_id).eq('is_admin', true)
      if (adminErr) throw adminErr
      if (!admins?.length) throw new Error('No admin found in your organization.')

      const rows = admins.map((a) => ({
        org_id: profile.org_id,
        profile_id: a.id,                         // admin gets the notif
        type: 'password_reset_request',
        title: 'Password reset requested',
        message: `${profile.full_name || 'An employee'} needs a password reset`,
        body: reason.trim() || null,
        actor_id: profile.id,
        actor_name: profile.full_name || null,
        metadata: { requested_by: profile.id, employee_code: profile.employee_code || null, reason: reason.trim() || null },
        link_to: '/admin/employees',
      }))
      const { error } = await supabase.from('notifications').insert(rows)
      if (error) throw error
      setMsg('Request sent to admin. They will reset your password and get back to you.')
      setReason('')
      load()
    } catch (e) { setMsg(`Request failed: ${e.message || e}`) }
    setBusy(false)
  }

  const bgCard = dark ? 'rgba(255,255,255,.04)' : '#fff'
  const bordCard = `1px solid ${dark ? 'rgba(148,163,184,.15)' : '#eef0f4'}`
  const tPrim = dark ? '#e2e8f0' : '#0f172a'
  const tMute = dark ? '#94a3b8' : '#64748b'

  return (
    <div style={{ padding: '8px 20px 30px' }}>
      <ScreenHeader title="Security & access" back="/profile" />

      {/* Info banner — self-service change is disabled */}
      <div style={{ marginTop: 8, padding: 14, borderRadius: 14, background: dark ? 'rgba(59,130,246,.08)' : '#eff6ff', border: `1px solid ${dark ? 'rgba(59,130,246,.25)' : '#bfdbfe'}`, color: dark ? '#93c5fd' : '#1e40af' }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>🔒 Password managed by admin</div>
        <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.45 }}>
          For your security, only your admin can change your password. If you forgot it or need a new one, send a request below — an admin will reset it and share the new password with you.
        </div>
      </div>

      {/* Request card */}
      <form onSubmit={submit} style={{ marginTop: 12, padding: 14, borderRadius: 16, background: bgCard, border: bordCard, display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: tPrim }}>Request password reset</div>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: tMute, letterSpacing: .4 }}>REASON (OPTIONAL)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Forgot my PIN, phone got wiped"
            style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${dark ? 'rgba(148,163,184,.25)' : '#e2e8f0'}`, background: dark ? 'rgba(255,255,255,.05)' : '#fff', color: tPrim, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </label>
        {pending && (
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.35)', color: '#a16207', fontSize: 11, fontWeight: 700 }}>
            ⏱ Waiting on admin — a previous request from {fmtDate(pending.created_at)} · {fmtTime(pending.created_at)} is still pending.
          </div>
        )}
        {msg && (
          <div style={{ padding: '10px 12px', borderRadius: 10, background: msg.startsWith('Request sent') ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${msg.startsWith('Request sent') ? '#86efac' : '#FCA5A5'}`, color: msg.startsWith('Request sent') ? '#15803d' : '#b91c1c', fontSize: 12, fontWeight: 700 }}>
            {msg}
          </div>
        )}
        <button type="submit" disabled={busy} style={{
          padding: '12px 14px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg,#dc2626,#f97316)', color: '#fff',
          fontSize: 13, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
        }}>{busy ? 'Sending…' : '📨 Send request to admin'}</button>
      </form>

      {/* History */}
      {past.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: tMute, letterSpacing: .4, marginBottom: 6 }}>YOUR REQUESTS</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {past.map((r) => (
              <div key={r.id} style={{ padding: 10, borderRadius: 12, background: bgCard, border: bordCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tPrim }}>{fmtDate(r.created_at)} · {fmtTime(r.created_at)}</div>
                  {r.body && <div style={{ fontSize: 10, color: tMute, marginTop: 2 }}>{r.body}</div>}
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: r.read_at ? '#15803d' : '#a16207', background: r.read_at ? '#DCFCE7' : '#FEF3C7', padding: '3px 8px', borderRadius: 999 }}>
                  {r.read_at ? '✓ Seen' : '⏱ Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
