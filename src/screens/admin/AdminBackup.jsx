import { card, table, th, td, btnPrimary, btnGhost, chip, PageHeader } from './adminShared'

const BACKUPS = [
  { date: 'Jun 23, 2026', time: '02:00 AM', size: '142.4 MB', type: 'Auto', status: 'success' },
  { date: 'Jun 22, 2026', time: '02:00 AM', size: '141.8 MB', type: 'Auto', status: 'success' },
  { date: 'Jun 21, 2026', time: '02:00 AM', size: '141.2 MB', type: 'Auto', status: 'success' },
  { date: 'Jun 20, 2026', time: '02:00 AM', size: '—', type: 'Auto', status: 'failed' },
  { date: 'Jun 19, 2026', time: '02:00 AM', size: '140.6 MB', type: 'Auto', status: 'success' },
  { date: 'Jun 18, 2026', time: '04:32 PM', size: '140.3 MB', type: 'Manual', status: 'success' },
]

export default function AdminBackup() {
  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Backup"
        sub="Last successful backup: Jun 23, 2026 02:00 AM"
        actions={<button style={btnPrimary}>⬇ Backup now</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Backup history</div>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Last 30 days</span>
          </div>
          <table style={table}>
            <thead><tr>{['DATE','TIME','SIZE','TYPE','STATUS',''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {BACKUPS.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{r.date}</td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{r.time}</td>
                  <td style={{ ...td, fontFamily: 'monospace' }}>{r.size}</td>
                  <td style={td}>{r.type}</td>
                  <td style={td}>{r.status === 'success' ? <span style={chip('#DCFCE7', '#15803d')}>● Success</span> : <span style={chip('#FEE2E2', '#b91c1c')}>● Failed</span>}</td>
                  <td style={td}>{r.status === 'success' ? <button style={{ ...btnGhost, padding: '4px 10px', fontSize: 11 }}>⬇ Download</button> : <button style={{ ...btnGhost, padding: '4px 10px', fontSize: 11, color: '#2563eb' }}>Retry</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Backup settings</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginTop: 8 }}>Auto-backup</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Daily at 02:00 AM</div>
              </div>
              <div style={{ width: 40, height: 22, background: '#2563eb', borderRadius: 12, position: 'relative' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, right: 2 }} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Frequency</div>
              <select style={{ width: '100%', marginTop: 4, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}><option>Daily</option><option>Weekly</option></select>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Retention</div>
              <select style={{ width: '100%', marginTop: 4, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}><option>30 days</option></select>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>Storage</div>
              <div style={{ marginTop: 4, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#0f172a', background: '#f8fafc' }}>☁ AWS S3 — ph-sea1</div>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Restore from backup</div>
            <div style={{ padding: 10, background: '#FEF9C3', border: '1px solid #FBBF24', borderRadius: 8, fontSize: 11, color: '#78350f' }}>
              ⚠ Restoring overwrites current data. Make sure to back up first.
            </div>
            <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, color: '#64748b' }}>Select backup</div>
            <select style={{ width: '100%', marginTop: 4, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}><option>Jun 23, 2026 — 02:00 AM</option></select>
            <button style={{ marginTop: 12, background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>↺ Restore from this backup</button>
          </div>
        </div>
      </div>
    </div>
  )
}
