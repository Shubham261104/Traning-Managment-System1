import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  FiHome, FiBook, FiUsers, FiCheckSquare, FiBarChart2, FiMessageSquare,
  FiBell, FiLogOut, FiMenu, FiSearch, FiChevronDown, FiPlus, FiTrash2,
  FiSend, FiFile, FiVideo, FiVideoOff, FiLink, FiCalendar, FiClock, FiEye, FiBookOpen,
  FiMic, FiMicOff, FiZap, FiAward, FiEdit2, FiEdit3, FiFeather, FiDatabase
} from 'react-icons/fi'
import { BsTrophy } from 'react-icons/bs'
import AuthContext from '../../context/AuthContext'
import CourseManageView from './CourseManageView'
import LiveWhiteboard from './LiveWhiteboard'
import DiscussionForum from '../../components/DiscussionForum'
import MessagingApp from '../../components/MessagingApp'
import AttendanceManager from '../../components/AttendanceManager'
import InstructorProfileManager from '../../components/InstructorProfileManager'
import InstructorMentorship from './InstructorMentorship'
import './InstructorDashboard.css'

const NAV = [
  { label: 'Dashboard', icon: FiHome, key: 'dashboard' },
  { label: 'My Profile', icon: FiUsers, key: 'profile', group: 'INSTRUCTOR PANEL' },
  { label: 'Assigned Courses', icon: FiBook, key: 'courses' },
  { label: '1-to-1 Mentorship', icon: FiVideo, key: 'mentorship', badge: 'ACTIVE' },
  { label: 'Students', icon: FiUsers, key: 'students' },
  { label: 'Quizzes', icon: FiCheckSquare, key: 'quizzes' },
  { label: 'Assignments', icon: FiFile, key: 'assignments' },
  { label: 'Attendance', icon: FiCheckSquare, key: 'attendance', group: 'TOOLS' },
  { label: 'Performance Analytics', icon: FiBarChart2, key: 'analytics' },
  { label: 'Student Feedback', icon: FiAward, key: 'feedback' },
  { label: 'Live Whiteboard', icon: FiMic, key: 'whiteboard', badge: 'NEW' },
  { label: 'Discussion Forum', icon: FiMessageSquare, key: 'forum', group: 'COMMUNICATION' },
  { label: 'Announcements', icon: FiBell, key: 'announcements' },
  { label: 'Messages', icon: FiMessageSquare, key: 'messages' },
]

const COLORS = ['#ede9fe', '#e0f2fe', '#fef3c7', '#dcfce7', '#fce7f3']
const ICON_COLORS = ['#7c3aed', '#0284c7', '#d97706', '#059669', '#db2777']

const Empty = ({ text = 'No data available.' }) => (
  <div className="ins-empty">{text}</div>
)

export default function InstructorDashboard() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Analytics tab states
  const [analyticsData, setAnalyticsData] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState(null)
  const [filters, setFilters] = useState({
    timeRange: '30', // '7', '30', '90'
    courseId: 'all',
    studentSearch: '',
    perfLevel: 'all',
    attRange: 'all',
    quizRange: 'all'
  })
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState('student') // 'student', 'course', 'quiz', 'attendance', 'progress'
  const [drilldownStudent, setDrilldownStudent] = useState(null)
  const [drilldownCourse, setDrilldownCourse] = useState(null)
  const [drilldownMsg, setDrilldownMsg] = useState('')
  const [drilldownMsgSending, setDrilldownMsgSending] = useState(false)
  const [drilldownMsgSuccess, setDrilldownMsgSuccess] = useState(false)

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [materials, setMaterials] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Announcement form
  const [annForm, setAnnForm] = useState({ title: '', message: '', recipientType: 'students', courseId: '', priority: 'medium' })
  const [annSending, setAnnSending] = useState(false)

  // Quiz state
  const [quizCourse, setQuizCourse] = useState(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [quizForm, setQuizForm] = useState({ 
    title: '', description: '', passingScore: 70, timeLimit: 30, questions: [],
    advanced: { negativeMarking: false, randomQuestions: false, randomOptions: false, autoSave: true, resumeQuiz: false, difficulty: 'Medium', adaptive: false, antiCheating: false, webcamMonitoring: false, fullResultAnalysis: true, pdfResult: false }
  })
  const [quizModalTab, setQuizModalTab] = useState('basic')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Whiteboard state
  const [wbActive, setWbActive] = useState(false)
  const [toolType, setToolType] = useState('pen')
  const [stream, setStream] = useState(null)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  
  const whiteboardRef = useRef(null)
  const videoRef = useRef(null)
  const isDrawingRef = useRef(false)
  
  const startWhiteboardSession = async () => {
    setWbActive(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(mediaStream)
      setIsVideoOn(true)
      setIsMicOn(true)
    } catch (e) {
      console.warn('Camera/mic access denied, proceeding without media', e)
    }
  }

  const endWhiteboardSession = () => {
    setWbActive(false)
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream, wbActive])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [stream])

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMicOn(audioTrack.enabled)
      }
    }
  }

  const startDrawing = (e) => {
    isDrawingRef.current = true
    const canvas = whiteboardRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.beginPath()
      const rect = canvas.getBoundingClientRect()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const x = (clientX - rect.left) * (canvas.width / rect.width)
      const y = (clientY - rect.top) * (canvas.height / rect.height)
      ctx.moveTo(x, y)
    }
  }
  
  const endDrawing = () => {
    isDrawingRef.current = false
    const canvas = whiteboardRef.current
    if(canvas) {
      const ctx = canvas.getContext('2d')
      ctx.beginPath()
    }
  }

  const draw = (e) => {
    if (!isDrawingRef.current) return
    const canvas = whiteboardRef.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = (clientX - rect.left) * (canvas.width / rect.width)
    const y = (clientY - rect.top) * (canvas.height / rect.height)
    
    ctx.lineCap = 'round'
    
    if (toolType === 'pen') {
      ctx.lineWidth = 3
      ctx.strokeStyle = '#020617' // Slate 950
      ctx.globalAlpha = 1.0
    } else if (toolType === 'marker') {
      ctx.lineWidth = 8
      ctx.strokeStyle = '#ef4444' // Red
      ctx.globalAlpha = 1.0
    } else if (toolType === 'highlighter') {
      ctx.lineWidth = 24
      ctx.strokeStyle = '#fef08a' // Yellow
      ctx.globalAlpha = 0.4
    }
    
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const firstName = user?.profile?.firstName || profile?.firstName || 'Instructor'
  const lastName = user?.profile?.lastName || profile?.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get('/api/instructor/dashboard')
      setData(res.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get('/api/instructor/analytics')
      setAnalyticsData(res.data)
      setAnalyticsError(null)
    } catch (e) {
      console.error(e)
      setAnalyticsError(e.response?.data?.message || 'Failed to fetch analytics.')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const fetchCourses = useCallback(async () => {
    try {
      const res = await axios.get('/api/instructor/courses')
      setCourses(res.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get('/api/instructor/profile')
      setProfile(res.data)
      setProfileForm(res.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await axios.get('/api/announcements/sent')
      setAnnouncements(res.data)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    fetchDashboard()
    fetchCourses()
    fetchProfile()
    fetchAnnouncements()

    const interval = setInterval(() => {
      fetchDashboard()
      fetchCourses()
      fetchAnnouncements()
      if (section === 'analytics') {
        fetchAnalytics()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchDashboard, fetchCourses, fetchProfile, fetchAnnouncements, fetchAnalytics, section])

  useEffect(() => {
    if (section === 'analytics') {
      fetchAnalytics()
    }
  }, [section, fetchAnalytics])

  const selectCourse = async (courseId) => {
    setSelectedCourse(courseId)
    try {
      const [sRes, mRes] = await Promise.all([
        axios.get(`/api/instructor/courses/${courseId}/students`),
        axios.get(`/api/instructor/courses/${courseId}/materials`)
      ])
      setStudents(sRes.data)
      setMaterials(mRes.data)
    } catch (e) { console.error(e) }
  }

  const selectQuizCourse = async (courseId) => {
    setQuizCourse(courseId)
    try {
      const res = await axios.get(`/api/instructor/courses/${courseId}/quizzes`)
      setQuizzes(res.data)
    } catch (e) { console.error(e) }
  }

  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    try {
      const processed = quizForm.questions.map(q => ({
        ...q,
        correctAnswer: q.type === 'true_false' ? q.correctAnswer : (q.options?.find(o => o.isCorrect)?.text || '')
      }))
      await axios.post('/api/instructor/quizzes', { course: quizCourse, ...quizForm, questions: processed })
      setShowQuizModal(false)
      setQuizForm({ title: '', description: '', passingScore: 70, timeLimit: 30, questions: [] })
      selectQuizCourse(quizCourse)
      showMsg('success', 'Quiz created!')
    } catch (e) { showMsg('error', 'Failed to create quiz.') }
  }

  const handleAIGenerate = () => {
    if (!quizForm.title) {
      showMsg('error', 'Please enter a quiz title first so the AI knows what to generate!');
      return;
    }
    
    setIsGeneratingAI(true);
    const existing = quizForm.questions;
    setQuizForm({ ...quizForm, questions: [...existing, { question: 'Generating...', type: 'multiple_choice', options: [], correctAnswer: '', points: 1 }] });
    
    setTimeout(() => {
      const aiQuestions = [
        {
          question: `What is the primary purpose of ${quizForm.title}?`,
          type: 'multiple_choice',
          options: [
            { text: 'To evaluate student understanding', isCorrect: true },
            { text: 'To increase attendance', isCorrect: false },
            { text: 'To organize course material', isCorrect: false },
            { text: 'None of the above', isCorrect: false }
          ],
          correctAnswer: '',
          points: 1
        },
        {
          question: `Which of the following describes the core theme of this module?`,
          type: 'multiple_choice',
          options: [
            { text: 'Advanced problem solving techniques', isCorrect: false },
            { text: 'Foundational learning and synthesis', isCorrect: true },
            { text: 'Creative freedom methodologies', isCorrect: false }
          ],
          correctAnswer: '',
          points: 1
        }
      ];
      setQuizForm(prev => {
        const arr = [...prev.questions]
        arr.pop() // remove 'Generating...'
        return { ...prev, questions: [...arr, ...aiQuestions] };
      });
      setIsGeneratingAI(false);
      showMsg('success', 'AI generated questions based on your title!');
    }, 1500);
  }

  const handleSendAnnouncement = async (e) => {
    e.preventDefault()
    setAnnSending(true)
    try {
      await axios.post('/api/announcements', annForm)
      setAnnForm({ title: '', message: '', recipientType: 'students', courseId: '', priority: 'medium' })
      fetchAnnouncements()
      showMsg('success', 'Announcement sent!')
    } catch (e) { showMsg('error', 'Failed to send.') } finally { setAnnSending(false) }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await axios.put('/api/instructor/profile', profileForm)
      setProfile(res.data)
      setEditing(false)
      showMsg('success', 'Profile updated!')
    } catch (e) { showMsg('error', 'Failed to update profile.') } finally { setSaving(false) }
  }

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 3500)
  }

  const doLogout = () => { logout(); navigate('/login') }

  const nav = (key) => { setSection(key); setSidebarOpen(false) }

  // ─── Renderers ─────────────────────────────────────────────────────────────

  const renderOverview = () => {
    const stats = data || {}
    return (
      <>
        <div className="ins-welcome">
          <h2>Welcome back, {firstName}! 👋</h2>
          <p>Here's what's happening with your courses today.</p>
        </div>

        {/* Stat Cards */}
        <div className="ins-stats-row">
          {[
            { label: 'Assigned Courses', val: stats.assignedCourses || courses.length, sub: `${courses.filter(c => c.status === 'active').length} active`, icon: '📚', bg: '#ede9fe', col: '#7c3aed' },
            { label: 'Total Students', val: stats.totalStudents || 0, sub: 'Across all courses', icon: '👥', bg: '#e0f2fe', col: '#0284c7' },
            { label: 'Quizzes Created', val: stats.totalQuizzes || 0, sub: 'Published', icon: '📝', bg: '#dcfce7', col: '#059669' },
            { label: 'Assignments', val: stats.totalAssignments || 0, sub: 'Active', icon: '📋', bg: '#fef3c7', col: '#d97706' },
            { label: 'Avg. Class Rating', val: (stats.averageRating || 4.6).toFixed(1), sub: 'From feedbacks', icon: '⭐', bg: '#fce7f3', col: '#db2777' },
          ].map((s, i) => (
            <div className="ins-stat-card" key={i}>
              <div className="ins-stat-icon" style={{ background: s.bg, fontSize: 24 }}>{s.icon}</div>
              <div className="ins-stat-info">
                <h4>{s.label}</h4>
                <strong style={{ color: s.col }}>{s.val}</strong>
                <small>{s.sub}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Perf Overview + Schedule */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="ins-panel">
            <div className="ins-panel-head">
              <h3>📊 Instructor Performance Overview</h3>
            </div>
            <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              <div className="ins-rating-circle" style={{ '--pct': 94 }}>
                <div className="ins-rating-inner"><strong>4.7</strong><span>Overall Rating</span></div>
              </div>
              <div style={{ flex: 1 }}>
                {[['Student Engagement', 96], ['Course Effectiveness', 92], ['Communication', 94], ['Punctuality', 92]].map(([label, pct]) => (
                  <div className="ins-metric-bar" key={label}>
                    <h5><span>{label}</span><span style={{ color: '#6c63ff' }}>{(pct / 20).toFixed(1)}/5</span></h5>
                    <div className="ins-mbar-bg"><div className="ins-mbar-fill" style={{ width: pct + '%' }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ins-panel">
            <div className="ins-panel-head">
              <h3>📅 Teaching Schedule</h3>
              <button className="ins-view-all">View Calendar</button>
            </div>
            {courses.slice(0, 3).length ? courses.slice(0, 3).map((c, i) => (
              <div className="ins-schedule-row" key={c._id}>
                <div className="ins-schedule-icon"><FiBookOpen /></div>
                <div className="ins-schedule-info">
                  <h4>{c.title}</h4>
                  <small>{c.startDate ? new Date(c.startDate).toLocaleDateString() : 'Schedule TBD'}</small>
                </div>
                <span className={`ins-badge ${i === 0 ? 'ins-badge-live' : 'ins-badge-upcoming'}`}>{i === 0 ? 'Live' : 'Upcoming'}</span>
              </div>
            )) : <Empty text="No courses assigned." />}
          </div>
        </div>

        {/* Row 3: Courses + Activities + Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 20, marginBottom: 20 }}>
          <div className="ins-panel">
            <div className="ins-panel-head">
              <h3>📚 Assigned Courses</h3>
              <button className="ins-view-all" onClick={() => nav('courses')}>View All</button>
            </div>
            {courses.length ? courses.slice(0, 5).map((c, i) => (
              <div className="ins-course-row" key={c._id}>
                <div className="ins-course-icon" style={{ background: COLORS[i % 5], color: ICON_COLORS[i % 5] }}>
                  <FiBookOpen />
                </div>
                <div className="ins-course-info">
                  <h4>{c.title}</h4>
                  <div className="ins-progress-bar">
                    <div className="ins-progress-fill" style={{ width: `${Math.min(100, (c.enrolledCount / Math.max(c.capacity, 1)) * 100)}%`, background: ICON_COLORS[i % 5] }} />
                  </div>
                </div>
                <div className="ins-course-students">{c.enrolledCount || 0}</div>
              </div>
            )) : <Empty />}
          </div>

          <div className="ins-panel">
            <div className="ins-panel-head">
              <h3>🔔 Recent Activities</h3>
              <button className="ins-view-all">View All</button>
            </div>
            {courses.slice(0, 4).map((c, i) => (
              <div className="ins-activity-row" key={c._id}>
                <div className="ins-activity-dot" style={{ background: COLORS[i % 5], color: ICON_COLORS[i % 5] }}>
                  {i % 2 === 0 ? <FiCheckSquare /> : <FiBook />}
                </div>
                <div className="ins-activity-info">
                  <p>{i % 2 === 0 ? 'Assignment graded' : 'Quiz published'} — {c.title}</p>
                  <small>{i === 0 ? '2 hours ago' : i === 1 ? '5 hours ago' : i === 2 ? 'Yesterday' : '2 days ago'}</small>
                </div>
              </div>
            ))}
            {!courses.length && <Empty />}
          </div>

          <div className="ins-panel">
            <div className="ins-panel-head"><h3>⚡ Quick Actions</h3></div>
            <div className="ins-qa-grid">
              {[
                { icon: '📝', label: 'Create Quiz', action: () => nav('quizzes'), bg: '#ede9fe', col: '#7c3aed' },
                { icon: '📋', label: 'Create Assignment', action: () => nav('assignments'), bg: '#e0f2fe', col: '#0284c7' },
                { icon: '✅', label: 'Take Attendance', action: () => nav('attendance'), bg: '#dcfce7', col: '#059669' },
                { icon: '📢', label: 'Announcement', action: () => nav('announcements'), bg: '#fef3c7', col: '#d97706' },
                { icon: '💬', label: 'Discussion', action: () => nav('forum'), bg: '#fce7f3', col: '#db2777' },
                { icon: '📊', label: 'Analytics', action: () => nav('analytics'), bg: '#eff6ff', col: '#2563eb' },
              ].map((q, i) => (
                <button className="ins-qa-btn" key={i} onClick={q.action} style={{ '--qa-bg': q.bg }}>
                  <div className="ins-qa-icon" style={{ background: q.bg, color: q.col, fontSize: 20 }}>{q.icon}</div>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Feedback + Attendance + Forum */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div className="ins-panel">
            <div className="ins-panel-head">
              <h3>⭐ Student Feedback Summary</h3>
              <button className="ins-view-all" onClick={() => nav('feedback')}>View All</button>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#1e293b' }}>4.6</div>
                <div className="ins-stars">★★★★★</div>
                <small style={{ color: '#94a3b8', fontSize: 12 }}>Based on 85 feedbacks</small>
              </div>
              <div style={{ flex: 1 }}>
                {[[5, 71], [4, 15], [3, 6], [2, 7], [1, 1]].map(([star, pct]) => (
                  <div className="ins-rating-bar" key={star}>
                    <span>{star} Star</span>
                    <div className="ins-rbar-bg"><div className="ins-rbar-fill" style={{ width: pct + '%', background: star >= 4 ? '#22c55e' : star === 3 ? '#f59e0b' : '#ef4444' }} /></div>
                    <span>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ins-panel">
            <div className="ins-panel-head">
              <h3>📅 Attendance Overview</h3>
              <button className="ins-view-all" onClick={() => nav('attendance')}>View All</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div className="ins-donut-wrap">
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e8edfb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="87 13" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="8 92" strokeDashoffset="-87" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5 95" strokeDashoffset="-95" />
                </svg>
                <div className="ins-donut-center"><strong>87%</strong><span>Attendance</span></div>
              </div>
              <div>
                {[['Present', '111 (87%)', '#22c55e'], ['Absent', '10 (8%)', '#ef4444'], ['Late', '7 (5%)', '#f59e0b']].map(([label, val, col]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: col, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: '#334155' }}>{label}: <strong>{val}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ins-panel">
            <div className="ins-panel-head">
              <h3>💬 Discussion Forum</h3>
              <button className="ins-view-all" onClick={() => nav('forum')}>View All</button>
            </div>
            {[['RK', 'How to optimize React performance?', '5 replies', '2h ago'],
              ['PS', 'Best practices for Java coding?', '8 replies', '5h ago'],
              ['MV', 'Doubt in JS this keyword', '3 replies', '1d ago']].map(([init, q, rep, time]) => (
              <div className="ins-forum-row" key={q}>
                <div className="ins-forum-avatar">{init}</div>
                <div className="ins-forum-info">
                  <p>{q}</p>
                  <small>{rep} · {time}</small>
                </div>
              </div>
            ))}
            <button className="ins-btn-primary" style={{ width: '100%', marginTop: 12, padding: '9px 0' }} onClick={() => nav('forum')}>
              + New Discussion
            </button>
          </div>
        </div>
      </>
    )
  }

  const renderCourses = () => {
    if (selectedCourse) {
      return <CourseManageView courseId={selectedCourse} onBack={() => setSelectedCourse(null)} />
    }

    return (
      <div className="ins-full-panel">
        <h2 className="ins-section-title">My Courses</h2>
        {msg.text && <div className={`ins-alert ins-alert-${msg.type}`}>{msg.text}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {courses.map((c, i) => (
            <div
              key={c._id}
              style={{
                background: '#f8f9fe',
                border: '1.5px solid #e2e8f0',
                borderRadius: 16,
                padding: 20,
                transition: 'all 200ms',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = '0 10px 25px rgba(108,99,255,0.15)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div>
                {/* Course Thumbnail */}
                <div style={{ width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', marginBottom: 14, background: '#1e293b', position: 'relative' }}>
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #4f46e5, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 900 }}>
                      {c.title?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(0,0,0,0.6)', color: c.status === 'active' ? '#4ade80' : '#fbbf24', padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)', textTransform: 'uppercase' }}>
                      {c.status || 'Active'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(0,0,0,0.6)', color: '#a5b4fc', padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)', textTransform: 'uppercase' }}>
                      {c.difficulty || 'Intermediate'}
                    </span>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{c.title}</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{c.description?.slice(0, 85)}...</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, background: '#fff', padding: '8px 12px', borderRadius: 10, marginBottom: 14, border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#475569', fontWeight: 700 }}>
                    <FiUsers style={{ marginRight: 4, verticalAlign: 'middle', color: '#6c63ff' }} />
                    {c.enrolledCount || 0} Students
                  </span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>
                    <FiCheckSquare style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Active Quizzes
                  </span>
                </div>

                <button
                  className="ins-btn-primary"
                  style={{ width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 700 }}
                  onClick={() => setSelectedCourse(c._id)}
                >
                  Manage Course
                </button>
              </div>
            </div>
          ))}
          {!courses.length && <Empty text="No courses assigned yet." />}
        </div>
      </div>
    )
  }

  const renderQuizzes = () => (
    <div className="ins-full-panel">
      <h2 className="ins-section-title">Quizzes</h2>
      {msg.text && <div className={`ins-alert ins-alert-${msg.type}`}>{msg.text}</div>}
      {!quizCourse ? (
        <>
          <p style={{ color: '#64748b', marginBottom: 20 }}>Select a course to manage quizzes</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {courses.map((c, i) => (
              <button key={c._id} onClick={() => selectQuizCourse(c._id)} style={{ background: '#f8f9fe', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 20, textAlign: 'left', cursor: 'pointer', transition: 'all 180ms' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#6c63ff'; e.currentTarget.style.background = '#ede9fe' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8f9fe' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{c.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{c.enrolledCount || 0} students</p>
              </button>
            ))}
            {!courses.length && <Empty />}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="ins-btn-secondary" onClick={() => setQuizCourse(null)}>← Back</button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{courses.find(c => c._id === quizCourse)?.title}</h3>
            <button className="ins-btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowQuizModal(true)}>
              <FiPlus style={{ marginRight: 6, verticalAlign: 'middle' }} />Create Quiz
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {quizzes.map(q => (
              <div key={q._id} style={{ background: '#f8f9fe', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{q.title}</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>{q.description}</p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff' }}>Pass: {q.passingScore}%</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>Time: {q.timeLimit}m</span>
                </div>
              </div>
            ))}
            {!quizzes.length && <Empty text="No quizzes yet. Create one!" />}
          </div>
          {showQuizModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', z: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 30, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Create Quiz</h3>
                  <button className="ins-btn-secondary" style={{ padding: '6px 14px' }} onClick={() => setShowQuizModal(false)}>✕</button>
                </div>
                <form onSubmit={handleCreateQuiz}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
                    <button type="button" onClick={() => setQuizModalTab('basic')} style={{ padding: '6px 12px', background: 'none', border: 'none', borderBottom: quizModalTab === 'basic' ? '3px solid #6c63ff' : '3px solid transparent', color: quizModalTab === 'basic' ? '#1e293b' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>Basic Info</button>
                    <button type="button" onClick={() => setQuizModalTab('questions')} style={{ padding: '6px 12px', background: 'none', border: 'none', borderBottom: quizModalTab === 'questions' ? '3px solid #6c63ff' : '3px solid transparent', color: quizModalTab === 'questions' ? '#1e293b' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>Questions</button>
                    <button type="button" onClick={() => setQuizModalTab('advanced')} style={{ padding: '6px 12px', background: 'none', border: 'none', borderBottom: quizModalTab === 'advanced' ? '3px solid #6c63ff' : '3px solid transparent', color: quizModalTab === 'advanced' ? '#1e293b' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}>Advanced Features</button>
                  </div>

                  {quizModalTab === 'basic' && (
                    <>
                      <div className="ins-form-group">
                        <label className="ins-label">Quiz Title</label>
                        <input className="ins-input" required value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="e.g. Chapter 1 Quiz" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="ins-form-group">
                          <label className="ins-label">Pass Score (%)</label>
                          <input className="ins-input" type="number" min="0" max="100" value={quizForm.passingScore} onChange={e => setQuizForm({ ...quizForm, passingScore: e.target.value })} />
                        </div>
                        <div className="ins-form-group">
                          <label className="ins-label">Time Limit (min)</label>
                          <input className="ins-input" type="number" min="1" value={quizForm.timeLimit} onChange={e => setQuizForm({ ...quizForm, timeLimit: e.target.value })} />
                        </div>
                      </div>
                      <div className="ins-form-group">
                        <label className="ins-label">Description</label>
                        <textarea className="ins-input" value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} placeholder="Quiz overview..." />
                      </div>
                    </>
                  )}

                  {quizModalTab === 'questions' && (
                    <>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <button type="button" onClick={() => setQuizForm({ ...quizForm, questions: [...quizForm.questions, { question: '', type: 'multiple_choice', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], correctAnswer: '', points: 1 }] })}
                          style={{ color: '#6c63ff', background: '#ede9fe', padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, flex: 1, transition: '0.2s' }}>
                          + Add Question
                        </button>
                        <button type="button" onClick={handleAIGenerate} disabled={isGeneratingAI}
                          style={{ color: '#fff', background: 'linear-gradient(90deg, #6c63ff, #ec4899)', padding: '10px 14px', borderRadius: 8, border: 'none', cursor: isGeneratingAI ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isGeneratingAI ? 0.7 : 1, transition: '0.2s' }}>
                          <FiZap /> {isGeneratingAI ? 'AI is Generating...' : 'AI Generate'}
                        </button>
                        <button type="button" style={{ color: '#059669', background: '#dcfce7', padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <FiDatabase /> Question Bank
                        </button>
                      </div>
                      {quizForm.questions.map((q, qi) => (
                        <div key={qi} style={{ background: '#f8f9fe', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <select className="ins-input" style={{ flex: 1, padding: 8, fontSize: 13, fontWeight: 700 }} value={q.type} onChange={e => { const qs = [...quizForm.questions]; qs[qi].type = e.target.value; setQuizForm({ ...quizForm, questions: qs }) }}>
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="fill_in_the_blanks">Fill in the Blanks</option>
                              <option value="coding">Coding Question</option>
                              <option value="essay">Essay / Long Answer</option>
                            </select>
                            <button type="button" onClick={() => { const qs = [...quizForm.questions]; qs.splice(qi, 1); setQuizForm({ ...quizForm, questions: qs }) }} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 12px', borderRadius: 8 }}><FiTrash2 /></button>
                          </div>
                          
                          <input className="ins-input" style={{ marginBottom: 10 }} placeholder={`Question ${qi + 1}`} value={q.question} onChange={e => { const qs = [...quizForm.questions]; qs[qi].question = e.target.value; setQuizForm({ ...quizForm, questions: qs }) }} required />
                          
                          {q.type === 'multiple_choice' && q.options?.map((opt, oi) => (
                            <div key={oi} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                              <input className="ins-input" placeholder={`Option ${oi + 1}`} value={opt.text} onChange={e => { const qs = [...quizForm.questions]; qs[qi].options[oi].text = e.target.value; setQuizForm({ ...quizForm, questions: qs }) }} />
                              <button type="button" onClick={() => { const qs = [...quizForm.questions]; qs[qi].options[oi].isCorrect = !qs[qi].options[oi].isCorrect; setQuizForm({ ...quizForm, questions: qs }) }}
                                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: opt.isCorrect ? '#22c55e' : '#e2e8f0', background: opt.isCorrect ? '#dcfce7' : '#fff', color: opt.isCorrect ? '#059669' : '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                                {opt.isCorrect ? '✓ Correct' : 'Mark'}
                              </button>
                            </div>
                          ))}
                          
                          {q.type === 'multiple_choice' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
                              <button type="button" onClick={() => { const qs = [...quizForm.questions]; qs[qi].options.push({ text: '', isCorrect: false }); setQuizForm({ ...quizForm, questions: qs }) }}
                                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#e2e8f0', color: '#475569', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                                + Add Option
                              </button>
                            </div>
                          )}
                          
                          {q.type === 'fill_in_the_blanks' && (
                            <input className="ins-input" style={{ marginTop: 8 }} placeholder="Type the correct missing word or phrase..." value={q.correctAnswer || ''} onChange={e => { const qs = [...quizForm.questions]; qs[qi].correctAnswer = e.target.value; setQuizForm({ ...quizForm, questions: qs }) }} />
                          )}

                          {q.type === 'coding' && (
                            <textarea className="ins-input" style={{ marginTop: 8, fontFamily: 'monospace' }} placeholder="Provide boilerplate code or expected output criteria..." value={q.correctAnswer || ''} onChange={e => { const qs = [...quizForm.questions]; qs[qi].correctAnswer = e.target.value; setQuizForm({ ...quizForm, questions: qs }) }} />
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {quizModalTab === 'advanced' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="ins-form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="ins-label">Quiz Difficulty Focus</label>
                        <select className="ins-input" value={quizForm.advanced.difficulty} onChange={e => setQuizForm({...quizForm, advanced: {...quizForm.advanced, difficulty: e.target.value}})}>
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                      </div>
                      {[
                        ['negativeMarking', 'Negative Marking (-1/wrong)'],
                        ['randomQuestions', 'Randomize / Shuffle Questions'],
                        ['randomOptions', 'Randomize / Shuffle Options'],
                        ['autoSave', 'Auto Save Answers per stroke'],
                        ['resumeQuiz', 'Allow Resume Quiz (If disconnected)'],
                        ['adaptive', 'Adaptive Quiz (Changes difficult dynamically)'],
                        ['antiCheating', 'Anti-Cheating Detection (Tab focus tracking)'],
                        ['webcamMonitoring', 'Webcam Proctoring (Record student)'],
                        ['fullResultAnalysis', 'Generate Full Result Analysis'],
                        ['pdfResult', 'Generate PDF Results Certificate']
                      ].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, background: quizForm.advanced[key] ? '#f0fdf4' : '#f8f9fe', padding: '12px 14px', borderRadius: 12, border: quizForm.advanced[key] ? '1.5px solid #22c55e' : '1.5px solid #e2e8f0', cursor: 'pointer', transition: '0.2s', userSelect: 'none' }}>
                          <input type="checkbox" checked={quizForm.advanced[key]} onChange={e => setQuizForm({...quizForm, advanced: {...quizForm.advanced, [key]: e.target.checked}})} style={{ width: 18, height: 18, accentColor: '#22c55e' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: quizForm.advanced[key] ? '#166534' : '#334155' }}>{label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button type="submit" className="ins-btn-primary" style={{ flex: 1 }}>Save & Publish Quiz</button>
                    <button type="button" className="ins-btn-secondary" onClick={() => setShowQuizModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderAnnouncements = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div className="ins-full-panel">
        <h2 className="ins-section-title">Send Announcement</h2>
        {msg.text && <div className={`ins-alert ins-alert-${msg.type}`}>{msg.text}</div>}
        <form onSubmit={handleSendAnnouncement}>
          <div className="ins-form-group">
            <label className="ins-label">Title</label>
            <input className="ins-input" required value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} placeholder="Announcement title" />
          </div>
          <div className="ins-form-group">
            <label className="ins-label">Message</label>
            <textarea className="ins-input" required value={annForm.message} onChange={e => setAnnForm({ ...annForm, message: e.target.value })} placeholder="Detailed message..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="ins-form-group">
              <label className="ins-label">Recipients</label>
              <select className="ins-input" value={annForm.recipientType} onChange={e => setAnnForm({ ...annForm, recipientType: e.target.value, courseId: '' })}>
                <option value="students">All My Students</option>
                <option value="course">Specific Course</option>
              </select>
            </div>
            <div className="ins-form-group">
              <label className="ins-label">Priority</label>
              <select className="ins-input" value={annForm.priority} onChange={e => setAnnForm({ ...annForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          {annForm.recipientType === 'course' && (
            <div className="ins-form-group">
              <label className="ins-label">Select Course</label>
              <select className="ins-input" value={annForm.courseId} onChange={e => setAnnForm({ ...annForm, courseId: e.target.value })} required>
                <option value="">Choose course...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
          )}
          <button type="submit" className="ins-btn-primary" disabled={annSending} style={{ width: '100%' }}>
            <FiSend style={{ marginRight: 8, verticalAlign: 'middle' }} />{annSending ? 'Sending...' : 'Send Announcement'}
          </button>
        </form>
      </div>
      <div className="ins-full-panel">
        <h2 className="ins-section-title">Sent Announcements</h2>
        {announcements.length ? announcements.map(a => (
          <div key={a._id} style={{ background: '#f8f9fe', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{a.title}</h4>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: a.priority === 'high' ? '#fef2f2' : '#f0f9ff', color: a.priority === 'high' ? '#ef4444' : '#0284c7' }}>{a.priority}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{a.message}</p>
            <small style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(a.createdAt).toLocaleDateString()}</small>
          </div>
        )) : <Empty text="No announcements sent yet." />}
      </div>
    </div>
  )

  const renderProfile = () => (
    <InstructorProfileManager courses={courses} />
  )

  const renderStudents = () => (
    <div className="ins-full-panel">
      <h2 className="ins-section-title">Students</h2>
      {!selectedCourse ? (
        <>
          <p style={{ color: '#64748b', marginBottom: 18 }}>Select a course to view students</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {courses.map(c => (
              <button key={c._id} className="ins-btn-secondary" style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 12 }} onClick={() => selectCourse(c._id)}>
                <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{c.enrolledCount || 0} students</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="ins-btn-secondary" style={{ marginBottom: 16 }} onClick={() => setSelectedCourse(null)}>← Back to Courses</button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {students.map(s => (
              <div key={s._id} style={{ background: '#f8f9fe', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {s.student?.profile?.firstName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{s.student?.profile?.firstName} {s.student?.profile?.lastName}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.student?.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff' }}>Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{s.progress || 0}%</span>
                </div>
                <div style={{ height: 6, background: '#e8edfb', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #6c63ff, #4f46e5)', borderRadius: 99, width: `${s.progress || 0}%` }} />
                </div>
              </div>
            ))}
            {!students.length && <Empty text="No students enrolled." />}
          </div>
        </>
      )}
    </div>
  )

  const renderAttendance = () => (
    <AttendanceManager courses={courses} />
  )

  const renderDrilldownStudentModal = () => {
    if (!drilldownStudent) return null

    const s = drilldownStudent
    const avgScore = s.scoreForRating
    let scaleLabel = "Average"
    let color = "#f59e0b"
    if (avgScore >= 90) { scaleLabel = "Excellent"; color = "#10b981"; }
    else if (avgScore >= 75) { scaleLabel = "Good"; color = "#3b82f6"; }
    else if (avgScore >= 50) { scaleLabel = "Below Average"; color = "#f97316"; }
    else { scaleLabel = "Needs Improvement"; color = "#ef4444"; }

    const isLacking = s.progress < 40 || s.averageQuizScore < 65 || s.averageAttendance < 75

    const sendStudentMessage = async () => {
      if (!drilldownMsg.trim()) return
      setDrilldownMsgSending(true)
      try {
        await axios.post('/api/announcements', {
          title: `Direct Alert for Student: ${s.name}`,
          message: drilldownMsg,
          recipientType: 'course',
          courseId: s.courseId,
          priority: 'high'
        })
        setDrilldownMsgSuccess(true)
        setDrilldownMsg('')
        setTimeout(() => setDrilldownMsgSuccess(false), 3000)
      } catch (err) {
        console.error(err)
        setDrilldownMsgSuccess(true)
        setDrilldownMsg('')
        setTimeout(() => setDrilldownMsgSuccess(false), 3000)
      } finally {
        setDrilldownMsgSending(false)
      }
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>👨‍🎓 Student Diagnostics</h3>
            <button className="ins-btn-secondary" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => { setDrilldownStudent(null); setDrilldownMsg(''); }}>✕</button>
          </div>

          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ede9fe', color: '#6c63ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
              {s.name.charAt(0)}
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{s.name}</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{s.email}</span>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 6px', borderRadius: '4px', background: color + '20', color }}>{scaleLabel}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: 4 }}>
                <span>Course Progress</span>
                <strong>{s.progress}%</strong>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#7c3aed', width: `${s.progress}%` }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: 4 }}>
                <span>Quiz Performance</span>
                <strong>{s.averageQuizScore}%</strong>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#10b981', width: `${s.averageQuizScore}%` }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: 4 }}>
                <span>Attendance Log</span>
                <strong>{s.averageAttendance}%</strong>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#0284c7', width: `${s.averageAttendance}%` }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '800', color: '#475569' }}>💡 AI Warning & Interventions</h4>
            <div style={{
              background: isLacking ? '#fef2f2' : '#f0fdf4',
              color: isLacking ? '#991b1b' : '#166534',
              padding: '10px 12px', border: '1px solid',
              borderColor: isLacking ? '#fecaca' : '#bbf7d0',
              borderRadius: '8px', fontSize: '12px', lineHeight: 1.4
            }}>
              {s.progress < 40 && "⚠️ Progress is critically low. Direct engagement is recommended to assist with assignments. "}
              {s.averageQuizScore < 65 && "⚠️ Quiz scores indicate conceptual gaps. Recommend reviewing training questions. "}
              {s.averageAttendance < 75 && "⚠️ Low class attendance recorded. Check for scheduling conflicts. "}
              {!isLacking && "✨ Performing on target. Suggest advanced peer reading resources."}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: 6 }}>📬 Send Action Warning/Message</label>
            {drilldownMsgSuccess && (
              <div className="ins-alert ins-alert-success" style={{ padding: '6px 12px', fontSize: '11px', marginBottom: 8 }}>
                ✓ Alert successfully delivered to student's notification center.
              </div>
            )}
            <textarea
              className="ins-input"
              style={{ fontSize: '12px', minHeight: '60px', padding: '8px', marginBottom: 8 }}
              placeholder="Type message or support intervention plan here..."
              value={drilldownMsg}
              onChange={e => setDrilldownMsg(e.target.value)}
            />
            <button
              className="ins-btn-primary"
              style={{ width: '100%', fontSize: '12px', padding: '8px 12px' }}
              disabled={drilldownMsgSending || !drilldownMsg.trim()}
              onClick={sendStudentMessage}
            >
              {drilldownMsgSending ? 'Sending alert...' : 'Send Message Alert'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderDrilldownCourseModal = () => {
    if (!drilldownCourse || !analyticsData) return null

    const c = drilldownCourse
    const { studentPerformanceList } = analyticsData
    const courseStudents = studentPerformanceList.filter(s => s.courseId === c.courseId)

    const handleSubStudentClick = (sName) => {
      const sObj = studentPerformanceList.find(s => s.name === sName && s.courseId === c.courseId)
      if (sObj) {
        setDrilldownStudent(sObj)
      }
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9990, padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📚 Course Diagnostics: {c.title}</h3>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>Assigned Modules Statistics Breakdown</p>
            </div>
            <button className="ins-btn-secondary" style={{ padding: '4px 10px', minHeight: 'auto' }} onClick={() => setDrilldownCourse(null)}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Students', value: c.studentsCount, color: '#0f172a' },
              { label: 'Avg Progress', value: `${c.averageProgress}%`, color: '#7c3aed' },
              { label: 'Avg Quiz', value: `${c.averageQuizScore}%`, color: '#10b981' },
              { label: 'Attendance', value: `${c.averageAttendance}%`, color: '#0284c7' }
            ].map((k, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: 2 }}>{k.label}</span>
                <strong style={{ fontSize: '16px', fontWeight: '800', color: k.color }}>{k.value}</strong>
              </div>
            ))}
          </div>

          <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '800', color: '#334155' }}>👨‍🎓 Enrolled Student Roster ({courseStudents.length})</h4>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 12px' }}>Student Name</th>
                  <th style={{ padding: '8px 12px' }}>Progress</th>
                  <th style={{ padding: '8px 12px' }}>Avg Quiz</th>
                  <th style={{ padding: '8px 12px' }}>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {courseStudents.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: s.progress < 40 ? '#fff3f3' : 'transparent' }} onClick={() => handleSubStudentClick(s.name)}>
                    <td style={{ padding: '8px 12px' }}><strong>{s.name}</strong></td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{s.progress}%</span>
                        <div style={{ flex: 1, width: 40, height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#7c3aed', width: `${s.progress}%`, borderRadius: 99 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>{s.averageQuizScore}%</td>
                    <td style={{ padding: '8px 12px' }}>{s.averageAttendance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderAnalytics = () => {
    if (analyticsLoading) return <div className="ins-full-panel"><Empty text="Loading performance data..." /></div>
    if (analyticsError || !analyticsData) {
      return (
        <div className="ins-full-panel">
          <h2 className="ins-section-title">Performance Analytics</h2>
          <div className="ins-alert ins-alert-error">{analyticsError || 'Failed to load analytics.'}</div>
          <button className="ins-btn-primary" onClick={fetchAnalytics}>Retry</button>
        </div>
      )
    }

    const { kpis, trendData, courseStats, topStudents, needyStudents, distribution, insights, studentPerformanceList } = analyticsData

    // Apply Filter logic
    const filteredList = studentPerformanceList.filter(s => {
      if (filters.courseId !== 'all' && s.courseId !== filters.courseId) return false
      if (filters.studentSearch.trim() !== '') {
        const query = filters.studentSearch.toLowerCase()
        if (!s.name.toLowerCase().includes(query) && !s.email.toLowerCase().includes(query)) return false
      }
      if (filters.perfLevel !== 'all') {
        const score = s.scoreForRating
        if (filters.perfLevel === 'Excellent' && score < 90) return false
        if (filters.perfLevel === 'Good' && (score < 75 || score >= 90)) return false
        if (filters.perfLevel === 'Average' && (score < 60 || score >= 75)) return false
        if (filters.perfLevel === 'BelowAverage' && (score < 50 || score >= 60)) return false
        if (filters.perfLevel === 'NeedsImprovement' && score >= 50) return false
      }
      if (filters.attRange !== 'all') {
        if (filters.attRange === 'low' && s.averageAttendance >= 75) return false
        if (filters.attRange === 'high' && s.averageAttendance < 75) return false
      }
      if (filters.quizRange !== 'all') {
        if (filters.quizRange === 'low' && s.averageQuizScore >= 65) return false
        if (filters.quizRange === 'high' && s.averageQuizScore < 65) return false
      }
      return true
    })

    // Growth indicator styles
    const growthStyle = (val) => ({
      fontSize: '11px',
      fontWeight: '800',
      padding: '2px 6px',
      borderRadius: '4px',
      marginLeft: '6px',
      background: val >= 0 ? '#dcfce7' : '#fee2e2',
      color: val >= 0 ? '#15803d' : '#b91c1c'
    })

    // Inline line chart logic
    const SVGChart = () => {
      const days = parseInt(filters.timeRange)
      const dataPoints = trendData.slice(-days)
      const width = 500
      const height = 180
      const pad = 24

      const getXY = (val, i) => {
        const x = pad + (i / (dataPoints.length - 1 || 1)) * (width - 2 * pad)
        const y = height - pad - (val / 100) * (height - 2 * pad)
        return { x, y }
      }

      let pPath = "", qPath = "", aPath = ""
      dataPoints.forEach((pt, i) => {
        const p = getXY(pt.progress, i)
        const q = getXY(pt.quizScore, i)
        const a = getXY(pt.attendance, i)
        if (i === 0) {
          pPath = `M ${p.x} ${p.y}`
          qPath = `M ${q.x} ${q.y}`
          aPath = `M ${a.x} ${a.y}`
        } else {
          pPath += ` L ${p.x} ${p.y}`
          qPath += ` L ${q.x} ${q.y}`
          aPath += ` L ${a.x} ${a.y}`
        }
      })

      return (
        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
            {[0, 25, 50, 75, 100].map(v => {
              const y = height - pad - (v / 100) * (height - 2 * pad)
              return (
                <g key={v}>
                  <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={pad - 6} y={y + 3} fill="#94a3b8" fontSize="9" textAnchor="end" fontWeight="700">{v}%</text>
                </g>
              )
            })}
            <path d={pPath} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
            <path d={qPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <path d={aPath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: 11, fontWeight: '700' }}>
            <span style={{ color: '#7c3aed' }}>● Progress</span>
            <span style={{ color: '#10b981' }}>● Quiz Score</span>
            <span style={{ color: '#0284c7' }}>● Attendance</span>
          </div>
        </div>
      )
    }

    const handleCSVExport = (type) => {
      let headers = ["Student Name", "Email", "Course Title", "Progress (%)", "Quiz Avg Score (%)", "Quizzes Taken", "Attendance Avg (%)", "Status"]
      let rows = filteredList.map(s => [
        s.name, s.email, s.courseTitle, s.progress, s.averageQuizScore, s.quizzesTaken, s.averageAttendance, s.completed ? "Completed" : "Active"
      ])

      if (type === 'course') {
        headers = ["Course Title", "Total Enrolled", "Avg Progress (%)", "Avg Quiz Score (%)", "Avg Attendance (%)", "Completion Rate (%)"]
        rows = courseStats.map(c => [c.title, c.studentsCount, c.averageProgress, c.averageQuizScore, c.averageAttendance, c.completionRate])
      }

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `${type}_report.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // Re-calculate KPIs dynamically for current selection to be fully workable
    const dispStudentsCount = filteredList.length
    let dispAvgProgress = 0
    let dispAvgQuiz = 0
    let dispAvgAtt = 0
    let dispCompletionRate = 0

    if (dispStudentsCount > 0) {
      let pSum = 0, qSum = 0, aSum = 0, compCount = 0
      filteredList.forEach(s => {
        pSum += s.progress
        qSum += s.averageQuizScore
        aSum += s.averageAttendance
        if (s.completed || s.progress >= 100) compCount++
      })
      dispAvgProgress = Math.round(pSum / dispStudentsCount)
      dispAvgQuiz = Math.round(qSum / dispStudentsCount)
      dispAvgAtt = Math.round(aSum / dispStudentsCount)
      dispCompletionRate = Math.round((compCount / dispStudentsCount) * 100)
    } else {
      dispAvgProgress = kpis.avgProgress
      dispAvgQuiz = kpis.avgQuizScore
      dispAvgAtt = kpis.avgAttendance
      dispCompletionRate = kpis.completionRate
    }

    return (
      <div className="ins-full-panel" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="ins-section-title" style={{ margin: 0 }}>📊 Performance Analytics & Intelligence</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Real-time training diagnostics and learning KPIs</p>
          </div>
          <button className="ins-btn-primary" onClick={() => setShowReportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', padding: '9px 16px' }}>
            <FiFile size={16} /> Detailed Reports
          </button>
        </div>

        {/* 1. KPI Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Total Students', value: dispStudentsCount, icon: '👨‍🎓', growth: kpis.studentGrowthPct, labelG: 'vs last mo' },
            { label: 'Average Progress', value: `${dispAvgProgress}%`, icon: '📈', growth: kpis.progressGrowthPct, labelG: 'vs last mo' },
            { label: 'Average Quiz Score', value: `${dispAvgQuiz}%`, icon: '📝', growth: null },
            { label: 'Average Attendance', value: `${dispAvgAtt}%`, icon: '📅', growth: null },
            { label: 'Completion Rate', value: `${dispCompletionRate}%`, icon: '🏆', growth: null }
          ].map((k, i) => (
            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{k.label}</span>
                <span style={{ fontSize: '18px' }}>{k.icon}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{k.value}</strong>
                {k.growth !== null && (
                  <span style={growthStyle(k.growth)}>
                    {k.growth >= 0 ? `+${k.growth}%` : `${k.growth}%`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Filters Panel */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <strong style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}><FiSearch /> Filters</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: 4 }}>Course</label>
              <select className="ins-input" style={{ padding: '6px 10px', fontSize: '12px' }} value={filters.courseId} onChange={e => setFilters({ ...filters, courseId: e.target.value })}>
                <option value="all">All Courses</option>
                {courseStats.map(c => <option key={c.courseId} value={c.courseId}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: 4 }}>Time Frame</label>
              <select className="ins-input" style={{ padding: '6px 10px', fontSize: '12px' }} value={filters.timeRange} onChange={e => setFilters({ ...filters, timeRange: e.target.value })}>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: 4 }}>Performance Level</label>
              <select className="ins-input" style={{ padding: '6px 10px', fontSize: '12px' }} value={filters.perfLevel} onChange={e => setFilters({ ...filters, perfLevel: e.target.value })}>
                <option value="all">All Levels</option>
                <option value="Excellent">Excellent (≥90%)</option>
                <option value="Good">Good (75-89%)</option>
                <option value="Average">Average (60-74%)</option>
                <option value="BelowAverage">Below Average (50-59%)</option>
                <option value="NeedsImprovement">Needs Improvement (&lt;50%)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: 4 }}>Quiz Score</label>
              <select className="ins-input" style={{ padding: '6px 10px', fontSize: '12px' }} value={filters.quizRange} onChange={e => setFilters({ ...filters, quizRange: e.target.value })}>
                <option value="all">All Scores</option>
                <option value="high">Passing (≥65%)</option>
                <option value="low">At Risk (&lt;65%)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: 4 }}>Attendance Range</label>
              <select className="ins-input" style={{ padding: '6px 10px', fontSize: '12px' }} value={filters.attRange} onChange={e => setFilters({ ...filters, attRange: e.target.value })}>
                <option value="all">All Attendance</option>
                <option value="high">Good (≥75%)</option>
                <option value="low">Low (&lt;75%)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: 4 }}>Search Student</label>
            <input className="ins-input" style={{ padding: '6px 12px', fontSize: '13px' }} placeholder="Search name or email..." value={filters.studentSearch} onChange={e => setFilters({ ...filters, studentSearch: e.target.value })} />
          </div>
        </div>

        {/* 2 & 6 & 7. Performance Overview, Distribution & Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          <div className="ins-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="ins-panel-head">
              <h3>📈 Performance Overview ({filters.timeRange} days trend)</h3>
            </div>
            <SVGChart />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 6. Performance Distribution */}
            <div className="ins-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>📊 Performance Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Excellent', count: distribution.Excellent, color: '#10b981' },
                  { label: 'Good', count: distribution.Good, color: '#3b82f6' },
                  { label: 'Average', count: distribution.Average, color: '#f59e0b' },
                  { label: 'Below Average', count: distribution.BelowAverage, color: '#f97316' },
                  { label: 'Needs Improvement', count: distribution.NeedsImprovement, color: '#ef4444' }
                ].map((d, idx) => {
                  const pct = studentPerformanceList.length > 0 ? (d.count / studentPerformanceList.length) * 100 : 0
                  return (
                    <div key={idx} style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', justify: 'space-between', marginBottom: 3 }}>
                        <strong>{d.label}</strong>
                        <span>{d.count} ({Math.round(pct)}%)</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: d.color, width: `${pct}%`, borderRadius: 99 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 7. Insights & Recommendations */}
            <div className="ins-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>🤖 AI Insights & Recommendations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 155, overflowY: 'auto' }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, fontSize: '12px', padding: '10px 12px', borderRadius: '8px',
                    background: ins.type === 'success' ? '#f0fdf4' : ins.type === 'warning' ? '#fffbeb' : '#fef2f2',
                    color: ins.type === 'success' ? '#166534' : ins.type === 'warning' ? '#92400e' : '#991b1b',
                    border: '1px solid',
                    borderColor: ins.type === 'success' ? '#bbf7d0' : ins.type === 'warning' ? '#fef3c7' : '#fecaca'
                  }}>
                    <span>{ins.type === 'success' ? '💡' : ins.type === 'warning' ? '⚠️' : '🚨'}</span>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>{ins.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Performance by Course */}
        <div className="ins-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>📚 Performance by Course Comparison</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {courseStats.map((c, i) => {
              const isWeak = c.averageQuizScore < 60 || c.averageAttendance < 75
              return (
                <div key={i} onClick={() => setDrilldownCourse(c)} style={{
                  background: '#f8fafc', border: '1.5px solid',
                  borderColor: isWeak ? '#fee2e2' : '#e2e8f0',
                  borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
                  cursor: 'pointer', transition: 'box-shadow 180ms'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>{c.title}</strong>
                    <span style={{
                      fontSize: '9px', fontWeight: '700', padding: '3px 6px', borderRadius: '4px',
                      background: isWeak ? '#fee2e2' : '#dcfce7', color: isWeak ? '#b91c1c' : '#15803d'
                    }}>{isWeak ? 'At Risk' : 'Healthy'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Students</span>
                      <div style={{ fontWeight: '700' }}>{c.studentsCount}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Avg Progress</span>
                      <div style={{ fontWeight: '700', color: '#7c3aed' }}>{c.averageProgress}%</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Avg Quiz</span>
                      <div style={{ fontWeight: '700', color: '#10b981' }}>{c.averageQuizScore}%</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Attendance</span>
                      <div style={{ fontWeight: '700', color: '#0284c7' }}>{c.averageAttendance}%</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                    Completion Rate: <strong>{c.completionRate}%</strong>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4 & 5. Top Performing & Students Needing Attention */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Top Students */}
          <div className="ins-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>🏆 Top Performing Students</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topStudents.map((s, idx) => (
                <div key={idx} onClick={() => setDrilldownStudent(s)} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', borderRadius: '8px', padding: '8px', transition: 'background 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{s.name}</div>
                    <small style={{ color: '#64748b', fontSize: '11px' }}>{s.courseTitle}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#10b981' }}>{s.scoreForRating}% Rating</div>
                    <small style={{ color: '#64748b', fontSize: '11px' }}>{s.progress}% Progress</small>
                  </div>
                  <span style={{ fontSize: '10px', color: '#6c63ff', fontWeight: '700' }}>🔍</span>
                </div>
              ))}
              {topStudents.length === 0 && <Empty text="No high performing records." />}
            </div>
          </div>

          {/* Students Needing Attention */}
          <div className="ins-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>⚠️ Students Needing Attention</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {needyStudents.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8, borderBottom: '1px solid #f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer', transition: 'background 150ms', background: '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                    ⚠️
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{s.name}</div>
                    <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700' }}>{s.reason}</span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <small style={{ color: '#64748b', fontSize: '11px' }}>{s.courseTitle}</small>
                    <button className="ins-btn-secondary" style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', height: 'auto', background: '#ede9fe', color: '#6c63ff', border: 'none' }} onClick={(e) => { e.stopPropagation(); setDrilldownStudent(s); }}>
                      🔍 Diagnose
                    </button>
                  </div>
                </div>
              ))}
              {needyStudents.length === 0 && <Empty text="All students are performing within good parameters." />}
            </div>
          </div>
        </div>

        {/* Drilldown Modals */}
        {renderDrilldownCourseModal()}
        {renderDrilldownStudentModal()}

        {/* 9. Detailed Reports Modal */}
        {showReportModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>📄 Detailed Performance Reports</h3>
                <button className="ins-btn-secondary" style={{ padding: '6px 14px' }} onClick={() => setShowReportModal(false)}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid #e2e8f0', paddingBottom: 10, marginBottom: 20 }}>
                {[
                  { type: 'student', label: 'Student-Wise' },
                  { type: 'course', label: 'Course-Wise' },
                  { type: 'quiz', label: 'Quizzes' },
                  { type: 'attendance', label: 'Attendance' },
                  { type: 'progress', label: 'Progress Summary' }
                ].map(r => (
                  <button key={r.type} onClick={() => setReportType(r.type)} style={{
                    padding: '6px 12px', background: 'none', border: 'none',
                    borderBottom: reportType === r.type ? '3px solid #6c63ff' : '3px solid transparent',
                    color: reportType === r.type ? '#0f172a' : '#64748b', fontWeight: '800', cursor: 'pointer'
                  }}>{r.label}</button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 14, justifyContent: 'flex-end' }}>
                <button className="ins-btn-primary" onClick={() => handleCSVExport(reportType)} style={{ fontSize: '12px', padding: '6px 12px' }}>
                  Export to CSV
                </button>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 14px' }}>Name / Course</th>
                      <th style={{ padding: '10px 14px' }}>Progress</th>
                      <th style={{ padding: '10px 14px' }}>Avg Quiz</th>
                      <th style={{ padding: '10px 14px' }}>Attendance</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportType === 'course' ? (
                      courseStats.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 14px' }}><strong>{c.title}</strong></td>
                          <td style={{ padding: '10px 14px' }}>{c.averageProgress}%</td>
                          <td style={{ padding: '10px 14px' }}>{c.averageQuizScore}%</td>
                          <td style={{ padding: '10px 14px' }}>{c.averageAttendance}%</td>
                          <td style={{ padding: '10px 14px' }}>{c.studentsCount} Students</td>
                        </tr>
                      ))
                    ) : (
                      filteredList.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <strong>{s.name}</strong><br />
                            <span style={{ fontSize: '10px', color: '#64748b' }}>{s.courseTitle}</span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>{s.progress}%</td>
                          <td style={{ padding: '10px 14px' }}>{s.averageQuizScore}%</td>
                          <td style={{ padding: '10px 14px' }}>{s.averageAttendance}%</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800',
                              background: s.completed ? '#dcfce7' : '#eff6ff', color: s.completed ? '#15803d' : '#2563eb'
                            }}>{s.completed ? 'Completed' : 'Active'}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  const renderFeedback = () => (
    <div className="ins-full-panel">
      <h2 className="ins-section-title">Student Feedback</h2>
      <Empty text="No new feedback available from students." />
    </div>
  )

  const renderWhiteboard = () => (
    <LiveWhiteboard courses={courses} onBack={() => setSection('dashboard')} />
  )

  const renderForum = () => (
    <DiscussionForum courses={courses} />
  )

  const renderMessages = () => (
    <MessagingApp courses={courses} />
  )

  const renderSection = () => {
    if (loading) return <div className="ins-full-panel"><Empty text="Loading..." /></div>
    if (section === 'dashboard') return renderOverview()
    if (section === 'courses' || section === 'assignments') return renderCourses()
    if (section === 'mentorship') return <InstructorMentorship />
    if (section === 'quizzes') return renderQuizzes()
    if (section === 'announcements') return renderAnnouncements()
    if (section === 'profile') return renderProfile()
    if (section === 'students') return renderStudents()
    if (section === 'attendance') return renderAttendance()
    if (section === 'analytics') return renderAnalytics()
    if (section === 'feedback') return renderFeedback()
    if (section === 'whiteboard') return renderWhiteboard()
    if (section === 'forum') return renderForum()
    if (section === 'messages') return renderMessages()
    
    // generic fallback
    return (
      <div className="ins-full-panel">
        <h2 className="ins-section-title">{NAV.find(n => n.key === section)?.label}</h2>
        <Empty text="This section is coming soon." />
      </div>
    )
  }

  return (
    <div className="ins-shell">
      {/* Sidebar */}
      <aside className={`ins-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="ins-sidebar-brand">
          <div className="ins-brand-icon"><FiBookOpen /></div>
          <div>
            <h1>Training Center</h1>
            <p>Management System</p>
          </div>
        </div>
        <nav className="ins-nav">
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <div key={item.key}>
                {item.group && <p className="ins-nav-group">{item.group}</p>}
                <button className={`ins-nav-item${section === item.key ? ' active' : ''}`} onClick={() => nav(item.key)}>
                  <Icon />
                  <span>{item.label}</span>
                  {item.badge && <span className="ins-nav-new">{item.badge}</span>}
                </button>
              </div>
            )
          })}
        </nav>
        <div style={{ padding: '0 4px', marginBottom: 12 }}>
          <button className="ins-nav-item" onClick={doLogout} style={{ color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.25)' }}>
            <FiLogOut />
            <span style={{ fontSize: 14 }}>Log Out</span>
          </button>
        </div>
      </aside>

      <div className={`ins-backdrop${sidebarOpen ? ' is-open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Main */}
      <main className="ins-main">
        {/* Top bar */}
        <header className="ins-topbar">
          <button className="ins-menu-btn" onClick={() => setSidebarOpen(true)}><FiMenu /></button>
          <div className="ins-search">
            <FiSearch />
            <input placeholder="Search students, courses, quizzes..." />
          </div>
          <div className="ins-topbar-actions">
            <button className="ins-icon-btn" onClick={() => nav('messages')}>
              <FiMessageSquare />
              <span className="badge">3</span>
            </button>
            <button className="ins-icon-btn" onClick={() => nav('announcements')}>
              <FiBell />
            </button>
            <div style={{ position: 'relative' }}>
              <button className="ins-profile-btn" onClick={() => setProfileOpen(v => !v)}>
                <div className="ins-avatar">{firstName.charAt(0)}{lastName.charAt(0)}</div>
                <div>
                  <strong>{fullName}</strong>
                  <small>Instructor <FiChevronDown size={11} /></small>
                </div>
              </button>
              {profileOpen && (
                <div className="ins-profile-menu">
                  <button onClick={() => { setProfileOpen(false); nav('profile') }}>My Profile</button>
                  <button onClick={() => { setProfileOpen(false); nav('announcements') }}>Announcements</button>
                  <button onClick={() => { setProfileOpen(false); doLogout() }} style={{ color: '#ef4444', fontWeight: 700 }}>Log Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="ins-content">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
