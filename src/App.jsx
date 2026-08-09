import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Shell from './components/Shell'
import AdminShell from './components/AdminShell'

import AdminLogin from './screens/AdminLogin'
import Login from './screens/Login'
import Home from './screens/Home'
import ClockIn from './screens/ClockIn'
import Attendance from './screens/Attendance'
import Schedule from './screens/Schedule'
import Leave from './screens/Leave'
import Overtime from './screens/Overtime'
import Team from './screens/Team'
import Reports from './screens/Reports'
import ReportTardiness from './screens/ReportTardiness'
import ReportPunctuality from './screens/ReportPunctuality'
import ReportPayslip from './screens/ReportPayslip'
import ReportLocations from './screens/ReportLocations'
import ReportTasks from './screens/ReportTasks'
import Profile from './screens/Profile'
import PersonalInfo from './screens/PersonalInfo'
import Security from './screens/Security'
import Notifications from './screens/Notifications'

import AdminDashboard from './screens/admin/AdminDashboard'
import AdminAttendance from './screens/admin/AdminAttendance'
import AdminEmployees from './screens/admin/AdminEmployees'
import AdminTasks from './screens/admin/AdminTasks'
import AdminLeave from './screens/admin/AdminLeave'
import AdminPayroll from './screens/admin/AdminPayroll'
import AdminPayslips from './screens/admin/AdminPayslips'
import AdminSales from './screens/admin/AdminSales'
import AdminExpenses from './screens/admin/AdminExpenses'
import AdminInventory from './screens/admin/AdminInventory'
import AdminReports from './screens/admin/AdminReports'
import AdminBackup from './screens/admin/AdminBackup'
import AdminSettings from './screens/admin/AdminSettings'

function Protected({ children, requireAdmin, requireEmployee }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (requireAdmin && profile && !profile.is_admin) return <Navigate to="/" replace />
  if (requireEmployee && profile?.is_admin) return <Navigate to="/admin/dashboard" replace />
  return children
}

function RoleGate() {
  const { session, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (profile?.is_admin) return <Navigate to="/admin/dashboard" replace />
  return <Shell />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/employee" element={<Login />} />

          {/* Admin routes */}
          <Route path="/admin" element={<Protected requireAdmin><AdminShell /></Protected>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="leave" element={<AdminLeave />} />
            <Route path="payroll" element={<AdminPayroll />} />
            <Route path="payslips" element={<AdminPayslips />} />
            <Route path="sales" element={<AdminSales />} />
            <Route path="expenses" element={<AdminExpenses />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="backup" element={<AdminBackup />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Employee routes (with role gate on root) */}
          <Route path="/" element={<RoleGate />}>
            <Route index element={<Home />} />
            <Route path="clock-in" element={<ClockIn />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="leave" element={<Leave />} />
            <Route path="overtime" element={<Overtime />} />
            <Route path="team" element={<Team />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/tardiness" element={<ReportTardiness />} />
            <Route path="reports/punctuality" element={<ReportPunctuality />} />
            <Route path="reports/payslip" element={<ReportPayslip />} />
            <Route path="reports/locations" element={<ReportLocations />} />
            <Route path="reports/tasks" element={<ReportTasks />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/personal" element={<PersonalInfo />} />
            <Route path="profile/security" element={<Security />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
