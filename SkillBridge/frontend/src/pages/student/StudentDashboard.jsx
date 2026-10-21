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
  FiDownload,
  FiEye,
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
import AuthContext from '../../context/AuthContext'
import StudentProfile from './StudentProfile'
import StudentProgressDashboard from '../../components/StudentProgressDashboard'
import StudentCourseMaterials from './StudentCourseMaterials'
import StudentCertificates from './StudentCertificates'
import StudentMentorship from './StudentMentorship'
import CertificateModal from '../../components/CertificateModal'
import DiscussionForum from '../../components/DiscussionForum'
import MessagingApp from '../../components/MessagingApp'
import './StudentDashboard.css'

const navItems = [
  { label: 'Dashboard', icon: FiHome, path: '/student' },
  { label: 'My Profile', icon: FiUser, path: '/student/profile', group: 'STUDENT MANAGEMENT' },
  { label: 'Browse Courses', icon: FiBookOpen, path: '/student/courses' },
  { label: '1-to-1 Mentorship', icon: FiVideo, path: '/student/mentorship' },
  { label: 'My Enrollments', icon: FiBriefcase, path: '/student/enrollments' },
  { label: 'My Progress', icon: FiTrendingUp, path: '/student/progress' },
  { label: 'My Certificates', icon: FiAward, path: '/student/certificates' },
  { label: 'Attendance', icon: FiCalendar, path: '/student/attendance' },
  { label: 'My Quizzes', icon: FiHelpCircle, path: '/student/quizzes' },
  { label: 'Assignments', icon: FiFileText, path: '/student/assignments' },
  { label: 'Discussion Forum', icon: FiMessageSquare, path: '/student/forum' },
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
  '/student/mentorship': '1-to-1 Mentorship',
  '/student/enrollments': 'My Enrollments',
  '/student/progress': 'My Progress',
  '/student/certificates': 'My Certificates',
  '/student/attendance': 'Attendance',
  '/student/quizzes': 'My Quizzes',
  '/student/assignments': 'Assignments',
  '/student/forum': 'Discussion Forum',
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
  const [availableQuizzes, setAvailableQuizzes] = useState([])
  const [certMsg, setCertMsg] = useState({})
  const [selectedCert, setSelectedCert] = useState(null)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)

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
  
  let activeView = currentPath;
  const matchMaterials = location.pathname.match(/^\/student\/courses\/([^/]+)\/materials$/);
  if (matchMaterials) {
    activeView = 'materials';
  }

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

  // Fetch fully-populated certificates (with instructor + student profile)
  // and sync into dashboard state so all sections show consistent data
  const fetchCertificates = async () => {
    try {
      const res = await axios.get('/api/student/certificates')
      const freshCerts = res.data || []
      setDashboard(prev => prev ? { ...prev, certificates: freshCerts } : prev)
      return freshCerts
    } catch (err) {
      console.error('Failed to refresh certificates:', err)
      return []
    }
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
      axios.get('/api/student/quizzes/available').then((res) => setAvailableQuizzes(res.data || [])),
      // Always load fully-populated certs alongside dashboard data
      fetchCertificates(),
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

  // Refresh fully-populated certificates whenever student opens My Certificates
  useEffect(() => {
    if (currentPath === '/student/certificates') {
      fetchCertificates()
    }
  }, [currentPath])

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

  const handleGenerateCert = async (courseId) => {
    try {
      setCertMsg(prev => ({ ...prev, [courseId]: { type: 'loading', text: 'Generating Certificate...' } }))
      await axios.post('/api/certificates/generate', { courseId })
      // Refresh certificates with full populate, then show modal
      const freshCerts = await fetchCertificates()
      const cert = freshCerts.find(c => String(c.course?._id || c.course) === String(courseId)) || freshCerts[0]
      setCertMsg(prev => ({ ...prev, [courseId]: null }))
      if (cert) {
        setSelectedCert(cert)
        setIsCertModalOpen(true)
      }
    } catch (err) {
      console.error('Failed to generate certificate:', err)
      setCertMsg(prev => ({ ...prev, [courseId]: { type: 'error', text: 'Generation failed.' } }))
    }
  }

  const handleViewCert = async (courseId) => {
    try {
      // Always get fully-populated data from the dedicated endpoint
      let freshCerts = await fetchCertificates()
      let cert = freshCerts.find(c => String(c.course?._id || c.course) === String(courseId))
      if (!cert) {
        // Certificate doesn't exist yet — generate it first
        await axios.post('/api/certificates/generate', { courseId })
        freshCerts = await fetchCertificates()
        cert = freshCerts.find(c => String(c.course?._id || c.course) === String(courseId)) || freshCerts[0]
      }
      if (cert) {
        setSelectedCert(cert)
        setIsCertModalOpen(true)
      } else {
        navigate('/student/certificates')
      }
    } catch (err) {
      console.error('Failed to view certificate:', err)
      navigate('/student/certificates')
    }
  }

  const downloadCert = async (certificateId) => {
    try {
      const res = await axios.get(`/api/certificates/${certificateId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `certificate-${certificateId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Download error:', err)
    }
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
    { label: 'Quizzes Completed', value: stats.quizzesCompleted || 0, note: `Average Score: ${stats.averageScore || 0}%`, icon: FiHelpCircle, tone: 'blue', path: '/student/quizzes' },
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

  const renderEnrollments = () => {
    const validEnrollments = enrollments.filter(e => e.course);

    return (
      <article className="panel full-panel">
        <div className="panel-head">
          <h3>My Enrollments</h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            {validEnrollments.length} enrollment{validEnrollments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {validEnrollments.length === 0 ? (
          <EmptyState title="No enrollments yet. Browse available courses to get started." />
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {validEnrollments.map((enrollment) => {
              const courseId = enrollment.course?._id;
              const progress = enrollment.progress || 0;
              const isApproved = enrollment.status === 'approved';
              const isCompleted = enrollment.completed || progress >= 100;
              const hasCert = certificates.some(c => {
                const cId = c.course?._id || c.course;
                return String(cId) === String(courseId);
              });
              const msg = certMsg[courseId];

              return (
                <div
                  key={enrollment._id}
                  style={{
                    border: isCompleted ? '1px solid #d1fae5' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '20px 24px',
                    background: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.08)'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {enrollment.course?.title}
                      </h4>
                      {enrollment.course?.description && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {enrollment.course.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <span className={`status-pill ${enrollment.status}`} style={{ margin: 0 }}>
                        {enrollment.status}
                      </span>
                      {isCompleted && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '999px' }}>
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {isApproved && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                        <span>Course Progress</span>
                        <span style={{ color: isCompleted ? '#059669' : '#7048ff' }}>{progress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background: isCompleted
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : 'linear-gradient(90deg, #7048ff, #5a32eb)',
                          transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Admin notes */}
                  {enrollment.adminNotes && (
                    <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#fef9c3', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.82rem', color: '#92400e' }}>
                      <strong>Admin Note:</strong> {enrollment.adminNotes}
                    </div>
                  )}

                  {/* Certificate feedback */}
                  {msg && (
                    <div style={{
                      marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600,
                      background: msg.type === 'success' ? '#f0fdf4' : msg.type === 'error' ? '#fef2f2' : '#f0f9ff',
                      color: msg.type === 'success' ? '#166534' : msg.type === 'error' ? '#b91c1c' : '#0369a1',
                      border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : msg.type === 'error' ? '#fecaca' : '#bae6fd'}`
                    }}>
                      {msg.text}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {isApproved && courseId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/student/courses/${courseId}/materials`)}
                        style={{
                          flex: 1, minWidth: '140px',
                          background: 'linear-gradient(135deg, #7048ff 0%, #5a32eb 100%)',
                          color: '#fff', border: 'none', borderRadius: '8px',
                          padding: '10px 14px', fontWeight: 700, fontSize: '0.85rem',
                          cursor: 'pointer', boxShadow: '0 4px 12px rgba(112,72,255,0.25)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(112,72,255,0.35)' }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(112,72,255,0.25)' }}
                      >
                        📚 {isCompleted ? 'Review Materials' : 'Continue Learning'}
                      </button>
                    )}

                    {isApproved && isCompleted && !hasCert && courseId && (
                      <button
                        type="button"
                        disabled={msg?.type === 'loading'}
                        onClick={() => handleGenerateCert(courseId)}
                        style={{
                          flex: 1, minWidth: '140px',
                          background: msg?.type === 'loading' ? '#e5e7eb' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: msg?.type === 'loading' ? '#6b7280' : '#fff',
                          border: 'none', borderRadius: '8px',
                          padding: '10px 14px', fontWeight: 700, fontSize: '0.85rem',
                          cursor: msg?.type === 'loading' ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
                          transition: 'all 0.2s'
                        }}
                      >
                        🏆 Get Certificate
                      </button>
                    )}

                    {isApproved && isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleViewCert(courseId)}
                        style={{
                          flex: 1, minWidth: '140px',
                          background: '#f0fdf4', color: '#059669',
                          border: '1px solid #a7f3d0', borderRadius: '8px',
                          padding: '10px 14px', fontWeight: 700, fontSize: '0.85rem',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#dcfce7'}
                        onMouseOut={e => e.currentTarget.style.background = '#f0fdf4'}
                      >
                        🎓 View Certificate
                      </button>
                    )}

                    {isApproved && !isCompleted && (
                      <div
                        style={{
                          flex: 1, minWidth: '200px', padding: '10px 14px',
                          background: '#f8fafc', color: '#64748b',
                          border: '1px solid #e2e8f0', borderRadius: '8px',
                          fontSize: '0.82rem', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <span>🔒</span> Complete the course to unlock your certificate.
                      </div>
                    )}

                    {!isApproved && (
                      <div style={{
                        flex: 1, padding: '10px 14px', background: '#f8fafc',
                        borderRadius: '8px', border: '1px solid #e2e8f0',
                        fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center'
                      }}>
                        {enrollment.status === 'pending' ? '⏳ Awaiting admin approval' : '✗ Enrollment rejected'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    )
  }

  const renderProgress = () => (
    <StudentProgressDashboard
      user={user}
      dashboardData={dashboard}
      loading={loading}
      error={error}
      onNavigate={navigate}
      onViewCert={(courseId) => handleViewCert(courseId)}
      onRefresh={fetchDashboard}
    />
  )

  const renderCertificates = () => {
    const pendingCourses = courses.filter((e) => {
      const isCompleted = e.completed || (e.progress || 0) >= 100
      const cId = String(e.course?._id || e.course)
      const alreadyIssued = certificates.some((c) => String(c.course?._id || c.course) === cId)
      return isCompleted && e.status === 'approved' && !alreadyIssued
    })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Top Header Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #f1f5f9',
          padding: '24px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              My Certificates & Credentials
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
              Official course completion certificates verified by SkillBridge.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ background: '#f3e8ff', color: '#7048ff', padding: '6px 14px', borderRadius: '999px', fontWeight: 700, fontSize: '0.8rem' }}>
              🏆 {certificates.length} Issued
            </span>
            <span style={{ background: '#ecfdf5', color: '#10b981', padding: '6px 14px', borderRadius: '999px', fontWeight: 700, fontSize: '0.8rem' }}>
              ✓ Verified Credentials
            </span>
          </div>
        </div>

        {/* Pending Certificate Issuances */}
        {pendingCourses.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #f5f3ff, #fff)',
            borderRadius: '16px',
            border: '1px solid #ddd6fe',
            padding: '20px 24px'
          }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 800, color: '#5b21b6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiAward /> Pending Certificate Issuance
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {pendingCourses.map((en) => {
                const cId = en.course?._id || en.course
                return (
                  <div key={en._id} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e9d5ff', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>{en.course?.title}</h5>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>✓ 100% Requirements Complete</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateCert(cId)}
                      style={{
                        background: 'linear-gradient(135deg, #7048ff, #5a32eb)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(112, 72, 255, 0.2)'
                      }}
                    >
                      <span>➕ Generate Certificate</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Issued Certificates Grid */}
        {certificates.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {certificates.map((cert) => {
              const courseTitle = cert.course?.title || 'Course Certificate'
              const instName = instructorName(cert.course)
              const certId = cert.certificateId || cert._id?.slice(-12).toUpperCase()

              return (
                <div
                  key={cert._id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #f1f5f9',
                    padding: '20px',
                    boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0, 0, 0, 0.08)' }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 18px -2px rgba(0, 0, 0, 0.04)' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        🏆 Verified Credential
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        {formatDate(cert.issuedAt)}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {courseTitle}
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: '#64748b' }}>
                      Instructor: <strong>{instName}</strong>
                    </p>
                    <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', fontWeight: 700 }}>
                      ID: {certId}
                    </div>
                  </div>

                  {/* Dual Buttons: View Certificate & Download PDF */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCert(cert)
                        setIsCertModalOpen(true)
                      }}
                      style={{
                        flex: 1,
                        background: '#f0fdf4',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#dcfce7'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#f0fdf4'}
                    >
                      <FiEye size={16} />
                      <span>View Certificate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadCert(cert._id)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #7048ff, #5a32eb)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(112, 72, 255, 0.25)',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #5a32eb, #4c1d95)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #7048ff, #5a32eb)'}
                    >
                      <FiDownload size={16} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          pendingCourses.length === 0 && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f3e8ff', color: '#7048ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '1.8rem' }}>
                🏆
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                No Earned Certificates Yet
              </h4>
              <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                Complete 100% of your course materials and pass knowledge quizzes to earn official verified certificates.
              </p>
              <button
                type="button"
                onClick={() => navigate('/student/courses')}
                style={{
                  background: 'linear-gradient(135deg, #7048ff, #5a32eb)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Browse My Enrolled Courses
              </button>
            </div>
          )
        )}
      </div>
    )
  }

  const renderAttendance = () => {
    const total = attendance.length
    const present = attendance.filter(r => r.status === 'present').length
    const late = attendance.filter(r => r.status === 'late').length
    const absent = attendance.filter(r => r.status === 'absent').length
    const excused = attendance.filter(r => r.status === 'excused').length
    const pct = total ? Math.round(((present + late) / total) * 100) : 0

    const statusColors = {
      present: { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
      late:    { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
      absent:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
      excused: { bg: '#eef2ff', color: '#6366f1', border: '#c7d2fe' },
    }

    return (
      <article className="panel full-panel" style={{ background: '#f8fafc' }}>
        <div className="panel-head" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Attendance</h3>
          <span style={{
            background: 'radial-gradient(circle at 100% 100%, #e0e7ff 0%, #c7d2fe 100%)',
            color: '#4f46e5', padding: '8px 16px', borderRadius: '20px',
            fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 10px rgba(79,70,229,0.1)'
          }}>
            Overall Attendance: {stats.attendancePercentage || 0}%
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(400px, 1.5fr)', gap: '30px', alignItems: 'stretch' }}>

          {/* Left Column: Summary */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Attendance Summary</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Your attendance is recorded by your instructor during each class session.</p>
            </div>

            {/* Info Banner */}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>📋</span>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#3730a3', display: 'block', marginBottom: '4px' }}>Instructor-Managed Attendance</strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#4338ca', lineHeight: 1.5 }}>
                    Attendance is recorded by your course instructor during live sessions. Contact your instructor if you notice any discrepancies.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                <span>Attendance Rate</span>
                <span style={{ color: pct >= 75 ? '#059669' : '#dc2626', fontWeight: 700 }}>{pct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: '999px',
                  background: pct >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #dc2626)',
                  transition: 'width 0.8s ease'
                }} />
              </div>
              {pct < 75 && total > 0 && (
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ Below 75% threshold. Minimum required attendance is 75%.
                </p>
              )}
            </div>

            {/* Stat Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Present', value: present, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
                { label: 'Late', value: late, color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⏰' },
                { label: 'Absent', value: absent, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
                { label: 'Excused', value: excused, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: '📝' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.75rem', color: stat.color, fontWeight: 600, marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Sessions Recorded: </span>
              <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 800 }}>{total}</span>
            </div>
          </div>

          {/* Right Column: History */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Attendance History</h4>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '440px', paddingRight: '4px' }}>
              {attendance.length ? attendance.map((record) => {
                const sc = statusColors[record.status] || statusColors.absent
                return (
                  <div
                    key={record._id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{record.course?.title || 'Unknown Course'}</h5>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        {formatDate(record.classDate)}
                        {record.notes && <span style={{ fontStyle: 'italic', marginLeft: '8px' }}>— "{record.notes}"</span>}
                      </p>
                    </div>
                    <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize', flexShrink: 0, marginLeft: '12px' }}>
                      {record.status}
                    </span>
                  </div>
                )
              }) : <EmptyState title="No attendance records found. Attend your first class to see records here." />}
            </div>
          </div>
        </div>
      </article>
    )
  }

  const renderQuizzes = () => (
    <article className="panel full-panel">
      <div className="panel-head">
        <h3>My Quizzes</h3>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          {availableQuizzes.length} quiz{availableQuizzes.length !== 1 ? 'zes' : ''} available
        </span>
      </div>

      {/* Available Quizzes */}
      {availableQuizzes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {availableQuizzes.map((quiz) => {
            const attempt = quiz.attempt
            return (
              <div
                key={quiz._id}
                style={{
                  background: '#fff',
                  border: attempt ? '2px solid #d1fae5' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{quiz.title}</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#7048ff', fontWeight: 600 }}>{quiz.course?.title}</p>
                  </div>
                  {attempt && (
                    <span
                      className={`status-pill ${attempt.passed ? 'approved' : 'rejected'}`}
                      style={{ margin: 0, fontSize: '0.75rem', flexShrink: 0 }}
                    >
                      {attempt.passed ? '✓ Passed' : '✗ Failed'}
                    </span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{quiz.description}</p>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>📝 {quiz.questions?.length || 0} Questions</span>
                  <span>⏱ {quiz.timeLimit} min</span>
                  <span>🎯 Pass: {quiz.passingScore}%</span>
                </div>

                {attempt && (
                  <div style={{ background: attempt.passed ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', color: attempt.passed ? '#166534' : '#b91c1c', fontWeight: 600 }}>
                    Your Score: {Math.round(attempt.percentage || 0)}%
                  </div>
                )}

                {attempt ? (
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/student/quiz/${quiz._id}?view=analysis`)}
                      style={{
                        flex: 1.2,
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '10px',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0' }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
                    >
                      📊 View Result & Analysis
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/student/quiz/${quiz._id}`)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #7048ff, #5a32eb)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(112,72,255,0.2)',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'none' }}
                    >
                      🔁 Retake
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/student/quiz/${quiz._id}`)}
                    style={{
                      marginTop: 'auto',
                      background: 'linear-gradient(135deg, #7048ff, #5a32eb)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(112,72,255,0.25)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(112,72,255,0.35)' }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(112,72,255,0.25)' }}
                  >
                    ▶ Take Quiz
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="loading-text" style={{ marginBottom: '1.5rem' }}>No quizzes available yet. Enroll in a course to get started.</p>
      )}

      {/* Past Attempts */}
      {attempts.length > 0 && (
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginBottom: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>Past Attempts</h4>
          <div className="content-list">
            {attempts.map((attempt) => (
              <div
                className="list-row"
                key={attempt._id}
                onClick={() => {
                  const qId = attempt.quiz?._id || attempt.quiz
                  if (qId) {
                    navigate(`/student/quiz/${qId}?attemptId=${attempt._id}`)
                  }
                }}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
                title="Click to view detailed attempt analysis"
              >
                <div>
                  <h4>{attempt.quiz?.title}</h4>
                  <p>{attempt.quiz?.course?.title} | {formatDate(attempt.completedAt)}</p>
                </div>
                <b>{Math.round(attempt.percentage || 0)}%</b>
                <span className={`status-pill ${attempt.passed ? 'approved' : 'rejected'}`}>{attempt.passed ? 'Passed' : 'Failed'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
    if (activeView === 'materials') return <div className="panel full-panel" style={{ padding: '24px', background: 'transparent', boxShadow: 'none' }}><StudentCourseMaterials /></div>
    if (currentPath === '/student/profile') return <StudentProfile />
    if (currentPath === '/student/courses') return renderCourses()
    if (currentPath === '/student/mentorship') return <StudentMentorship />
    if (currentPath === '/student/enrollments') return renderEnrollments()
    if (currentPath === '/student/progress') return renderProgress()
    if (currentPath === '/student/certificates') return renderCertificates()
    if (currentPath === '/student/attendance') return renderAttendance()
    if (currentPath === '/student/quizzes') return renderQuizzes()
    if (currentPath === '/student/assignments') return renderAssignments()
    if (currentPath === '/student/forum') return <DiscussionForum courses={courses} />
    if (currentPath === '/student/messages') return <MessagingApp courses={courses} />
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

        <section className={`dashboard-content ${activeView === 'materials' ? 'student-materials-view' : 'student-dashboard-header'}`}>
          {activeView !== 'materials' && (
            <div className="welcome-row">
              <div>
                <h2>{currentPath === '/student' ? `Welcome back, ${firstName}!` : pageTitles[currentPath]}</h2>
                <p>{currentPath === '/student' ? 'Track your learning progress and achieve your goals.' : 'Your student workspace stays in the same dashboard layout.'}</p>
              </div>
            </div>
          )}
          {renderMain()}
        </section>
      </main>

      {sidebarOpen && <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        certificate={selectedCert}
        onDownload={downloadCert}
      />
    </div>
  )
}

export default StudentDashboard
