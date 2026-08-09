import { useEffect, useState } from 'react'
import { ScreenHeader } from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

export default function PersonalInfo() {
  const { profile, refreshProfile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [form, setForm] = useState({ full_name: '', phone: '', position: '', avatar_url: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '', position: profile.position || '', avatar_url: profile.avatar_url || '' })
  }, [profile])

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('')
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    setBusy(false)
    if (error) return setMsg(error.message)
    setMsg('Saved.')
    refreshProfile()
  }

  return (
    <div style={{ padding: '8px 20px 0' }}>
      <ScreenHeader title="Personal information" back="/profile" />
      <form onSubmit={save} style={{ marginTop: 8, padding: 14, borderRadius: 16, background: dark ? 'rgba(255,255,255,.04)' : '#fff', border: `1px solid ${dark ? 'rgba(148,163,184,.15)' : '#eef0f4'}`, display: 'grid', gap: 10 }}>
        <Field label="Full name" dark={dark}><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={inputStyle(dark)} /></Field>
        <Field label="Position" dark={dark}><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} style={inputStyle(dark)} /></Field>
        <Field label="Phone" dark={dark}><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle(dark)} /></Field>
        <Field label="Avatar URL" dark={dark}><input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} style={inputStyle(dark)} placeholder="https://…" /></Field>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
        {msg && <div style={{ fontSize: 12, fontWeight: 700, color: msg === 'Saved.' ? '#16a34a' : '#b91c1c' }}>{msg}</div>}
      </form>
    </div>
  )
}

function Field({ label, children, dark }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: dark ? '#94a3b8' : '#475569' }}>{label}</span>
      {children}
    </label>
  )
}
function inputStyle(dark) {
  return {
    padding: '10px 12px', borderRadius: 10, border: `1px solid ${dark ? 'rgba(148,163,184,.25)' : '#e2e8f0'}`,
    background: dark ? 'rgba(255,255,255,.05)' : '#fff', color: dark ? '#e2e8f0' : '#0f172a', fontSize: 13, width: '100%'
  }
}
