import { useEffect, useRef } from 'react'

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

let leafletPromise = null

function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L))
      existing.addEventListener('error', reject)
      return
    }
    const s = document.createElement('script')
    s.src = LEAFLET_JS
    s.async = true
    s.onload = () => resolve(window.L)
    s.onerror = reject
    document.head.appendChild(s)
  })
  return leafletPromise
}

/**
 * MapView — Leaflet map.
 *
 * Props:
 *   center: [lat, lng]  (required)
 *   zoom: number = 17
 *   radiusM: number = 100   (geofence radius in meters)
 *   siteName: string
 *   userPos: {lat, lng} | null  (draws a pulsing green dot for the user)
 *   height: number | string = 200
 *   editable: boolean = false   (click map to move the pin)
 *   onChange: ({lat, lng}) => void  (called when pin moves in editable mode)
 */
export default function MapView({ center, zoom = 17, radiusM = 100, siteName = 'Site', userPos = null, height = 200, editable = false, onChange }) {
  const el = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({ circle: null, marker: null, user: null })
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Init map once
  useEffect(() => {
    let cancelled = false
    loadLeaflet().then((L) => {
      if (cancelled || !L || !el.current || mapRef.current) return
      const map = L.map(el.current, {
        center, zoom,
        zoomControl: false, attributionControl: true,
      })
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)
      mapRef.current = map

      if (editable) {
        map.on('click', (ev) => {
          const { lat, lng } = ev.latlng
          if (onChangeRef.current) onChangeRef.current({ lat, lng })
        })
      }
    })
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        layersRef.current = { circle: null, marker: null, user: null }
      }
    }
    // eslint-disable-next-line
  }, [])

  // Redraw geofence + site marker whenever center/radius/site change
  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    if (!L || !map || !center) return

    // Site geofence circle
    if (layersRef.current.circle) map.removeLayer(layersRef.current.circle)
    layersRef.current.circle = L.circle(center, {
      radius: radiusM || 100,
      color: '#2563eb', weight: 1.5, dashArray: '6 4',
      fillColor: '#2563eb', fillOpacity: 0.08,
    }).addTo(map)

    // Site label marker
    if (layersRef.current.marker) map.removeLayer(layersRef.current.marker)
    const officeIcon = L.divIcon({
      className: 'ts-map-office-label',
      html: `<div style="background:#2563eb;color:#fff;font-size:9px;font-weight:800;padding:3px 8px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.3);white-space:nowrap">${escapeHtml(siteName)}</div>`,
      iconSize: [60, 20], iconAnchor: [30, 25],
    })
    layersRef.current.marker = L.marker(center, { icon: officeIcon }).addTo(map)

    // Recenter
    map.setView(center, map.getZoom())
  }, [center, radiusM, siteName])

  // User position dot (pulsing green)
  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    if (!L || !map) return
    if (layersRef.current.user) {
      map.removeLayer(layersRef.current.user)
      layersRef.current.user = null
    }
    if (userPos && Number.isFinite(userPos.lat) && Number.isFinite(userPos.lng)) {
      const userIcon = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(34,197,94,.35),0 0 12px rgba(34,197,94,.6)"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8],
      })
      layersRef.current.user = L.marker([userPos.lat, userPos.lng], { icon: userIcon }).addTo(map)
    }
  }, [userPos])

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 16, overflow: 'hidden', background: '#e0f2fe' }}>
      <div ref={el} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
