import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate } from '../lib/util'

// Employee-facing task list. Read-only — the shift itself flips status
// (todo→in_progress on clock-in, in_progress→done on clock-out). Employees
// cannot toggle; they can only delete a completed task from their history.
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

  const removeTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  const pending = rows.filter((r) => r.status !== 'done')
  const done = rows.filter((r) => r.status === 'done')

  const stateChip = (s) => {
    if (s === 'in_progress') {
      return <span style={{ fontSize: 9, fontWeight: 800, color: '#a16207', background: '#FEF3C7', padding: '3px 10px', borderRadius: 999 }}>⏱ Pending</span>
    }
    return <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b', background: dark ? 'rgba(255,255,255,.06)' : '#e2e8f0', padding: '3px 10px', borderRadius: 999 }}>Waiting</span>
  }

  const stateIcon = (s) => {
    // Fills in for the checkbox — a purely visual status icon, not a button.
    if (s === 'in_progress') {
      return (
        <div style={{ width: 22, height: 22, borderRadius: 6, background: '#FEF3C7', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} />
        </div>
      )
    }
    return <div style={{ width: 22, height: 22, borderRadius: 6, border: '2px solid #94a3b8', background: 'transparent', flexShrink: 0 }} />
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

      <div style={{ fontSize: 11, color: textMuted, padding: '0 4px 10px', lineHeight: 1.5 }}>
        These tasks start automatically when you clock in and complete when you clock out. Only the admin can add or remove tasks — you can delete finished tasks from your history below.
      </div>

      <div style={{ marginTop: 4, fontWeight: 800, fontSize: 14, color: textPrimary }}>Recent</div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pending.length === 0 && (
          <div style={{ padding: 14, borderRadius: 14, background: cardBg, border: cardBorder, textAlign: 'center', fontSize: 12, color: textMuted }}>No pending tasks.</div>
        )}
        {pending.map((t) => (
          <div key={t.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'default' }}>
            {stateIcon(t.status)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: textPrimary }}>{t.title}</div>
                {stateChip(t.status)}
              </div>
              {t.description && (
                <div style={{ fontSize: 11, color: textPrimary, opacity: .85, marginTop: 6, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {t.description}
                </div>
              )}
              <div style={{ fontSize: 10, color: textMuted, marginTop: 6 }}>
                {t.due_date ? `Due ${fmtDate(t.due_date)}` : 'No due date'}{t.priority ? ` · ${t.priority} priority` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div style={{ marginTop: 20, fontWeight: 800, fontSize: 14, color: textPrimary }}>Completed</div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.slice(0, 10).map((t) => (
              <div key={t.id} style={{ padding: 12, borderRadius: 14, background: cardBg, border: cardBorder, display: 'flex', alignItems: 'flex-start', gap: 12, opacity: .8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#22c55e', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: textPrimary, textDecoration: 'line-through' }}>{t.title}</div>
                    <button
                      onClick={() => removeTask(t.id)}
                      title="Delete finished task"
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 14, cursor: 'pointer' }}
                    >🗑</button>
                  </div>
                  {t.description && (
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 4, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{t.description}</div>
                  )}
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
