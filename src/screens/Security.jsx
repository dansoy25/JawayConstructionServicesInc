import { useState } from 'react'
import { ScreenHeader } from '../components/Header'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

export default function Security() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const change = async (e) => {
    e.preventDefault(); setMsg(''); setBusy(true)
    if (pw !== pw2) { setMsg("Passwords don't match."); setBusy(false); return }
    if (pw.length < 8) { setMsg('Use at least 8 characters.'); setBusy(false); return }
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setMsg(error.message)
    setPw(''); setPw2(''); setMsg('Password updated.')
  }

  return (
    <div style={{ padding: '8px 20px 0' }}>
      <ScreenHeader title="Security & access" back="/profile" />
      <form onSubmit={change} style={{ marginTop: 8, padding: 14, borderRadius: 16, background: dark ? 'rgba(255,255,255,.04)' : '#fff', border: `1px solid ${dark ? 'rgba(148,163,184,.15)' : '#eef0f4'}`, display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: dark ? '#e2e8f0' : '#0f172a' }}>Change password</div>
        <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} style={input(dark)} />
        <input type="password" placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={input(dark)} />
        <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Updating…' : 'Update password'}</button>
        {msg && <div style={{ fontSize: 12, fontWeight: 700, color: msg.includes('updated') ? '#16a34a' : '#b91c1c' }}>{msg}</div>}
      </form>
    </div>
  )
}
function input(dark) {
  return {
    padding: '10px 12px', borderRadius: 10, border: `1px solid ${dark ? 'rgba(148,163,184,.25)' : '#e2e8f0'}`,
    background: dark ? 'rgba(255,255,255,.05)' : '#fff', color: dark ? '#e2e8f0' : '#0f172a', fontSize: 13, width: '100%'
  }
}
