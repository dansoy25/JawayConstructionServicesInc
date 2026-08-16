import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { card, btnPrimary, btnGhost, PageHeader } from './adminShared'

const TABS = [
  { key: 'company', label: 'Company profile', icon: '🏢' },
  { key: 'payroll', label: 'Payroll settings', icon: '💰' },
  { key: 'attendance', label: 'Attendance settings', icon: '⏱' },
  { key: 'privacy', label: 'Data & privacy', icon: '🔒' },
]

export default function AdminSettings() {
  const [tab, setTab] = useState('company')
  const { profile } = useAuth()
  const [org, setOrg] = useState(null)
  const [settings, setSettings] = useState(null)

  const load = () => {
    if (!profile?.org_id) return
    supabase.from('organizations').select('*').eq('id', profile.org_id).single().then(({ data }) => setOrg(data))
    supabase.from('org_settings').select('*').eq('org_id', profile.org_id).maybeSingle().then(({ data }) => setSettings(data || {}))
  }
  useEffect(load, [profile?.org_id])

  return (
    <div style={{ padding: 32 }}>
      <PageHeader title="Settings" sub="Configure your workspace" />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.35)), var(--accent, #1e40af)', color: '#fff', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Settings</div>
          <div style={{ fontSize: 11, opacity: .8, marginBottom: 16 }}>Manage your workspace</div>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 12px', borderRadius: 10, marginBottom: 4,
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? 'var(--accent, #2563eb)' : '#e2e8f0',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: tab === t.key ? 700 : 600, textAlign: 'left',
            }}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div style={card}>
          {tab === 'company' && <CompanyPanel org={org} settings={settings} onSaved={load} />}
          {tab === 'payroll' && <PayrollPanel settings={settings} orgId={profile?.org_id} onSaved={load} />}
          {tab === 'attendance' && <AttendancePanel settings={settings} orgId={profile?.org_id} onSaved={load} />}
          {tab === 'privacy' && <PrivacyPanel org={org} />}
        </div>
      </div>
    </div>
  )
}

// ─── Company profile ──────────────────────────────────────────────────

function CompanyPanel({ org, settings, onSaved }) {
  const [name, setName] = useState(org?.name || '')
  const [address, setAddress] = useState(settings?.company_address || '')
  const [phone, setPhone] = useState(settings?.company_phone || '')
  const [email, setEmail] = useState(settings?.company_email || '')
  const [tin, setTin] = useState(settings?.company_tin || '')
  const [industry, setIndustry] = useState(settings?.company_industry || 'Construction')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    setName(org?.name || '')
    setAddress(settings?.company_address || '')
    setPhone(settings?.company_phone || '')
    setEmail(settings?.company_email || '')
    setTin(settings?.company_tin || '')
    setIndustry(settings?.company_industry || 'Construction')
  }, [org?.id, settings?.org_id])

  const save = async () => {
    setBusy(true); setErr(''); setOk(false)
    try {
      if (org?.id && name && name !== org.name) {
        const { error } = await supabase.from('organizations').update({ name }).eq('id', org.id)
        if (error) throw error
      }
      if (org?.id) {
        const { error } = await supabase.from('org_settings').upsert({
          org_id: org.id,
          company_address: address || null,
          company_phone: phone || null,
          company_email: email || null,
          company_tin: tin || null,
          company_industry: industry || null,
        }, { onConflict: 'org_id' })
        if (error) throw error
      }
      setOk(true); onSaved()
      setTimeout(() => setOk(false), 2500)
    } catch (e) { setErr(e.message || 'Save failed.') }
    setBusy(false)
  }

  return (
    <>
      <div style={h1}>Company profile</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Basic organization info shown on payslips, reports, and the login screen.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <F label="Company name" value={name} onChange={setName} />
        <FSelect label="Industry" value={industry} onChange={setIndustry} options={['Construction', 'Retail & Trading', 'Manufacturing', 'Services', 'Hospitality', 'Logistics', 'Other']} />
        <div style={{ gridColumn: 'span 2' }}>
          <F label="Address" value={address} onChange={setAddress} placeholder="Street, city, province, postal code" />
        </div>
        <F label="Tax ID / TIN" value={tin} onChange={setTin} placeholder="BN 12345 6789 RC0001" />
        <F label="Contact phone" value={phone} onChange={setPhone} placeholder="+1 (555) 123-4567" />
        <div style={{ gridColumn: 'span 2' }}>
          <F label="Contact email" value={email} onChange={setEmail} placeholder="info@yourcompany.com" />
        </div>
      </div>
      <SavedRow ok={ok} err={err} busy={busy} save={save} />
    </>
  )
}

// ─── Payroll ──────────────────────────────────────────────────────────

function PayrollPanel({ settings, orgId, onSaved }) {
  const rateToPct = (r) => (r == null || Number(r) === 0) ? '' : String(Number(r) * 100)
  const [cpp, setCpp] = useState(rateToPct(settings?.cpp_rate))
  const [ei, setEi] = useState(rateToPct(settings?.ei_rate))
  const [fed, setFed] = useState(rateToPct(settings?.federal_tax_rate))
  const [prov, setProv] = useState(rateToPct(settings?.provincial_tax_rate))
  const [frequency, setFrequency] = useState(settings?.pay_frequency || 'semi-monthly')
  const [cutoff, setCutoff] = useState(settings?.cutoff_days || '15,end')
  const [payout, setPayout] = useState(settings?.payout_days || '5,20')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    setCpp(rateToPct(settings?.cpp_rate))
    setEi(rateToPct(settings?.ei_rate))
    setFed(rateToPct(settings?.federal_tax_rate))
    setProv(rateToPct(settings?.provincial_tax_rate))
    setFrequency(settings?.pay_frequency || 'semi-monthly')
    setCutoff(settings?.cutoff_days || '15,end')
    setPayout(settings?.payout_days || '5,20')
  }, [settings?.org_id])

  const save = async () => {
    setBusy(true); setErr(''); setOk(false)
    try {
      const pct = (v) => (v === '' || v == null) ? 0 : Number(v) / 100
      const { error } = await supabase.from('org_settings').upsert({
        org_id: orgId,
        cpp_rate: pct(cpp), ei_rate: pct(ei),
        federal_tax_rate: pct(fed), provincial_tax_rate: pct(prov),
        pay_frequency: frequency, cutoff_days: cutoff, payout_days: payout,
      }, { onConflict: 'org_id' })
      if (error) throw error
      setOk(true); onSaved()
      setTimeout(() => setOk(false), 2500)
    } catch (e) { setErr(e.message || 'Save failed.') }
    setBusy(false)
  }

  return (
    <>
      <div style={h1}>Payroll settings</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Default statutory rates and pay schedule. Individual employees can override rates from their profile.</div>

      <div style={h2}>Statutory rates (%)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <FPct label="CPP" value={cpp} onChange={setCpp} />
        <FPct label="EI" value={ei} onChange={setEi} />
        <FPct label="Federal" value={fed} onChange={setFed} />
        <FPct label="Provincial" value={prov} onChange={setProv} />
      </div>

      <div style={h2}>Pay schedule</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <FSelect label="Frequency" value={frequency} onChange={setFrequency} options={['weekly', 'bi-weekly', 'semi-monthly', 'monthly']} />
        <F label="Cut-off days" value={cutoff} onChange={setCutoff} placeholder="15,end" />
        <F label="Pay-out days" value={payout} onChange={setPayout} placeholder="5,20" />
      </div>
      <SavedRow ok={ok} err={err} busy={busy} save={save} />
    </>
  )
}

// ─── Attendance ────────────────────────────────────────────────────────

function AttendancePanel({ settings, orgId, onSaved }) {
  const [shiftStart, setShiftStart] = useState(settings?.default_shift_start || '08:00')
  const [shiftEnd, setShiftEnd] = useState(settings?.default_shift_end || '17:00')
  const [grace, setGrace] = useState(settings?.late_grace_minutes ?? 5)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    setShiftStart(settings?.default_shift_start || '08:00')
    setShiftEnd(settings?.default_shift_end || '17:00')
    setGrace(settings?.late_grace_minutes ?? 5)
  }, [settings?.org_id])

  const save = async () => {
    setBusy(true); setErr(''); setOk(false)
    try {
      const { error } = await supabase.from('org_settings').upsert({
        org_id: orgId,
        default_shift_start: shiftStart,
        default_shift_end: shiftEnd,
        late_grace_minutes: Number(grace) || 0,
      }, { onConflict: 'org_id' })
      if (error) throw error
      setOk(true); onSaved()
      setTimeout(() => setOk(false), 2500)
    } catch (e) { setErr(e.message || 'Save failed.') }
    setBusy(false)
  }

  return (
    <>
      <div style={h1}>Attendance settings</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Defaults for new employees. Each employee can override their own shift.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={fieldLbl}>DEFAULT SHIFT START</div>
          <input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} style={inputBox} />
        </div>
        <div>
          <div style={fieldLbl}>DEFAULT SHIFT END</div>
          <input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} style={inputBox} />
        </div>
        <div>
          <div style={fieldLbl}>LATE GRACE (MINUTES)</div>
          <input type="number" min="0" value={grace} onChange={(e) => setGrace(e.target.value)} style={inputBox} />
        </div>
      </div>
      <SavedRow ok={ok} err={err} busy={busy} save={save} />
    </>
  )
}

// ─── Privacy ──────────────────────────────────────────────────────────

function PrivacyPanel({ org }) {
  return (
    <>
      <div style={h1}>Data & privacy</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Your workspace uses Supabase Postgres with Row-Level Security. Only admins in this organization can see this data.</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <PrivacyRow label="Organization code" value={org?.code || '—'} mono />
        <PrivacyRow label="Organization name" value={org?.name || '—'} />
        <PrivacyRow label="Created" value={org?.created_at ? new Date(org.created_at).toLocaleDateString('en-CA', { timeZone: 'America/Regina' }) : '—'} />
        <PrivacyRow label="Data isolation" value="Row-Level Security (RLS) enforced" />
        <PrivacyRow label="Password storage" value="One-way bcrypt hash via Supabase Auth" />
        <PrivacyRow label="Employee data export" value="Available via Reports → Export CSV" />
      </div>
    </>
  )
}

function PrivacyRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────

function F({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={fieldLbl}>{label.toUpperCase()}</div>
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputBox} />
    </div>
  )
}
function FSelect({ label, value, onChange, options }) {
  return (
    <div>
      <div style={fieldLbl}>{label.toUpperCase()}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputBox}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
function FPct({ label, value, onChange }) {
  return (
    <div>
      <div style={fieldLbl}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', marginTop: 4 }}>
        <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal"
          style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, background: 'transparent' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', paddingRight: 12 }}>%</span>
      </div>
    </div>
  )
}

function SavedRow({ ok, err, busy, save }) {
  return (
    <>
      {err && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>{err}</div>}
      {ok && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#DCFCE7', border: '1px solid #86efac', color: '#15803d', fontSize: 12, fontWeight: 700 }}>✓ Saved</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={save} disabled={busy} style={{ ...btnPrimary, opacity: busy ? .6 : 1 }}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
    </>
  )
}

const inputBox = { width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#0f172a', background: '#fff', fontWeight: 600 }
const fieldLbl = { fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: .4 }
const h1 = { fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }
const h2 = { fontSize: 12, fontWeight: 800, color: '#0f172a', marginTop: 12, marginBottom: 8 }
