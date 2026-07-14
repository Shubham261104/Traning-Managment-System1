import React, { useState, useEffect, useCallback, useContext } from 'react'
import axios from 'axios'
import { 
  FiHome, FiUsers, FiBookOpen, FiUserCheck, FiClock, FiActivity, FiZap, 
  FiTarget, FiSearch, FiBell, FiMessageSquare, FiSettings, FiList, 
  FiChevronDown, FiArrowRight, FiCheckCircle, FiXCircle, FiPieChart, 
  FiBarChart2, FiDollarSign, FiTrendingUp, FiLogOut, FiMenu
} from 'react-icons/fi'
import AuthContext from '../../context/AuthContext'

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

  // User management modal
  const [userModal, setUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null) // null = add mode, object = edit mode
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'student' })
  const [userMsg, setUserMsg] = useState('')

  const COLORS = ['#6c5ce7', '#00b894', '#0984e3', '#e84393', '#fdcb6e']

  const fetchData = useCallback(async () => {
    try {
      const [st, enroles] = await Promise.all([
        axios.get('/api/admin/dashboard/stats'),
        axios.get('/api/admin/enrollments/pending')
      ])
      setStats(st.data)
      setPendingEnrollments(enroles.data)
    } catch (e) {
      console.error(e)
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

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/admin/students')
      setStudents(res.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fetchInstructors = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/admin/instructors')
      setInstructors(res.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  
  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/courses')
      setCourses(res.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'students') fetchStudents()
    if (activeTab === 'instructors') fetchInstructors()
    if (activeTab === 'courses') fetchCourses()
    if (activeTab === 'enrollments') fetchAllEnrollments()
    if (activeTab === 'announcements') fetchAnnouncements()
  }, [activeTab])

  // Process Actions
  const handleEnrollmentAction = async (id, status) => {
    try {
      await axios.put(`/api/admin/enrollments/${id}`, { status })
      fetchData()
      fetchAllEnrollments()
    } catch (e) { console.error(e) }
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

  const renderDashboard = () => (
    <div style={{ padding: '0 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            Admin Dashboard <span style={{ fontSize: 24 }}>👋</span>
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Welcome back! Here's what's happening with your training center.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#334155' }}>
            May 1 - May 29, 2026 📅
          </div>
          <button style={{ background: '#6c5ce7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiLogOut style={{ transform: 'rotate(90deg)' }}/> Export Dashboard
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Students', value: stats.totalStudents || 0, bg: '#f3e8ff', color: '#a855f7', icon: FiUsers, trend: '+12.5%' },
          { label: 'Total Courses', value: stats.totalCourses || 0, bg: '#dcfce7', color: '#22c55e', icon: FiBookOpen, trend: '+8.7%' },
          { label: 'Total Instructors', value: stats.totalInstructors || 0, bg: '#e0f2fe', color: '#0ea5e9', icon: FiUserCheck, trend: '+5.3%' },
          { label: 'Total Revenue', value: '₹ 12,45,000', bg: '#fef3c7', color: '#f59e0b', icon: FiDollarSign, trend: '+18.6%' },
          { label: 'Active Users', value: '1,234', bg: '#fce7f3', color: '#ec4899', icon: FiActivity, trend: 'Online Now' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <card.icon />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>{card.label}</p>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1e293b' }}>{card.value}</h3>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: card.trend.includes('+') ? '#22c55e' : '#0ea5e9' }}>
              ↑ {card.trend} {card.trend.includes('+') ? 'from last month' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.8fr', gap: 16, marginBottom: 24 }}>
        {[
          { title: 'Student Growth', value: '2,345', sub: 'Total Students', pop: '+12.5%', color: '#6c5ce7', data: '0,80 50,75 100,50 150,60 200,40 250,30 300,35 350,15 400,0' },
          { title: 'Enrollment Trends', value: '3,456', sub: 'Total Enrollments', pop: '+15.3%', color: '#22c55e', data: '0,90 50,70 100,80 150,55 200,45 250,50 300,20 350,25 400,5' },
          { title: 'Revenue Analytics', value: '₹ 12,45,000', sub: 'Total Revenue', pop: '+18.6%', color: '#0ea5e9', data: '0,85 50,90 100,60 150,65 200,30 250,35 300,10 350,20 400,0' }
        ].map((chart, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{chart.title}</h3>
              <select style={{ fontSize: 11, padding: 4, borderRadius: 4, border: '1px solid #e2e8f0', outline: 'none' }}><option>This Year</option></select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1e293b' }}>{chart.value}</h2>
              <span style={{ fontSize: 11, color: '#64748b' }}>{chart.sub}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 99, background: '#dcfce7', color: '#166534' }}>{chart.pop}</span>
            </div>
            <LineChartMock color={chart.color} dataPoints={chart.data} />
          </div>
        ))}
        
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
             <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Course Popularity</h3>
             <select style={{ fontSize: 11, padding: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}><option>Top 5</option></select>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
             <div style={{ position: 'relative', width: 120, height: 120 }}>
               <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                 <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e8edfb" strokeWidth="6" />
                 <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6c5ce7" strokeWidth="6" strokeDasharray="80 100" />
                 <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0ea5e9" strokeWidth="6" strokeDasharray="40 100" strokeDashoffset="-80" />
                 <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray="20 100" strokeDashoffset="-120" />
                 <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ec4899" strokeWidth="6" strokeDasharray="15 100" strokeDashoffset="-140" />
               </svg>
               <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{ fontSize: 18, fontWeight: 900 }}>156</div>
                 <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Courses</div>
               </div>
             </div>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
               {[
                 ['Web Development', '28%', '#6c5ce7'],
                 ['Data Science', '22%', '#0ea5e9'],
                 ['UI/UX Design', '18%', '#f59e0b'],
                 ['Python Program...', '16%', '#ec4899']
               ].map((c, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#475569' }}>
                     <span style={{ width: 8, height: 8, borderRadius: '50%', background: c[2] }}/> {c[0]}
                   </div>
                   <span style={{ fontSize: 11, fontWeight: 800 }}>{c[1]}</span>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Row 3 Placeholder Layouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1e293b' }}>Recent Pending Enrollments</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Awaiting your approval</p>
            </div>
            <button className="text-[#6c5ce7] font-bold text-[12px] bg-transparent border-none cursor-pointer" onClick={() => setActiveTab('enrollments')}>View All</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {pendingEnrollments.length ? pendingEnrollments.slice(0,4).map(en => (
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
            {[
              { title: 'Web Development', stu: 68, col: '#6c5ce7', icon: FiBookOpen },
              { title: 'Data Science', stu: 54, col: '#0ea5e9', icon: FiActivity },
              { title: 'UI/UX Design', stu: 42, col: '#f59e0b', icon: FiPieChart },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.col}15`, color: c.col, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <c.icon size={18}/>
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{c.title}</h5>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{c.stu} Students</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 99, background: '#dcfce7', color: '#166534' }}>Active</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
           <h3 style={{ margin: '0 0 24px', fontSize: 15, fontWeight: 900, color: '#1e293b' }}>Platform Overview</h3>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center', marginBottom: 20 }}>
             <div>
               <div style={{ width: 70, height: 70, borderRadius: '50%', border: '5px solid #22c55e', borderTopColor: '#e2e8f0', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>68%</div>
               <span style={{ fontSize: 11, fontWeight: 600 }}>Storage Usage</span>
             </div>
             <div>
               <div style={{ width: 70, height: 70, borderRadius: '50%', border: '5px solid #0ea5e9', borderLeftColor: '#e2e8f0', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2.4GB</div>
               <span style={{ fontSize: 11, fontWeight: 600 }}>Database</span>
             </div>
           </div>
           
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
               <span style={{ fontSize: 12, fontWeight: 700 }}>System Performance</span>
               <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 800 }}>Excellent</span>
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

  const renderStudents = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: 0 }}>Students Management</h2>
        <button onClick={() => openAddUser('student')} style={{ background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          + Add Student
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6c5ce7' }}>Loading...</div> :
         students.length === 0 ? <Empty /> :
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
           <thead>
             <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e2e8f0' }}>
               {['STUDENT', 'EMAIL', 'COURSES', 'PROGRESS', 'STATUS', 'ACTIONS'].map(h => <th key={h} style={{ padding: '16px 20px', fontSize: 12, color: '#64748b' }}>{h}</th>)}
             </tr>
           </thead>
           <tbody>
             {students.map(s => (
               <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9', opacity: s.isActive ? 1 : 0.55 }}>
                 <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                     <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                       {s.profile?.firstName?.charAt(0) || '?'}
                     </div>
                     {s.profile?.firstName} {s.profile?.lastName}
                   </div>
                 </td>
                 <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{s.email}</td>
                 <td style={{ padding: '14px 20px', fontSize: 13 }}>{s.enrolledCoursesCount}</td>
                 <td style={{ padding: '14px 20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <div style={{ flex: 1, background: '#e2e8f0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                       <div style={{ width: `${s.averageProgress || 0}%`, height: '100%', background: '#6c5ce7' }} />
                     </div>
                     <span style={{ fontSize: 11, fontWeight: 700, minWidth: 28 }}>{s.averageProgress || 0}%</span>
                   </div>
                 </td>
                 <td style={{ padding: '14px 20px' }}>
                   <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.isActive ? '#dcfce7' : '#fef9c3', color: s.isActive ? '#166534' : '#854d0e' }}>
                     {s.isActive ? 'Active' : 'Blocked'}
                   </span>
                 </td>
                 <td style={{ padding: '14px 20px' }}>
                   <div style={{ display: 'flex', gap: 6 }}>
                     <button onClick={() => openEditUser(s)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#e0e7ff', color: '#4338ca', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✏ Edit</button>
                     <button onClick={() => handleToggleBlock(s)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: s.isActive ? '#fef9c3' : '#dcfce7', color: s.isActive ? '#854d0e' : '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                       {s.isActive ? '🔒 Block' : '✅ Unblock'}
                     </button>
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

  const renderInstructors = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: 0 }}>Instructors Management</h2>
        <button onClick={() => openAddUser('instructor')} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          + Add Instructor
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6c5ce7' }}>Loading...</div> :
         instructors.length === 0 ? <Empty /> :
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
           <thead>
             <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e2e8f0' }}>
               {['INSTRUCTOR', 'EMAIL', 'COURSES', 'STUDENTS', 'STATUS', 'ACTIONS'].map(h => <th key={h} style={{ padding: '16px 20px', fontSize: 12, color: '#64748b' }}>{h}</th>)}
             </tr>
           </thead>
           <tbody>
             {instructors.map(i => (
               <tr key={i._id} style={{ borderBottom: '1px solid #f1f5f9', opacity: i.isActive ? 1 : 0.55 }}>
                 <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                     <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#d1fae5', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                       {i.profile?.firstName?.charAt(0) || '?'}
                     </div>
                     {i.profile?.firstName} {i.profile?.lastName}
                   </div>
                 </td>
                 <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{i.email}</td>
                 <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700 }}>{i.courseCount || 0}</td>
                 <td style={{ padding: '14px 20px', fontSize: 13 }}>{i.studentCount || 0}</td>
                 <td style={{ padding: '14px 20px' }}>
                   <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: i.isActive ? '#dcfce7' : '#fef9c3', color: i.isActive ? '#166534' : '#854d0e' }}>
                     {i.isActive ? 'Active' : 'Blocked'}
                   </span>
                 </td>
                 <td style={{ padding: '14px 20px' }}>
                   <div style={{ display: 'flex', gap: 6 }}>
                     <button onClick={() => openEditUser(i)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#e0e7ff', color: '#4338ca', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✏ Edit</button>
                     <button onClick={() => handleToggleBlock(i)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: i.isActive ? '#fef9c3' : '#dcfce7', color: i.isActive ? '#854d0e' : '#166534', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                       {i.isActive ? '🔒 Block' : '✅ Unblock'}
                     </button>
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

  const renderCourses = () => renderTableSection('Courses Directory', courses, (
    <>
       <thead>
        <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e2e8f0' }}>
          <th style={{ padding: '16px 20px', fontSize: 12, color: '#64748b' }}>COURSE TITLE</th>
          <th style={{ padding: '16px 20px', fontSize: 12, color: '#64748b' }}>LEVEL</th>
          <th style={{ padding: '16px 20px', fontSize: 12, color: '#64748b' }}>PRICE</th>
          <th style={{ padding: '16px 20px', fontSize: 12, color: '#64748b' }}>ENROLLED</th>
          <th style={{ padding: '16px 20px', fontSize: 12, color: '#64748b' }}>STATUS</th>
        </tr>
      </thead>
      <tbody>
        {courses.map(c => (
          <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{c.title}</td>
            <td style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700 }}>{c.level}</td>
            <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, color: '#6c5ce7' }}>{c.price > 0 ? `₹${c.price}` : 'Free'}</td>
            <td style={{ padding: '16px 20px', fontSize: 13 }}>{c.enrolledCount} / {c.capacity || '∞'}</td>
            <td style={{ padding: '16px 20px' }}>
              <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.status === 'active' ? '#dcfce7' : '#f1f5f9', color: c.status === 'active' ? '#166534' : '#64748b' }}>
                {c.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </>
  ), loading)

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

  const renderReports = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Finance Reports</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: '₹ 12,45,000', change: '+18.6%', color: '#6c5ce7', bg: '#f3e8ff' },
          { label: 'This Month', value: '₹ 1,20,500', change: '+8.2%', color: '#22c55e', bg: '#dcfce7' },
          { label: 'Pending Payouts', value: '₹ 45,230', change: '3 instructors', color: '#f59e0b', bg: '#fef9c3' },
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
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Monthly Reports</h3>
          <button style={{ background: '#6c5ce7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Generate Report</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              {['REPORT', 'PERIOD', 'REVENUE', 'STUDENTS', 'DOWNLOAD'].map(h => <th key={h} style={{ padding: '14px 20px', fontSize: 12, color: '#64748b', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ['May 2026 Report', 'May 1 – 31', '₹ 1,20,500', 42, 'May 29, 2026'],
              ['April 2026 Report', 'Apr 1 – 30', '₹ 95,800', 38, 'Apr 30, 2026'],
              ['March 2026 Report', 'Mar 1 – 31', '₹ 88,200', 31, 'Mar 31, 2026'],
              ['February 2026 Report', 'Feb 1 – 28', '₹ 72,400', 27, 'Feb 28, 2026'],
            ].map(([name, period, rev, stu, date], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: 14 }}>{name}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>{period}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, color: '#6c5ce7' }}>{rev}</td>
                <td style={{ padding: '14px 20px', fontSize: 13 }}>{stu} enrolled</td>
                <td style={{ padding: '14px 20px' }}>
                  <button style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#334155' }}>⬇ PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Analytics & Insights</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Student Growth</h3>
          <LineChartMock color="#6c5ce7" dataPoints="0,80 50,70 100,55 150,60 200,40 250,30 300,25 350,15 400,5" />
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div><h4 style={{ margin: 0, fontWeight: 900, fontSize: 22 }}>{stats.totalStudents || 0}</h4><p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Students</p></div>
            <div><h4 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: '#22c55e' }}>+12.5%</h4><p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Growth Rate</p></div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Course Enrollments</h3>
          <LineChartMock color="#22c55e" dataPoints="0,90 50,80 100,60 150,65 200,45 250,50 300,25 350,30 400,10" />
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div><h4 style={{ margin: 0, fontWeight: 900, fontSize: 22 }}>{stats.totalCourses || 0}</h4><p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Active Courses</p></div>
            <div><h4 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: '#22c55e' }}>+8.7%</h4><p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Enrollment Rate</p></div>
          </div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Real-time Platform Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { label: 'Users Online', value: '245', color: '#6c5ce7', icon: FiUsers },
            { label: 'Enrollments Today', value: '89', color: '#22c55e', icon: FiCheckCircle },
            { label: 'Classes Today', value: '23', color: '#f59e0b', icon: FiBookOpen },
            { label: 'Revenue Today', value: '₹ 45,230', color: '#ec4899', icon: FiDollarSign },
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
    } catch (err) { console.error(err) } finally { setAnnSending(false) }
  }

  const renderAnnouncements = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Announcements</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>Send Announcement</h3>
          <form onSubmit={handleSendAnnouncement}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Title</label>
              <input required value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} placeholder="e.g. Platform Maintenance Notice" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Message</label>
              <textarea required value={annForm.message} onChange={e => setAnnForm({...annForm, message: e.target.value})} placeholder="Write your announcement here..." rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Recipients</label>
                <select value={annForm.recipientType} onChange={e => setAnnForm({...annForm, recipientType: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                  <option value="students">All Students</option>
                  <option value="instructors">All Instructors</option>
                  <option value="all">Everyone</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Priority</label>
                <select value={annForm.priority} onChange={e => setAnnForm({...annForm, priority: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={annSending} style={{ width: '100%', padding: '12px 0', background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: annSending ? 'not-allowed' : 'pointer', opacity: annSending ? 0.7 : 1 }}>
              {annSending ? 'Sending...' : '📢 Send Announcement'}
            </button>
          </form>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: 500 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Sent Announcements</h3>
          {annList.length ? annList.map(a => (
            <div key={a._id} style={{ padding: 16, background: '#f8f9fa', borderRadius: 12, marginBottom: 12, border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{a.title}</h4>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 700, background: a.priority === 'high' ? '#fee2e2' : '#f0f9ff', color: a.priority === 'high' ? '#dc2626' : '#0284c7' }}>{a.priority}</span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>{a.message}</p>
              <small style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(a.createdAt).toLocaleDateString()}</small>
            </div>
          )) : <p style={{ color: '#94a3b8', fontSize: 13 }}>No announcements sent yet.</p>}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 20 }}>Platform Settings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>General Settings</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Platform Name</label>
            <input value={settingsForm.platformName} onChange={e => setSettingsForm({...settingsForm, platformName: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Max Student Capacity</label>
            <input type="number" value={settingsForm.maxStudents} onChange={e => setSettingsForm({...settingsForm, maxStudents: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <button style={{ background: 'linear-gradient(135deg, #6c5ce7, #4834d4)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', width: '100%' }}>Save Changes</button>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>Feature Toggles</h3>
          {[
            ['allowRegistration', 'Allow New Registrations', 'Students can self-register'],
            ['autoApprove', 'Auto-Approve Enrollments', 'Skip manual enrollment review'],
            ['emailNotifications', 'Email Notifications', 'Send email on key events'],
            ['maintenanceMode', 'Maintenance Mode', 'Block all user logins temporarily'],
          ].map(([key, label, desc]) => (
            <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: settingsForm[key] ? '#1e293b' : '#64748b' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{desc}</p>
              </div>
              <div onClick={() => setSettingsForm({...settingsForm, [key]: !settingsForm[key]})}
                style={{ width: 44, height: 24, borderRadius: 12, background: settingsForm[key] ? '#6c5ce7' : '#e2e8f0', position: 'relative', transition: '0.3s', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: settingsForm[key] ? 22 : 3, transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const MOCK_LOGS = [
    { id: 1, time: '17:01:05', level: 'INFO', event: 'New student John Doe enrolled in React Development', user: 'system' },
    { id: 2, time: '16:58:22', level: 'INFO', event: 'Payment of ₹5,000 received from Sarah Wilson', user: 'payment-svc' },
    { id: 3, time: '16:54:11', level: 'WARN', event: 'Failed login attempt for user admin@skillbridge.in', user: 'auth' },
    { id: 4, time: '16:48:02', level: 'INFO', event: 'New course Data Science Bootcamp created by Instructor Mike', user: 'instructor' },
    { id: 5, time: '16:40:19', level: 'INFO', event: 'Certificate generated for student Emily Davis', user: 'cert-svc' },
    { id: 6, time: '16:32:00', level: 'ERROR', event: 'Email delivery failed for user rajat@example.com', user: 'mailer' },
    { id: 7, time: '16:20:44', level: 'INFO', event: 'Instructor Mike Johnson added a new quiz to Web Dev', user: 'instructor' },
    { id: 8, time: '16:08:33', level: 'WARN', event: 'Server CPU usage spiked to 85% for 12 seconds', user: 'monitor' },
    { id: 9, time: '15:55:12', level: 'INFO', event: 'Admin exported dashboard report (PDF)', user: 'admin' },
    { id: 10, time: '15:44:01', level: 'INFO', event: 'Course UI/UX Design marked as Active by admin', user: 'admin' },
  ]

  const renderLogs = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: 0 }}>System Logs</h2>
        <div style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Filter logs..." style={{ padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', width: 260 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {['ALL', 'INFO', 'WARN', 'ERROR'].map(level => (
          <span key={level} style={{ padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: level === 'ERROR' ? '#fee2e2' : level === 'WARN' ? '#fef9c3' : '#f1f5f9', color: level === 'ERROR' ? '#dc2626' : level === 'WARN' ? '#d97706' : '#475569' }}>{level}</span>
        ))}
      </div>
      <div style={{ background: '#0b1121', borderRadius: 16, overflow: 'hidden', fontFamily: 'monospace' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12, fontSize: 11, color: '#475569', fontWeight: 700 }}>
          <span style={{ width: 80 }}>TIME</span>
          <span style={{ width: 60 }}>LEVEL</span>
          <span>EVENT</span>
        </div>
        {MOCK_LOGS.filter(l => l.event.toLowerCase().includes(logSearch.toLowerCase())).map(log => (
          <div key={log.id} style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 80, fontSize: 11, color: '#475569', flexShrink: 0 }}>{log.time}</span>
            <span style={{ width: 60, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: log.level === 'ERROR' ? '#7f1d1d' : log.level === 'WARN' ? '#78350f' : '#1e3a5f', color: log.level === 'ERROR' ? '#fca5a5' : log.level === 'WARN' ? '#fde68a' : '#93c5fd', flexShrink: 0 }}>{log.level}</span>
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>{log.event}</span>
          </div>
        ))}
      </div>
    </div>
  )

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
            
            <div style={{ display: 'flex', gap: 16, color: '#64748b' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                <FiBell size={20} />
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 'bold', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>3</span>
              </div>
              <div style={{ position: 'relative', cursor: 'pointer' }}>
                <FiMessageSquare size={20} />
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 'bold', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>5</span>
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: '#e2e8f0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6c5ce7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>
                {user?.profile?.firstName?.charAt(0) || 'A'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{user?.profile?.firstName || 'Admin'}</h4>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Super Administrator ▾</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas Scrollable */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'students' && renderStudents()}
          {activeTab === 'instructors' && renderInstructors()}
          {activeTab === 'courses' && renderCourses()}
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
    </div>
  )
}

export default AdminDashboard
