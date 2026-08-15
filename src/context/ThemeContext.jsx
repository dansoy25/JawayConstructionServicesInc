import { createContext, useContext, useEffect, useState } from 'react'

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

// Five accent options. Each one drives the full app theme:
//   --accent   → primary button/highlight color
//   --app-bg   → whole-app background (soft tint of the accent)
//   --app-fg   → readable primary text color for that background
export const ACCENTS = [
  { key: 'red',    label: 'Red',    color: '#DC2626', bg: '#FEF2F2', fg: '#1F2937' },
  { key: 'pink',   label: 'Pink',   color: '#EC4899', bg: '#FDF2F8', fg: '#1F2937' },
  { key: 'grey',   label: 'Grey',   color: '#475569', bg: '#F1F5F9', fg: '#0F172A' },
  { key: 'blue',   label: 'Blue',   color: '#2563EB', bg: '#EFF6FF', fg: '#0F172A' },
  { key: 'orange', label: 'Orange', color: '#F97316', bg: '#FFF7ED', fg: '#1F2937' },
]

// Legacy accent keys that no longer exist ('black' → 'grey') are silently
// remapped so stored settings from prior versions still resolve.
function normalizeKey(k) { return k === 'black' ? 'grey' : k }

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [accent, setAccent] = useState(() => normalizeKey(localStorage.getItem('accent') || 'red'))

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const chosen = ACCENTS.find((a) => a.key === accent) || ACCENTS[0]
    localStorage.setItem('accent', chosen.key)
    const root = document.documentElement
    root.style.setProperty('--accent', chosen.color)
    root.style.setProperty('--app-bg', chosen.bg)
    root.style.setProperty('--app-fg', chosen.fg)
    root.dataset.accent = chosen.key
    // Also paint <body> so pages that don't set their own bg pick it up.
    document.body.style.background = chosen.bg
    document.body.style.color = chosen.fg
  }, [accent])

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  const active = ACCENTS.find((a) => a.key === accent) || ACCENTS[0]

  return (
    <ThemeCtx.Provider value={{
      theme, toggle, setTheme,
      accent, setAccent: (k) => setAccent(normalizeKey(k)),
      accentColor: active.color,
      accentBg: active.bg,
      accentFg: active.fg,
      accents: ACCENTS,
    }}>
      {children}
    </ThemeCtx.Provider>
  )
}
