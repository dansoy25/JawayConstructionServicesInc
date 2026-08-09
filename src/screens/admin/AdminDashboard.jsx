import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { manilaToday, fmtTime, initials } from '../../lib/util'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ attendance: 0, employees: 0, pendingLeave: 0, sales: 48290, expenses: 12480, payroll: 782000 })
  const [activity, setActivity] = useState([])
  const [trend, setTrend] = useState([85,87,86,89,90,92,94])

  useEffect(() => {
    if (!profile?.org_id) return
    ;(async () => {
      const d = manilaToday()
      const [{ count: att }, { count: emp }, { count: leave }, { data: recent }] = await Promise.all([
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).eq('work_date', d),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).eq('is_admin', false),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).eq('status', 'pending'),
        supabase.from('attendance').select('*, profile:profiles(full_name)').eq('org_id', profile.org_id).order('created_at', { ascending: false }).limit(6),
      ])
      setStats((s) => ({ ...s, attendance: att || 0, employees: emp || 0, pendingLeave: leave || 0 }))
      setActivity((recent || []).map((r) => ({ id: r.id, name: r.profile?.full_name || 'Someone', action: r.clock_out ? 'clocked out' : 'clocked in', when: r.clock_out || r.clock_in, tag: r.clock_out ? 'Verified' : 'Verified' })))
    })()
  }, [profile?.org_id])

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Good morning, {profile?.full_name?.split(' ')[0] || 'Admin'}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })} · here's what's happening today.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={pillBtn(false)}>⚙ Customize</button>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
            <button style={{ ...tabBtn, background: '#2563eb', color: '#fff' }}>Today</button>
            <button style={tabBtn}>Week</button>
            <button style={tabBtn}>Month</button>
          </div>
          <button style={pillBtn(false)}>⬇ Export</button>
        </div>
      </div>

      {/* 4 gradient stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <GradientCard bg="linear-gradient(135deg,#16a34a,#65a30d)" label="ATTENDANCE" value={`${stats.attendance}/${stats.employees}`} sub={`${Math.round((stats.attendance / Math.max(1, stats.employees)) * 100)}% · +2 vs yesterday`} icon="👥" />
        <GradientCard bg="linear-gradient(135deg,#84cc16,#65a30d)" label="SALES" value={`$${(stats.sales / 1000).toFixed(2)}k`.replace('.00k', 'k')} sub="⋯ 12.4% vs yesterday" icon="🛒" />
        <GradientCard bg="linear-gradient(135deg,#0d9488,#0f766e)" label="EXPENSES" value={`$${stats.expenses.toLocaleString()}`} sub="+3.2% vs yesterday" icon="💳" />
        <GradientCard bg="linear-gradient(135deg,#b45309,#9a3412)" label="PAYROLL" value={`$${(stats.payroll / 1000).toFixed(0)}K`} sub="Run payroll →" icon="💰" />
      </div>

      {/* Trend + Expense breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Attendance trend</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Last 7 days</div>
            </div>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2, fontSize: 11 }}>
              <button style={{ ...tabBtn, padding: '5px 10px', background: '#2563eb', color: '#fff' }}>7D</button>
              <button style={{ ...tabBtn, padding: '5px 10px' }}>30D</button>
            </div>
          </div>
          <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#3b82f6" stopOpacity=".3"/>
                <stop offset="1" stopColor="#3b82f6" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={`M0,${160 - trend[0] * 1.4} ${trend.map((v, i) => `L${(i * 400) / (trend.length - 1)},${160 - v * 1.4}`).join(' ')} L400,160 L0,160 Z`} fill="url(#trendFill)"/>
            <path d={`M0,${160 - trend[0] * 1.4} ${trend.map((v, i) => `L${(i * 400) / (trend.length - 1)},${160 - v * 1.4}`).join(' ')}`} stroke="#2563eb" strokeWidth="2.5" fill="none"/>
            {trend.map((v, i) => <circle key={i} cx={(i * 400) / (trend.length - 1)} cy={160 - v * 1.4} r="3" fill="#2563eb"/>)}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
            {['Wed','Thu','Fri','Sat','Sun','Mon','Today'].map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Expense breakdown</div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>{new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg width="130" height="130" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#e2e8f0" strokeWidth="6"/>
              {[
                { color: '#3b82f6', pct: 38 },
                { color: '#a855f7', pct: 24 },
                { color: '#22c55e', pct: 18 },
                { color: '#f59e0b', pct: 12 },
                { color: '#94a3b8', pct: 8 },
              ].reduce((acc, seg) => {
                const dash = seg.pct
                const el = <circle key={seg.color} cx="21" cy="21" r="15.9" fill="transparent" stroke={seg.color} strokeWidth="6" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-acc.off} transform="rotate(-90 21 21)"/>
                acc.els.push(el); acc.off += dash; return acc
              }, { els: [], off: 0 }).els}
              <text x="21" y="23" textAnchor="middle" fontSize="4" fontWeight="700" fill="#64748b">spent</text>
            </svg>
            <div style={{ flex: 1, display: 'grid', gap: 8, fontSize: 12 }}>
              {[
                { label: 'Salaries', pct: '38%', color: '#3b82f6' },
                { label: 'Operations', pct: '24%', color: '#a855f7' },
                { label: 'Utilities', pct: '18%', color: '#22c55e' },
                { label: 'Supplies', pct: '12%', color: '#f59e0b' },
                { label: 'Other', pct: '8%', color: '#94a3b8' },
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
      </div>

      {/* Activity + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Recent Activity</div>
            <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>View all</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activity.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No recent activity.</div>
            )}
            {activity.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                  {initials(a.name)}
                </div>
                <div style={{ flex: 1, fontSize: 13, color: '#0f172a' }}>
                  <span style={{ fontWeight: 700 }}>{a.name}</span> <span style={{ color: '#64748b' }}>{a.action}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d', background: '#DCFCE7', padding: '2px 10px', borderRadius: 999 }}>{a.tag}</span>
                <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 50, textAlign: 'right' }}>just now</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Quick actions</div>
          {[
            { icon: '👤', label: 'Add employee' },
            { icon: '▶', label: 'Run payroll' },
            { icon: '＋', label: 'Create task' },
            { icon: '$', label: 'Add expense' },
          ].map((a) => (
            <button key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
          <div style={{ marginTop: 12, fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: 1 }}>UPCOMING</div>
          <div style={{ marginTop: 6, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📅</span>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>Payroll cutoff</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const card = { background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }
const pillBtn = () => ({ padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' })
const tabBtn = { padding: '6px 14px', border: 'none', background: 'transparent', color: '#64748b', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer' }

function GradientCard({ bg, label, value, sub, icon }) {
  return (
    <div style={{ background: bg, borderRadius: 16, padding: 18, color: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
        <span>{label}</span>
        <span style={{ fontSize: 14 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: .85, marginTop: 4 }}>{sub}</div>
    </div>
  )
}
