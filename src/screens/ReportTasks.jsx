import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate } from '../lib/util'

export default function ReportTasks() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [rows, setRows] = useState([])

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('tasks').select('*').eq('assignee_id', profile.id).order('created_at', { ascending: false }).limit(30)
    setRows(data || [])
  }
  useEffect(() => { load() }, [profile?.id])

  const toggle = async (id, current) => {
    const next = current === 'done' ? 'todo' : 'done'
    await supabase.from('tasks').update({ status: next }).eq('id', id)
    load()
  }

  const pending = rows.filter((r) => r.status !== 'done')
  const done = rows.filter((r) => r.status === 'done')

  const priorityChip = (p) => {
    const cfg = { high: { bg: '#FEE2E2', color: '#b91c1c' }, medium: { bg: '#FEF3C7', color: '#a16207' }, low: { bg: '#DBEAFE', color: '#2563eb' } }[p || 'medium']
    return <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 999 }}>{p || 'medium'}</span>
  }

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px' }}>
        <Link to="/reports" style={{ textDecoration: 'none', border: cardBorder, background: cardBg, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textPrimary} strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>Tasks To Do</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ marginTop: 4, fontWeight: 800, fontSize: 14, color: textPrimary }}>Recent</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pending.length === 0 && (
          <div style={{ padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 12, color: textMuted }}>No pending tasks.</div>
        )}
        {pending.map((t) => (
          <div key={t.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => toggle(t.id, t.status)} style={{
              width: 20, height: 20, borderRadius: 6, border: '2px solid #94a3b8', background: 'transparent', cursor: 'pointer', flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{t.title}</div>
              <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>
                {t.due_date ? `Due ${fmtDate(t.due_date)}` : 'No due date'}{t.priority ? ` · ${t.priority} priority` : ''}
              </div>
            </div>
            {priorityChip(t.priority)}
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div style={{ marginTop: 20, fontWeight: 800, fontSize: 14, color: textPrimary }}>Completed</div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.slice(0, 5).map((t) => (
              <div key={t.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', alignItems: 'center', gap: 12, opacity: .6 }}>
                <button onClick={() => toggle(t.id, t.status)} style={{
                  width: 20, height: 20, borderRadius: 6, background: '#22c55e', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: textPrimary, textDecoration: 'line-through' }}>{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ height: 30 }} />
    </div>
  )
}
