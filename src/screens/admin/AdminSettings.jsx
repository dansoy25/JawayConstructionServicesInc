import { useState } from 'react'
import { card, btnPrimary, btnGhost, PageHeader } from './adminShared'

const TABS = [
  { key: 'company', label: 'Company profile', icon: '🏢' },
  { key: 'roles', label: 'Roles & permissions', icon: '🛡' },
  { key: 'payroll', label: 'Payroll settings', icon: '💰' },
  { key: 'attendance', label: 'Attendance settings', icon: '⏱' },
  { key: 'leave', label: 'Leave settings', icon: '📅' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'privacy', label: 'Data & privacy', icon: '🔒' },
]

export default function AdminSettings() {
  const [tab, setTab] = useState('company')

  return (
    <div style={{ padding: 32 }}>
      <PageHeader title="Settings" sub="Configure your workspace" />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ background: 'linear-gradient(180deg,#1e40af,#1e3a8a)', color: '#fff', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Settings</div>
          <div style={{ fontSize: 11, opacity: .8, marginBottom: 16 }}>Manage your workspace</div>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 12px', borderRadius: 10, marginBottom: 4,
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? '#2563eb' : '#e2e8f0',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: tab === t.key ? 700 : 600, textAlign: 'left',
            }}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div style={card}>
          {tab === 'company' && <CompanyProfile />}
          {tab !== 'company' && (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{TABS.find((t) => t.key === tab)?.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{TABS.find((t) => t.key === tab)?.label}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Configuration coming soon.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CompanyProfile() {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Company profile</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22 }}>T</div>
        <div>
          <button style={btnGhost}>Upload logo</button>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>PNG, SVG · max 2MB</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Company name" defaultValue="Jaway Construction Services Inc." />
        <Field label="Industry" defaultValue="Retail & Trading" select options={['Retail & Trading','Construction','Services']} />
        <div style={{ gridColumn: 'span 2' }}>
          <Field label="Address" defaultValue="PO Box 175, Preeceville SK S0A 3B0, 1226" />
        </div>
        <Field label="TIN" defaultValue="BN 82938 4571 RC0001" />
        <Field label="SEC Reg." defaultValue="SK Corp #4192" />
        <Field label="Contact email" defaultValue="info@jawayconstruction.ca" />
        <Field label="Phone" defaultValue="+1 (306) 547-2200" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <button style={btnGhost}>Cancel</button>
        <button style={btnPrimary}>Save changes</button>
      </div>
    </div>
  )
}

function Field({ label, defaultValue, select, options }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{label}</div>
      {select ? (
        <select defaultValue={defaultValue} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }}>
          {(options || []).map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input defaultValue={defaultValue} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxSizing: 'border-box' }} />
      )}
    </div>
  )
}
