import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signInWithPin, session } = useAuth()
  const nav = useNavigate()
  const [companyCode, setCompanyCode] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [pin, setPin] = useState('')
  const [keep, setKeep] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  const addDigit = (d) => setPin((p) => (p.length < 6 ? p + d : p))
  const clearPin = () => setPin('')
  const backspace = () => setPin((p) => p.slice(0, -1))

  const submit = async (e) => {
    e?.preventDefault()
    if (!companyCode.trim() || !employeeId.trim() || pin.length !== 6) {
      setErr('Enter company code, username, and 6-digit PIN.')
      return
    }
    setErr(''); setBusy(true)
    try {
      await signInWithPin(companyCode.trim(), employeeId.trim(), pin)
      nav('/', { replace: true })
    } catch (error) {
      setErr(error.message || 'Sign-in failed.')
    }
    setBusy(false)
  }

  return (
    <div
      className="ts-login-root"
      style={{
        height: '100dvh',
        display: 'flex', flexDirection: 'column',
        background: 'radial-gradient(120% 60% at 10% 0%,rgba(220,38,38,.28) 0%,transparent 55%),radial-gradient(90% 60% at 100% 10%,rgba(249,115,22,.22) 0%,transparent 60%),radial-gradient(80% 50% at 50% 100%,rgba(16,185,129,.15) 0%,transparent 65%),linear-gradient(160deg,#070b14 0%,#0d1528 40%,#111827 100%)',
        color: '#fff', fontFamily: "'Inter',system-ui,sans-serif",
        position: 'relative', overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <style>{`
        @keyframes tsSpinSlow{to{transform:rotate(360deg)}}
        @keyframes tsSpinMed{to{transform:rotate(360deg)}}
        @keyframes tsSpinFast{to{transform:rotate(360deg)}}
        @keyframes tsPulse{0%,100%{opacity:.35}50%{opacity:.9}}
        @keyframes tsCaret{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes tsWave{0%{transform:translateY(0)}15%{transform:translateY(-5px)}30%{transform:translateY(0)}100%{transform:translateY(0)}}
        .ts-hand-h{transform-origin:50% 50%;animation:tsSpinSlow 120s linear infinite}
        .ts-hand-m{transform-origin:50% 50%;animation:tsSpinMed 30s linear infinite}
        .ts-hand-s{transform-origin:50% 50%;animation:tsSpinFast 6s linear infinite}
        .ts-pulse{animation:tsPulse 3s ease-in-out infinite}
        .ts-wave span{display:inline-block;animation:tsWave 6s ease-in-out infinite}
        .ts-login-input::placeholder{color:rgba(148,163,184,.55);font-weight:600;letter-spacing:1px}
        /* Frame is a proper phone silhouette on desktop, edge-to-edge on mobile. */
        .ts-login-frame {
          flex: 1;
          width: 100%;
          display: flex; flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        @media (min-width: 769px) {
          .ts-login-root {
            padding: 24px;
            align-items: center;
            justify-content: center;
          }
          .ts-login-frame {
            flex: none;
            width: 390px;
            height: 100%;
            max-height: 844px;
            border-radius: 40px;
            box-shadow: 0 30px 80px -20px rgba(0,0,0,.7), 0 0 60px rgba(220,38,38,.12);
            border: 1px solid rgba(255,255,255,.06);
          }
        }
      `}</style>

      {/* All layout for this frame lives in .ts-login-frame CSS above so the
          desktop media query can override without inline-style specificity fights. */}
      <div className="ts-login-frame">
        {/* TOP HERO SECTION */}
        <div style={{ position: 'relative', padding: '20px 24px 12px', flexShrink: 0 }}>
          {/* Clock decoration behind the text */}
          <svg viewBox="0 0 400 400" fill="none" style={{
            position: 'absolute', left: 60, top: 5, width: 300, height: 300,
            pointerEvents: 'none', filter: 'drop-shadow(0 0 40px rgba(220,38,38,.28))',
            zIndex: 0, opacity: 0.7,
          }}>
            <defs>
              <linearGradient id="tsRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ef4444" stopOpacity=".5"/>
                <stop offset="1" stopColor="#10b981" stopOpacity=".2"/>
              </linearGradient>
              <radialGradient id="tsGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#ef4444" stopOpacity=".1"/>
                <stop offset="1" stopColor="#10b981" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="180" fill="url(#tsGlow)"/>
            <circle cx="200" cy="200" r="170" stroke="url(#tsRing)" strokeWidth="1.5" strokeDasharray="1 6"/>
            <circle cx="200" cy="200" r="150" stroke="rgba(239,68,68,.18)" strokeWidth="1"/>
            <g className="ts-hand-h"><rect x="197" y="130" width="6" height="80" rx="3" fill="rgba(148,163,184,.4)"/></g>
            <g className="ts-hand-m"><rect x="198.5" y="90" width="3" height="120" rx="1.5" fill="rgba(239,68,68,.6)"/></g>
            <g className="ts-hand-s"><rect x="199.5" y="70" width="1.5" height="140" fill="#10b981"/></g>
            <circle className="ts-pulse" cx="200" cy="200" r="6" fill="#10b981"/>
            <circle cx="200" cy="200" r="2.5" fill="#fff"/>
          </svg>

          {/* Brand */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.6, color: '#fff', textShadow: '0 2px 18px rgba(255,255,255,.25)' }}>Jaway Construction </span>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.6, background: 'linear-gradient(135deg,#fca5a5 0%,#dc2626 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 20px rgba(220,38,38,.6))' }}>Services Inc.</span>
          </div>

          {/* Jaway crest inside a soft cream disc so the black+red silhouette pops */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <div style={{
              width: 92, height: 92, borderRadius: '50%',
              background: 'radial-gradient(circle at 50% 45%, #fffbeb 0%, #fef3c7 65%, #fde68a 100%)',
              boxShadow: '0 8px 22px rgba(220,38,38,.35), inset 0 0 0 1px rgba(220,38,38,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img
                src={`${import.meta.env.BASE_URL}jaway-logo.png`}
                alt="Jaway Construction Services"
                style={{ width: '82%', height: '82%', objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.25))' }}
                onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }}
              />
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 2, marginTop: 20 }}>
            <div className="ts-wave" style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)' }}>
              {'EVERY MINUTE · ACCOUNTED'.split('').map((c, i) => (
                <span key={i} style={{ animationDelay: `${(i * 0.03).toFixed(2)}s` }}>{c === ' ' ? ' ' : c}</span>
              ))}
            </div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>Your Shift Starts Here.</div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: 'rgba(226,232,240,.72)', lineHeight: 1.4 }}>
              Sign in with your credentials — we'll verify your location and log your clock-in securely.
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>Designed and Developed By TingSync</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', padding: '3px 9px', borderRadius: 999, fontSize: 9, fontWeight: 800, color: '#10b981' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,.8)' }} />
                LIVE
              </div>
            </div>
          </div>
        </div>

        {/* CARD SECTION — fills remaining space, no internal scroll */}
        <div style={{
          flex: 1, minHeight: 0,
          background: 'linear-gradient(180deg,#0d1528,#111827)',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '14px 20px 18px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -20px 40px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06)',
          color: '#e2e8f0',
        }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: '#f87171' }}>EMPLOYEE SIGN-IN</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, color: '#f1f5f9' }}>Welcome back</div>
              </div>
              <button type="submit" disabled={busy} style={{
                flexShrink: 0,
                background: 'linear-gradient(135deg,#dc2626,#f97316)', color: '#fff', border: 'none',
                borderRadius: 10, padding: '9px 14px', fontWeight: 800, fontSize: 12,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 16px rgba(220,38,38,.4), inset 0 1px 0 rgba(255,255,255,.15)',
                cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: busy ? 0.6 : 1,
              }}>
                {busy ? '…' : 'Sign in'}
                {!busy && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
              </button>
            </div>

            {/* Company Code */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>COMPANY CODE</div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid rgba(220,38,38,.28)', borderRadius: 10, padding: '9px 12px', background: 'rgba(255,255,255,.04)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                <input
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  placeholder="JAWAY-0026"
                  autoCapitalize="characters" autoCorrect="off"
                  className="ts-login-input"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, fontWeight: 700, letterSpacing: 1, minWidth: 0 }}
                />
              </div>
            </div>

            {/* Employee ID */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>EMPLOYEE ID</div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid rgba(220,38,38,.28)', borderRadius: 10, padding: '9px 12px', background: 'rgba(255,255,255,.04)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
                <input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="EMP-001"
                  autoCapitalize="none" autoCorrect="off"
                  className="ts-login-input"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, fontWeight: 600, minWidth: 0 }}
                />
              </div>
            </div>

            {/* PIN boxes */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>6-DIGIT PIN</div>
              <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
                {[0,1,2,3,4,5].map((i) => {
                  const filled = i < pin.length
                  const active = i === pin.length
                  return (
                    <div key={i} style={{
                      height: 38, borderRadius: 10,
                      border: `1.5px solid ${filled ? 'rgba(220,38,38,.4)' : active ? 'rgba(239,68,68,.55)' : 'rgba(255,255,255,.06)'}`,
                      background: filled || active ? 'rgba(220,38,38,.10)' : 'rgba(255,255,255,.02)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 800, color: '#f87171',
                      boxShadow: active ? '0 0 0 3px rgba(220,38,38,.18)' : 'none',
                      position: 'relative',
                    }}>
                      {filled ? '•' : active ? <div style={{ width: 2, height: 18, background: '#ef4444', borderRadius: 2, animation: 'tsCaret 1.1s ease-in-out infinite', boxShadow: '0 0 6px 1px rgba(220,38,38,.7)' }} /> : null}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Keep me signed in + forgot */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#94a3b8', fontWeight: 600, fontSize: 11, cursor: 'pointer' }} onClick={() => setKeep(!keep)}>
              <span style={{
                width: 15, height: 15, borderRadius: 4,
                background: keep ? 'linear-gradient(135deg,#dc2626,#f97316)' : 'rgba(255,255,255,.04)',
                border: keep ? 'none' : '1px solid rgba(255,255,255,.15)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: keep ? '0 2px 8px rgba(220,38,38,.4)' : 'none',
                flexShrink: 0,
              }}>
                {keep && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </span>
              Keep me signed in
            </label>

            {err && <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', fontSize: 11, fontWeight: 600 }}>{err}</div>}

            {/* Numeric keypad — fills remaining vertical space */}
            <div style={{ flex: 1, minHeight: 0, marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridAutoRows: '1fr', gap: 6 }}>
              {[1,2,3,4,5,6,7,8,9].map((n) => (
                <button key={n} type="button" onClick={() => addDigit(String(n))} style={keyBtn}>{n}</button>
              ))}
              <button type="button" onClick={clearPin} style={{ ...keyBtn, color: '#94a3b8', fontSize: 13 }}>Clear</button>
              <button type="button" onClick={() => addDigit('0')} style={keyBtn}>0</button>
              <button type="button" onClick={backspace} style={{ ...keyBtn, color: '#94a3b8' }}>⌫</button>
            </div>

            {/* Footer links */}
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <Link to="/login" style={{
                textDecoration: 'none',
                fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: '#f87171',
              }}>
                GO TO ADMIN SIGN-IN
              </Link>
              <div style={{ marginTop: 4, fontSize: 9, color: '#475569' }}>
                By signing in you agree to the <span style={{ color: '#f87171', fontWeight: 700 }}>Attendance Policy</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const keyBtn = {
  border: '1px solid rgba(255,255,255,.08)',
  background: 'rgba(255,255,255,.04)',
  color: '#e2e8f0',
  borderRadius: 10,
  padding: 0,
  minHeight: 40,
  fontWeight: 800,
  fontSize: 17,
  fontFamily: 'inherit',
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
}
