import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { manilaToday, fmtTime, hoursBetween, initials } from '../lib/util'

export default function Home() {
  const { profile, site } = useAuth()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const [today, setToday] = useState(null)
  const [tasks, setTasks] = useState([])

  const refresh = async () => {
    if (!profile?.id) return
    const d = manilaToday()
    const { data } = await supabase.from('attendance').select('*').eq('profile_id', profile.id).eq('work_date', d).maybeSingle()
    setToday(data)
    // Tasks assigned to this employee, newest-first, unfinished on top.
    const { data: taskRows } = await supabase.from('tasks')
      .select('id, title, description, status, priority, due_date, created_at')
      .eq('assignee_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setTasks(taskRows || [])
  }
  useEffect(() => { refresh() }, [profile?.id])

  const openTasks = tasks.filter((t) => t.status !== 'done')
  const startTask = async (t) => {
    await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', t.id)
    refresh()
  }
  const removeTask = async (t) => {
    if (!confirm('Remove this completed task from your list?')) return
    await supabase.from('tasks').delete().eq('id', t.id)
    refresh()
  }

  const onDuty = today?.clock_in && !today?.clock_out

  // Parse the employee's schedule ("HH:MM-HH:MM") — falls back to 08:00-17:00
  const schedule = parseSchedule(profile?.schedule)
  const shiftHours = Math.max(0.5, (timeToMinutes(schedule.end) - timeToMinutes(schedule.start)) / 60)
  const shiftInLabel = fmt12h(schedule.start)
  const shiftOutLabel = fmt12h(schedule.end)
  const shiftBadgeIn = schedule.start
  const shiftBadgeOut = schedule.end

  const hoursToday = onDuty ? hoursBetween(today.clock_in, new Date()) : (Number(today?.hours) || 0)
  const shiftPct = Math.min(100, (hoursToday / shiftHours) * 100)
  const hrs = String(Math.floor(hoursToday)).padStart(2, '0')
  const min = String(Math.floor((hoursToday * 60) % 60)).padStart(2, '0')

  // Clock-in schedule quick-tile: show scheduled clock-in time (or Active if past)
  const clockInHm = shiftBadgeIn
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
  const scheduledIn = timeToMinutes(shiftBadgeIn)
  const scheduleIsActive = onDuty || (nowMinutes >= scheduledIn && nowMinutes < timeToMinutes(shiftBadgeOut))

  const bg = dark ? 'linear-gradient(180deg,#0d1528,#111827)' : 'linear-gradient(180deg,#f1f5f9,#ffffff)'
  const cardBg = dark ? 'linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))' : 'linear-gradient(145deg,#ffffff 0%,#f0f9ff 100%)'
  const cardBorder = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(203,213,225,.6)'
  const textPrimary = dark ? '#e2e8f0' : '#334155'
  const textMuted = dark ? '#94a3b8' : '#64748b'

  return (
    <div style={{ background: bg, minHeight: '100%', padding: '8px 20px 0', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes tsDotGlow{0%,100%{box-shadow:0 0 4px #22ff6a}50%{box-shadow:0 0 10px 2px #22ff6a}}`}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 2px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,.26)' }}>
            {initials(profile?.full_name || 'JR')}
          </div>
          <div>
            <div style={{ fontSize: 10, color: textMuted, fontWeight: 600 }}>Good morning</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary, lineHeight: 1.1 }}>{profile?.full_name || 'Employee'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/notifications" style={{ textDecoration: 'none', width: 38, height: 38, borderRadius: 12, border: dark ? '1px solid rgba(255,255,255,.1)' : '1px solid #e2e8f0', background: dark ? 'rgba(255,255,255,.04)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 2px 6px rgba(15,23,42,.06)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dark ? '#94a3b8' : '#334155'} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
            <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, background: '#ef4444', border: '1.5px solid #fff', borderRadius: '50%' }} />
          </Link>
          <button onClick={toggle} title="Switch theme" style={{ position: 'relative', width: 66, height: 38, borderRadius: 19, border: dark ? '1px solid rgba(255,255,255,.08)' : '1px solid #e2e8f0', background: dark ? 'rgba(255,255,255,.04)' : '#f1f5f9', padding: 0, cursor: 'pointer', boxShadow: 'inset 0 1px 3px rgba(15,23,42,.06)' }}>
            <div style={{ position: 'absolute', top: 3, [dark ? 'left' : 'right']: 3, width: 30, height: 30, borderRadius: '50%', background: dark ? 'linear-gradient(135deg,#1e293b,#0f172a)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: dark ? '0 3px 10px rgba(59,130,246,.35)' : '0 3px 8px rgba(245,158,11,.45)', transition: 'all .2s' }}>
              {dark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: 'radial-gradient(120% 80% at 0% 0%,#3b82f6 0%,transparent 55%),linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%)', color: '#fff', padding: 18, boxShadow: '0 6px 20px rgba(17,17,17,.2)', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.2)', padding: '5px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: .6 }}>
            <span style={{ width: 6, height: 6, background: onDuty ? '#22ff6a' : '#94a3b8', borderRadius: '50%', animation: onDuty ? 'tsDotGlow 2s ease-in-out infinite' : 'none' }} />
            {onDuty ? `ON DUTY · ${(site?.name || 'SITE').toUpperCase()}` : 'OFF DUTY'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>
            {new Date().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div style={{ marginTop: 15, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{hrs}:{min}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>hrs today</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
          {today?.clock_in ? `Clocked in at ${fmtTime(today.clock_in)} · ${site?.name || 'Main Office'}` : 'Not clocked in yet.'}
        </div>

        <div style={{ marginTop: 14, height: 8, background: 'rgba(255,255,255,.15)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${shiftPct}%`, height: '100%', background: 'linear-gradient(90deg,#60a5fa,#22ff6a)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>
          <span>{shiftBadgeIn} IN</span><span>{shiftHours}h shift · {Math.round(shiftPct)}%</span><span>{shiftBadgeOut} OUT</span>
        </div>
      </div>

      {/* Clock In/Out button - overlapping */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -14, position: 'relative', zIndex: 3 }}>
        <Link to="/clock-in" style={{
          textDecoration: 'none',
          background: onDuty ? 'linear-gradient(180deg,#F16E6E,#EB4F4F,#D04444)' : 'linear-gradient(180deg,#0A7BDF,#056BC7,#04549B)',
          color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 14,
          fontWeight: 800, fontSize: 16,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: onDuty ? '0 4px 12px rgba(38,0,0,.65)' : '0 4px 12px rgba(36,36,36,.65)',
          minWidth: 200, textAlign: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {onDuty ? 'Clock Out' : 'Clock In'}
        </Link>
      </div>

      {/* Metric row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 15 }}>
        <Link to="/reports/tasks" style={{ textDecoration: 'none', borderRadius: 16, padding: '10px 12px', border: '1px solid rgba(59,130,246,.2)', background: dark ? 'linear-gradient(160deg,#899DA151,#334155,#899DA11A)' : 'linear-gradient(160deg,#FFE6E6BC,#FFFAFA,#8B8B8B1A)', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: dark ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.44)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#727376" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            {(() => {
              const dueSoon = tasks.filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date) <= new Date(Date.now() + 3 * 86400000)).length
              return dueSoon > 0
                ? <div style={{ fontSize: 9, fontWeight: 800, color: '#BD2C2C', padding: '3px 7px', borderRadius: 99, boxShadow: '0 4px 12px rgba(0,0,0,.2)' }}>{dueSoon} due</div>
                : <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', padding: '3px 7px', borderRadius: 99 }}>—</div>
            })()}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: dark ? '#e2e8f0' : '#022557', marginTop: 8, letterSpacing: -.5 }}>{openTasks.length}</div>
          <div style={{ fontSize: 10, color: dark ? '#94a3b8' : '#3A3B3C', fontWeight: 600 }}>Tasks to do</div>
        </Link>
        <Link to="/schedule" style={{ textDecoration: 'none', borderRadius: 16, padding: '10px 12px', border: '1px solid rgba(59,130,246,.2)', background: dark ? 'linear-gradient(160deg,#899DA151,#334155,#899DA11A)' : 'linear-gradient(160deg,#FFE6E6BC,#FFFAFA,#8B8B8B1A)', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: dark ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.44)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#727376" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: scheduleIsActive ? '#22c55e' : '#94a3b8', padding: '3px 8px', borderRadius: 999, boxShadow: '0 4px 12px rgba(0,0,0,.2)' }}>{scheduleIsActive ? 'Active' : 'Scheduled'}</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: dark ? '#e2e8f0' : '#022557', marginTop: 8, letterSpacing: -.5 }}>{shiftInLabel}</div>
          <div style={{ fontSize: 10, color: dark ? '#94a3b8' : '#3A3B3C', fontWeight: 600 }}>Clock-in schedule</div>
        </Link>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: textPrimary }}>Quick actions</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 8 }}>
        <QuickTile to="/overtime" gradient="linear-gradient(145deg,#fde9c8,#f8c471)" color="#5c3a0d" iconColor="#a16207" label="Overtime" icon={<path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>} />
        <QuickTile to="/team" gradient="linear-gradient(145deg,#dbe8ff,#7ea6f5)" color="#1e3a8a" iconColor="#2563eb" label="Team" icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>} />
        <QuickTile to="/schedule" gradient="linear-gradient(145deg,#AABCD7,#495D7C)" color="#F5EDFD" iconColor="#1E293B" label="Shifts" icon={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />
        <QuickTile to="/reports" gradient="linear-gradient(145deg,#d7f7d0,#7CD671)" color="#14532d" iconColor="#16a34a" label="Reports" icon={<><path d="M3 3h18v4H3zM3 10h18v11H3z"/></>} />
      </div>

      {/* Locations card */}
      <Link to="/reports/locations" style={{ textDecoration: 'none', background: cardBg, borderRadius: 16, padding: '10px 12px', border: dark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>Locations</div>
          <div style={{ fontSize: 10, color: textMuted }}>{site?.name || 'Main Office'} · Last verified today</div>
        </div>
        <div style={{ color: textMuted, fontSize: 14 }}>›</div>
      </Link>

      {/* Today's schedule — real per-employee data */}
      <div style={{ marginTop: 10, background: cardBg, border: cardBorder, borderRadius: 16, padding: '10px 12px', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: textPrimary }}>Today's schedule</div>
          <div style={{ fontSize: 10, color: textMuted, fontWeight: 600 }}>{new Date().toLocaleDateString('en-CA', { weekday: 'long' })}</div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 32, borderRadius: 99, background: scheduleIsActive ? '#22c55e' : '#94a3b8' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textPrimary }}>Shift · {site?.name || 'Main Office'}</div>
              <div style={{ fontSize: 10, color: textMuted }}>{shiftInLabel} – {shiftOutLabel} · {shiftHours.toFixed(1)}h</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: scheduleIsActive ? '#22c55e' : textMuted, padding: '3px 8px', borderRadius: 999, boxShadow: '0 4px 12px rgba(0,0,0,.2)' }}>{scheduleIsActive ? 'Active' : 'Scheduled'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 32, borderRadius: 99, background: '#f59e0b' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textPrimary }}>Break window</div>
              <div style={{ fontSize: 10, color: textMuted }}>1 unpaid hr · take between {shiftInLabel} and {shiftOutLabel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 32, borderRadius: 99, background: dark ? 'rgba(255,255,255,.08)' : '#e2e8f0' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: textPrimary }}>End-of-day sign-out</div>
              <div style={{ fontSize: 10, color: textMuted }}>Clock out at {shiftOutLabel} to close today's timesheet</div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: textMuted, background: dark ? 'rgba(255,255,255,.06)' : '#f1f5f9', padding: '3px 7px', borderRadius: 99 }}>{shiftOutLabel}</div>
          </div>
        </div>
      </div>

      {/* Tasks from admin */}
      <div style={{ marginTop: 12, background: cardBg, border: cardBorder, borderRadius: 16, padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: textPrimary }}>Tasks from admin</div>
            <div style={{ fontSize: 10, color: textMuted }}>{openTasks.length} open · {tasks.length - openTasks.length} done</div>
          </div>
          {openTasks.length > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999 }}>{openTasks.length}</span>
          )}
        </div>
        {tasks.length === 0 ? (
          <div style={{ padding: 14, textAlign: 'center', fontSize: 11, color: textMuted }}>
            No tasks assigned yet. Your admin can send you tasks from their dashboard.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.slice(0, 5).map((t) => {
              const pri = { urgent: '#dc2626', high: '#dc2626', medium: '#f59e0b', low: '#2563eb' }[t.priority || 'medium'] || '#94a3b8'
              const done = t.status === 'done'
              const inProgress = t.status === 'in_progress'
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: dark ? 'rgba(255,255,255,.03)' : '#f8fafc', borderRadius: 10 }}>
                  <div style={{ width: 4, height: 30, borderRadius: 2, background: done ? '#22c55e' : pri }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: textPrimary, textDecoration: done ? 'line-through' : 'none' }}>{t.title}</div>
                    <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>
                      {done ? 'Completed' : inProgress ? 'In progress · auto-completes on clock-out' : (t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}` : 'Not started')}
                      {' · '}{(t.priority || 'medium').toUpperCase()}
                    </div>
                  </div>
                  {done
                    ? <button onClick={() => removeTask(t)} title="Delete completed task" style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 14, cursor: 'pointer' }}>🗑</button>
                    : inProgress
                      ? <span style={{ fontSize: 10, fontWeight: 800, color: '#a16207', background: '#FEF3C7', padding: '4px 8px', borderRadius: 999 }}>⏱ Working</span>
                      : <button onClick={() => startTask(t)} style={{ background: pri, border: 'none', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>▶ Click to start</button>}
                </div>
              )
            })}
            {tasks.length > 5 && (
              <div style={{ textAlign: 'center', fontSize: 10, color: textMuted, paddingTop: 4 }}>+ {tasks.length - 5} more</div>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  )
}

function QuickTile({ to, gradient, color, iconColor, label, icon }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', borderRadius: 14, padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: gradient, boxShadow: '0 4px 15px rgba(0,0,0,.15)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color }}>{label}</div>
    </Link>
  )
}

// Parse "HH:MM-HH:MM" schedule string. Falls back to 08:00-17:00.
function parseSchedule(s) {
  if (typeof s === 'string') {
    const m = s.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/)
    if (m) return { start: m[1], end: m[2] }
  }
  return { start: '08:00', end: '17:00' }
}

function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + (m || 0)
}

// "13:30" -> "1:30 PM"
function fmt12h(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const pad = String(m || 0).padStart(2, '0')
  if (h === 0) return `12:${pad} AM`
  if (h < 12) return `${h}:${pad} AM`
  if (h === 12) return `12:${pad} PM`
  return `${h - 12}:${pad} PM`
}
