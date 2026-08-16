import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/util'

// ─── Date helpers ────────────────────────────────────────────────────
function toIso(d) { return d.toISOString().slice(0, 10) }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d }
function rangeFor(scope) {
  const now = new Date()
  if (scope === 'today')  return { start: toIso(now), end: toIso(now), days: 1 }
  if (scope === 'week')   return { start: toIso(daysAgo(6)), end: toIso(now), days: 7 }
  return { start: toIso(daysAgo(29)), end: toIso(now), days: 30 } // month
}

// ─── Card style + reusable buttons ───────────────────────────────────
const card = { background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }
const tabBtn = { padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer' }

export default function AdminDashboard() {
  const { profile } = useAuth()
  const { accent, setAccent, accents, accentColor } = useTheme()
  const nav = useNavigate()

  const [scope, setScope] = useState('today')        // today | week | month
  const [trendScope, setTrendScope] = useState('7d') // 7d | 30d
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [stats, setStats] = useState({ attendance: 0, employees: 0, pendingLeave: 0, payroll: 0 })
  const [activity, setActivity] = useState([])
  const [trend, setTrend] = useState([])

  const scopeRange = useMemo(() => rangeFor(scope), [scope])
  const trendDays = trendScope === '7d' ? 7 : 30

  // ─── Load stats + activity — reruns when scope changes ──────────────
  useEffect(() => {
    if (!profile?.org_id) return
    ;(async () => {
      const { start, end } = scopeRange
      const [emp, att, leave, payRuns, recent] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).eq('is_admin', false),
        supabase.from('attendance').select('profile_id').eq('org_id', profile.org_id).gte('work_date', start).lte('work_date', end),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).eq('status', 'pending'),
        supabase.from('payroll_runs').select('net').eq('org_id', profile.org_id).eq('status', 'completed').gte('period_end', start).lte('period_end', end),
        supabase.from('attendance').select('*, profile:profiles(full_name)').eq('org_id', profile.org_id).order('created_at', { ascending: false }).limit(6),
      ])
      const distinctPresent = new Set((att.data || []).map((r) => r.profile_id)).size
      const totalNet = (payRuns.data || []).reduce((s, r) => s + Number(r.net || 0), 0)
      setStats({
        attendance: distinctPresent,
        employees: emp.count || 0,
        pendingLeave: leave.count || 0,
        payroll: totalNet,
      })
      setActivity((recent.data || []).map((r) => ({ id: r.id, name: r.profile?.full_name || 'Someone', action: r.clock_out ? 'clocked out' : 'clocked in', when: r.clock_out || r.clock_in })))
    })()
  }, [profile?.org_id, scope, scopeRange])

  // ─── Load Expenses trend — daily $ totals for the selected window ────
  useEffect(() => {
    if (!profile?.org_id) return
    ;(async () => {
      const startDate = daysAgo(trendDays - 1)
      const { data: rows } = await supabase.from('expenses').select('spent_on, amount')
        .eq('org_id', profile.org_id).gte('spent_on', toIso(startDate))
      const buckets = Array.from({ length: trendDays }, () => 0)
      for (const r of rows || []) {
        const idx = Math.max(0, Math.min(trendDays - 1, Math.floor((new Date(r.spent_on) - startDate) / 86400000)))
        buckets[idx] += Number(r.amount || 0)
      }
      setTrend(buckets)
    })()
  }, [profile?.org_id, trendDays])

  const trendLabels = useMemo(() => {
    return Array.from({ length: trendDays }, (_, i) => {
      const d = daysAgo(trendDays - 1 - i)
      if (i === trendDays - 1) return 'Today'
      return d.toLocaleDateString('en-CA', { timeZone: 'America/Regina', weekday: 'short' })
    })
  }, [trendDays])

  const scopeLabel = scope === 'today' ? 'today' : scope === 'week' ? 'in the last 7 days' : 'in the last 30 days'

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Good morning, {profile?.full_name?.split(' ')[0] || 'Admin'}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-CA', { timeZone: 'America/Regina', weekday: 'long', month: 'long', day: 'numeric' })} · showing metrics {scopeLabel}.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setCustomizeOpen(true)} style={pillBtn()}>⚙ Customize</button>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            {['today', 'week', 'month'].map((k) => (
              <button
                key={k}
                onClick={() => setScope(k)}
                style={{ ...tabBtn, background: scope === k ? accentColor : 'transparent', color: scope === k ? '#fff' : '#64748b' }}
              >{k[0].toUpperCase() + k.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 gradient stat cards — attendance + employees + pending leave + payroll (all real) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <GradientCard bg="linear-gradient(135deg,#16a34a,#65a30d)" label="ATTENDANCE" value={`${stats.attendance}/${stats.employees}`} sub={`${Math.round((stats.attendance / Math.max(1, stats.employees)) * 100)}% present · ${scope}`} icon="👥" />
        <GradientCard bg="linear-gradient(135deg,#84cc16,#65a30d)" label="EMPLOYEES" value={stats.employees} sub="on the roster" icon="🧑‍🔧" />
        <GradientCard bg="linear-gradient(135deg,#f59e0b,#b45309)" label="PENDING LEAVE" value={stats.pendingLeave} sub="awaiting your review" icon="🏖" />
        <GradientCard bg="linear-gradient(135deg,#dc2626,#0f172a)" label="PAYROLL PAID" value={`$${(stats.payroll / 1000).toFixed(1)}k`} sub={`${scope} · click to run`} icon="💰" onClick={() => nav('/admin/payroll')} />
      </div>

      {/* Trend + Expense breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Receipts / Expenses trend</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Last {trendDays} days · daily spend</div>
            </div>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2, fontSize: 11 }}>
              {['7d', '30d'].map((k) => (
                <button
                  key={k}
                  onClick={() => setTrendScope(k)}
                  style={{ ...tabBtn, padding: '5px 10px', background: trendScope === k ? accentColor : 'transparent', color: trendScope === k ? '#fff' : '#64748b' }}
                >{k.toUpperCase()}</button>
              ))}
            </div>
          </div>
          {trend.length > 0 && trend.some((v) => v > 0) ? (
            <>
              {(() => {
                const maxV = Math.max(1, ...trend)
                const y = (v) => 150 - (v / maxV) * 130
                const w = trend.length > 1 ? 400 / (trend.length - 1) : 400
                return (
                  <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="expFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor={accentColor} stopOpacity=".35"/>
                        <stop offset="1" stopColor={accentColor} stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {trend.length > 1 && (
                      <>
                        <path d={`M0,${y(trend[0])} ${trend.map((v, i) => `L${i * w},${y(v)}`).join(' ')} L400,160 L0,160 Z`} fill="url(#expFill)"/>
                        <path d={`M0,${y(trend[0])} ${trend.map((v, i) => `L${i * w},${y(v)}`).join(' ')}`} stroke={accentColor} strokeWidth="2.5" fill="none"/>
                      </>
                    )}
                    {trend.map((v, i) => <circle key={i} cx={i * w} cy={y(v)} r="3" fill={accentColor}/>)}
                  </svg>
                )
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                <span>Total: ${trend.reduce((s, v) => s + v, 0).toLocaleString('en-CA', { maximumFractionDigits: 0 })}</span>
                <span>Peak: ${Math.max(...trend).toLocaleString('en-CA', { maximumFractionDigits: 0 })}</span>
              </div>
            </>
          ) : (
            <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12, gap: 6 }}>
              <span>No receipts logged yet.</span>
              <button onClick={() => nav('/admin/expenses')} style={{ ...pillBtn(), fontSize: 11 }}>+ Add receipt</button>
            </div>
          )}
        </div>

        <ExpenseBreakdown />
      </div>

      {/* Activity + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Recent Activity</div>
          </div>
          <div>
            {activity.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No recent activity.</div>
            )}
            {activity.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                  {initials(a.name)}
                </div>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{a.name}</span> <span style={{ color: '#64748b' }}>{a.action}</span>
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 90, textAlign: 'right' }}>{a.when ? new Date(a.when).toLocaleTimeString('en-CA', { timeZone: 'America/Regina', hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Quick actions</div>
          {[
            { icon: '👤', label: 'Add employee', to: '/admin/employees' },
            { icon: '▶', label: 'Run payroll',   to: '/admin/payroll' },
            { icon: '＋', label: 'Create task',   to: '/admin/tasks' },
            { icon: '📍', label: 'Add worksite',  to: '/admin/gps' },
            { icon: '🧾', label: 'Add expense',   to: '/admin/expenses' },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => nav(a.to)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}
            >
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {customizeOpen && <CustomizeDialog onClose={() => setCustomizeOpen(false)} accents={accents} accent={accent} setAccent={setAccent} />}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────

function CustomizeDialog({ onClose, accents, accent, setAccent }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Customize dashboard</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Pick your app accent — applies immediately to charts and buttons.</div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '8px 0' }}>
          {accents.map((a) => (
            <button
              key={a.key}
              onClick={() => setAccent(a.key)}
              title={a.label}
              style={{
                width: 46, height: 46, borderRadius: '50%',
                background: a.color,
                border: accent === a.key ? '4px solid #fff' : '3px solid rgba(0,0,0,.08)',
                boxShadow: accent === a.key ? `0 0 0 3px ${a.color}` : '0 2px 6px rgba(0,0,0,.15)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 6, textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
          Selected: {accents.find((a) => a.key === accent)?.label}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--accent, #dc2626)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  )
}

function ExpenseBreakdown() {
  return (
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Payroll breakdown</div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>{new Date().toLocaleDateString('en-CA', { timeZone: 'America/Regina', month: 'long', year: 'numeric' })}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="130" height="130" viewBox="0 0 42 42">
          <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#e2e8f0" strokeWidth="6"/>
          {[
            { color: '#dc2626', pct: 55 },  // Wages
            { color: '#f59e0b', pct: 18 },  // Federal
            { color: '#2563eb', pct: 12 },  // Provincial
            { color: '#22c55e', pct: 9 },   // CPP
            { color: '#a855f7', pct: 6 },   // EI
          ].reduce((acc, seg) => {
            const el = <circle key={seg.color} cx="21" cy="21" r="15.9" fill="transparent" stroke={seg.color} strokeWidth="6" strokeDasharray={`${seg.pct} ${100 - seg.pct}`} strokeDashoffset={-acc.off} transform="rotate(-90 21 21)"/>
            acc.els.push(el); acc.off += seg.pct; return acc
          }, { els: [], off: 0 }).els}
          <text x="21" y="23" textAnchor="middle" fontSize="4" fontWeight="700" fill="#64748b">split</text>
        </svg>
        <div style={{ flex: 1, display: 'grid', gap: 8, fontSize: 12 }}>
          {[
            { label: 'Wages',          pct: '55%', color: '#dc2626' },
            { label: 'Federal Tax',    pct: '18%', color: '#f59e0b' },
            { label: 'Provincial Tax', pct: '12%', color: '#2563eb' },
            { label: 'CPP',            pct: '9%',  color: '#22c55e' },
            { label: 'EI',             pct: '6%',  color: '#a855f7' },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                <span style={{ color: '#334155', fontWeight: 600 }}>{r.label}</span>
              </div>
              <span style={{ color: '#64748b', fontWeight: 700 }}>{r.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GradientCard({ bg, label, value, sub, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: bg, borderRadius: 16, padding: 18, color: '#fff',
        boxShadow: '0 8px 20px rgba(0,0,0,.15)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
        <span>{label}</span>
        <span style={{ fontSize: 14 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: .85, marginTop: 4 }}>{sub}</div>
    </div>
  )
}

const pillBtn = () => ({ padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' })
