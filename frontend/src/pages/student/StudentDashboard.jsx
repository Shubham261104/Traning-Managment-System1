import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiCreditCard,
  FiFileText,
  FiHelpCircle,
  FiHome,
  FiMail,
  FiMenu,
  FiMessageSquare,
  FiSearch,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiVideo,
  FiX,
  FiLogOut,
} from 'react-icons/fi'
import { BsTrophy } from 'react-icons/bs'
import AuthContext from '../../context/AuthContext'
import StudentProfile from './StudentProfile'
import './StudentDashboard.css'

const navItems = [
  { label: 'Dashboard', icon: FiHome, path: '/student' },
  { label: 'My Profile', icon: FiUser, path: '/student/profile', group: 'STUDENT MANAGEMENT' },
  { label: 'Browse Courses', icon: FiBookOpen, path: '/student/courses' },
  { label: 'My Enrollments', icon: FiBriefcase, path: '/student/enrollments' },
  { label: 'My Progress', icon: FiTrendingUp, path: '/student/progress' },
  { label: 'My Certificates', icon: BsTrophy, path: '/student/certificates' },
  { label: 'Attendance', icon: FiCalendar, path: '/student/attendance' },
  { label: 'My Quizzes', icon: FiHelpCircle, path: '/student/quizzes' },
  { label: 'Assignments', icon: FiFileText, path: '/student/assignments' },
  { label: 'Messages', icon: FiMail, path: '/student/messages' },
  { label: 'Announcements', icon: FiMessageSquare, path: '/student/announcements' },
  { label: 'Class Group', icon: FiUsers, path: '/student/class-group' },
  { label: 'Calendar', icon: FiCalendar, path: '/student/calendar' },
  { label: 'My Wallet', icon: FiCreditCard, path: '/student/wallet' },
]

const pageTitles = {
  '/student': 'Dashboard',
  '/student/profile': 'My Profile',
  '/student/courses': 'Browse Courses',
  '/student/enrollments': 'My Enrollments',
  '/student/progress': 'My Progress',
  '/student/certificates': 'My Certificates',
  '/student/attendance': 'Attendance',
  '/student/quizzes': 'My Quizzes',
  '/student/assignments': 'Assignments',
  '/student/messages': 'Messages',
  '/student/announcements': 'Announcements',
  '/student/class-group': 'Class Group',
  '/student/calendar': 'Calendar',
  '/student/wallet': 'My Wallet',
  '/student/notifications': 'Notifications',
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
const formatTime = (date) => date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
const instructorName = (course) => {
  const profile = course?.instructor?.profile
  return `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || course?.instructor?.email || 'Not assigned'
}

const EmptyState = ({ title }) => <p className="loading-text">{title}</p>

const StudentDashboard = () => {
  const { user, fetchUser, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [profile, setProfile] = useState(null)
  const [availableCourses, setAvailableCourses] = useState([])
  const [notifications, setNotifications] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [messages, setMessages] = useState([])
  const [calendar, setCalendar] = useState([])
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] })
  const [query, setQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({})
  const [assignmentText, setAssignmentText] = useState({})
  const [messageForm, setMessageForm] = useState({ subject: '', message: '', recipientRole: 'admin' })
  const [activeChatCourseId, setActiveChatCourseId] = useState(null)
  const [chatInputs, setChatInputs] = useState({})
  const [localChats, setLocalChats] = useState({})

  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [attCourseId, setAttCourseId] = useState('')
  const [attStatus, setAttStatus] = useState('present')
  const [attDate, setAttDate] = useState(getLocalDateString())
  const [attNotes, setAttNotes] = useState('')
  const [attError, setAttError] = useState('')
  const [attSuccess, setAttSuccess] = useState('')

  const currentPath = pageTitles[location.pathname] ? location.pathname : '/student'
  const stats = dashboard?.stats || {}
  const enrollments = dashboard?.enrollments || []
  const courses = enrollments.filter((item) => item.status === 'approved')
  const assignments = dashboard?.assignments || []
  const attempts = dashboard?.attempts || []
  const certificates = dashboard?.certificates || []
  const attendance = dashboard?.attendance || []
  const activities = dashboard?.recentActivities || []
  const upcomingClasses = dashboard?.upcomingClasses || []

  const alreadyMarkedRecord = useMemo(() => {
    if (!attCourseId || !attDate) return null
    return attendance.find((record) => {
      const recordCourseId = record.course?._id || record.course
      if (recordCourseId?.toString() !== attCourseId.toString()) return false

      const rDate = new Date(record.classDate)
      const parts = attDate.split('-')
      if (parts.length !== 3) return false
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)

      return (
        (rDate.getUTCFullYear() === year &&
          rDate.getUTCMonth() === month &&
          rDate.getUTCDate() === day) ||
        (rDate.getFullYear() === year &&
          rDate.getMonth() === month &&
          rDate.getDate() === day)
      )
    })
  }, [attendance, attCourseId, attDate])

  const firstName = profile?.firstName || user?.profile?.firstName || 'Student'
  const lastName = profile?.lastName || user?.profile?.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()

  const fetchDashboard = async () => {
    const res = await axios.get('/api/student/dashboard')
    setDashboard(res.data)
  }

  const fetchPageData = async () => {
    await fetchDashboard()

    const requests = [
      axios.get('/api/student/profile').then((res) => {
        setProfile(res.data)
        setForm(res.data || {})
      }),
      axios.get('/api/student/courses/available').then((res) => setAvailableCourses(res.data || [])),
      axios.get('/api/notifications?limit=25').then((res) => setNotifications(res.data?.notifications || [])),
      axios.get('/api/student/announcements').then((res) => setAnnouncements(res.data || [])),
      axios.get('/api/student/messages').then((res) => setMessages(res.data || [])),
      axios.get('/api/student/calendar').then((res) => setCalendar(res.data || [])),
      axios.get('/api/student/wallet').then((res) => setWallet(res.data || { balance: 0, transactions: [] })),
    ]
    await Promise.allSettled(requests)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setError('')
        await fetchPageData()
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load student dashboard data.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 10000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (courses.length > 0 && !attCourseId) {
      setAttCourseId(courses[0].course?._id || '')
    }
  }, [courses, attCourseId])

  const filteredAvailableCourses = useMemo(() => {
    const search = query.toLowerCase()
    return availableCourses.filter((course) => {
      const matchesSearch = `${course.title} ${course.description} ${course.category || ''}`.toLowerCase().includes(search)
      const matchesFilter = courseFilter === 'all' || course.category === courseFilter
      return matchesSearch && matchesFilter
    })
  }, [availableCourses, courseFilter, query])

  const paginatedCourses = filteredAvailableCourses.slice((page - 1) * 6, page * 6)
  const categories = ['all', ...new Set(availableCourses.map((course) => course.category).filter(Boolean))]
  const totalPages = Math.max(1, Math.ceil(filteredAvailableCourses.length / 6))

  const handleNav = (path) => {
    setSidebarOpen(false)
    setActiveChatCourseId(null)
    navigate(path)
  }

  const handleEnroll = async (courseId) => {
    await axios.post('/api/student/enrollments', { courseId })
    await fetchPageData()
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    const res = await axios.put('/api/student/profile', form)
    setProfile(res.data)
    await fetchUser?.()
  }

  const handleAssignmentSubmit = async (assignmentId) => {
    await axios.post(`/api/student/assignments/${assignmentId}/submit`, {
      text: assignmentText[assignmentId] || ''
    })
    setAssignmentText((prev) => ({ ...prev, [assignmentId]: '' }))
    await fetchDashboard()
  }

  const handleMarkAttendance = async (event) => {
    event.preventDefault()
    if (!attCourseId) {
      setAttError('Please select a course.')
      return
    }
    try {
      setAttError('')
      setAttSuccess('')
      await axios.post('/api/student/attendance', {
        courseId: attCourseId,
        status: attStatus,
        classDate: attDate,
        notes: attNotes
      })
      setAttSuccess('Attendance marked successfully!')
      setAttNotes('')
      await fetchPageData()
    } catch (err) {
      setAttError(err.response?.data?.message || 'Failed to mark attendance.')
    }
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()
    await axios.post('/api/student/messages', messageForm)
    setMessageForm({ subject: '', message: '', recipientRole: 'admin' })
    const res = await axios.get('/api/student/messages')
    setMessages(res.data || [])
  }

  const markNotificationRead = async (id) => {
    await axios.put(`/api/notifications/${id}/read`)
    await fetchPageData()
  }

  const markAnnouncementRead = async (id) => {
    await axios.put(`/api/student/announcements/${id}/read`)
    const res = await axios.get('/api/student/announcements')
    setAnnouncements(res.data || [])
    await fetchDashboard()
  }

  const statsCards = [
    { label: 'Enrolled Courses', value: stats.enrolledCourses || 0, note: 'Active enrollments', icon: FiBookOpen, tone: 'purple', path: '/student/enrollments' },
    { label: 'Courses Completed', value: stats.coursesCompleted || 0, note: 'Completed from real progress', icon: FiTrendingUp, tone: 'green', path: '/student/progress' },
    { label: 'Quizzes Completed', value: stats.quizzesCompleted || 0, note: `Average Score: ${stats.averageScore || 0}%`, icon: BsTrophy, tone: 'blue', path: '/student/quizzes' },
    { label: 'Certificates Earned', value: stats.certificatesEarned || 0, note: 'View all certificates', icon: FiAward, tone: 'orange', path: '/student/certificates' },
  ]

  const renderChart = () => {
    const series = dashboard?.progressSeries || []
    if (!series.length) return <EmptyState title="No progress data available yet." />
    const points = series.slice(-12).map((item, index) => {
      const x = series.length === 1 ? 320 : (index / (Math.min(series.length, 12) - 1)) * 640
      const y = 205 - ((item.value || 0) / 100) * 167
      return { x, y, item }
    })
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')
    const fill = `${line} L640 205 L0 205 Z`

    return (
      <>
        <svg viewBox="0 0 640 230" preserveAspectRatio="none">
          <defs>
            <linearGradient id="progressArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7048ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7048ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((lineIndex) => <line key={lineIndex} x1="0" x2="640" y1={25 + lineIndex * 42} y2={25 + lineIndex * 42} />)}
          <path className="chart-fill" d={fill} />
          <path className="chart-line" d={line} />
          {points.map((point) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" />)}
        </svg>
        <div className="chart-labels">
          {points.slice(0, 5).map((point) => <span key={point.x}>{formatDate(point.item.date)}</span>)}
        </div>
      </>
    )
  }

  const renderOverview = () => (
    <>
      <section className="stats-grid student-stats">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <button type="button" className={`stat-card ${stat.tone}`} key={stat.label} onClick={() => navigate(stat.path)}>
              <span className="stat-icon"><Icon /></span>
              <span>
                <small>{stat.label}</small>
                <strong>{stat.value}</strong>
                <em>{stat.note}</em>
              </span>
              <FiChevronRight className="stat-arrow" />
            </button>
          )
        })}
      </section>

      <section className="dashboard-grid">
        <article className="panel progress-panel">
          <div className="panel-head">
            <h3>Learning Progress</h3>
            <button type="button" onClick={() => navigate('/student/progress')}>View All</button>
          </div>
          <div className="progress-body">
            <div className="overall-progress">
              <p>Overall Progress</p>
              <strong>{stats.progressPercentage || 0}%</strong>
              <span>Attendance {stats.attendancePercentage || 0}%</span>
              <div><i style={{ width: `${stats.progressPercentage || 0}%` }} /></div>
            </div>
            <div className="line-chart" role="img" aria-label="Learning progress chart">{renderChart()}</div>
          </div>
        </article>

        <article className="panel classes-panel">
          <div className="panel-head">
            <h3>Upcoming Classes</h3>
            <button type="button" onClick={() => navigate('/student/calendar')}>View All</button>
          </div>
          {upcomingClasses.length ? upcomingClasses.slice(0, 3).map((item) => (
            <div className="class-row" key={item._id}>
              <span className="date-box blue"><strong>{new Date(item.date).getDate()}</strong>{new Date(item.date).toLocaleString('default', { month: 'short' })}</span>
              <div>
                <h4>{item.title}</h4>
                <p>{item.startTime} - {item.endTime}</p>
              </div>
              <b>Online</b>
            </div>
          )) : <EmptyState title="No upcoming classes assigned." />}
        </article>

        <article className="panel courses-panel">
          <div className="panel-head">
            <h3>My Courses</h3>
            <button type="button" onClick={() => navigate('/student/enrollments')}>View All</button>
          </div>
          {courses.length ? courses.slice(0, 3).map((enrollment) => (
            <div className="course-row" key={enrollment._id}>
              <div className="course-logo" style={{ '--accent': '#1680f2' }}>{enrollment.course?.title?.charAt(0) || 'C'}</div>
              <div className="course-info">
                <h4>{enrollment.course?.title}</h4>
                <p>Instructor: {instructorName(enrollment.course)}</p>
                <div className="course-progress"><i style={{ width: `${enrollment.progress || 0}%` }} /></div>
              </div>
              <span>{enrollment.progress || 0}%</span>
              <button type="button" onClick={() => navigate(`/student/courses/${enrollment.course?._id}/materials`)}>Continue</button>
            </div>
          )) : <EmptyState title="No active enrollments found." />}
        </article>

        <article className="panel activity-panel">
          <div className="panel-head">
            <h3>Recent Activities</h3>
            <button type="button" onClick={() => navigate('/student/progress')}>View All</button>
          </div>
          <div className="activity-list">
            {activities.length ? activities.slice(0, 4).map((activity) => (
              <div className="activity-row" key={`${activity.type}-${activity.occurredAt}`}>
                <span className="blue"><FiFileText /></span>
                <div>
                  <h4>{activity.title}</h4>
                  {activity.detail && <p>{activity.detail}</p>}
                </div>
                <time>{formatDate(activity.occurredAt)}</time>
              </div>
            )) : <EmptyState title="No recent activity yet." />}
          </div>
        </article>

        <div className="right-column">
          <article className="panel performance-panel">
            <h3>Performance Overview</h3>
            <div className="performance-body">
              <div className="donut"><span><strong>{stats.averageScore || 0}%</strong><small>Average Score</small></span></div>
              <div className="legend">
                <p><i className="teal" /> Excellent <b>{dashboard?.performance?.excellent || 0}</b></p>
                <p><i className="green" /> Good <b>{dashboard?.performance?.good || 0}</b></p>
                <p><i className="amber" /> Average <b>{dashboard?.performance?.average || 0}</b></p>
                <p><i className="red" /> Needs Improvement <b>{dashboard?.performance?.needsImprovement || 0}</b></p>
              </div>
            </div>
          </article>

          <article className="panel quick-panel">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button type="button" onClick={() => navigate('/student/courses')}><FiBookOpen /><span>Browse Courses</span></button>
              <button type="button" onClick={() => navigate('/student/quizzes')}><FiHelpCircle /><span>Take Quiz</span></button>
              <button type="button" onClick={() => navigate('/student/progress')}><FiBarChart2 /><span>View Progress</span></button>
              <button type="button" onClick={() => navigate('/student/certificates')}><FiAward /><span>My Certificates</span></button>
            </div>
          </article>
        </div>
      </section>
    </>
  )

  const renderCourses = () => (
    <article className="panel full-panel">
      <div className="panel-head">
        <h3>Browse Courses</h3>
        <select value={courseFilter} onChange={(event) => { setCourseFilter(event.target.value); setPage(1) }}>
          {categories.map((category) => <option key={category} value={category}>{category === 'all' ? 'All Categories' : category}</option>)}
        </select>
      </div>
      <div className="content-grid">
        {paginatedCourses.length ? paginatedCourses.map((course) => (
          <div className="data-card" key={course._id}>
            <h4>{course.title}</h4>
            <p>{course.description}</p>
            <small>Instructor: {instructorName(course)}</small>
            <small>{course.duration} hours | {course.enrolledCount || 0}/{course.capacity} seats</small>
            <button type="button" onClick={() => handleEnroll(course._id)}>Request Enrollment</button>
          </div>
        )) : <EmptyState title="No available courses found." />}
      </div>
      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
    </article>
  )

  const renderEnrollments = () => (
    <article className="panel full-panel">
      <h3>My Enrollments</h3>
      <div className="content-list">
        {enrollments.length ? enrollments.map((enrollment) => (
          <div className="list-row" key={enrollment._id}>
            <div>
              <h4>{enrollment.course?.title}</h4>
              <p>{enrollment.course?.description}</p>
            </div>
            <span className={`status-pill ${enrollment.status}`}>{enrollment.status}</span>
            <b>{enrollment.progress || 0}%</b>
          </div>
        )) : <EmptyState title="No enrollments yet." />}
      </div>
    </article>
  )



  const renderProgress = () => (
    <article className="panel full-panel">
      <h3>My Progress</h3>
      <div className="progress-body page-progress">
        <div className="overall-progress">
          <p>Overall Progress</p>
          <strong>{stats.progressPercentage || 0}%</strong>
          <div><i style={{ width: `${stats.progressPercentage || 0}%` }} /></div>
        </div>
        <div className="line-chart">{renderChart()}</div>
      </div>
      <div className="content-list">
        {courses.map((enrollment) => (
          <div className="list-row" key={enrollment._id}>
            <h4>{enrollment.course?.title}</h4>
            <div className="course-progress"><i style={{ width: `${enrollment.progress || 0}%` }} /></div>
            <b>{enrollment.progress || 0}%</b>
          </div>
        ))}
      </div>
    </article>
  )

  const renderCertificates = () => (
    <article className="panel full-panel">
      <h3>My Certificates</h3>
      <div className="content-grid">
        {certificates.length ? certificates.map((certificate) => (
          <div className="data-card" key={certificate._id}>
            <h4>{certificate.course?.title}</h4>
            <p>Issued: {formatDate(certificate.issuedAt)}</p>
            <small>{certificate.certificateId}</small>
            <a href={`/api/certificates/${certificate._id}/download`} target="_blank" rel="noreferrer">Download PDF</a>
          </div>
        )) : <EmptyState title="No earned certificates yet." />}
      </div>
    </article>
  )

  const renderAttendance = () => (
    <article className="panel full-panel" style={{ background: '#f8fafc' }}>
      <div className="panel-head" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Attendance Management</h3>
        <span style={{ 
          background: 'radial-gradient(circle at 100% 100%, #e0e7ff 0%, #c7d2fe 100%)', 
          color: '#4f46e5', 
          padding: '8px 16px', 
          borderRadius: '20px', 
          fontWeight: 705, 
          fontSize: '0.95rem',
          boxShadow: '0 4px 10px rgba(79, 70, 229, 0.1)'
        }}>
          Overall Attendance: {stats.attendancePercentage || 0}%
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 1.5fr)', gap: '30px', alignItems: 'stretch' }}>
        {/* Left Column: Mark Attendance Form */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          padding: '24px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Mark Daily Attendance</h4>
          
          {alreadyMarkedRecord ? (
            <div style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', border: '1px solid #bfdbfe', lineHeight: '1.5' }}>
              <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Already Checked-In</span>
              You have already marked attendance for this class as <strong style={{ textTransform: 'capitalize' }}>{alreadyMarkedRecord.status}</strong> on this date.
              {alreadyMarkedRecord.notes && <span style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem', color: '#2563eb' }}>Notes: "{alreadyMarkedRecord.notes}"</span>}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
              Check-in for your classes manually. Choose the course, specify the status, and document class notes.
            </p>
          )}

          {attError && (
            <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', border: '1px solid #fee2e2', fontWeight: 500 }}>
              {attError}
            </div>
          )}

          {attSuccess && (
            <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', border: '1px solid #dcfce7', fontWeight: 500 }}>
              {attSuccess}
            </div>
          )}

          <form onSubmit={handleMarkAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Select Enrolled Course</label>
              <select 
                value={attCourseId} 
                onChange={(e) => {
                  setAttCourseId(e.target.value);
                  setAttSuccess('');
                  setAttError('');
                }}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '0.95rem',
                  color: '#334155',
                  outline: 'none',
                  background: '#f8fafc',
                  transition: 'border-color 0.2s'
                }}
                required
              >
                <option value="">-- Choose Course --</option>
                {courses.map((enrollment) => (
                  <option key={enrollment._id} value={enrollment.course?._id}>
                    {enrollment.course?.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Attendance Status</label>
                <select 
                  value={attStatus} 
                  onChange={(e) => setAttStatus(e.target.value)}
                  disabled={!!alreadyMarkedRecord}
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '0.95rem',
                    color: !!alreadyMarkedRecord ? '#94a3b8' : '#334155',
                    outline: 'none',
                    background: !!alreadyMarkedRecord ? '#e2e8f0' : '#f8fafc',
                    cursor: !!alreadyMarkedRecord ? 'not-allowed' : 'default'
                  }}
                  required
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Class Date</label>
                <input 
                  type="date" 
                  value={attDate} 
                  onChange={(e) => {
                    setAttDate(e.target.value);
                    setAttSuccess('');
                    setAttError('');
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '9px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '0.95rem',
                    color: '#334155',
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Class Notes (Optional)</label>
              <textarea 
                placeholder={alreadyMarkedRecord ? "Attendance already saved." : "Include topics covered or reasons for late/excused check-in..."}
                value={alreadyMarkedRecord ? "" : attNotes}
                onChange={(e) => setAttNotes(e.target.value)}
                disabled={!!alreadyMarkedRecord}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '0.95rem',
                  color: !!alreadyMarkedRecord ? '#94a3b8' : '#334155',
                  outline: 'none',
                  background: !!alreadyMarkedRecord ? '#e2e8f0' : '#f8fafc',
                  resize: 'none',
                  cursor: !!alreadyMarkedRecord ? 'not-allowed' : 'default'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={!!alreadyMarkedRecord}
              style={{ 
                background: alreadyMarkedRecord ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', 
                color: alreadyMarkedRecord ? '#94a3b8' : '#ffffff', 
                fontWeight: 650, 
                padding: '12px', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: alreadyMarkedRecord ? 'not-allowed' : 'pointer', 
                fontSize: '1rem',
                boxShadow: alreadyMarkedRecord ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.2s',
                marginTop: '10px'
              }}
              onMouseOver={(e) => { 
                if (!alreadyMarkedRecord) {
                  e.currentTarget.style.transform = 'translateY(-1px)'; 
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.4)' 
                }
              }}
              onMouseOut={(e) => { 
                if (!alreadyMarkedRecord) {
                  e.currentTarget.style.transform = 'none'; 
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.3)' 
                }
              }}
            >
              {alreadyMarkedRecord ? 'Already Checked-In' : 'Mark Attendance'}
            </button>
          </form>
        </div>

        {/* Right Column: Attendance Records */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          padding: '24px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Attendance History</h4>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
            {attendance.length ? attendance.map((record) => (
              <div 
                key={record._id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '14px 16px', 
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{record.course?.title || 'Unknown Course'}</h5>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    {formatDate(record.classDate)} {record.notes && <span style={{ fontStyle: 'italic', marginLeft: '8px' }}>- "{record.notes}"</span>}
                  </p>
                </div>
                <span className={`status-pill ${record.status}`} style={{ margin: 0 }}>
                  {record.status}
                </span>
              </div>
            )) : <EmptyState title="No attendance records found." />}
          </div>
        </div>
      </div>
    </article>
  )

  const renderQuizzes = () => (
    <article className="panel full-panel">
      <h3>Quiz Results</h3>
      <div className="content-list">
        {attempts.length ? attempts.map((attempt) => (
          <div className="list-row" key={attempt._id}>
            <div>
              <h4>{attempt.quiz?.title}</h4>
              <p>{attempt.quiz?.course?.title} | {formatDate(attempt.completedAt)}</p>
            </div>
            <b>{Math.round(attempt.percentage || 0)}%</b>
            <span className={`status-pill ${attempt.passed ? 'approved' : 'rejected'}`}>{attempt.passed ? 'Passed' : 'Failed'}</span>
          </div>
        )) : <EmptyState title="No quiz attempts yet." />}
      </div>
    </article>
  )

  const renderAssignments = () => (
    <article className="panel full-panel">
      <h3>Assignments</h3>
      <div className="content-list">
        {assignments.length ? assignments.map((assignment) => (
          <div className="assignment-row" key={assignment._id}>
            <div>
              <h4>{assignment.title}</h4>
              <p>{assignment.course?.title} | Due {formatDate(assignment.dueDate)}</p>
              <span className={`status-pill ${assignment.status}`}>{assignment.status}</span>
            </div>
            <textarea
              placeholder="Submission notes or link"
              value={assignmentText[assignment._id] || ''}
              onChange={(event) => setAssignmentText({ ...assignmentText, [assignment._id]: event.target.value })}
            />
            <button type="button" onClick={() => handleAssignmentSubmit(assignment._id)}>Submit</button>
          </div>
        )) : <EmptyState title="No assignments found." />}
      </div>
    </article>
  )

  const renderMessages = () => (
    <article className="panel full-panel">
      <div className="panel-head"><h3>Messages</h3></div>
      <form className="message-form" onSubmit={handleSendMessage}>
        <input placeholder="Subject" value={messageForm.subject} onChange={(event) => setMessageForm({ ...messageForm, subject: event.target.value })} />
        <textarea placeholder="Message" value={messageForm.message} onChange={(event) => setMessageForm({ ...messageForm, message: event.target.value })} />
        <button type="submit">Send Message</button>
      </form>
      <div className="content-list">
        {messages.length ? messages.map((ticket) => (
          <div className="list-row" key={ticket._id}>
            <div>
              <h4>{ticket.subject}</h4>
              <p>{ticket.messages?.at(-1)?.message}</p>
            </div>
            <span className={`status-pill ${ticket.status}`}>{ticket.status}</span>
          </div>
        )) : <EmptyState title="No messages yet." />}
      </div>
    </article>
  )

  const renderAnnouncements = () => (
    <article className="panel full-panel">
      <h3>Announcements</h3>
      <div className="content-list">
        {announcements.length ? announcements.map((announcement) => (
          <div className="list-row" key={announcement._id}>
            <div>
              <h4>{announcement.title}</h4>
              <p>{announcement.message}</p>
            </div>
            {!announcement.isRead && <button type="button" onClick={() => markAnnouncementRead(announcement._id)}>Mark Read</button>}
          </div>
        )) : <EmptyState title="No announcements available." />}
      </div>
    </article>
  )

  const renderClassGroup = () => {
    if (activeChatCourseId) {
      const activeEnrollment = courses.find(c => (c.course?._id === activeChatCourseId || c._id === activeChatCourseId));
      const activeCourseName = activeEnrollment?.course?.title || 'Class';
      const history = localChats[activeChatCourseId] || [
         { sender: 'System', text: `Welcome to the ${activeCourseName} discussion board! You can chat with your classmates here.`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), isSelf: false }
      ];
      
      return (
        <article className="panel full-panel" style={{ height: '70vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: '#fff' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
            <button 
              type="button" 
              onClick={() => setActiveChatCourseId(null)}
              style={{ background: '#f3f4f6', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              &larr; Back
            </button>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(112, 72, 255, 0.1)', color: '#7048ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <FiUsers />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{activeCourseName} Class Chat</h3>
              <small style={{ color: '#6b7280' }}>Discussing with classmates</small>
            </div>
            <button 
              type="button" 
              onClick={() => window.open(`https://meet.jit.si/SkillBridge-${activeChatCourseId}`, '_blank')}
              style={{ marginLeft: 'auto', background: 'rgba(112, 72, 255, 0.1)', color: '#7048ff', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FiVideo /> Live Video
            </button>
          </div>
          
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isSelf ? 'flex-end' : 'flex-start' }}>
                <small style={{ color: '#6b7280', margin: '0 0.5rem 0.25rem' }}>{msg.sender} • {msg.time}</small>
                <div style={{ 
                  background: msg.isSelf ? '#7048ff' : '#ffffff', 
                  color: msg.isSelf ? 'white' : '#111827',
                  padding: '0.75rem 1rem', 
                  borderRadius: '16px', 
                  borderTopRightRadius: msg.isSelf ? '4px' : '16px',
                  borderTopLeftRadius: msg.isSelf ? '16px' : '4px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  maxWidth: '70%',
                  border: msg.isSelf ? 'none' : '1px solid #e5e7eb',
                  lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          
          <form 
            style={{ padding: '1.25rem', borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', gap: '1rem' }}
            onSubmit={(e) => {
              e.preventDefault();
              const text = chatInputs[activeChatCourseId];
              if (!text?.trim()) return;
              const newMessage = { sender: 'You', text: text.trim(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), isSelf: true };
              setLocalChats(prev => ({ ...prev, [activeChatCourseId]: [...(prev[activeChatCourseId] || history), newMessage] }));
              setChatInputs(prev => ({ ...prev, [activeChatCourseId]: '' }));
            }}
          >
            <input 
              placeholder="Type a message to the class..." 
              value={chatInputs[activeChatCourseId] || ''}
              onChange={(e) => setChatInputs(prev => ({ ...prev, [activeChatCourseId]: e.target.value }))}
              style={{ flex: 1, padding: '0.8rem 1.25rem', borderRadius: '24px', border: '1px solid #dfdfdf', outline: 'none', background: '#f9fafb', fontSize: '0.95rem' }}
              autoFocus
            />
            <button 
              type="submit" 
              style={{ background: '#7048ff', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FiMessageSquare />
            </button>
          </form>
        </article>
      );
    }

    return (
      <article className="panel full-panel">
        <h3>Class Groups</h3>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontWeight: 500 }}>Connect, chat, and collaborate with your coursemates via text and video.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {courses.length ? courses.map((enrollment) => (
            <div key={enrollment._id} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', background: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', transition: 'transform 0.2s ease-in-out' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(112, 72, 255, 0.1)', color: '#7048ff', fontSize: '1.5rem' }}>
                  <FiUsers />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#111827', fontSize: '1.15rem' }}>{enrollment.course?.title}</h4>
                  <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>Instructor: {instructorName(enrollment.course)}</small>
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '1.5rem', flex: 1, lineHeight: '1.5' }}>
                Join the active discussion or start a live video conference with students enrolled in this course.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f3f4f6', color: '#374151', border: 'none', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                  onClick={() => setActiveChatCourseId(enrollment.course?._id || enrollment._id)}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.transform = 'none' }}
                >
                  <FiMessageSquare /> Chat Room
                </button>
                <button 
                  type="button" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#7048ff', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(112,72,255,0.3)' }}
                  onClick={() => window.open(`https://meet.jit.si/SkillBridge-${enrollment.course?._id || enrollment._id}`, '_blank')}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#5a32eb'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#7048ff'; e.currentTarget.style.transform = 'none' }}
                >
                  <FiVideo /> Video Call
                </button>
              </div>
            </div>
          )) : <EmptyState title="No active courses to display class groups." />}
        </div>
      </article>
    )
  }

  const renderCalendar = () => (
    <article className="panel full-panel">
      <h3>Calendar</h3>
      <div className="content-list">
        {calendar.length ? calendar.map((event) => (
          <div className="list-row" key={`${event.type}-${event._id}`}>
            <div>
              <h4>{event.title}</h4>
              <p>{event.type} | {formatDate(event.date)} {event.startTime || formatTime(event.date)}</p>
            </div>
          </div>
        )) : <EmptyState title="No calendar events found." />}
      </div>
    </article>
  )

  const renderWallet = () => (
    <article className="panel full-panel">
      <h3>Wallet</h3>
      <div className="wallet-total">Balance: Rs. {wallet.balance || 0}</div>
      <div className="content-list">
        {wallet.transactions?.length ? wallet.transactions.map((transaction) => (
          <div className="list-row" key={transaction._id}>
            <div>
              <h4>{transaction.description || transaction.type}</h4>
              <p>{formatDate(transaction.paidAt || transaction.createdAt)}</p>
            </div>
            <b>Rs. {transaction.amount}</b>
            <span className={`status-pill ${transaction.status}`}>{transaction.status}</span>
          </div>
        )) : <EmptyState title="No wallet transactions found." />}
      </div>
    </article>
  )

  const renderNotifications = () => (
    <article className="panel full-panel">
      <h3>Notifications</h3>
      <div className="content-list">
        {notifications.length ? notifications.map((notification) => (
          <div className="list-row" key={notification._id}>
            <div>
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
            </div>
            {!notification.isRead && <button type="button" onClick={() => markNotificationRead(notification._id)}>Mark Read</button>}
          </div>
        )) : <EmptyState title="No notifications found." />}
      </div>
    </article>
  )

  const renderMain = () => {
    if (loading) return <div className="panel full-panel"><EmptyState title="Loading student data..." /></div>
    if (error) return <div className="panel full-panel"><EmptyState title={error} /></div>
    if (currentPath === '/student/profile') return <StudentProfile />
    if (currentPath === '/student/courses') return renderCourses()
    if (currentPath === '/student/enrollments') return renderEnrollments()
    if (currentPath === '/student/progress') return renderProgress()
    if (currentPath === '/student/certificates') return renderCertificates()
    if (currentPath === '/student/attendance') return renderAttendance()
    if (currentPath === '/student/quizzes') return renderQuizzes()
    if (currentPath === '/student/assignments') return renderAssignments()
    if (currentPath === '/student/messages') return renderMessages()
    if (currentPath === '/student/announcements') return renderAnnouncements()
    if (currentPath === '/student/class-group') return renderClassGroup()
    if (currentPath === '/student/calendar') return renderCalendar()
    if (currentPath === '/student/wallet') return renderWallet()
    if (currentPath === '/student/notifications') return renderNotifications()
    return renderOverview()
  }

  return (
    <div className="student-app-shell">
      <aside className={`student-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="student-brand">
          <div className="brand-mark"><FiBookOpen /></div>
          <div>
            <h1>Training Center</h1>
            <p>Management System</p>
          </div>
        </div>

        <nav className="student-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path
            const badge = item.label === 'Messages' ? messages.filter((ticket) => ticket.status !== 'closed').length : null
            return (
              <div key={item.label}>
                {item.group && <p className="student-nav-group">{item.group}</p>}
                <button type="button" className={`student-nav-item ${isActive ? 'active' : ''}`} onClick={() => handleNav(item.path)}>
                  <Icon />
                  <span>{item.label}</span>
                  {!!badge && <b>{badge}</b>}
                </button>
              </div>
            )
          })}
        </nav>

        <div style={{ padding: '0 4px', margin: '8px 0 16px 0' }}>
          <button 
            type="button" 
            className="student-nav-item" 
            onClick={() => { logout(); navigate('/login') }}
            style={{ 
              color: '#ff6b6b', 
              background: 'transparent',
              border: '1px solid rgba(255, 107, 107, 0.25)',
              minHeight: '42px',
              padding: '0 14px',
              gap: '12px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <FiLogOut />
            <span style={{ fontSize: '14px', fontWeight: 650 }}>Log Out</span>
          </button>
        </div>

        <div className="streak-card" style={{ padding: '12px 14px', margin: 'auto 10px 0', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c3cdec' }}>Learning Streak</h3>
          <strong style={{ fontSize: '18px', marginTop: '8px', display: 'block', lineHeight: 1 }}>
            {stats.learningStreak || 0} <span style={{ fontSize: '12px', fontWeight: 500 }}>Days</span>
          </strong>
          <p style={{ fontSize: '11px', marginTop: '6px', fontWeight: 500, color: '#d8e2ff', lineHeight: '1.4' }}>
            {stats.learningStreak ? 'Great going! Keep it up!' : 'Start learning to build your streak.'}
          </p>
          <div className="streak-meter" style={{ marginTop: '10px', gap: '5px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {[0, 1, 2, 3, 4].map((item) => item < Math.min(5, stats.learningStreak || 0) ? <i key={item} style={{ height: '4px' }} /> : <span key={item} style={{ height: '4px' }} />)}
          </div>
        </div>
      </aside>

      <main className="student-main">
        <header className="student-topbar">
          <button type="button" className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><FiMenu /></button>
          <label className="student-search">
            <FiSearch />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." />
          </label>
          <div className="topbar-actions">
            <button type="button" className="icon-button with-badge" onClick={() => navigate('/student/notifications')} aria-label="Notifications">
              <FiBell />
              {!!stats.unreadNotifications && <span>{stats.unreadNotifications}</span>}
            </button>
            <button type="button" className="icon-button with-badge" onClick={() => navigate('/student/messages')} aria-label="Messages">
              <FiMail />
              {!!messages.length && <span>{messages.length}</span>}
            </button>
            <button type="button" className="profile-button" onClick={() => setProfileOpen((value) => !value)}>
              <span>{firstName.charAt(0)}{lastName.charAt(0)}</span>
              <div>
                <strong>{fullName}</strong>
                <small>Student <FiChevronDown /></small>
              </div>
            </button>
             {profileOpen && (
              <div className="profile-menu">
                <button type="button" onClick={() => { setProfileOpen(false); navigate('/student/profile') }}>My Profile</button>
                <button type="button" onClick={() => { setProfileOpen(false); navigate('/student/certificates') }}>Certificates</button>
                <button type="button" onClick={() => { setProfileOpen(false); navigate('/student/wallet') }}>Wallet</button>
                <button 
                  type="button" 
                  onClick={() => { setProfileOpen(false); logout(); navigate('/login') }} 
                  style={{ 
                    color: '#ef4444', 
                    borderTop: '1px solid #f1f5f9', 
                    marginTop: '6px', 
                    paddingTop: '10px',
                    fontWeight: 700 
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="dashboard-content student-dashboard-header">
          <div className="welcome-row">
            <div>
              <h2>{currentPath === '/student' ? `Welcome back, ${firstName}!` : pageTitles[currentPath]}</h2>
              <p>{currentPath === '/student' ? 'Track your learning progress and achieve your goals.' : 'Your student workspace stays in the same dashboard layout.'}</p>
            </div>
          </div>
          {renderMain()}
        </section>
      </main>

      {sidebarOpen && <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
    </div>
  )
}

export default StudentDashboard
