import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ERROR_BANNERS = {
  'no-profile': {
    title: 'This account has no employee profile',
    body: 'You were signed out because your login exists but no employee record is linked to it. Ask your administrator to add you in the Employees dashboard, then try again.',
  },
}

export default function AdminLogin() {
  const { signInWithPin, session } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const errorCode = new URLSearchParams(location.search).get('e')
  const banner = errorCode ? ERROR_BANNERS[errorCode] : null

  const [companyCode, setCompanyCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (session) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    if (!companyCode.trim() || !username.trim() || !password) {
      setErr('Enter company code, username, and password.')
      return
    }
    setErr(''); setBusy(true)
    try {
      await signInWithPin(companyCode.trim(), username.trim(), password)
      nav('/', { replace: true })
    } catch (error) {
      setErr(error.message || 'Sign-in failed.')
    }
    setBusy(false)
  }

  return (
    <div style={{
      width: '100vw', minHeight: '100dvh', display: 'flex',
      background: 'linear-gradient(160deg,#070b14 0%,#0d1528 40%,#111827 100%)',
      color: '#fff', fontFamily: "'Inter',system-ui,sans-serif", overflow: 'hidden', position: 'relative',
    }}>
      <style>{`
        @keyframes tsSpinSlow{to{transform:rotate(360deg)}}
        @keyframes tsSpinMed{to{transform:rotate(360deg)}}
        @keyframes tsSpinFast{to{transform:rotate(360deg)}}
        @keyframes tsPulse{0%,100%{opacity:.35}50%{opacity:.9}}
        @keyframes tsWave{0%{transform:translateY(0)}15%{transform:translateY(-5px)}30%{transform:translateY(0)}100%{transform:translateY(0)}}
        .ts-orbit-d{transform-origin:50% 50%;animation:tsSpinSlow 40s linear infinite}
        .ts-hand-h-d{transform-origin:50% 50%;animation:tsSpinSlow 120s linear infinite}
        .ts-hand-m-d{transform-origin:50% 50%;animation:tsSpinMed 30s linear infinite}
        .ts-hand-s-d{transform-origin:50% 50%;animation:tsSpinFast 6s linear infinite}
        .ts-pulse-d{animation:tsPulse 3s ease-in-out infinite}
        .ts-wave span{display:inline-block;animation:tsWave 6s ease-in-out infinite}
        .ts-input-d:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(37,99,235,.2)}
        .ts-input-d::placeholder{color:rgba(148,163,184,.55);font-weight:600}
        .ts-btn-primary-d:hover{filter:brightness(1.1);transform:translateY(-1px);transition:.15s}
        .ts-sso-d:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15)}
        @media (max-width: 900px) {
          .ts-admin-left { display: none !important; }
          .ts-admin-right {
            flex: 1 !important;
            padding-top: max(env(safe-area-inset-top), 32px) !important;
            padding-bottom: max(env(safe-area-inset-bottom), 32px) !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
      `}</style>

      {/* LEFT PANEL — brand + clock */}
      <div className="ts-admin-left" style={{
        flex: 1.1,
        background: 'radial-gradient(120% 60% at 10% 0%,rgba(37,99,235,.35) 0%,transparent 55%),radial-gradient(80% 50% at 100% 100%,rgba(16,185,129,.2) 0%,transparent 65%),linear-gradient(160deg,#0d1528 0%,#111827 100%)',
        padding: '36px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden', minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, zIndex: 5, position: 'relative' }}>
          <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1.2, color: '#fff', marginRight: 7 }}>Jaway Construction</span>
          <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1.2, background: 'linear-gradient(135deg,#60a5fa 0%,#10b981 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 20px rgba(16,185,129,.6))' }}>Services Incorporated</span>
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 520, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="ts-wave" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', marginBottom: 14 }}>
            {'EVERY MINUTE · ACCOUNTED'.split('').map((c, i) => (
              <span key={i} style={{ animationDelay: `${(i * 0.03).toFixed(2)}s` }}>{c === ' ' ? ' ' : c}</span>
            ))}
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, color: '#fff', letterSpacing: -1.3 }}>Your shift starts here.</div>
          <div style={{ marginTop: 14, fontSize: 15, color: 'rgba(148,163,184,.9)', lineHeight: 1.5, maxWidth: 460 }}>
            Sign in with your credentials — we'll verify your location and log your clock-in securely from any workstation.
          </div>

          {/* Time widget */}
          <div style={{ marginTop: 24, display: 'inline-flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '18px 22px', backdropFilter: 'blur(20px)', boxShadow: '0 10px 40px rgba(0,0,0,.3)', alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 12 }}>JC</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .6 }}>CURRENT TIME</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: -.5, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                  {now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                  {now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 10, color: 'rgba(148,163,184,.9)' }}>Designed and Developed by TingSync</div>
        </div>

        <div style={{ fontSize: 11, color: '#475569', zIndex: 5, position: 'relative' }}>
          © TingSync · <span style={{ color: '#60a5fa' }}>Attendance Policy</span>
        </div>

        {/* Rotating clock decoration */}
        <svg viewBox="0 0 400 400" fill="none" style={{ position: 'absolute', right: -80, bottom: -80, width: 520, height: 520, pointerEvents: 'none', filter: 'drop-shadow(0 0 40px rgba(37,99,235,.2))', zIndex: 1, opacity: .7 }}>
          <defs>
            <linearGradient id="tsRingD" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3b82f6" stopOpacity=".5"/>
              <stop offset="1" stopColor="#10b981" stopOpacity=".2"/>
            </linearGradient>
            <radialGradient id="tsGlowD" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#3b82f6" stopOpacity=".15"/>
              <stop offset="1" stopColor="#10b981" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="180" fill="url(#tsGlowD)"/>
          <circle cx="200" cy="200" r="170" stroke="url(#tsRingD)" strokeWidth="1.5" strokeDasharray="1 6"/>
          <circle cx="200" cy="200" r="150" stroke="rgba(59,130,246,.15)" strokeWidth="1"/>
          <g stroke="rgba(59,130,246,.25)" strokeWidth="2" strokeLinecap="round">
            <line x1="200" y1="52" x2="200" y2="68"/>
            <line x1="200" y1="332" x2="200" y2="348"/>
            <line x1="52" y1="200" x2="68" y2="200"/>
            <line x1="332" y1="200" x2="348" y2="200"/>
          </g>
          <g className="ts-hand-h-d"><rect x="197" y="130" width="6" height="80" rx="3" fill="rgba(148,163,184,.4)"/></g>
          <g className="ts-hand-m-d"><rect x="198.5" y="90" width="3" height="120" rx="1.5" fill="rgba(59,130,246,.5)"/></g>
          <g className="ts-hand-s-d"><rect x="199.5" y="70" width="1.5" height="140" fill="#10b981"/></g>
          <circle className="ts-pulse-d" cx="200" cy="200" r="6" fill="#10b981"/>
          <circle cx="200" cy="200" r="2.5" fill="#fff"/>
        </svg>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="ts-admin-right" style={{
        flex: 0.9,
        background: 'linear-gradient(180deg,#0d1528,#111827)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 64px', position: 'relative', overflowY: 'auto', minWidth: 0,
      }}>
        <div style={{ maxWidth: 460, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: '#60a5fa' }}>ADMIN SIGN-IN</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', padding: '5px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, color: '#10b981' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,.8)' }} />
              LIVE
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', letterSpacing: -.8 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>Enter your credentials to start your shift.</div>

          {banner && (
            <div style={{
              marginTop: 20, padding: '12px 14px', borderRadius: 12,
              background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
              color: '#fca5a5',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>⚠ {banner.title}</div>
              <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>{banner.body}</div>
            </div>
          )}

          {/* Social logins intentionally removed per requirements */}
          <div style={{ height: 24 }} />

          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 6 }}>COMPANY CODE</div>
              <input className="ts-input-d" type="text" value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())} placeholder="JAWAY-0026"
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '13px 16px', color: '#e2e8f0', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', letterSpacing: .5 }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 6 }}>EMPLOYEE ID</div>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: 15 }}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
                <input className="ts-input-d" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin"
                  autoCapitalize="none" autoCorrect="off"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid rgba(37,99,235,.25)', background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '13px 16px 13px 40px', color: '#e2e8f0', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4, marginBottom: 6 }}>PASSWORD</div>
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: 15 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input className="ts-input-d" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid rgba(37,99,235,.25)', background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '13px 16px 13px 40px', color: '#e2e8f0', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', letterSpacing: 4 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 22px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8', fontWeight: 600, cursor: 'pointer' }}>
                <span onClick={() => setRemember(!remember)} style={{ width: 18, height: 18, borderRadius: 6, background: remember ? 'linear-gradient(135deg,#2563eb,#0ea5e9)' : 'rgba(255,255,255,.04)', border: remember ? 'none' : '1px solid rgba(255,255,255,.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: remember ? '0 2px 8px rgba(37,99,235,.4)' : 'none' }}>
                  {remember && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </span>
                Remember this device
              </label>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Forgot? Contact administrator</div>
            </div>

            {err && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', fontSize: 12, fontWeight: 600 }}>{err}</div>}

            <button type="submit" disabled={busy} className="ts-btn-primary-d" style={{
              width: '100%', background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', border: 'none',
              borderRadius: 14, padding: 16, fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
              cursor: busy ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(37,99,235,.4), inset 0 1px 0 rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: busy ? 0.6 : 1,
            }}>
              {busy ? 'Signing in…' : 'Sign in & Clock In'}
              {!busy && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 20 }}>
            By signing in you agree to the <span style={{ color: '#60a5fa', fontWeight: 700 }}>Attendance Policy</span> and <span style={{ color: '#60a5fa', fontWeight: 700 }}>Privacy Notice</span>
          </div>

          <Link to="/employee" style={{
            display: 'block', textAlign: 'center', marginTop: 20, textDecoration: 'none',
            fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: '#60a5fa',
          }}>
            GO TO EMPLOYEE SIGN-IN →
          </Link>
        </div>
      </div>
    </div>
  )
}

