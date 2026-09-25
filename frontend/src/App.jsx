import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import OfflineBanner from './components/OfflineBanner'
import NotFound from './components/NotFound'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Internships from './pages/Internships'
import Candidates from './pages/Candidates'
import Attendance from './pages/Attendance'
import Tasks from './pages/Tasks'
import Payroll from './pages/Payroll'
import Colleges from './pages/Colleges'
import Clients from './pages/Clients'
import MyProfile from './pages/MyProfile'
import Security from './pages/Security'
import WFH from './pages/WFH'

function FullPageLoader() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:12,background:'var(--paper)'}}>
      <div className="state-spinner state-spinner-lg"/>
      <div style={{fontSize:13,color:'var(--gray-500)'}}>Loading…</div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader/>
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace/>
}

function HRRoute({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'hr' && user?.role !== 'hr_executive') return <Navigate to="/" replace/>
  return children
}

function FullHRRRoute({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'hr') return <Navigate to="/" replace/>
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader/>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace/> : <Login/>}/>
      <Route path="/" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
      <Route path="/profile" element={<PrivateRoute><MyProfile/></PrivateRoute>}/>
      <Route path="/security" element={<PrivateRoute><Security/></PrivateRoute>}/>
      <Route path="/employees" element={<PrivateRoute><HRRoute><Employees/></HRRoute></PrivateRoute>}/>
      <Route path="/internships" element={<PrivateRoute><HRRoute><Internships/></HRRoute></PrivateRoute>}/>
      <Route path="/candidates" element={<PrivateRoute><HRRoute><Candidates/></HRRoute></PrivateRoute>}/>
      <Route path="/attendance" element={<PrivateRoute><Attendance/></PrivateRoute>}/>
      <Route path="/wfh" element={<PrivateRoute><WFH/></PrivateRoute>}/>
      <Route path="/tasks" element={<PrivateRoute><Tasks/></PrivateRoute>}/>
      <Route path="/payroll" element={<PrivateRoute><FullHRRRoute><Payroll/></FullHRRRoute></PrivateRoute>}/>
      <Route path="/my-payslips" element={<PrivateRoute><Payroll/></PrivateRoute>}/>
      <Route path="/colleges" element={<PrivateRoute><HRRoute><Colleges/></HRRoute></PrivateRoute>}/>
      <Route path="/clients" element={<PrivateRoute><FullHRRRoute><Clients/></FullHRRRoute></PrivateRoute>}/>
      <Route path="*" element={<NotFound/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OfflineBanner/>
        <AppRoutes/>
      </BrowserRouter>
    </AuthProvider>
  )
}
