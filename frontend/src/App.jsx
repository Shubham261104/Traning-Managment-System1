import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCourses from './pages/admin/AdminCourses'
import AdminStudents from './pages/admin/AdminStudents'
import AdminInstructors from './pages/admin/AdminInstructors'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminTeam from './pages/admin/AdminTeam'
import InstructorDashboard from './pages/instructor/InstructorDashboard'
import StudentDashboard from './pages/student/StudentDashboard'
import HelpSupport from './pages/HelpSupport'
import AboutUs from './pages/public/AboutUs'
import ContactUs from './pages/public/ContactUs'
import MemberDetail from './pages/public/MemberDetail'
import PrivacyPolicy from './pages/public/PrivacyPolicy'
import TermsOfService from './pages/public/TermsOfService'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/about/:id" element={<MemberDetail />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />

              <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']} />}>
                <Route index element={<AdminDashboard />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="instructors" element={<AdminInstructors />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="team" element={<AdminTeam />} />
                <Route path="support" element={<HelpSupport />} />
              </Route>

              <Route path="/instructor" element={<PrivateRoute allowedRoles={['instructor']} />}>
                <Route index element={<InstructorDashboard />} />
                <Route path="*" element={<InstructorDashboard />} />
              </Route>

              <Route path="/student" element={<PrivateRoute allowedRoles={['student']} />}>
                <Route index element={<StudentDashboard />} />
                <Route path="*" element={<StudentDashboard />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
