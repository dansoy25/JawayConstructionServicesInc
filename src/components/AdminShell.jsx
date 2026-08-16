import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/util'

const SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
    ],
  },
  {
    label: 'WORKFORCE',
    items: [
      { to: '/admin/attendance', label: 'Attendance', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
      { to: '/admin/employees', label: 'Employees', icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></> },
      { to: '/admin/tasks', label: 'Tasks', icon: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></> },
      { to: '/admin/leave', label: 'Leave Management', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></> },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { to: '/admin/payroll', label: 'Payroll', icon: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></> },
      { to: '/admin/payslips', label: 'Payslips', icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
      { to: '/admin/expenses', label: 'Receipts / Expenses', icon: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M8 4v4"/></> },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/admin/gps', label: 'GPS', icon: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></> },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: <><path d="M18 20V10M12 20V4M6 20v-6"/></> },
      { to: '/admin/settings', label: 'Settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></> },
    ],
  },
]

const CRUMB_LABEL = Object.fromEntries(SECTIONS.flatMap(s => s.items.map(i => [i.to, { label: i.label, section: s.label }])))

export default function AdminShell() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const nav = useNavigate()
  const current = CRUMB_LABEL[location.pathname] || { label: 'Dashboard', section: 'MAIN' }

  const doSignOut = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--app-bg, #f8fafc)', fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'linear-gradient(180deg,#0d1528 0%,#0b1220 100%)',
        color: '#e2e8f0',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,.04)',
      }}>
        {/* Brand: one-line title + inline Jaway construction logo */}
        <div style={{ padding: '18px 16px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: -.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Jaway Construction <span style={{ color: '#ef4444' }}>Services Inc.</span>
          </div>
          <JawayLogo />
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2, color: '#94a3b8', marginTop: 6 }}>BUSINESS OPERATIONS</div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          {SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1.5, padding: '0 12px 8px' }}>{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                    textDecoration: 'none',
                    color: isActive ? '#60a5fa' : '#94a3b8',
                    background: isActive ? 'linear-gradient(90deg,rgba(37,99,235,.18),rgba(37,99,235,.06))' : 'transparent',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* User footer */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, flexShrink: 0 }}>
              {initials(profile?.full_name || 'JJ')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'Admin'}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Owner</div>
            </div>
            <button onClick={doSignOut} title="Sign out" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6, borderRadius: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>{current.section === 'MAIN' ? 'Main' : current.section === 'WORKFORCE' ? 'Workforce' : current.section === 'FINANCE' ? 'Finance' : current.section === 'OPERATIONS' ? 'Operations' : 'System'}</span>
            <span>›</span>
            <span style={{ color: '#0f172a', fontWeight: 800 }}>{current.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TopbarSearch />
            <button style={{ ...iconBtn, position: 'relative' }} onClick={() => nav('/admin/leave')} title="Pending leave requests">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
              <span style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }} />
            </button>
            <button
              onClick={() => nav('/admin/profile')}
              title="Your admin profile"
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden',
                background: profile?.avatar_url ? '#f1f5f9' : 'linear-gradient(135deg,#fce7f3,#fbcfe8)',
                color: '#831843', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12,
              }}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials(profile?.full_name || 'JJ')}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

const iconBtn = {
  width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9',
  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}

// Small inline SVG rendition of the Jaway Construction Services logo.
// If a real PNG is dropped at /public/jaway-logo.png we render that instead —
// the deploy already handles the fallback if the fetch fails.
function JawayLogo() {
  const [imgOk, setImgOk] = useState(true)
  const src = `${import.meta.env.BASE_URL}jaway-logo.png`
  if (imgOk) {
    return (
      <div style={{
        margin: '10px auto 0',
        width: 72, height: 72,
        borderRadius: 16,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        // Layered red gradient glow underneath the rounded-square badge.
        boxShadow:
          '0 0 0 2px rgba(239,68,68,.35), ' +
          '0 6px 14px rgba(239,68,68,.55), ' +
          '0 14px 28px rgba(220,38,38,.35)',
        overflow: 'hidden',
      }}>
        <img
          src={src}
          alt="Jaway Construction Services"
          onError={() => setImgOk(false)}
          style={{ width: '86%', height: '86%', objectFit: 'contain' }}
        />
      </div>
    )
  }
  // SVG fallback — kept tighter and more detailed to mirror the real crest.
  return (
    <svg viewBox="0 0 140 132" width="82" height="78" style={{ display: 'block', margin: '8px auto 0' }} aria-hidden="true">
      {/* red flag / hammer LEFT — angled outward */}
      <path d="M28 8 L48 4 L46 18 L34 26 Z" fill="#ef4444" />
      {/* red flag / hammer RIGHT — angled outward */}
      <path d="M112 8 L92 4 L94 18 L106 26 Z" fill="#ef4444" />
      {/* central sharp peak */}
      <path d="M70 4 L58 22 L82 22 Z" fill="#0f172a" />
      {/* double-roof silhouette (two overlapping gables like the real crest) */}
      <path d="M4 52 L36 22 L70 46 L104 22 L136 52 L136 74 L4 74 Z" fill="#0f172a" />
      {/* extended eaves */}
      <path d="M4 52 L4 84 L20 68 Z" fill="#0f172a" />
      <path d="M136 52 L136 84 L120 68 Z" fill="#0f172a" />
      {/* left window */}
      <rect x="30" y="56" width="12" height="14" fill="#fff" rx="1"/>
      <path d="M36 56 L36 70 M30 63 L42 63" stroke="#0f172a" strokeWidth="1"/>
      {/* right window */}
      <rect x="98" y="56" width="12" height="14" fill="#fff" rx="1"/>
      <path d="M104 56 L104 70 M98 63 L110 63" stroke="#0f172a" strokeWidth="1"/>
      {/* arched door */}
      <path d="M62 62 L62 74 L78 74 L78 62 Q78 56 70 56 Q62 56 62 62 Z" fill="#fff"/>
      {/* diamond outline (dark chevron border) */}
      <path d="M32 96 L70 132 L108 96 L70 82 Z" fill="#0f172a"/>
      {/* red diamond core */}
      <path d="M50 100 L70 122 L90 100 L70 90 Z" fill="#ef4444"/>
      {/* J */}
      <text x="70" y="112" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Georgia, serif">J</text>
    </svg>
  )
}

// Global search — opens on click, queries employees / sites / tasks / expenses,
// jumps to the matching page when a result is picked.
function TopbarSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState({ employees: [], sites: [], tasks: [], expenses: [] })
  const [busy, setBusy] = useState(false)
  const { profile } = useAuth()
  const nav = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (!open || !profile?.org_id) return
    const term = q.trim()
    if (!term) { setResults({ employees: [], sites: [], tasks: [], expenses: [] }); return }
    setBusy(true)
    const p = `%${term}%`
    Promise.all([
      supabase.from('profiles').select('id, full_name, employee_code, position').eq('org_id', profile.org_id).or(`full_name.ilike.${p},employee_code.ilike.${p},position.ilike.${p}`).limit(5),
      supabase.from('sites').select('id, name').eq('org_id', profile.org_id).ilike('name', p).limit(5),
      supabase.from('tasks').select('id, title, status').eq('org_id', profile.org_id).ilike('title', p).limit(5),
      supabase.from('expenses').select('id, description, amount, spent_on, category').eq('org_id', profile.org_id).or(`description.ilike.${p},category.ilike.${p}`).limit(5),
    ]).then(([e, s, t, x]) => {
      setResults({
        employees: e.data || [], sites: s.data || [],
        tasks: t.data || [], expenses: x.data || [],
      })
      setBusy(false)
    })
  }, [q, open, profile?.org_id])

  const go = (path) => { nav(path); setOpen(false); setQ('') }
  const total = results.employees.length + results.sites.length + results.tasks.length + results.expenses.length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((v) => !v)} title="Search" style={iconBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 42, right: 0, width: 380, maxHeight: 480, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.18)', overflow: 'hidden', zIndex: 200 }}>
          <div style={{ padding: 10, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employees, sites, tasks, receipts…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#0f172a' }} />
            {busy && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>…</span>}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 420 }}>
            {!q.trim() ? (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Type to search across the whole workspace.</div>
            ) : total === 0 && !busy ? (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No matches.</div>
            ) : (
              <>
                <ResultGroup label="Employees" items={results.employees.map((r) => ({ id: r.id, label: r.full_name, sub: `${r.employee_code || ''} · ${r.position || ''}` }))} onGo={() => go('/admin/employees')} />
                <ResultGroup label="Sites" items={results.sites.map((r) => ({ id: r.id, label: r.name, sub: '' }))} onGo={() => go('/admin/gps')} />
                <ResultGroup label="Tasks" items={results.tasks.map((r) => ({ id: r.id, label: r.title, sub: r.status }))} onGo={() => go('/admin/tasks')} />
                <ResultGroup label="Receipts" items={results.expenses.map((r) => ({ id: r.id, label: r.description || r.category || '(no note)', sub: `$${r.amount} · ${r.spent_on}` }))} onGo={() => go('/admin/expenses')} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ResultGroup({ label, items, onGo }) {
  if (!items.length) return null
  return (
    <div>
      <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: 1, background: '#fafafa' }}>{label.toUpperCase()}</div>
      {items.map((it) => (
        <button key={it.id} onClick={onGo} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{it.label}</div>
          {it.sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{it.sub}</div>}
        </button>
      ))}
    </div>
  )
}
