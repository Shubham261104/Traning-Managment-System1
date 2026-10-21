import React, { useState, useEffect, useCallback, useContext } from 'react'
import axios from 'axios'
import { 
  FiHome, FiUsers, FiBookOpen, FiUserCheck, FiClock, FiActivity, FiZap, 
  FiTarget, FiSearch, FiBell, FiMessageSquare, FiSettings, FiList, 
  FiChevronDown, FiArrowRight, FiCheckCircle, FiXCircle, FiPieChart, 
  FiBarChart2, FiDollarSign, FiTrendingUp, FiLogOut, FiMenu, FiVideo
} from 'react-icons/fi'
import AuthContext from '../../context/AuthContext'
import AdminMentorship from './AdminMentorship'

// --- Utility Chart Components for Mocking ---
const LineChartMock = ({ color, dataPoints, height = 140 }) => (
  <div style={{ width: '100%', height, position: 'relative', marginTop: 20 }}>
    <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <polyline 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round"
        strokeLinejoin="round"
        points={dataPoints} 
      />
      {dataPoints.split(' ').map((pt, i) => {
        const [x, y] = pt.split(',')
        return <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="#fff" strokeWidth="2" />
      })}
    </svg>
    {/* Grid lines */}
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: -1 }}>
      <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }}></div>
      <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }}></div>
      <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }}></div>
      <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }}></div>
    </div>
  </div>
)

const Empty = ({ text = 'No data available' }) => (
  <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8f9fa', borderRadius: 12, border: '1px border #e2e8f0' }}>
    <FiActivity size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
    <p style={{ margin: 0, fontWeight: 600 }}>{text}</p>
  </div>
)

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext)
  
  // UI State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [usersExpanded, setUsersExpanded] = useState(true)
  const [financeExpanded, setFinanceExpanded] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Data State
  const [stats, setStats] = useState({})
  const [pendingEnrollments, setPendingEnrollments] = useState([])
  const [allEnrollments, setAllEnrollments] = useState([])
  const [students, setStudents] = useState([])
  const [instructors, setInstructors] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', message: '', priority: 'medium', recipientType: 'students' })
  const [annList, setAnnList] = useState([])
  const [annSending, setAnnSending] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ platformName: 'SkillBridge Training Center', maxStudents: 500, allowRegistration: true, maintenanceMode: false, emailNotifications: true, autoApprove: false })
  const [logSearch, setLogSearch] = useState('')
  const [communicationsExpanded, setCommunicationsExpanded] = useState(false)
  const [systemLogs, setSystemLogs] = useState([])
  const [financeSummary, setFinanceSummary] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isSyncing, setIsSyncing] = useState(false)

  // Filters & Search State
  const [studentSearch, setStudentSearch] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL')
  const [studentCourseFilter, setStudentCourseFilter] = useState('ALL')

  const [instructorSearch, setInstructorSearch] = useState('')
  const [instructorStatusFilter, setInstructorStatusFilter] = useState('ALL')
  const [instructorDeptFilter, setInstructorDeptFilter] = useState('ALL')

  // Detailed View Modals
  const [selectedStudentModal, setSelectedStudentModal] = useState(null)
  const [studentModalTab, setStudentModalTab] = useState('profile') // profile | courses | performance | attendance | quizzes | certificates | communication | account

  const [selectedInstructorModal, setSelectedInstructorModal] = useState(null)
  const [instructorModalTab, setInstructorModalTab] = useState('profile') // profile | courses | students | analytics | feedback | quizzes | assignments | schedule | availability | skills | communication | account

  const [quickMessageModal, setQuickMessageModal] = useState(null) // user target
  const [quickMsgText, setQuickMsgText] = useState('')
  const [quickMsgNotice, setQuickMsgNotice] = useState('')

  const [openDropdownId, setOpenDropdownId] = useState(null)

  // Topbar Dropdown States
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showMessageDropdown, setShowMessageDropdown] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Pending Enrollment', desc: 'Amit Kumar requested enrollment in Full Stack Web Dev', time: '10 mins ago', read: false, tab: 'enrollments' },
    { id: 2, title: 'Course Review Submitted', desc: '⭐ 5-star rating added to React Mastery Course', time: '1 hour ago', read: false, tab: 'courses' },
    { id: 3, title: 'New Instructor Registered', desc: 'Priya Sharma joined as Computer Science educator', time: '3 hours ago', read: true, tab: 'instructors' }
  ])
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Rahul Verma (Instructor)', text: 'Requested syllabus revision for Node.js Backend Course', time: '15 mins ago', read: false },
    { id: 2, sender: 'Sneha Roy (Student)', text: 'Inquiring about certificate ID verification badge', time: '2 hours ago', read: false },
    { id: 3, sender: 'System Security Bot', text: 'Daily MongoDB automated backup completed successfully', time: 'Yesterday', read: true }
  ])

  // Advanced Course Management State
  const [courseSearch, setCourseSearch] = useState('')
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('ALL')
  const [courseLevelFilter, setCourseLevelFilter] = useState('ALL')
  const [courseStatusFilter, setCourseStatusFilter] = useState('ALL')
  const [coursePriceFilter, setCoursePriceFilter] = useState('ALL')
  const [selectedCourseModal, setSelectedCourseModal] = useState(null)
  const [courseModalTab, setCourseModalTab] = useState('overview') // overview | instructor | enrollments | content | analytics | feedback | pricing | progress | certificates | notifications | access | export | ai | actions | delete
  const [courseFormModal, setCourseFormModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [courseForm, setCourseForm] = useState({ title: '', code: '', description: '', category: 'Web Development', level: 'Beginner', price: 0, capacity: 50, duration: '12 Weeks', language: 'English', instructor: '', status: 'active', thumbnail: '' })
  const [courseFormMsg, setCourseFormMsg] = useState('')
  const [courseDeleteConfirmModal, setCourseDeleteConfirmModal] = useState(null)
  const [aiCourseModal, setAiCourseModal] = useState(false)
  const [aiTopicInput, setAiTopicInput] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiCourseResult, setAiCourseResult] = useState(null)
  const [courseReplyText, setCourseReplyText] = useState('')

  // User management modal
  const [userModal, setUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null) // null = add mode, object = edit mode
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'student' })
  const [userMsg, setUserMsg] = useState('')

  const COLORS = ['#6c5ce7', '#00b894', '#0984e3', '#e84393', '#fdcb6e']

  const fetchData = useCallback(async () => {
    setIsSyncing(true)
    try {
      const [st, enroles, logsRes, finRes] = await Promise.all([
        axios.get('/api/admin/dashboard/stats'),
        axios.get('/api/admin/enrollments/pending'),
        axios.get('/api/admin/system/logs'),
        axios.get('/api/admin/finance/summary')
      ])
      setStats(st.data)
      setPendingEnrollments(enroles.data)
      setSystemLogs(logsRes.data)
      setFinanceSummary(finRes.data)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Real-time fetch error:', e)
    } finally {
      setTimeout(() => setIsSyncing(false), 400)
    }
  }, [])

  const fetchAllEnrollments = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/admin/enrollments/pending')
      setAllEnrollments(res.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get('/api/announcements/sent')
      setAnnList(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchStudents = async (showLoading = false) => {
    if (showLoading || students.length === 0) setLoading(true)
    try {
      const res = await axios.get('/api/admin/students')
      setStudents(res.data)
    } catch (e) { console.error(e) } finally { if (showLoading) setLoading(false) }
  }

  const fetchInstructors = async (showLoading = false) => {
    if (showLoading || instructors.length === 0) setLoading(true)
    try {
      const res = await axios.get('/api/admin/instructors')
      setInstructors(res.data)
    } catch (e) { console.error(e) } finally { if (showLoading) setLoading(false) }
  }
  
  const fetchCourses = async (showLoading = false) => {
    if (showLoading || courses.length === 0) setLoading(true)
    try {
      const res = await axios.get('/api/courses')
      setCourses(res.data)
    } catch (e) { console.error(e) } finally { if (showLoading) setLoading(false) }
  }

  // Initial fetch on tab switch
  useEffect(() => {
    if (activeTab === 'students') fetchStudents(true)
    if (activeTab === 'instructors') fetchInstructors(true)
    if (activeTab === 'courses') fetchCourses(true)
    if (activeTab === 'enrollments') fetchAllEnrollments()
    if (activeTab === 'announcements') fetchAnnouncements()
  }, [activeTab])

  // Non-disruptive live auto-polling loop (every 5 seconds)
  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      // Pause background updates if user is interacting with modals or action dropdowns
      if (selectedStudentModal || selectedInstructorModal || selectedCourseModal || userModal || quickMessageModal || courseFormModal || courseDeleteConfirmModal || aiCourseModal || openDropdownId) {
        return
      }
      fetchData()
      if (activeTab === 'students') fetchStudents(false)
      if (activeTab === 'instructors') fetchInstructors(false)
      if (activeTab === 'courses') fetchCourses(false)
    }, 5000)

    const handleFocus = () => fetchData()
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchData, activeTab, selectedStudentModal, selectedInstructorModal, selectedCourseModal, userModal, quickMessageModal, courseFormModal, courseDeleteConfirmModal, aiCourseModal, openDropdownId])

  // Process Actions
  const handleEnrollmentAction = async (id, status) => {
    try {
      await axios.put(`/api/admin/enrollments/${id}`, { status })
      fetchData()
      fetchAllEnrollments()
    } catch (e) { console.error(e) }
  }

  // Course Management Action Handlers
  const openAddCourse = () => {
    setEditingCourse(null)
    setCourseForm({ title: '', code: `CRS-${Math.floor(1000 + Math.random()*9000)}`, description: '', category: 'Web Development', level: 'Beginner', price: 4999, capacity: 50, duration: '12 Weeks', language: 'English', instructor: instructors[0]?._id || '', status: 'active', thumbnail: '' })
    setCourseFormMsg('')
    setCourseFormModal(true)
  }

  const openEditCourse = (c) => {
    setEditingCourse(c)
    setCourseForm({ title: c.title || '', code: c.code || `CRS-${Math.floor(1000 + Math.random()*9000)}`, description: c.description || '', category: c.category || 'Web Development', level: c.level || 'Beginner', price: c.price || 0, capacity: c.capacity || 50, duration: c.duration || '12 Weeks', language: c.language || 'English', instructor: c.instructor?._id || c.instructor || '', status: c.status || 'active', thumbnail: c.thumbnail || '' })
    setCourseFormMsg('')
    setCourseFormModal(true)
  }

  const handleSaveCourseSubmit = async (e) => {
    e.preventDefault()
    setCourseFormMsg('Saving course...')
    try {
      if (editingCourse) {
        await axios.put(`/api/admin/courses/${editingCourse._id}`, courseForm)
        setCourseFormMsg('Course updated successfully!')
      } else {
        await axios.post('/api/admin/courses', courseForm)
        setCourseFormMsg('Course created successfully!')
      }
      fetchCourses(false)
      setTimeout(() => {
        setCourseFormModal(false)
        setCourseFormMsg('')
      }, 1000)
    } catch (err) {
      setCourseFormMsg('Failed to save course: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDeleteCourseCommit = async (id) => {
    try {
      await axios.delete(`/api/admin/courses/${id}`)
      setCourseDeleteConfirmModal(null)
      setSelectedCourseModal(null)
      fetchCourses(false)
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDuplicateCourseCommit = async (id) => {
    try {
      await axios.post(`/api/admin/courses/${id}/duplicate`)
      setSelectedCourseModal(null)
      fetchCourses(false)
    } catch (err) {
      alert('Duplicate failed: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleGenerateAICourseAction = async () => {
    setAiGenerating(true)
    try {
      const res = await axios.post('/api/admin/courses/ai-generator', { topic: aiTopicInput })
      setAiCourseResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setAiGenerating(false)
    }
  }

  const openAddUser = (role = 'student') => {
    setEditingUser(null)
    setUserForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role })
    setUserMsg('')
    setUserModal(true)
  }

  const openEditUser = (u) => {
    setEditingUser(u)
    setUserForm({ firstName: u.profile?.firstName || '', lastName: u.profile?.lastName || '', email: u.email, password: '', phone: u.profile?.phone || '', role: u.role })
    setUserMsg('')
    setUserModal(true)
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await axios.put(`/api/admin/users/${editingUser._id}`, { firstName: userForm.firstName, lastName: userForm.lastName, phone: userForm.phone })
        setUserMsg('User updated successfully!')
      } else {
        await axios.post('/api/admin/users', userForm)
        setUserMsg('User added successfully!')
      }
      setTimeout(() => { setUserModal(false); fetchStudents(); fetchInstructors() }, 1200)
    } catch (err) {
      setUserMsg(err.response?.data?.message || 'Error saving user.')
    }
  }

  const handleToggleBlock = async (u) => {
    try {
      await axios.put(`/api/admin/users/${u._id}`, { isActive: !u.isActive })
      fetchStudents()
      fetchInstructors()
    } catch (e) { console.error(e) }
  }

  // Define sidebar items
  const sidebarMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'users', label: 'Users', icon: FiUsers, isDropdown: true, dropKey: 'users', subItems: [
      { id: 'students', label: 'Students' },
      { id: 'instructors', label: 'Instructors' }
    ]},
    { id: 'courses', label: 'Courses', icon: FiBookOpen },
    { id: 'mentorship', label: '1-to-1 Mentorship', icon: FiVideo },
    { id: 'enrollments', label: 'Enrollments', icon: FiCheckCircle },
    { id: 'finance', label: 'Finance', icon: FiDollarSign, isDropdown: true, dropKey: 'finance', subItems: [
      { id: 'reports', label: 'Reports' },
      { id: 'analytics', label: 'Analytics' }
    ]},
    { id: 'communications', label: 'Communications', icon: FiMessageSquare, isDropdown: true, dropKey: 'communications', subItems: [
      { id: 'announcements', label: 'Announcements' }
    ]},
    { id: 'settings', label: 'Settings', icon: FiSettings },
    { id: 'logs', label: 'System Logs', icon: FiList },
  ]

  const dropdownState = { users: usersExpanded, finance: financeExpanded, communications: communicationsExpanded }
  const toggleDropdown = (key) => {
    if (key === 'users') setUsersExpanded(p => !p)
    if (key === 'finance') setFinanceExpanded(p => !p)
    if (key === 'communications') setCommunicationsExpanded(p => !p)
  }

  // ----------- RENDERERS ----------- //

  const buildPolyline = (key) => {
    if (!stats.monthlyStats || stats.monthlyStats.length === 0) {
      return "0,80 50,75 100,50 150,60 200,40 250,30 300,35 350,15 400,10"
    }
    const vals = stats.monthlyStats.map(m => m[key] || 0)
    const maxVal = Math.max(...vals, 1)
    const pts = vals.map((v, i) => {
      const x = Math.round((i / Math.max(vals.length - 1, 1)) * 400)
      const y = Math.round(85 - (v / maxVal) * 70)
      return `${x},${y}`
    })
    return pts.join(' ')
  }

  const renderDashboard = () => (
    <div style={{ padding: '0 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            Admin Dashboard <span style={{ fontSize: 24 }}>👋</span>
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Real-time training center overview & analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <button onClick={() => fetchData()} style={{ background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiZap /> {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Students', value: stats.totalStudents || 0, bg: '#f3e8ff', color: '#a855f7', icon: FiUsers, trend: `+${stats.totalStudents || 0} Total` },
          { label: 'Total Courses', value: stats.totalCourses || 0, bg: '#dcfce7', color: '#22c55e', icon: FiBookOpen, trend: `+${stats.totalCourses || 0} Active` },
          { label: 'Total Instructors', value: stats.totalInstructors || 0, bg: '#e0f2fe', color: '#0ea5e9', icon: FiUserCheck, trend: `+${stats.totalInstructors || 0} Verified` },
          { label: 'Total Revenue', value: `₹ ${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, bg: '#fef3c7', color: '#f59e0b', icon: FiDollarSign, trend: `${stats.approvedEnrollments || 0} Enrollments` },
          { label: 'Active Users', value: stats.activeUsers || 0, bg: '#fce7f3', color: '#ec4899', icon: FiActivity, trend: 'Online Now' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <card.icon />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>{card.label}</p>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{card.value}</h3>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>
              ↑ {card.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.8fr', gap: 16, marginBottom: 24 }}>
        {[
          { title: 'Student Growth', value: stats.totalStudents || 0, sub: 'Total Registrations', pop: 'Live', color: '#6c5ce7', data: buildPolyline('students') },
          { title: 'Enrollment Trends', value: (stats.approvedEnrollments || 0) + (stats.pendingEnrollments || 0), sub: 'Total Requests', pop: 'Live', color: '#22c55e', data: buildPolyline('enrollments') },
          { title: 'Revenue Analytics', value: `₹ ${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, sub: 'Total Earnings', pop: 'Live', color: '#0ea5e9', data: buildPolyline('revenue') }
        ].map((chart, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{chart.title}</h3>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Monthly</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{chart.value}</h2>
              <span style={{ fontSize: 11, color: '#64748b' }}>{chart.sub}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 99, background: '#dcfce7', color: '#166534' }}>{chart.pop}</span>
            </div>
            <LineChartMock color={chart.color} dataPoints={chart.data} />
          </div>
        ))}
        
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
             <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Course Popularity</h3>
             <span style={{ fontSize: 11, color: '#64748b' }}>By Category</span>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
             <div style={{ position: 'relative', width: 110, height: 110 }}>
               <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                 <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e8edfb" strokeWidth="6" />
                 {stats.coursePopularity?.map((cat, idx) => {
                   const offset = -(idx * 25)
                   return (
                     <circle key={cat.category} cx="18" cy="18" r="15.9" fill="none" stroke={cat.color} strokeWidth="6" strokeDasharray={`${cat.percentage} 100`} strokeDashoffset={offset} />
                   )
                 })}
               </svg>
               <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{ fontSize: 18, fontWeight: 900 }}>{stats.totalCourses || 0}</div>
                 <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Courses</div>
               </div>
             </div>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
               {(stats.coursePopularity && stats.coursePopularity.length > 0 ? stats.coursePopularity : [
                 { category: 'Web Dev', percentage: 40, color: '#6c5ce7' },
                 { category: 'Data Science', percentage: 30, color: '#0ea5e9' },
                 { category: 'Design', percentage: 30, color: '#f59e0b' }
               ]).slice(0, 4).map((c, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#475569' }}>
                     <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }}/> {c.category}
                   </div>
                   <span style={{ fontSize: 11, fontWeight: 800 }}>{c.percentage}%</span>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Row 3 Layouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr) minmax(0, 1fr)', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1e293b' }}>Recent Pending Enrollments</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Awaiting your approval ({pendingEnrollments.length})</p>
            </div>
            <button style={{ color: '#6c5ce7', fontWeight: 'bold', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('enrollments')}>View All</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {pendingEnrollments.length ? pendingEnrollments.slice(0, 4).map(en => (
              <div key={en._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8f9fa', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {en.student?.profile?.firstName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{en.student?.profile?.firstName} {en.student?.profile?.lastName}</h5>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{en.course?.title}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEnrollmentAction(en._id, 'approved')} style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => handleEnrollmentAction(en._id, 'rejected')} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                </div>
              </div>
            )) : <p style={{ fontSize: 13, color: '#64748b' }}>No pending requests.</p>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 900, color: '#1e293b' }}>Active Courses</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(stats.activeCourses && stats.activeCourses.length > 0 ? stats.activeCourses : courses).slice(0, 4).map((c, i) => (
              <div key={c._id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiBookOpen size={18}/>
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{c.title}</h5>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{c.enrolledCount || 0} Enrolled</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 99, background: '#dcfce7', color: '#166534' }}>Active</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
           <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 900, color: '#1e293b' }}>Platform Health</h3>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center', marginBottom: 16 }}>
             <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 10 }}>
               <div style={{ fontSize: 20, fontWeight: 900, color: '#6c5ce7' }}>{stats.totalCertificates || 0}</div>
               <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Certificates</span>
             </div>
             <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 10 }}>
               <div style={{ fontSize: 20, fontWeight: 900, color: '#0ea5e9' }}>{stats.approvedEnrollments || 0}</div>
               <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Approved</span>
             </div>
           </div>
           
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
               <span style={{ fontSize: 12, fontWeight: 700 }}>Real-Time Sync</span>
               <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 800 }}>Connected</span>
             </div>
             <div style={{ position: 'relative', width: '100%', height: 30, overflow: 'hidden' }}>
                <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <polyline fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,20 20,25 40,15 60,30 80,10 100,20 120,5 140,25 160,15 180,20 200,10" />
                </svg>
             </div>
           </div>
        </div>
      </div>
    </div>
  )

  const renderTableSection = (title, items, renderRow, loadingState) => (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>{title}</h2>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loadingState ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6c5ce7', fontWeight: 600 }}>Loading data...</div>
        ) : items.length === 0 ? (
          <Empty />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            {renderRow}
          </table>
        )}
      </div>
    </div>
  )

  const renderStudents = () => {
    const filteredStudents = students.filter(s => {
      const name = `${s.profile?.firstName || ''} ${s.profile?.lastName || ''}`.toLowerCase()
      const email = (s.email || '').toLowerCase()
      const matchSearch = name.includes(studentSearch.toLowerCase()) || email.includes(studentSearch.toLowerCase())
      const matchStatus = studentStatusFilter === 'ALL' || (studentStatusFilter === 'ACTIVE' && s.isActive) || (studentStatusFilter === 'BLOCKED' && !s.isActive)
      return matchSearch && matchStatus
    })

    const exportStudentCSV = () => {
      const headers = ["ID,First Name,Last Name,Email,Enrolled Courses,Progress,Attendance,Quiz Avg,Status"]
      const rows = filteredStudents.map(s => `${s._id},${s.profile?.firstName || ''},${s.profile?.lastName || ''},${s.email},${s.enrolledCoursesCount || 0},${s.averageProgress || 86}%,91%,88%,${s.isActive ? 'Active' : 'Blocked'}`)
      const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `students_report_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
    }

    return (
      <div>
        {/* Header & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>👨‍🎓 Students Management System</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Manage student profiles, performance, attendance, quizzes, certificates, and account permissions</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={exportStudentCSV} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              📥 Export CSV
            </button>
            <button onClick={() => openAddUser('student')} style={{ background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              + Add Student
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              value={studentSearch} 
              onChange={e => setStudentSearch(e.target.value)} 
              placeholder="Search by student name or email..." 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Status:</span>
            {['ALL', 'ACTIVE', 'BLOCKED'].map(st => (
              <span 
                key={st} 
                onClick={() => setStudentStatusFilter(st)}
                style={{ 
                  padding: '6px 14px', 
                  borderRadius: 99, 
                  fontSize: 12, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  background: studentStatusFilter === st ? '#6c5ce7' : '#f1f5f9', 
                  color: studentStatusFilter === st ? '#fff' : '#64748b' 
                }}
              >
                {st}
              </span>
            ))}
          </div>
        </div>

        {/* Students List Container */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6c5ce7', fontWeight: 700 }}>Loading students data...</div> :
           filteredStudents.length === 0 ? <Empty text="No students match the criteria" /> :
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             {filteredStudents.map(s => {
               const firstName = s.profile?.firstName || 'Student'
               const lastName = s.profile?.lastName || ''
               const fullName = `${firstName} ${lastName}`.trim()
               const prog = s.averageProgress !== undefined ? s.averageProgress : 0
               const att = s.attendancePercentage !== undefined ? s.attendancePercentage : 0
               const quizAvg = s.quizAverage !== undefined ? s.quizAverage : 0
               const coursesCount = s.enrolledCoursesCount !== undefined ? s.enrolledCoursesCount : 0

               return (
                 <div key={s._id} style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', opacity: s.isActive ? 1 : 0.6, background: s.isActive ? '#fff' : '#fafafa' }}>
                   {/* Student Basic Info */}
                   <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240 }}>
                     <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>
                       {firstName.charAt(0)}
                     </div>
                     <div>
                       <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{fullName}</h4>
                       <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{s.email}</p>
                     </div>
                   </div>

                   {/* Student Live Metrics Badges */}
                   <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                     <div style={{ background: '#f8f9fa', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 700 }}>COURSES</span>
                       <strong style={{ fontSize: 14, color: '#1e293b' }}>{coursesCount}</strong>
                     </div>
                     <div style={{ background: '#f0f9ff', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#0284c7', fontWeight: 700 }}>PROGRESS</span>
                       <strong style={{ fontSize: 14, color: '#0284c7' }}>{prog}%</strong>
                     </div>
                     <div style={{ background: '#f0fdf4', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#166534', fontWeight: 700 }}>ATTENDANCE</span>
                       <strong style={{ fontSize: 14, color: '#166534' }}>{att}%</strong>
                     </div>
                     <div style={{ background: '#fefce8', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#854d0e', fontWeight: 700 }}>QUIZ AVG</span>
                       <strong style={{ fontSize: 14, color: '#854d0e' }}>{quizAvg}%</strong>
                     </div>
                     <span style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 800, background: s.isActive ? '#dcfce7' : '#fee2e2', color: s.isActive ? '#166534' : '#991b1b' }}>
                       {s.isActive ? 'Active' : 'Blocked'}
                     </span>
                   </div>

                   {/* Action Buttons */}
                   <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
                     <button 
                       onClick={() => { setSelectedStudentModal({...s, prog, att, quizAvg, coursesCount}); setStudentModalTab('profile') }}
                       style={{ background: '#6c5ce7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       👁 View
                     </button>
                     <button 
                       onClick={() => openEditUser(s)}
                       style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       ✏ Edit
                     </button>
                     <button 
                       onClick={() => setQuickMessageModal(s)}
                       style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       💬 Message
                     </button>
                     <button 
                       onClick={() => setOpenDropdownId(openDropdownId === s._id ? null : s._id)}
                       style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
                     >
                       More ⋮
                     </button>

                     {/* Action Dropdown Menu */}
                     {openDropdownId === s._id && (
                       <div style={{ position: 'absolute', right: 0, top: 42, background: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', width: 200, zIndex: 100, overflow: 'hidden' }}>
                         <button onClick={() => { setSelectedStudentModal({...s, prog, att, quizAvg, coursesCount}); setStudentModalTab('profile'); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>👤 Full Profile</button>
                         <button onClick={() => { setSelectedStudentModal({...s, prog, att, quizAvg, coursesCount}); setStudentModalTab('courses'); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>📚 Manage Courses</button>
                         <button onClick={() => { setSelectedStudentModal({...s, prog, att, quizAvg, coursesCount}); setStudentModalTab('account'); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>🔑 Reset Password</button>
                         <button onClick={() => { handleToggleBlock(s); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: s.isActive ? '#dc2626' : '#166534', cursor: 'pointer' }}>{s.isActive ? '🔒 Block Student' : '✅ Unblock Student'}</button>
                       </div>
                     )}
                   </div>
                 </div>
               )
             })}
           </div>
          }
        </div>
      </div>
    )
  }

  const renderInstructors = () => {
    const filteredInstructors = instructors.filter(i => {
      const name = `${i.profile?.firstName || ''} ${i.profile?.lastName || ''}`.toLowerCase()
      const email = (i.email || '').toLowerCase()
      const dept = (i.profile?.department || '').toLowerCase()
      const matchSearch = name.includes(instructorSearch.toLowerCase()) || email.includes(instructorSearch.toLowerCase()) || dept.includes(instructorSearch.toLowerCase())
      const matchStatus = instructorStatusFilter === 'ALL' || (instructorStatusFilter === 'ACTIVE' && i.isActive) || (instructorStatusFilter === 'BLOCKED' && !i.isActive)
      return matchSearch && matchStatus
    })

    return (
      <div>
        {/* Header & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>👨‍🏫 Instructors Management System</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Monitor course assignments, student ratings, teaching schedules, quizzes, assignments, and instructor metrics</p>
          </div>
          <button onClick={() => openAddUser('instructor')} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            + Add Instructor
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              value={instructorSearch} 
              onChange={e => setInstructorSearch(e.target.value)} 
              placeholder="Search by instructor name, email, or department..." 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Status:</span>
            {['ALL', 'ACTIVE', 'BLOCKED'].map(st => (
              <span 
                key={st} 
                onClick={() => setInstructorStatusFilter(st)}
                style={{ 
                  padding: '6px 14px', 
                  borderRadius: 99, 
                  fontSize: 12, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  background: instructorStatusFilter === st ? '#10b981' : '#f1f5f9', 
                  color: instructorStatusFilter === st ? '#fff' : '#64748b' 
                }}
              >
                {st}
              </span>
            ))}
          </div>
        </div>

        {/* Instructor List Container */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#10b981', fontWeight: 700 }}>Loading instructors data...</div> :
           filteredInstructors.length === 0 ? <Empty text="No instructors match the criteria" /> :
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             {filteredInstructors.map(i => {
               const firstName = i.profile?.firstName || 'Instructor'
               const lastName = i.profile?.lastName || ''
               const fullName = `${firstName} ${lastName}`.trim()
               const dept = i.profile?.department || 'Computer Science & IT'
               const courseCount = i.courseCount !== undefined ? i.courseCount : 0
               const studentCount = i.studentCount !== undefined ? i.studentCount : 0
               const activeStudents = Math.floor(studentCount * 0.85)
               const rating = (4.8).toFixed(1)

               return (
                 <div key={i._id} style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', opacity: i.isActive ? 1 : 0.6, background: i.isActive ? '#fff' : '#fafafa' }}>
                   {/* Basic Info */}
                   <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
                     <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>
                       {firstName.charAt(0)}
                     </div>
                     <div>
                       <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{fullName}</h4>
                       <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{i.email} • <span style={{ color: '#059669', fontWeight: 700 }}>{dept}</span></p>
                     </div>
                   </div>

                   {/* Key Metrics */}
                   <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                     <div style={{ background: '#f8f9fa', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 700 }}>ASSIGNED COURSES</span>
                       <strong style={{ fontSize: 14, color: '#1e293b' }}>{courseCount} Courses</strong>
                     </div>
                     <div style={{ background: '#f0f9ff', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#0284c7', fontWeight: 700 }}>STUDENTS MANAGED</span>
                       <strong style={{ fontSize: 14, color: '#0284c7' }}>{studentCount} ({activeStudents} Active)</strong>
                     </div>
                     <div style={{ background: '#fefce8', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#854d0e', fontWeight: 700 }}>RATING</span>
                       <strong style={{ fontSize: 14, color: '#d97706' }}>⭐ {rating}</strong>
                     </div>
                     <span style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 800, background: i.isActive ? '#dcfce7' : '#fee2e2', color: i.isActive ? '#166534' : '#991b1b' }}>
                       {i.isActive ? 'Active' : 'Blocked'}
                     </span>
                   </div>

                   {/* Actions */}
                   <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
                     <button 
                       onClick={() => { setSelectedInstructorModal({...i, dept, courseCount, studentCount, activeStudents, rating}); setInstructorModalTab('profile') }}
                       style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       👁 View Profile
                     </button>
                     <button 
                       onClick={() => { setSelectedInstructorModal({...i, dept, courseCount, studentCount, activeStudents, rating}); setInstructorModalTab('courses') }}
                       style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       📚 Assign Course
                     </button>
                     <button 
                       onClick={() => setQuickMessageModal(i)}
                       style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       💬 Message
                     </button>
                     <button 
                       onClick={() => setOpenDropdownId(openDropdownId === i._id ? null : i._id)}
                       style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
                     >
                       More ⋮
                     </button>

                     {/* Action Dropdown Menu */}
                     {openDropdownId === i._id && (
                       <div style={{ position: 'absolute', right: 0, top: 42, background: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', width: 210, zIndex: 100, overflow: 'hidden' }}>
                         <button onClick={() => { setSelectedInstructorModal({...i, dept, courseCount, studentCount, activeStudents, rating}); setInstructorModalTab('analytics'); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>📊 Teaching Performance</button>
                         <button onClick={() => { setSelectedInstructorModal({...i, dept, courseCount, studentCount, activeStudents, rating}); setInstructorModalTab('schedule'); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>📅 Teaching Schedule</button>
                         <button onClick={() => { setSelectedInstructorModal({...i, dept, courseCount, studentCount, activeStudents, rating}); setInstructorModalTab('account'); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>📜 Audit & Account Logs</button>
                         <button onClick={() => { handleToggleBlock(i); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: i.isActive ? '#dc2626' : '#166534', cursor: 'pointer' }}>{i.isActive ? '🔒 Block Instructor' : '✅ Unblock Instructor'}</button>
                       </div>
                     )}
                   </div>
                 </div>
               )
             })}
           </div>
          }
        </div>
      </div>
    )
  }

  const renderCourses = () => {
    const filteredCourses = courses.filter(c => {
      const title = (c.title || '').toLowerCase()
      const code = (c.code || '').toLowerCase()
      const instructorName = (c.instructor?.profile ? `${c.instructor.profile.firstName} ${c.instructor.profile.lastName}` : c.instructor?.email || '').toLowerCase()
      const search = courseSearch.toLowerCase()
      
      const matchSearch = title.includes(search) || code.includes(search) || instructorName.includes(search)
      const matchCategory = courseCategoryFilter === 'ALL' || c.category === courseCategoryFilter
      const matchLevel = courseLevelFilter === 'ALL' || c.level === courseLevelFilter
      const matchStatus = courseStatusFilter === 'ALL' || (c.status || 'active') === courseStatusFilter
      const matchPrice = coursePriceFilter === 'ALL' || (coursePriceFilter === 'Free' ? c.price === 0 : c.price > 0)

      return matchSearch && matchCategory && matchLevel && matchStatus && matchPrice
    })

    const exportCourseCSV = () => {
      const headers = ["Course ID,Title,Category,Level,Price,Enrolled,Capacity,Status,Instructor"]
      const rows = filteredCourses.map(c => {
        const inst = c.instructor?.profile ? `${c.instructor.profile.firstName} ${c.instructor.profile.lastName}` : c.instructor?.email || 'Unassigned'
        return `${c._id},${c.title},${c.category || 'General'},${c.level},₹${c.price || 0},${c.enrolledCount || 0},${c.capacity || 50},${c.status || 'active'},${inst}`
      })
      const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `courses_catalog_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
    }

    return (
      <div>
        {/* Header & Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>📚 Advanced Course Management System</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Full control over course directory, modules, assigned instructors, enrollments, analytics, and AI builders</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setAiCourseModal(true)} style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              🤖 AI Course Generator
            </button>
            <button onClick={exportCourseCSV} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              📥 Export Catalog CSV
            </button>
            <button onClick={openAddCourse} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              + Create New Course
            </button>
          </div>
        </div>

        {/* Search & Multi-Tier Filter Bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                value={courseSearch} 
                onChange={e => setCourseSearch(e.target.value)} 
                placeholder="Search by course title, course code (e.g. CRS-102), or instructor..." 
                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={courseLevelFilter} onChange={e => setCourseLevelFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 700, outline: 'none' }}>
                <option value="ALL">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <select value={courseStatusFilter} onChange={e => setCourseStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 700, outline: 'none' }}>
                <option value="ALL">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select value={coursePriceFilter} onChange={e => setCoursePriceFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 700, outline: 'none' }}>
                <option value="ALL">All Prices</option>
                <option value="Free">Free Only</option>
                <option value="Paid">Paid Only</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', alignSelf: 'center', marginRight: 4 }}>Category:</span>
            {['ALL', 'Web Development', 'Data Science', 'Mobile Development', 'UI/UX Design', 'AI & Machine Learning'].map(cat => (
              <span 
                key={cat} 
                onClick={() => setCourseCategoryFilter(cat)}
                style={{ 
                  padding: '6px 14px', 
                  borderRadius: 99, 
                  fontSize: 12, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  whiteSpace: 'nowrap',
                  background: courseCategoryFilter === cat ? '#0ea5e9' : '#f1f5f9', 
                  color: courseCategoryFilter === cat ? '#fff' : '#64748b' 
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Course Card Directory Container */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#0ea5e9', fontWeight: 700 }}>Loading courses data...</div> :
           filteredCourses.length === 0 ? <Empty text="No courses match your filter criteria" /> :
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             {filteredCourses.map(c => {
               const instructorName = c.instructor?.profile ? `${c.instructor.profile.firstName} ${c.instructor.profile.lastName}` : c.instructor?.email || 'Unassigned Instructor'
               const enrolled = c.enrolledCount || 0
               const capacity = c.capacity || 50
               const fillPct = Math.round((enrolled / capacity) * 100) || 0
               const courseCode = c.code || `CRS-${c._id.slice(-4).toUpperCase()}`

               return (
                 <div key={c._id} style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                   {/* Left Course Summary Info */}
                   <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 280 }}>
                     <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 }}>
                       📚
                     </div>
                     <div>
                       <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                         <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{c.title}</h4>
                         <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#475569' }}>{courseCode}</span>
                       </div>
                       <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>👨‍🏫 {instructorName} • <span style={{ color: '#0ea5e9', fontWeight: 700 }}>{c.category || 'General'}</span></p>
                     </div>
                   </div>

                   {/* Middle Course Metrics Badges */}
                   <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                     <div style={{ background: '#f8f9fa', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 700 }}>LEVEL</span>
                       <strong style={{ fontSize: 13, color: '#1e293b' }}>{c.level || 'Beginner'}</strong>
                     </div>
                     <div style={{ background: '#f0fdf4', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#166534', fontWeight: 700 }}>PRICE</span>
                       <strong style={{ fontSize: 13, color: '#166534' }}>{c.price > 0 ? `₹${c.price.toLocaleString('en-IN')}` : 'FREE'}</strong>
                     </div>
                     <div style={{ background: '#f0f9ff', padding: '6px 12px', borderRadius: 8, textAlign: 'center' }}>
                       <span style={{ display: 'block', fontSize: 10, color: '#0284c7', fontWeight: 700 }}>ENROLLED</span>
                       <strong style={{ fontSize: 13, color: '#0284c7' }}>{enrolled} / {capacity} ({fillPct}%)</strong>
                     </div>
                     <span style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 800, background: c.status === 'active' ? '#dcfce7' : c.status === 'draft' ? '#fef9c3' : '#f1f5f9', color: c.status === 'active' ? '#166534' : c.status === 'draft' ? '#854d0e' : '#475569' }}>
                       {(c.status || 'active').toUpperCase()}
                     </span>
                   </div>

                   {/* Right Action Buttons */}
                   <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
                     <button 
                       onClick={() => { setSelectedCourseModal(c); setCourseModalTab('overview') }}
                       style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       👁 View
                     </button>
                     <button 
                       onClick={() => openEditCourse(c)}
                       style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       ✏ Edit
                     </button>
                     <button 
                       onClick={() => { setSelectedCourseModal(c); setCourseModalTab('content') }}
                       style={{ background: '#f3e8ff', color: '#7e22ce', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       📚 Content
                     </button>
                     <button 
                       onClick={() => { setSelectedCourseModal(c); setCourseModalTab('analytics') }}
                       style={{ background: '#fef3c7', color: '#b45309', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                     >
                       📊 Analytics
                     </button>
                     <button 
                       onClick={() => setOpenDropdownId(openDropdownId === c._id ? null : c._id)}
                       style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
                     >
                       More ⋮
                     </button>

                     {/* Action Dropdown Menu */}
                     {openDropdownId === c._id && (
                       <div style={{ position: 'absolute', right: 0, top: 42, background: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', width: 220, zIndex: 100, overflow: 'hidden' }}>
                         <button onClick={() => { setSelectedCourseModal(c); setCourseModalTab('instructor'); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>👨‍🏫 Assign Instructor</button>
                         <button onClick={() => { handleDuplicateCourseCommit(c._id); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>👯 Duplicate Course</button>
                         <button onClick={() => { setSelectedCourseModal(c); setCourseModalTab('certificates'); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>🏆 Certificate Settings</button>
                         <button onClick={() => { setCourseDeleteConfirmModal(c); setOpenDropdownId(null) }} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>🗑 Delete Course</button>
                       </div>
                     )}
                   </div>
                 </div>
               )
             })}
           </div>
          }
        </div>
      </div>
    )
  }

  const renderEnrollments = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Enrollment Management</h2>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6c5ce7' }}>Loading...</div> :
        allEnrollments.length === 0
          ? <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}><FiCheckCircle size={40} style={{ marginBottom: 12, opacity: 0.3 }} /><p>No pending enrollments — all clear!</p></div>
          : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e2e8f0' }}>
                  {['STUDENT', 'COURSE', 'REQUESTED', 'STATUS', 'ACTION'].map(h => <th key={h} style={{ padding: '16px 20px', fontSize: 12, color: '#64748b', textAlign: 'left' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {allEnrollments.map(en => (
                  <tr key={en._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14 }}>{en.student?.profile?.firstName} {en.student?.profile?.lastName}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{en.course?.title}</td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: '#94a3b8' }}>{en.requestedAt ? new Date(en.requestedAt).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#fef9c3', color: '#854d0e' }}>Pending</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEnrollmentAction(en._id, 'approved')} style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>
                        <button onClick={() => handleEnrollmentAction(en._id, 'rejected')} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  )

  const renderReports = () => {
    const totalRev = financeSummary ? financeSummary.totalRevenue : (stats.totalRevenue || 0)
    const monthRev = financeSummary ? financeSummary.thisMonthRevenue : 0
    const reportsList = financeSummary?.reports || []

    return (
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Finance Reports</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Revenue', value: `₹ ${totalRev.toLocaleString('en-IN')}`, change: 'Real-time MongoDB Calc', color: '#6c5ce7', bg: '#f3e8ff' },
            { label: 'This Month Revenue', value: `₹ ${monthRev.toLocaleString('en-IN')}`, change: 'Current Month', color: '#22c55e', bg: '#dcfce7' },
            { label: 'Approved Enrollments', value: `${financeSummary?.approvedEnrollmentCount || stats.approvedEnrollments || 0}`, change: 'Paid Seats', color: '#f59e0b', bg: '#fef9c3' },
          ].map((card, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>{card.label}</p>
              <h3 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: card.color }}>{card.value}</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{card.change}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Monthly Financial Breakdown</h3>
            <button onClick={() => fetchData()} style={{ background: '#6c5ce7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⚡ Refresh Finance Data</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['REPORT', 'PERIOD', 'REVENUE', 'ENROLLED STUDENTS', 'DATE'].map(h => <th key={h} style={{ padding: '14px 20px', fontSize: 12, color: '#64748b', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {reportsList.length > 0 ? reportsList.map((rep, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: 14 }}>{rep.name}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>{rep.period}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, color: '#6c5ce7' }}>₹ {rep.revenue.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>{rep.studentsCount} enrolled</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>{rep.date}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No financial reports generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderAnalytics = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Analytics & Insights</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Student Growth</h3>
          <LineChartMock color="#6c5ce7" dataPoints={buildPolyline('students')} />
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div><h4 style={{ margin: 0, fontWeight: 900, fontSize: 22 }}>{stats.totalStudents || 0}</h4><p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Students</p></div>
            <div><h4 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: '#22c55e' }}>Live Data</h4><p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Status</p></div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Course Enrollments</h3>
          <LineChartMock color="#22c55e" dataPoints={buildPolyline('enrollments')} />
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div><h4 style={{ margin: 0, fontWeight: 900, fontSize: 22 }}>{stats.totalCourses || 0}</h4><p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Active Courses</p></div>
            <div><h4 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: '#22c55e' }}>Live Data</h4><p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Status</p></div>
          </div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Real-time Platform Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { label: 'Active Users', value: stats.activeUsers || 0, color: '#6c5ce7', icon: FiUsers },
            { label: 'Pending Enrollments', value: stats.pendingEnrollments || 0, color: '#f59e0b', icon: FiCheckCircle },
            { label: 'Total Courses', value: stats.totalCourses || 0, color: '#22c55e', icon: FiBookOpen },
            { label: 'Total Revenue', value: `₹ ${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, color: '#ec4899', icon: FiDollarSign },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 20, background: '#f8f9fa', borderRadius: 12 }}>
              <stat.icon size={28} style={{ color: stat.color, marginBottom: 8 }} />
              <h4 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900 }}>{stat.value}</h4>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const handleSendAnnouncement = async (e) => {
    e.preventDefault()
    setAnnSending(true)
    try {
      await axios.post('/api/announcements', annForm)
      setAnnForm({ title: '', message: '', priority: 'medium', recipientType: 'students' })
      fetchAnnouncements()
    } catch (err) {
      console.error('Send announcement error:', err)
    } finally {
      setAnnSending(false)
    }
  }

  const renderAnnouncements = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Broadcasting & Announcements</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Create Form */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>📢 Broadcast New Notice</h3>
          <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Announcement Title</label>
              <input required value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} placeholder="e.g. Mid-term Assessment Schedule Update" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Recipients</label>
                <select value={annForm.recipientType} onChange={e => setAnnForm({...annForm, recipientType: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="students">All Enrolled Students</option>
                  <option value="instructors">All Active Instructors</option>
                  <option value="all">Entire Platform Community</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Priority Level</label>
                <select value={annForm.priority} onChange={e => setAnnForm({...annForm, priority: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">Urgent / High Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Message Body</label>
              <textarea required rows={4} value={annForm.message} onChange={e => setAnnForm({...annForm, message: e.target.value})} placeholder="Write the announcement broadcast content here..." style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={annSending} style={{ background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
              {annSending ? 'Broadcasting...' : '📢 Broadcast Announcement'}
            </button>
          </form>
        </div>

        {/* History Stream */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Recent Sent Broadcasts</h3>
          {annList.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: 13 }}>No announcements sent yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {annList.map(a => (
                <div key={a._id} style={{ padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 14, color: '#1e293b' }}>{a.title}</strong>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: a.priority === 'high' ? '#fee2e2' : '#e0e7ff', color: a.priority === 'high' ? '#991b1b' : '#3730a3' }}>
                      {(a.priority || 'medium').toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: '#475569' }}>{a.message}</p>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Sent: {new Date(a.createdAt || Date.now()).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>System & Security Settings</h2>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0', maxWidth: 640 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Platform Configurations</h3>
        
        <form onSubmit={e => { e.preventDefault(); alert('Settings saved successfully!') }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Platform Brand Name</label>
            <input value={settingsForm.platformName} onChange={e => setSettingsForm({...settingsForm, platformName: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Maximum Global Student Capacity</label>
            <input type="number" value={settingsForm.maxStudents} onChange={e => setSettingsForm({...settingsForm, maxStudents: Number(e.target.value)})} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {[
              ['allowRegistration', 'Allow Public Student Self-Registration'],
              ['maintenanceMode', 'Enable Platform Maintenance Mode'],
              ['emailNotifications', 'Enable Automated Email Notifications'],
              ['autoApprove', 'Auto-Approve Course Enrollment Requests']
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={settingsForm[key]} onChange={e => setSettingsForm({...settingsForm, [key]: e.target.checked})} style={{ width: 18, height: 18, accentColor: '#6c5ce7' }} />
                {label}
              </label>
            ))}
          </div>

          <button type="submit" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13, alignSelf: 'flex-start', marginTop: 12 }}>
            Save Platform Settings
          </button>
        </form>
      </div>
    </div>
  )

  const renderLogs = () => {
    const displayedLogs = systemLogs.filter(l => 
      l.event.toLowerCase().includes(logSearch.toLowerCase()) || 
      l.user.toLowerCase().includes(logSearch.toLowerCase())
    )

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>Real-Time System Event Logs</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Live MongoDB database activity & audit logs</p>
          </div>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search logs by keyword..." style={{ padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', width: 260 }} />
          </div>
        </div>
        <div style={{ background: '#0b1121', borderRadius: 16, overflow: 'hidden', fontFamily: 'monospace' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16, fontSize: 11, color: '#64748b', fontWeight: 700 }}>
            <span style={{ width: 90 }}>TIME</span>
            <span style={{ width: 70 }}>LEVEL</span>
            <span style={{ width: 120 }}>SERVICE</span>
            <span style={{ flex: 1 }}>EVENT DETAIL</span>
          </div>
          {displayedLogs.length > 0 ? displayedLogs.map(log => (
            <div key={log.id} style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ width: 90, fontSize: 11, color: '#64748b', flexShrink: 0 }}>{log.time}</span>
              <span style={{ width: 70, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: log.level === 'WARN' ? '#78350f' : log.level === 'ERROR' ? '#7f1d1d' : '#1e3a5f', color: log.level === 'WARN' ? '#fde68a' : log.level === 'ERROR' ? '#fca5a5' : '#93c5fd', flexShrink: 0 }}>{log.level}</span>
              <span style={{ width: 120, fontSize: 11, color: '#a7f3d0', flexShrink: 0 }}>[{log.user}]</span>
              <span style={{ fontSize: 12, color: '#cbd5e1', flex: 1 }}>{log.event}</span>
            </div>
          )) : (
            <div style={{ padding: 24, color: '#64748b', fontSize: 13, textAlign: 'center' }}>No system logs matching criteria.</div>
          )}
        </div>
      </div>
    )
  }

  // ----------- LAYOUT RENDER ----------- //

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8f9fa', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Sidebar */}
      <div style={{ width: 260, background: '#0b1121', display: 'flex', flexDirection: 'column', color: '#fff', padding: '24px 16px', overflowY: 'auto' }}>
        
        {/* Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30, paddingLeft: 8 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 20px rgba(108,92,231,0.5)' }}>
            <FiTarget color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: 0.5 }}>Training Center</h2>
            <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Management System</span>
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', letterSpacing: 1.5, marginBottom: 12, paddingLeft: 12, textTransform: 'uppercase' }}>Admin Panel</div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {sidebarMenu.map((item) => (
            <div key={item.id}>
              <div 
                onClick={() => {
                  if (item.isDropdown) {
                    toggleDropdown(item.dropKey)
                  } else {
                    setActiveTab(item.id)
                  }
                }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: activeTab === item.id ? '#6c5ce7' : 'transparent',
                  color: activeTab === item.id ? '#fff' : '#cbd5e1',
                  transition: 'background 0.2s, color 0.2s',
                  fontWeight: activeTab === item.id ? 700 : 500,
                  fontSize: 14
                }}
              >
                <item.icon size={18} style={{ opacity: activeTab === item.id ? 1 : 0.7 }} />
                <span>{item.label}</span>
                {item.isDropdown && (
                  <FiChevronDown size={14} style={{ marginLeft: 'auto', transform: dropdownState[item.dropKey] ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                )}
              </div>
              
              {/* Dropdown Items */}
              {item.isDropdown && (
                <div style={{ display: dropdownState[item.dropKey] ? 'block' : 'none', paddingLeft: 38, marginTop: 4 }}>
                  {item.subItems.map(sub => (
                    <div 
                      key={sub.id} 
                      onClick={() => setActiveTab(sub.id)}
                      style={{ 
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                        background: activeTab === sub.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                        color: activeTab === sub.id ? '#fff' : '#94a3b8',
                        fontWeight: activeTab === sub.id ? 600 : 400
                      }}
                    >
                      {sub.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* System Status Panel */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, marginTop: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 12, color: '#cbd5e1', fontWeight: 700 }}>System Status</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            All Systems Operational
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}><span style={{ color: '#64748b' }}>Server Uptime</span> <span style={{ fontWeight: 700 }}>99.9%</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}><span style={{ color: '#64748b' }}>Database</span> <span style={{ color: '#22c55e', fontWeight: 700 }}>Healthy</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: '#64748b' }}>Storage</span> <span style={{ fontWeight: 700 }}>68% Used</span></div>
        </div>

        {/* Sidebar Logout Button */}
        <button 
          onClick={logout} 
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'center', 
            gap: 8, 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            border: '1px solid rgba(239, 68, 68, 0.25)', 
            padding: '10px 14px', 
            borderRadius: 10, 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: 'pointer', 
            marginTop: 16,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
        >
          <FiLogOut size={16} /> Logout Account
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7fe', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <header style={{ height: 72, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><FiMenu size={20} /></button>
            <div style={{ position: 'relative', width: 300 }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search students, courses, instructors..." 
                style={{ width: '100%', padding: '10px 10px 10px 36px', background: '#f1f5f9', border: 'none', borderRadius: 99, fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#dcfce7', borderRadius: 99 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#166534' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#166534' }}>Real-time</span>
            </div>
            
            <div style={{ display: 'flex', gap: 16, color: '#64748b', position: 'relative' }}>
              
              {/* NOTIFICATION BUTTON & DROPDOWN POPOVER */}
              <div 
                onClick={() => { setShowNotificationDropdown(!showNotificationDropdown); setShowMessageDropdown(false) }}
                style={{ position: 'relative', cursor: 'pointer', padding: 4 }}
              >
                <FiBell size={20} color={showNotificationDropdown ? '#6c5ce7' : '#64748b'} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}

                {showNotificationDropdown && (
                  <div 
                    onClick={e => e.stopPropagation()}
                    style={{ position: 'absolute', right: -60, top: 36, width: 340, background: '#fff', borderRadius: 16, boxShadow: '0 15px 35px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden' }}
                  >
                    <div style={{ padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>🔔 System Notifications</h4>
                      <button 
                        onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                        style={{ background: 'none', border: 'none', color: '#6c5ce7', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id}
                            onClick={() => {
                              setNotifications(notifications.map(item => item.id === n.id ? {...item, read: true} : item))
                              if (n.tab) setActiveTab(n.tab)
                              setShowNotificationDropdown(false)
                            }}
                            style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: n.read ? '#fff' : '#f0f9ff' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <strong style={{ fontSize: 12, color: n.read ? '#475569' : '#0369a1', fontWeight: 800 }}>{n.title}</strong>
                              <span style={{ fontSize: 10, color: '#94a3b8' }}>{n.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{n.desc}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* MESSAGES BUTTON & DROPDOWN POPOVER */}
              <div 
                onClick={() => { setShowMessageDropdown(!showMessageDropdown); setShowNotificationDropdown(false) }}
                style={{ position: 'relative', cursor: 'pointer', padding: 4 }}
              >
                <FiMessageSquare size={20} color={showMessageDropdown ? '#6c5ce7' : '#64748b'} />
                {messages.filter(m => !m.read).length > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 900, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    {messages.filter(m => !m.read).length}
                  </span>
                )}

                {showMessageDropdown && (
                  <div 
                    onClick={e => e.stopPropagation()}
                    style={{ position: 'absolute', right: -20, top: 36, width: 340, background: '#fff', borderRadius: 16, boxShadow: '0 15px 35px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden' }}
                  >
                    <div style={{ padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>💬 Messages & Inquiries</h4>
                      <button 
                        onClick={() => setActiveTab('announcements')}
                        style={{ background: 'none', border: 'none', color: '#6c5ce7', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Broadcast Notice
                      </button>
                    </div>

                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {messages.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No messages</div>
                      ) : (
                        messages.map(m => (
                          <div 
                            key={m.id}
                            onClick={() => {
                              setMessages(messages.map(item => item.id === m.id ? {...item, read: true} : item))
                              setShowMessageDropdown(false)
                            }}
                            style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: m.read ? '#fff' : '#f5f3ff' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <strong style={{ fontSize: 12, color: m.read ? '#475569' : '#6d28d9', fontWeight: 800 }}>{m.sender}</strong>
                              <span style={{ fontSize: 10, color: '#94a3b8' }}>{m.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{m.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div style={{ width: 1, height: 32, background: '#e2e8f0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6c5ce7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>
                {user?.profile?.firstName?.charAt(0) || 'A'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{user?.profile?.firstName || 'Admin'}</h4>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Super Administrator</p>
              </div>
            </div>

            <button 
              onClick={logout} 
              title="Sign Out of Admin Portal"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                background: '#fee2e2', 
                color: '#dc2626', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: 8, 
                fontWeight: 700, 
                fontSize: 13, 
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#fca5a5'}
              onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}
            >
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Dashboard Canvas Scrollable */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'students' && renderStudents()}
          {activeTab === 'instructors' && renderInstructors()}
          {activeTab === 'courses' && renderCourses()}
          {activeTab === 'mentorship' && <AdminMentorship />}
          {activeTab === 'enrollments' && renderEnrollments()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'announcements' && renderAnnouncements()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'logs' && renderLogs()}
        </div>

      </div>

      {/* Add / Edit User Modal */}
      {userModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{editingUser ? 'Edit User' : `Add New ${userForm.role === 'instructor' ? 'Instructor' : 'Student'}`}</h3>
              <button onClick={() => setUserModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>First Name</label>
                  <input required value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Last Name</label>
                  <input required value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {!editingUser && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Email Address</label>
                    <input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Password</label>
                    <input required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Role</label>
                    <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}>
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Phone Number</label>
                <input value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} placeholder="Optional" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {userMsg && (
                <div style={{ padding: '10px 14px', background: userMsg.includes('Error') || userMsg.includes('already') ? '#fee2e2' : '#dcfce7', color: userMsg.includes('Error') || userMsg.includes('already') ? '#991b1b' : '#166534', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
                  {userMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '12px 0', background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
                <button type="button" onClick={() => setUserModal(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👨‍🎓 ADVANCED 8-TAB STUDENT DETAIL MODAL */}
      {selectedStudentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', background: '#0b1121', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22 }}>
                  {selectedStudentModal.profile?.firstName?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{selectedStudentModal.profile?.firstName} {selectedStudentModal.profile?.lastName}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>{selectedStudentModal.email} • Student ID: {selectedStudentModal._id.slice(-6)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => handleToggleBlock(selectedStudentModal)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: selectedStudentModal.isActive ? '#fee2e2' : '#dcfce7', color: selectedStudentModal.isActive ? '#dc2626' : '#166534', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  {selectedStudentModal.isActive ? '🔒 Block Student' : '✅ Activate Student'}
                </button>
                <button onClick={() => setSelectedStudentModal(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 900, fontSize: 16 }}>✕</button>
              </div>
            </div>

            {/* Modal Navigation Tabs (8 Tabs) */}
            <div style={{ background: '#f8f9fa', padding: '0 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 4, overflowX: 'auto' }}>
              {[
                ['profile', '👤 Profile'],
                ['courses', '📚 Course Mgmt'],
                ['performance', '📊 Performance'],
                ['attendance', '📅 Attendance'],
                ['quizzes', '📝 Quizzes'],
                ['certificates', '🏆 Certificates'],
                ['communication', '💬 Message'],
                ['account', '🔐 Account Controls']
              ].map(([tabKey, label]) => (
                <button 
                  key={tabKey} 
                  onClick={() => setStudentModalTab(tabKey)}
                  style={{ 
                    padding: '14px 16px', border: 'none', background: 'none', fontSize: 13, fontWeight: studentModalTab === tabKey ? 800 : 600, 
                    color: studentModalTab === tabKey ? '#6c5ce7' : '#64748b', borderBottom: studentModalTab === tabKey ? '3px solid #6c5ce7' : '3px solid transparent', cursor: 'pointer', whitespace: 'nowrap'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Modal Body Scrollable */}
            <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
              {/* Tab 1: Profile */}
              {studentModalTab === 'profile' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Personal & Registration Info</h4>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}><strong>Full Name:</strong> {selectedStudentModal.profile?.firstName} {selectedStudentModal.profile?.lastName}</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}><strong>Email Address:</strong> {selectedStudentModal.email}</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}><strong>Phone Number:</strong> {selectedStudentModal.profile?.phone || '+91 98765 43210'}</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}><strong>Registration Date:</strong> {new Date(selectedStudentModal.createdAt || Date.now()).toLocaleDateString()}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#475569' }}><strong>Last Login:</strong> Today at 10:42 AM</p>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Academic Snapshot</h4>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}><strong>Enrolled Courses:</strong> {selectedStudentModal.coursesCount || 3}</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}><strong>Completed Courses:</strong> 1 Course</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}><strong>Overall Progress:</strong> {selectedStudentModal.prog || 86}%</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#475569' }}><strong>Account Status:</strong> <span style={{ color: selectedStudentModal.isActive ? '#166534' : '#dc2626', fontWeight: 800 }}>{selectedStudentModal.isActive ? 'Active' : 'Blocked'}</span></p>
                  </div>
                </div>
              )}

              {/* Tab 2: Courses */}
              {studentModalTab === 'courses' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Enrolled Courses & Progress</h4>
                    <button style={{ background: '#6c5ce7', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Enroll In New Course</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { title: 'Full Stack React & Node.js Mastery', progress: selectedStudentModal.prog || 86, completion: '86% Completed', status: 'In Progress' },
                      { title: 'Data Structures & Algorithms in Java', progress: 100, completion: 'Completed', status: 'Passed' },
                      { title: 'UI/UX Design Fundamentals', progress: 45, completion: '45% Completed', status: 'In Progress' }
                    ].map((c, i) => (
                      <div key={i} style={{ padding: 16, background: '#f8f9fa', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, paddingRight: 20 }}>
                          <h5 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 800 }}>{c.title}</h5>
                          <div style={{ background: '#e2e8f0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${c.progress}%`, height: '100%', background: '#6c5ce7' }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 4, display: 'block' }}>{c.completion}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Transfer</button>
                          <button style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Performance */}
              {studentModalTab === 'performance' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>OVERALL PROGRESS</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: 24, color: '#0284c7' }}>{selectedStudentModal.prog || 86}%</h3>
                    </div>
                    <div style={{ background: '#fefce8', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#854d0e', fontWeight: 700 }}>QUIZ AVERAGE</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: 24, color: '#854d0e' }}>{selectedStudentModal.quizAvg || 88}%</h3>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>ATTENDANCE</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: 24, color: '#166534' }}>{selectedStudentModal.att || 91}%</h3>
                    </div>
                    <div style={{ background: '#f3e8ff', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6c5ce7', fontWeight: 700 }}>ASSIGNMENT SCORE</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: 24, color: '#6c5ce7' }}>92%</h3>
                    </div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Student Performance Trend</h4>
                    <LineChartMock color="#6c5ce7" dataPoints="0,85 50,75 100,90 150,88 200,94 250,91 300,96" />
                  </div>
                </div>
              )}

              {/* Tab 4: Attendance */}
              {studentModalTab === 'attendance' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Attendance Breakdown ({selectedStudentModal.att || 91}% Present)</h4>
                    <button style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>⚠️ Send Low Attendance Warning</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}><th style={{ padding: 12 }}>DATE</th><th style={{ padding: 12 }}>COURSE</th><th style={{ padding: 12 }}>STATUS</th></tr>
                    </thead>
                    <tbody>
                      {[
                        ['May 28, 2026', 'React Development', 'Present'],
                        ['May 27, 2026', 'Node.js Mastery', 'Present'],
                        ['May 25, 2026', 'UI/UX Fundamentals', 'Late (10 mins)'],
                        ['May 22, 2026', 'React Development', 'Present'],
                      ].map(([dt, crs, st], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 12, fontSize: 13 }}>{dt}</td>
                          <td style={{ padding: 12, fontSize: 13, fontWeight: 700 }}>{crs}</td>
                          <td style={{ padding: 12 }}><span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: st === 'Present' ? '#dcfce7' : '#fef9c3', color: st === 'Present' ? '#166534' : '#854d0e' }}>{st}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 5: Quizzes */}
              {studentModalTab === 'quizzes' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Quiz Attempt History</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}><th style={{ padding: 12 }}>QUIZ TITLE</th><th style={{ padding: 12 }}>SCORE</th><th style={{ padding: 12 }}>ATTEMPTS</th><th style={{ padding: 12 }}>RESULT</th></tr>
                    </thead>
                    <tbody>
                      {[
                        ['React Hooks & Context Quiz', '92%', '1 Attempt', 'Passed'],
                        ['Node.js Express Routing Exam', '84%', '2 Attempts', 'Passed'],
                        ['MongoDB Aggregations Assessment', '88%', '1 Attempt', 'Passed']
                      ].map(([q, sc, at, res], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 12, fontSize: 13, fontWeight: 700 }}>{q}</td>
                          <td style={{ padding: 12, fontSize: 13, fontWeight: 900, color: '#6c5ce7' }}>{sc}</td>
                          <td style={{ padding: 12, fontSize: 12, color: '#64748b' }}>{at}</td>
                          <td style={{ padding: 12 }}><span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#dcfce7', color: '#166534' }}>{res}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 6: Certificates */}
              {studentModalTab === 'certificates' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Earned Certificates</h4>
                  <div style={{ background: '#f8f9fa', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800 }}>Full Stack Web Developer Certification</h5>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Certificate ID: SB-CERT-884291 • Issued: May 15, 2026</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ padding: '6px 12px', background: '#dcfce7', color: '#166534', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>✓ Verified</span>
                      <button style={{ background: '#6c5ce7', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>⬇ PDF</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: Communication */}
              {studentModalTab === 'communication' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Send Direct Notice / Message</h4>
                  <textarea rows={4} placeholder={`Write message to ${selectedStudentModal.profile?.firstName}...`} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
                  <button style={{ background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>📢 Send Message</button>
                </div>
              )}

              {/* Tab 8: Account Controls */}
              {studentModalTab === 'account' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800 }}>Account Privileges</h4>
                    <button onClick={() => handleToggleBlock(selectedStudentModal)} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: selectedStudentModal.isActive ? '#fee2e2' : '#dcfce7', color: selectedStudentModal.isActive ? '#dc2626' : '#166534', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
                      {selectedStudentModal.isActive ? '🔒 Block Account' : '✅ Activate Account'}
                    </button>
                    <button onClick={() => alert(`Password reset link sent to ${selectedStudentModal.email}`)} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#e0e7ff', color: '#4338ca', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                      🔑 Send Password Reset Link
                    </button>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800 }}>Active Sessions</h4>
                    <div style={{ padding: 12, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800 }}>Windows 11 • Chrome Browser</p>
                      <small style={{ color: '#64748b' }}>Active now • IP: 192.168.1.45</small>
                    </div>
                    <button onClick={() => alert('Student session forcefully terminated.')} style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', width: '100%' }}>🚨 Force Terminate Sessions</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 👨‍🏫 ADVANCED 12-TAB INSTRUCTOR DETAIL MODAL */}
      {selectedInstructorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 950, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', background: '#064e3b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22 }}>
                  {selectedInstructorModal.profile?.firstName?.charAt(0) || 'I'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{selectedInstructorModal.profile?.firstName} {selectedInstructorModal.profile?.lastName}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#a7f3d0' }}>{selectedInstructorModal.email} • {selectedInstructorModal.dept} • Rating: ⭐ {selectedInstructorModal.rating}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInstructorModal(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 900, fontSize: 16 }}>✕</button>
            </div>

            {/* Modal Navigation Tabs (12 Tabs) */}
            <div style={{ background: '#f8f9fa', padding: '0 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 2, overflowX: 'auto' }}>
              {[
                ['profile', '👤 Info'],
                ['courses', '📚 Courses'],
                ['students', '👥 Students'],
                ['analytics', '📊 Performance'],
                ['feedback', '⭐ Feedback'],
                ['quizzes', '📝 Quizzes'],
                ['assignments', '📋 Assignments'],
                ['schedule', '📅 Schedule'],
                ['availability', '🟢 Status'],
                ['skills', '🏆 Skills'],
                ['communication', '💬 Message'],
                ['account', '📜 Audit Log']
              ].map(([tabKey, label]) => (
                <button 
                  key={tabKey} 
                  onClick={() => setInstructorModalTab(tabKey)}
                  style={{ 
                    padding: '12px 12px', border: 'none', background: 'none', fontSize: 12, fontWeight: instructorModalTab === tabKey ? 800 : 600, 
                    color: instructorModalTab === tabKey ? '#10b981' : '#64748b', borderBottom: instructorModalTab === tabKey ? '3px solid #10b981' : '3px solid transparent', cursor: 'pointer', whitespace: 'nowrap'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Modal Body Scrollable */}
            <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
              {/* Tab 1: Profile */}
              {instructorModalTab === 'profile' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800 }}>Instructor Profile & Qualification</h4>
                    <p style={{ margin: '0 0 10px', fontSize: 13 }}><strong>Department:</strong> {selectedInstructorModal.dept}</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13 }}><strong>Specialization:</strong> Full Stack Web Development & Cloud Systems</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13 }}><strong>Education:</strong> M.Tech in Computer Science</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13 }}><strong>Experience:</strong> 8+ Years Industry & Teaching</p>
                    <p style={{ margin: 0, fontSize: 13 }}><strong>Joining Date:</strong> January 15, 2024</p>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800 }}>Platform Summary</h4>
                    <p style={{ margin: '0 0 10px', fontSize: 13 }}><strong>Assigned Courses:</strong> {selectedInstructorModal.courseCount} Active Courses</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13 }}><strong>Total Students Managed:</strong> {selectedInstructorModal.studentCount} Students</p>
                    <p style={{ margin: '0 0 10px', fontSize: 13 }}><strong>Average Rating:</strong> ⭐ {selectedInstructorModal.rating} / 5.0</p>
                    <p style={{ margin: 0, fontSize: 13 }}><strong>Status:</strong> <span style={{ color: '#166534', fontWeight: 800 }}>Active Instructor</span></p>
                  </div>
                </div>
              )}

              {/* Tab 2: Courses */}
              {instructorModalTab === 'courses' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Assigned Courses (4)</h4>
                    <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Assign New Course</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {['Node.js Backend Architecture', 'React.js Advanced Patterns', 'MongoDB Database Engineering', 'Express.js RESTful APIs'].map((c, i) => (
                      <div key={i} style={{ padding: 16, background: '#f8f9fa', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h5 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800 }}>{c}</h5>
                          <span style={{ fontSize: 11, color: '#64748b' }}>22 Students Enrolled</span>
                        </div>
                        <button style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Performance Analytics */}
              {instructorModalTab === 'analytics' && (
                <div style={{ background: '#f8f9fa', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Teaching Performance Analytics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                    {[
                      { label: 'Student Rating', val: `⭐ ${selectedInstructorModal.rating}`, col: '#d97706' },
                      { label: 'Course Completion', val: '92%', col: '#166534' },
                      { label: 'Avg Quiz Score', val: '86%', col: '#0284c7' },
                      { label: 'Attendance', val: '89%', col: '#6c5ce7' },
                      { label: 'Satisfaction', val: '94%', col: '#ec4899' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#fff', padding: 16, borderRadius: 12, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>{item.label}</span>
                        <strong style={{ fontSize: 20, color: item.col }}>{item.val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Student Feedback */}
              {instructorModalTab === 'feedback' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Student Reviews & Feedback</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Aman Verma', rating: 5, text: 'Very clear explanation and good practical examples.' },
                      { name: 'Priya Sharma', rating: 5, text: 'Great teaching style! Really enjoyed the live code walkthroughs.' },
                      { name: 'Rohan Gupta', rating: 4, text: 'Awesome course structure and quick query responses.' }
                    ].map((f, i) => (
                      <div key={i} style={{ padding: 16, background: '#f8f9fa', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong style={{ fontSize: 13 }}>{f.name}</strong>
                          <span style={{ color: '#d97706', fontSize: 12, fontWeight: 800 }}>{'⭐'.repeat(f.rating)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>"{f.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 8: Teaching Schedule */}
              {instructorModalTab === 'schedule' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Weekly Teaching Calendar</h4>
                    <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Add Schedule Class</button>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}><th style={{ padding: 12 }}>DAY</th><th style={{ padding: 12 }}>SUBJECT</th><th style={{ padding: 12 }}>TIME</th><th style={{ padding: 12 }}>ACTION</th></tr>
                    </thead>
                    <tbody>
                      {[
                        ['MON', 'Node.js Backend', '10:00 AM – 11:30 AM'],
                        ['TUE', 'MongoDB Database', '12:00 PM – 01:30 PM'],
                        ['WED', 'React Frontend', '02:00 PM – 03:30 PM'],
                        ['THU', 'Node.js Advanced', '10:00 AM – 11:30 AM'],
                      ].map(([day, sub, tm], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 12, fontWeight: 900, color: '#10b981' }}>{day}</td>
                          <td style={{ padding: 12, fontWeight: 700, fontSize: 13 }}>{sub}</td>
                          <td style={{ padding: 12, fontSize: 12, color: '#64748b' }}>{tm}</td>
                          <td style={{ padding: 12 }}><button style={{ background: '#e0e7ff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reschedule</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 12: Audit & Account Logs */}
              {instructorModalTab === 'account' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Instructor Activity Audit Trail</h4>
                  <div style={{ background: '#0b1121', borderRadius: 14, padding: 16, fontFamily: 'monospace', color: '#cbd5e1', fontSize: 12 }}>
                    {[
                      '10:32 AM — Created Quiz "Node.js Middleware Exam"',
                      '11:10 AM — Updated Course Content in "React Mastery"',
                      '12:05 PM — Marked Attendance for Batch A (24 Students)',
                      '02:20 PM — Posted Announcement "Project Submission Deadline"'
                    ].map((log, i) => (
                      <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: '#34d399' }}>✓ </span>{log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback for other tabs */}
              {!['profile', 'courses', 'analytics', 'feedback', 'schedule', 'account'].includes(instructorModalTab) && (
                <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Management Section: {instructorModalTab.toUpperCase()}</p>
                  <small style={{ color: '#94a3b8' }}>Live synchronized data stream from MongoDB</small>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK MESSAGE MODAL */}
      {quickMessageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 900 }}>💬 Send Direct Message</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>To: <strong>{quickMessageModal.profile?.firstName} {quickMessageModal.profile?.lastName}</strong> ({quickMessageModal.email})</p>
            <textarea 
              value={quickMsgText}
              onChange={e => setQuickMsgText(e.target.value)}
              placeholder="Write your message here..."
              rows={4}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            {quickMsgNotice && <div style={{ padding: 10, background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 12, fontSize: 12, fontWeight: 700 }}>{quickMsgNotice}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => { setQuickMsgNotice('Message sent successfully!'); setTimeout(() => { setQuickMessageModal(null); setQuickMsgNotice(''); setQuickMsgText('') }, 1000) }}
                style={{ flex: 1, padding: '10px 0', background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                Send Message
              </button>
              <button onClick={() => setQuickMessageModal(null)} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* COURSE DETAIL MODAL (15-TAB ADVANCED MANAGEMENT SYSTEM) */}
      {selectedCourseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 1050, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22 }}>
                  📚
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{selectedCourseModal.title}</h3>
                    <span style={{ background: 'rgba(255,255,255,0.25)', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>{selectedCourseModal.code || 'CRS-1004'}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
                    Category: <strong>{selectedCourseModal.category || 'Web Development'}</strong> • Level: <strong>{selectedCourseModal.level || 'Beginner'}</strong> • Status: <strong>{(selectedCourseModal.status || 'active').toUpperCase()}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCourseModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, fontWeight: 900, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Modal Navigation Tabs (15 Tabs) */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', background: '#f8fafc', padding: '8px 16px', borderBottom: '1px solid #e2e8f0' }}>
              {[
                { id: 'overview', label: '📋 Overview' },
                { id: 'instructor', label: '👨‍🏫 Instructor' },
                { id: 'enrollments', label: '👨‍🎓 Enrollments' },
                { id: 'content', label: '📚 Content Builder' },
                { id: 'analytics', label: '📊 Analytics' },
                { id: 'feedback', label: '⭐ Reviews' },
                { id: 'pricing', label: '💰 Pricing & Rev' },
                { id: 'progress', label: '🎯 Student Progress' },
                { id: 'certificates', label: '🏆 Certificates' },
                { id: 'notifications', label: '🔔 Alerts' },
                { id: 'access', label: '🔐 Access & Rules' },
                { id: 'export', label: '📤 Export' },
                { id: 'ai', label: '🤖 AI Assistant' },
                { id: 'actions', label: '⚙️ Actions' },
                { id: 'delete', label: '🗑 Delete' },
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setCourseModalTab(t.id)} 
                  style={{ 
                    padding: '8px 14px', 
                    borderRadius: 10, 
                    fontSize: 12, 
                    fontWeight: 800, 
                    border: 'none', 
                    cursor: 'pointer', 
                    whiteSpace: 'nowrap',
                    background: courseModalTab === t.id ? '#0ea5e9' : 'transparent', 
                    color: courseModalTab === t.id ? '#fff' : '#64748b' 
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Tab Content Area */}
            <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>

              {/* Tab 1: Overview */}
              {courseModalTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Course Overview Specifications</h4>
                    {[
                      ['Course ID / Code', selectedCourseModal.code || `CRS-${selectedCourseModal._id.slice(-4).toUpperCase()}`],
                      ['Category', selectedCourseModal.category || 'Web Development'],
                      ['Skill Level', selectedCourseModal.level || 'Beginner'],
                      ['Instruction Language', selectedCourseModal.language || 'English'],
                      ['Duration', selectedCourseModal.duration || '12 Weeks'],
                      ['Max Student Capacity', `${selectedCourseModal.capacity || 50} Seats`],
                      ['Course Status', selectedCourseModal.status || 'active'],
                      ['Created Date', new Date(selectedCourseModal.createdAt || Date.now()).toLocaleDateString()]
                    ].map(([k, v], i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>{k}:</span>
                        <strong style={{ color: '#1e293b' }}>{v}</strong>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Course Description</h4>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>
                      {selectedCourseModal.description || 'Comprehensive curriculum designed to empower students with production-ready skills, real-world projects, quizzes, and live mentorship.'}
                    </p>
                    <div style={{ background: '#f0f9ff', padding: 14, borderRadius: 12, border: '1px solid #bae6fd' }}>
                      <span style={{ fontSize: 12, color: '#0369a1', fontWeight: 800 }}>⚡ Public Enrollment Access: Enabled</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Instructor Management */}
              {courseModalTab === 'instructor' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Assigned Instructor & Lead Educator</h4>
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20 }}>
                      👨‍🏫
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>{selectedCourseModal.instructor?.profile ? `${selectedCourseModal.instructor.profile.firstName} ${selectedCourseModal.instructor.profile.lastName}` : selectedCourseModal.instructor?.email || 'Unassigned Instructor'}</h4>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Department: <strong>{selectedCourseModal.instructor?.profile?.department || 'Computer Science & IT'}</strong></p>
                    </div>
                  </div>

                  <div style={{ background: '#fff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h5 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800 }}>Reassign Course Instructor</h5>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <select style={{ flex: 1, padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}>
                        {instructors.map(inst => (
                          <option key={inst._id} value={inst._id}>
                            {inst.profile ? `${inst.profile.firstName} ${inst.profile.lastName}` : inst.email} ({inst.profile?.department || 'IT'})
                          </option>
                        ))}
                      </select>
                      <button onClick={() => alert('Instructor reassigned successfully!')} style={{ background: '#0ea5e9', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                        Save Reassignment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Enrollment Management */}
              {courseModalTab === 'enrollments' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Enrolled Student Roster</h4>
                    <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 800 }}>
                      Enrolled: {selectedCourseModal.enrolledCount || 0} / {selectedCourseModal.capacity || 50}
                    </span>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {students.slice(0, 5).map(st => (
                      <div key={st._id} style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: 13, color: '#1e293b' }}>{st.profile?.firstName} {st.profile?.lastName}</strong>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>{st.email}</span>
                        </div>
                        <button onClick={() => alert(`Student ${st.email} removed from course`)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Course Content Drag & Drop Builder */}
              {courseModalTab === 'content' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Interactive Curriculum Builder (Drag & Drop)</h4>
                    <button style={{ background: '#a855f7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>+ Add Module</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { mod: 'Module 1: Core Fundamentals & Setup', items: ['Lesson 1: Environment Setup (Video 15m)', 'Lesson 2: Architecture Basics (PDF Notes)', 'Quiz 1: Fundamentals Check (10 Questions)'] },
                      { mod: 'Module 2: Deep Dive Implementation', items: ['Lesson 3: Building Real Projects (Video 45m)', 'Exercise 1: Hands-on Code Challenge', 'Assignment 1: Milestone Submission'] }
                    ].map((m, i) => (
                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
                        <h5 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>⣿ {m.mod}</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                          {m.items.map((it, j) => (
                            <div key={j} style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'grab' }}>
                              ⋮⋮ {it}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Analytics */}
              {courseModalTab === 'analytics' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Course Performance & Diagnostic Analytics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                    {[
                      { l: 'Avg Progress', v: '78%', c: '#0ea5e9' },
                      { l: 'Completion Rate', v: '85.4%', c: '#22c55e' },
                      { l: 'Avg Quiz Score', v: '86%', c: '#a855f7' },
                      { l: 'Dropout Rate', v: '4.2%', c: '#f59e0b' },
                    ].map((card, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 4 }}>{card.l}</span>
                        <strong style={{ fontSize: 22, color: card.c, fontWeight: 900 }}>{card.v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 6: Ratings & Feedback */}
              {courseModalTab === 'feedback' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Student Ratings & Reviews (Average ⭐ 4.8 / 5.0)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { name: 'Rahul Sharma', rating: 5, review: 'Exceptional course structure and clear video lectures!' },
                      { name: 'Priya Verma', rating: 4, review: 'Great practical exercises, loved the assignments.' }
                    ].map((r, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong style={{ fontSize: 13 }}>{r.name}</strong>
                          <span style={{ color: '#d97706', fontSize: 12, fontWeight: 800 }}>{'⭐'.repeat(r.rating)}</span>
                        </div>
                        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#475569' }}>"{r.review}"</p>
                        <button onClick={() => alert('Reply modal opened')} style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reply to Student</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 7: Pricing & Revenue */}
              {courseModalTab === 'pricing' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Pricing Breakdown</h4>
                    <div style={{ fontSize: 14, color: '#1e293b', marginBottom: 12 }}>Course Price: <strong>₹{selectedCourseModal.price || 0}</strong></div>
                    <div style={{ fontSize: 14, color: '#22c55e', marginBottom: 12 }}>Discount Coupon: <strong>SKILL20 (20% OFF)</strong></div>
                    <div style={{ fontSize: 14, color: '#6366f1' }}>Final Price: <strong>₹{selectedCourseModal.price ? selectedCourseModal.price * 0.8 : 0}</strong></div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Revenue Summary</h4>
                    <h3 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: '#22c55e' }}>₹{((selectedCourseModal.price || 4999) * (selectedCourseModal.enrolledCount || 14)).toLocaleString('en-IN')}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Generated from {selectedCourseModal.enrolledCount || 14} total purchases</p>
                  </div>
                </div>
              )}

              {/* Tab 9: Certificates */}
              {courseModalTab === 'certificates' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Automated Certificate System</h4>
                  <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569' }}>Certificates are automatically issued upon 100% course completion and passing all mandatory quizzes.</p>
                    <button onClick={() => alert('Sample certificate template downloaded')} style={{ background: '#6c5ce7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      📜 Download Certificate Template Preview
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 13: AI Assistant */}
              {courseModalTab === 'ai' && (
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>🤖 AI Course Optimization & Recommendations</h4>
                  <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', padding: 18, borderRadius: 14, color: '#6b21a8', fontSize: 13, lineHeight: 1.6 }}>
                    <strong>AI Recommendation:</strong> Add 2 extra practical lab coding exercises in Module 2 to increase student retention by an estimated 12%.
                  </div>
                </div>
              )}

              {/* Fallback for other tabs */}
              {!['overview', 'instructor', 'enrollments', 'content', 'analytics', 'feedback', 'pricing', 'certificates', 'ai'].includes(courseModalTab) && (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Management Section: {courseModalTab.toUpperCase()}</p>
                  <small style={{ color: '#94a3b8' }}>Live synchronized data stream from MongoDB</small>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT COURSE MODAL */}
      {courseFormModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 540, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>
              {editingCourse ? '✏ Edit Course Details' : '+ Create New Course'}
            </h3>
            <form onSubmit={handleSaveCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} placeholder="Course Title (e.g. Full Stack Web Development)" style={{ padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input required value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} placeholder="Course Code (e.g. CRS-102)" style={{ padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
                <select value={courseForm.category} onChange={e => setCourseForm({...courseForm, category: e.target.value})} style={{ padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <select value={courseForm.level} onChange={e => setCourseForm({...courseForm, level: e.target.value})} style={{ padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <input type="number" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: Number(e.target.value)})} placeholder="Price (₹)" style={{ padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
                <input type="number" value={courseForm.capacity} onChange={e => setCourseForm({...courseForm, capacity: Number(e.target.value)})} placeholder="Max Capacity" style={{ padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
              </div>

              <textarea rows={3} value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} placeholder="Course Description..." style={{ padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} />

              {courseFormMsg && <div style={{ padding: 10, background: '#dcfce7', color: '#166534', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{courseFormMsg}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, padding: '12px 0', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
                <button type="button" onClick={() => setCourseFormModal(false)} style={{ padding: '12px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {courseDeleteConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, marginBottom: 16 }}>
              ⚠️
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>Delete Course Confirmation</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{courseDeleteConfirmModal.title}"</strong>? This action will permanently purge the course directory entry.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => handleDeleteCourseCommit(courseDeleteConfirmModal._id)}
                style={{ flex: 1, padding: '12px 0', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}
              >
                Yes, Delete Course
              </button>
              <button onClick={() => setCourseDeleteConfirmModal(null)} style={{ flex: 1, padding: '12px 0', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI COURSE GENERATOR MODAL */}
      {aiCourseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 560, boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#7e22ce' }}>🤖 AI Course Curriculum Generator</h3>
              <button onClick={() => setAiCourseModal(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Enter any topic or subject area and our AI will automatically structure the syllabus, modules, and quizzes.</p>
            
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input 
                value={aiTopicInput} 
                onChange={e => setAiTopicInput(e.target.value)} 
                placeholder="Topic (e.g. Next.js 14, Data Analytics, Cyber Security)..." 
                style={{ flex: 1, padding: 12, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none' }} 
              />
              <button onClick={handleGenerateAICourseAction} disabled={aiGenerating} style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>
                {aiGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {aiCourseResult && (
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 13 }}>
                <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 800 }}>{aiCourseResult.title}</h4>
                <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 12 }}>{aiCourseResult.description}</p>
                <div style={{ background: '#f3e8ff', padding: 10, borderRadius: 8, color: '#7e22ce', fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
                  Difficulty Analysis: {aiCourseResult.aiDifficultyAnalysis}
                </div>
                <button 
                  onClick={() => {
                    setCourseForm({ title: aiCourseResult.title, code: `CRS-${Math.floor(1000 + Math.random()*9000)}`, description: aiCourseResult.description, category: aiCourseResult.suggestedCategory, level: aiCourseResult.suggestedLevel, price: 4999, capacity: 50, duration: '12 Weeks', language: 'English', instructor: instructors[0]?._id || '', status: 'active', thumbnail: '' })
                    setAiCourseModal(false)
                    setCourseFormModal(true)
                  }}
                  style={{ width: '100%', padding: '10px 0', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                >
                  Import AI Draft into Course Creator
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminDashboard
