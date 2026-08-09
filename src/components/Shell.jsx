import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useTheme } from '../context/ThemeContext'

export default function Shell() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: dark ? '#0b1220' : '#cbd5e1' }}>
      <div className={`ios-frame ${dark ? 'app-dark' : 'app-light'}`}>
        <div
          className="scroll-hide"
          style={{
            height: '100%',
            overflowY: 'auto',
            paddingTop: 'max(env(safe-area-inset-top), 20px)',
            paddingBottom: 'calc(92px + env(safe-area-inset-bottom))',
          }}
        >
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
