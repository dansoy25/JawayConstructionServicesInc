import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials, fmtDate } from '../../lib/util'
import { card, btnPrimary, btnGhost, chip, PageHeader } from './adminShared'

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'done', label: 'Done', color: '#22c55e' },
]

export default function AdminTasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    if (!profile?.org_id) return
    supabase.from('tasks').select('*, assignee:profiles!tasks_assignee_id_fkey(full_name)').eq('org_id', profile.org_id).order('created_at', { ascending: false }).limit(60).then(({ data }) => setTasks(data || []))
  }, [profile?.org_id])

  const grouped = COLUMNS.reduce((acc, c) => ({ ...acc, [c.key]: tasks.filter((t) => (t.status || 'todo') === c.key) }), {})
  const total = tasks.length
  const doneWeek = tasks.filter((t) => t.status === 'done').length

  const priorityChip = (p) => {
    const cfg = { high: { bg: '#FEE2E2', color: '#b91c1c' }, urgent: { bg: '#FEE2E2', color: '#b91c1c' }, medium: { bg: '#FEF3C7', color: '#a16207' }, low: { bg: '#DBEAFE', color: '#2563eb' } }[p || 'medium']
    return <span style={chip(cfg.bg, cfg.color)}>{(p || 'medium').charAt(0).toUpperCase() + (p || 'medium').slice(1)}</span>
  }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Tasks"
        sub={`${total} open · ${doneWeek} completed this week`}
        actions={<>
          <button style={btnPrimary}>+ Create task</button>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            <button style={{ padding: '6px 14px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>▦ Kanban</button>
            <button style={{ padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>≡ List</button>
          </div>
          <button style={btnGhost}>⬇ CSV</button>
        </>}
      />

      <div style={{ display: 'flex', gap: 12, padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search tasks…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }} />
        </div>
        <button style={btnGhost}>All assignees</button>
        <button style={btnGhost}>Any priority</button>
        <button style={btnGhost}>This week</button>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, alignSelf: 'center' }}>{total} tasks</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {COLUMNS.map((col) => (
          <div key={col.key} style={{ background: '#f8fafc', borderRadius: 12, padding: 12, minHeight: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{col.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: 999 }}>{grouped[col.key].length}</span>
              </div>
              <button style={{ background: '#dbeafe', color: '#2563eb', border: 'none', width: 22, height: 22, borderRadius: 6, cursor: 'pointer', fontWeight: 900 }}>+</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped[col.key].length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No tasks</div>
              )}
              {grouped[col.key].map((t) => (
                <div key={t.id} style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                  <div style={{ marginBottom: 8 }}>{priorityChip(t.priority)}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textDecoration: col.key === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                  {t.status === 'in_progress' && (
                    <div style={{ marginTop: 8, fontSize: 10, color: '#64748b' }}>Subtasks in progress</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 9 }}>
                      {initials(t.assignee?.full_name || '?')}
                    </div>
                    {t.due_date && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{fmtDate(t.due_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
