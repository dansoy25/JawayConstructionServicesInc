export const card = { background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }
export const table = { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }
export const th = { textAlign: 'left', padding: '10px 14px', background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: .5 }
export const td = { padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: 12 }
// Primary button pulls its color from the Customize accent (ThemeContext sets
// --accent on <html>). Falls back to blue only if the CSS var isn't wired.
export const btnPrimary = { padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--accent, #2563eb)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }
export const btnGhost = { padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }
export const chip = (bg, color) => ({ fontSize: 10, fontWeight: 700, color, background: bg, padding: '3px 10px', borderRadius: 999, display: 'inline-block' })

export function StatTile({ icon, label, value, sub, subColor, accent = '#2563eb' }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #e2e8f0', borderTop: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1, marginBottom: 6 }}>
        {icon && <span>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export function PageHeader({ crumb, title, sub, actions }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{sub}</div>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  )
}
