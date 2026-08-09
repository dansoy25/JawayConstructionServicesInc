import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useTheme } from '../context/ThemeContext'

export default function Shell() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: dark ? '#0b1220' : '#cbd5e1' }}>
      <div className={`ios-frame ${dark ? 'app-dark' : 'app-light'}`}>
        <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 92 }} className="scroll-hide">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
