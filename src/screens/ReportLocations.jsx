import { useEffect, useState } from 'react'
import { ScreenHeader } from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { fmtDate, fmtTime } from '../lib/util'
import Icon from '../components/Icon'

export default function ReportLocations() {
  const { profile } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('attendance').select('id, work_date, clock_in, lat, lng, site:sites(name, address)').eq('profile_id', profile.id).order('work_date', { ascending: false }).limit(30)
      .then(({ data }) => setRows(data || []))
  }, [profile?.id])

  return (
    <div style={{ padding: '8px 20px 0' }}>
      <ScreenHeader title="Locations" />
      <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
        {rows.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: dark ? '#94a3b8' : '#64748b', fontSize: 12 }}>No locations logged yet.</div>}
        {rows.map((r) => (
          <div key={r.id} style={{ padding: 12, borderRadius: 14, background: dark ? 'rgba(255,255,255,.04)' : '#fff', border: `1px solid ${dark ? 'rgba(148,163,184,.15)' : '#eef0f4'}`, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="pin" size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: dark ? '#e2e8f0' : '#0f172a' }}>{r.site?.name || 'Unassigned site'}</div>
              <div style={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b' }}>{fmtDate(r.work_date)} · {r.clock_in ? fmtTime(r.clock_in) : '—'}</div>
              {r.lat && r.lng && <div style={{ fontSize: 10, color: dark ? '#94a3b8' : '#94a3b8', marginTop: 2 }}>{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
