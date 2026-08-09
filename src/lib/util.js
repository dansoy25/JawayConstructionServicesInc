// Timezone helpers (Asia/Manila to match siteforce)
export const TZ = 'Asia/Manila'
export const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ })

export const fmtDate = (d, opts = { month: 'short', day: 'numeric', weekday: 'short' }) =>
  new Date(d).toLocaleDateString('en-US', { timeZone: TZ, ...opts })

export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true })

export const hoursBetween = (a, b) => {
  if (!a || !b) return 0
  return Math.max(0, (new Date(b) - new Date(a)) / 36e5)
}

// Haversine distance in meters
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function getCurrentPosition(opts = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, ...opts }
    )
  })
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?'

export const currency = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(n) || 0)
