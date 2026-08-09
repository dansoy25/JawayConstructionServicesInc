// Tiny inline icon set to avoid an external icon dep.
const strokeProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

const paths = {
  home:      <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/></>,
  clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  list:      <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
  chart:     <><path d="M3 3v18h18"/><path d="M7 15l4-4 4 3 5-6"/></>,
  user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>,
  bell:      <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
  menu:      <><line x1="4" y1="7" x2="20" y2="7"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="17" x2="14" y2="17"/></>,
  pin:       <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>,
  arrow:     <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
  back:      <><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></>,
  check:     <><path d="M20 6 9 17l-5-5"/></>,
  x:         <><path d="M18 6 6 18"/><path d="M6 6l12 12"/></>,
  sun:       <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
  moon:      <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
  calendar:  <><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></>,
  file:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
  logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
  shield:    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  camera:    <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  team:      <><circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="18" cy="9" r="3"/><path d="M22 20c0-2.4-2-4.5-5-4.5"/></>,
  bolt:      <><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></>,
  hourglass: <><path d="M6 2h12M6 22h12M6 2v4l6 6-6 6v4M18 2v4l-6 6 6 6v4"/></>,
  search:    <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></>,
  edit:      <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
  lock:      <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  plus:      <><path d="M12 5v14M5 12h14"/></>,
}

export default function Icon({ name, size = 20, className = '', style = {} }) {
  const p = paths[name]
  if (!p) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} {...strokeProps}>
      {p}
    </svg>
  )
}
