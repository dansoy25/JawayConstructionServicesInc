import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/util'
import { card, btnPrimary, btnGhost, PageHeader } from './adminShared'

export default function AdminProfile() {
  const { profile, session, refreshProfile, signOut } = useAuth()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  // Editable text fields — kept minimal (name + phone). Employees can't edit
  // their own profile, but admins can edit theirs.
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)

  const onPickFile = () => fileRef.current?.click()

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !session?.user?.id) return
    if (!file.type.startsWith('image/')) { setErr('Please choose an image file.'); return }
    if (file.size > 4 * 1024 * 1024) { setErr('Image must be under 4MB.'); return }
    setUploading(true); setErr(''); setMsg('')
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${session.user.id}/${Date.now()}.${ext}`
      const up = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true })
      if (up.error) throw up.error
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const upd = await supabase.from('profiles').update({ avatar_url: pub.publicUrl }).eq('id', session.user.id)
      if (upd.error) throw upd.error
      await refreshProfile()
      setMsg('Photo updated.')
    } catch (e) {
      setErr(e.message || 'Upload failed.')
    }
    setUploading(false)
  }

  const removePhoto = async () => {
    setUploading(true); setErr(''); setMsg('')
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', session.user.id)
    if (error) setErr(error.message)
    else { await refreshProfile(); setMsg('Photo removed.') }
    setUploading(false)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setErr(''); setMsg('')
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
      }).eq('id', session.user.id)
      if (error) throw error
      await refreshProfile()
      setMsg('Profile saved.')
    } catch (e) { setErr(e.message || 'Save failed.') }
    setSaving(false)
  }

  return (
    <div style={{ padding: 32 }}>
      <PageHeader title="My admin profile" sub="Update your name, phone, and profile picture." />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'flex-start' }}>
        {/* Avatar card */}
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{
            width: 140, height: 140, borderRadius: '50%', margin: '0 auto 14px',
            background: profile?.avatar_url ? '#f1f5f9' : 'linear-gradient(135deg,#fce7f3,#fbcfe8)',
            color: '#831843', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 42, overflow: 'hidden',
            border: '3px solid #fff', boxShadow: '0 6px 18px rgba(0,0,0,.15)',
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials(profile?.full_name || 'JJ')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{profile?.full_name || 'Admin'}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{profile?.employee_code || 'ADMIN'} · Admin</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' }}>
            <button onClick={onPickFile} disabled={uploading} style={{ ...btnPrimary, opacity: uploading ? .6 : 1 }}>
              {uploading ? 'Uploading…' : '📷 Change photo'}
            </button>
            {profile?.avatar_url && (
              <button onClick={removePhoto} disabled={uploading} style={btnGhost}>Remove</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChosen} style={{ display: 'none' }} />
        </div>

        {/* Editable fields */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>Account details</div>
          <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>FULL NAME</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputBox} />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>PHONE</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" style={inputBox} />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>EMPLOYEE ID</span>
              <input value={profile?.employee_code || ''} readOnly style={{ ...inputBox, background: '#f8fafc', color: '#94a3b8' }} />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }}>LOGIN EMAIL</span>
              <input value={session?.user?.email || ''} readOnly style={{ ...inputBox, background: '#f8fafc', color: '#94a3b8' }} />
            </label>

            {err && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}
            {msg && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#DCFCE7', border: '1px solid #86efac', color: '#15803d', fontSize: 12, fontWeight: 700 }}>✓ {msg}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" onClick={signOut} style={{ ...btnGhost, color: '#ef4444', borderColor: 'rgba(239,68,68,.4)' }}>Sign out</button>
              <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? .6 : 1 }}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const inputBox = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600, width: '100%', boxSizing: 'border-box' }
