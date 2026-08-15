import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials, fmtDate } from '../../lib/util'
import { btnPrimary, btnGhost, chip, PageHeader } from './adminShared'
import { exportCsv, todayStamp } from '../../lib/exports'

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'done', label: 'Done', color: '#22c55e' },
]

export default function AdminTasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [createDefault, setCreateDefault] = useState('todo')

  const load = () => {
    if (!profile?.org_id) return
    supabase.from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name)')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => setTasks(data || []))
    supabase.from('profiles')
      .select('id, full_name')
      .eq('org_id', profile.org_id)
      .eq('is_admin', false)
      .order('full_name')
      .then(({ data }) => setEmployees(data || []))
  }
  useEffect(load, [profile?.org_id])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (q && !((t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))) return false
      if (priorityFilter !== 'all' && (t.priority || 'medium') !== priorityFilter) return false
      if (assigneeFilter !== 'all' && t.assignee_id !== assigneeFilter) return false
      return true
    })
  }, [tasks, search, priorityFilter, assigneeFilter])

  const grouped = COLUMNS.reduce((acc, c) => ({ ...acc, [c.key]: visible.filter((t) => (t.status || 'todo') === c.key) }), {})
  const total = visible.length
  const doneWeek = visible.filter((t) => t.status === 'done').length

  const priorityChip = (p) => {
    const cfg = { high: { bg: '#FEE2E2', color: '#b91c1c' }, urgent: { bg: '#FEE2E2', color: '#b91c1c' }, medium: { bg: '#FEF3C7', color: '#a16207' }, low: { bg: '#DBEAFE', color: '#2563eb' } }[p || 'medium']
    return <span style={chip(cfg.bg, cfg.color)}>{(p || 'medium').charAt(0).toUpperCase() + (p || 'medium').slice(1)}</span>
  }

  const openCreate = (status = 'todo') => { setCreateDefault(status); setCreateOpen(true) }

  const doExportCsv = () => {
    exportCsv(
      `tasks-${todayStamp()}.csv`,
      ['Title', 'Description', 'Status', 'Priority', 'Assignee', 'Due Date', 'Created'],
      visible.map((t) => [
        t.title, t.description || '', t.status || 'todo', t.priority || 'medium',
        t.assignee?.full_name || '', t.due_date || '', t.created_at,
      ]),
    )
  }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Tasks"
        sub={`${total} open · ${doneWeek} completed this week`}
        actions={<>
          <button onClick={() => openCreate('todo')} style={btnPrimary}>+ Create task</button>
          <button onClick={load} style={btnGhost}>↻ Refresh</button>
          <button onClick={doExportCsv} style={btnGhost}>⬇ CSV</button>
        </>}
      />

      <div style={{ display: 'flex', gap: 12, padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12 }} />
        </div>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} style={selStyle}>
          <option value="all">All assignees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={selStyle}>
          <option value="all">Any priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
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
              <button
                onClick={() => openCreate(col.key)}
                title={`Add task to ${col.label}`}
                style={{ background: '#dbeafe', color: '#2563eb', border: 'none', width: 22, height: 22, borderRadius: 6, cursor: 'pointer', fontWeight: 900 }}
              >+</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped[col.key].length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No tasks</div>
              )}
              {grouped[col.key].map((t) => (
                <TaskCard key={t.id} t={t} priorityChip={priorityChip} onChanged={load} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {createOpen && (
        <CreateTaskModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); load() }}
          orgId={profile?.org_id}
          createdBy={profile?.id}
          employees={employees}
          defaultStatus={createDefault}
        />
      )}
    </div>
  )
}

function TaskCard({ t, priorityChip, onChanged }) {
  const nextStatus = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo'
  const advance = async (e) => {
    e.stopPropagation()
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', t.id)
    onChanged()
  }
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
      <div style={{ marginBottom: 8 }}>{priorityChip(t.priority)}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
      {t.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>{t.description}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 9 }}>
            {initials(t.assignee?.full_name || '?')}
          </div>
          {t.due_date && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{fmtDate(t.due_date)}</span>}
        </div>
        <button
          onClick={advance}
          title={`Move to ${nextStatus.replace('_', ' ')}`}
          style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
        >→ {nextStatus === 'todo' ? 'Reset' : nextStatus === 'in_progress' ? 'Start' : 'Complete'}</button>
      </div>
    </div>
  )
}

function CreateTaskModal({ orgId, createdBy, employees, defaultStatus, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState(defaultStatus)
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setErr('Title is required.'); return }
    setBusy(true); setErr('')
    try {
      const { error } = await supabase.from('tasks').insert({
        org_id: orgId,
        title: title.trim(),
        description: description.trim() || null,
        priority, status,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        created_by: createdBy || null,
      })
      if (error) throw error
      onCreated()
    } catch (e) { setErr(e.message || 'Create failed.') }
    setBusy(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Create task</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
          <Label label="TITLE *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Deliver rebar to Site 3" style={inputStyle} />
          </Label>
          <Label label="DESCRIPTION">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional details" style={{ ...inputStyle, resize: 'vertical' }} />
          </Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Label label="STATUS">
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </Label>
            <Label label="PRIORITY">
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Label label="ASSIGNEE">
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={inputStyle}>
                <option value="">— Unassigned —</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </Label>
            <Label label="DUE DATE">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
            </Label>
          </div>
          {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? .6 : 1 }}>{busy ? 'Creating…' : 'Create task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Label({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600 }
const selStyle = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer', outline: 'none' }
