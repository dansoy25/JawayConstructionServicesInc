import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials, fmtDate } from '../../lib/util'
import { card, btnPrimary, btnGhost, chip, StatTile, PageHeader } from './adminShared'

export default function AdminLeave() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])

  const load = () => {
    if (!profile?.org_id) return
    supabase.from('leave_requests').select('*, profile:profiles(full_name, avatar_url), leave_type:leave_types(label, code)').eq('org_id', profile.org_id).order('created_at', { ascending: false }).limit(30).then(({ data }) => setRows(data || []))
  }
  useEffect(() => { load() }, [profile?.org_id])

  const pending = rows.filter((r) => r.status === 'pending')
  const approved = rows.filter((r) => r.status === 'approved').length
  const denied = rows.filter((r) => r.status === 'rejected' || r.status === 'declined').length

  const decide = async (id, status) => {
    await supabase.from('leave_requests').update({ status, reviewed_by: profile.id, reviewed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Leave Management"
        sub={`${pending.length} pending · ${approved} approved this month`}
        actions={<>
          <button style={btnPrimary}>≡ Leave types</button>
          <button style={btnGhost}>⬇ CSV</button>
          <button style={btnGhost}>📄 PDF</button>
        </>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatTile icon="⏱" label="PENDING" value={pending.length} sub="awaiting approval" accent="#f59e0b" />
        <StatTile icon="✓" label="APPROVED THIS MONTH" value={approved} sub="vacation · sick" accent="#22c55e" />
        <StatTile icon="✗" label="DENIED THIS MONTH" value={denied} sub="Review policy" subColor="#b91c1c" accent="#ef4444" />
        <StatTile icon="👥" label="ON LEAVE TODAY" value="3" sub="returning by Friday" accent="#2563eb" />
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Pending requests</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Review and act on team requests</div>
          </div>
          <span style={chip('#FEF3C7', '#a16207')}>● {pending.length} awaiting</span>
        </div>

        {pending.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: '#DCFCE7', color: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>All caught up</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>No pending leave requests to review.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #f1f5f9', borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                  {initials(r.profile?.full_name || '?')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.profile?.full_name} — {r.leave_type?.label || 'Leave'}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{fmtDate(r.start_date)} — {fmtDate(r.end_date)} ({r.days} days){r.reason && ` · "${r.reason}"`}</div>
                </div>
                <button onClick={() => decide(r.id, 'rejected')} style={{ padding: '6px 12px', borderRadius: 8, background: '#FEE2E2', color: '#b91c1c', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✗ Deny</button>
                <button onClick={() => decide(r.id, 'approved')} style={{ padding: '6px 12px', borderRadius: 8, background: '#DCFCE7', color: '#15803d', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Leave calendar — {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button style={{ ...btnGhost, padding: '6px 10px' }}>‹</button>
              <button style={{ ...btnGhost, padding: '6px 10px' }}>Today</button>
              <button style={{ ...btnGhost, padding: '6px 10px' }}>›</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, fontSize: 10, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 4 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '1/1', border: '1px solid #f1f5f9', borderRadius: 6, padding: 4, fontSize: 10, color: '#64748b' }}>{i + 1}</div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Leave types</div>
            <button style={btnPrimary}>+ New type</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Vacation Leave','Sick Leave','Emergency Leave','Personal Leave'].map((n, i) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ['#16a34a','#2563eb','#f59e0b','#a855f7'][i] }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{n}</span>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>✎</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
