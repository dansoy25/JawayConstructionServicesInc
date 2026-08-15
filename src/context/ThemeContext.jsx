import { createContext, useContext, useEffect, useState } from 'react'

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

// Five accent options — exposed via `useTheme().accent` and driven by the
// CSS variable --accent so any component can pick it up.
export const ACCENTS = [
  { key: 'red',    label: 'Red',    color: '#DC2626' }, // default — matches brand
  { key: 'pink',   label: 'Pink',   color: '#EC4899' },
  { key: 'black',  label: 'Black',  color: '#0F172A' },
  { key: 'blue',   label: 'Blue',   color: '#2563EB' },
  { key: 'orange', label: 'Orange', color: '#F97316' },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [accent, setAccent] = useState(() => localStorage.getItem('accent') || 'red')

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const chosen = ACCENTS.find((a) => a.key === accent) || ACCENTS[0]
    localStorage.setItem('accent', chosen.key)
    document.documentElement.style.setProperty('--accent', chosen.color)
    document.documentElement.dataset.accent = chosen.key
  }, [accent])

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  const accentColor = (ACCENTS.find((a) => a.key === accent) || ACCENTS[0]).color

  return (
    <ThemeCtx.Provider value={{ theme, toggle, setTheme, accent, setAccent, accentColor, accents: ACCENTS }}>
      {children}
    </ThemeCtx.Provider>
  )
}
