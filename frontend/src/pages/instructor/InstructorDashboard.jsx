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
import './InstructorDashboard.css'

const NAV = [
  { label: 'Dashboard', icon: FiHome, key: 'dashboard' },
  { label: 'My Profile', icon: FiUsers, key: 'profile', group: 'INSTRUCTOR PANEL' },
  { label: 'Assigned Courses', icon: FiBook, key: 'courses' },
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
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchDashboard, fetchCourses, fetchProfile, fetchAnnouncements])

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

  const renderCourses = () => (
    <div className="ins-full-panel">
      <h2 className="ins-section-title">My Courses</h2>
      {msg.text && <div className={`ins-alert ins-alert-${msg.type}`}>{msg.text}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
        {courses.map((c, i) => (
          <div key={c._id} style={{ background: '#f8f9fe', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 20, transition: 'box-shadow 200ms' }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(108,99,255,0.12)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: COLORS[i % 5], color: ICON_COLORS[i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                <FiBookOpen />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, background: c.status === 'active' ? '#dcfce7' : '#f1f5f9', color: c.status === 'active' ? '#059669' : '#64748b', padding: '3px 10px', borderRadius: 99 }}>{c.status}</span>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{c.title}</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{c.description?.slice(0, 80)}...</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#475569', fontWeight: 600 }}><FiUsers style={{ marginRight: 5, verticalAlign: 'middle' }} />{c.enrolledCount || 0} Students</span>
              <button className="ins-btn-primary" style={{ padding: '7px 16px', fontSize: 12 }} onClick={() => { setSelectedCourse(c._id); selectCourse(c._id) }}>
                Manage
              </button>
            </div>
            {selectedCourse === c._id && students.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#6c63ff' }}>Enrolled Students</p>
                {students.slice(0, 3).map(s => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                      {s.student?.profile?.firstName?.charAt(0) || '?'}
                    </div>
                    <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{s.student?.profile?.firstName} {s.student?.profile?.lastName}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6c63ff', fontWeight: 700 }}>{s.progress || 0}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {!courses.length && <Empty text="No courses assigned yet." />}
      </div>
    </div>
  )

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
    <div className="ins-full-panel" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="ins-section-title" style={{ margin: 0 }}>My Profile</h2>
        {!editing ? (
          <button className="ins-btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ins-btn-primary" onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            <button className="ins-btn-secondary" onClick={() => { setEditing(false); setProfileForm(profile) }}>Cancel</button>
          </div>
        )}
      </div>
      {msg.text && <div className={`ins-alert ins-alert-${msg.type}`}>{msg.text}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {[['firstName', 'First Name'], ['lastName', 'Last Name'], ['phone', 'Phone'], ['education', 'Education'], ['specialization', 'Specialization'], ['department', 'Department']].map(([field, label]) => (
          <div className="ins-form-group" key={field}>
            <label className="ins-label">{label}</label>
            {editing
              ? <input className="ins-input" value={profileForm[field] || ''} onChange={e => setProfileForm({ ...profileForm, [field]: e.target.value })} />
              : <div style={{ padding: '10px 14px', background: '#f8f9fe', borderRadius: 10, fontSize: 14, color: '#1e293b', border: '1px solid #e2e8f0' }}>{profile?.[field] || '—'}</div>}
          </div>
        ))}
        <div className="ins-form-group" style={{ gridColumn: 'span 2' }}>
          <label className="ins-label">Bio</label>
          {editing
            ? <textarea className="ins-input" value={profileForm.bio || ''} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
            : <div style={{ padding: '10px 14px', background: '#f8f9fe', borderRadius: 10, fontSize: 14, color: '#1e293b', border: '1px solid #e2e8f0', minHeight: 60 }}>{profile?.bio || '—'}</div>}
        </div>
      </div>
    </div>
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
    <div className="ins-full-panel">
      <h2 className="ins-section-title">Attendance Management</h2>
      <Empty text="Attendance feature is currently tracking automatically via module completions." />
    </div>
  )

  const renderAnalytics = () => (
    <div className="ins-full-panel">
      <h2 className="ins-section-title">Performance Analytics</h2>
      <Empty text="Analytics dashboard requires more course activity to generate insights." />
    </div>
  )
  
  const renderFeedback = () => (
    <div className="ins-full-panel">
      <h2 className="ins-section-title">Student Feedback</h2>
      <Empty text="No new feedback available from students." />
    </div>
  )

  const renderWhiteboard = () => (
    <div className="ins-full-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="ins-section-title" style={{ margin: 0 }}>Live Whiteboard</h2>
        {wbActive && (
          <button className="ins-btn-secondary" onClick={endWhiteboardSession} style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}>
            End Session
          </button>
        )}
      </div>
      
      {!wbActive ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f9fe', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <FiMic size={48} style={{ color: '#cbd5e1', marginBottom: 16 }} />
          <h3 style={{ color: '#1e293b', marginBottom: 8 }}>Ready to start a live session?</h3>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Start drawing and collaborating with your students in real-time.</p>
          <button className="ins-btn-primary" onClick={startWhiteboardSession}>
            <FiZap style={{ marginRight: 8, verticalAlign: 'middle' }} /> Start New Session
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'ins-pulse 2s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Live Session Active</span>
            </div>

            {/* Tools */}
            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', padding: '8px 14px', borderRadius: 99, display: 'flex', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 10 }}>
              <button onClick={() => setToolType('pen')} style={{ padding: '8px 12px', borderRadius: 20, border: 'none', background: toolType === 'pen' ? '#e2e8f0' : 'transparent', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#1e293b', transition: '0.2s' }}>
                <FiEdit2 /> Pen
              </button>
              <button onClick={() => setToolType('marker')} style={{ padding: '8px 12px', borderRadius: 20, border: 'none', background: toolType === 'marker' ? '#fee2e2' : 'transparent', color: toolType === 'marker' ? '#dc2626' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s' }}>
                <FiEdit3 /> Marker
              </button>
              <button onClick={() => setToolType('highlighter')} style={{ padding: '8px 12px', borderRadius: 20, border: 'none', background: toolType === 'highlighter' ? '#fef9c3' : 'transparent', color: toolType === 'highlighter' ? '#ca8a04' : '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s' }}>
                <FiFeather /> Highlight
              </button>
              <div style={{ width: 1, background: '#cbd5e1', margin: '0 4px', alignSelf: 'stretch' }} />
              <button onClick={() => {
                const canvas = whiteboardRef.current;
                if (canvas) canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
              }} style={{ padding: '8px 12px', borderRadius: 20, border: 'none', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s' }}>
                <FiTrash2 /> Clear
              </button>
            </div>
            
            {/* Video PIP */}
            {stream && (
              <div style={{ position: 'absolute', top: 16, right: 16, width: 200, overflow: 'hidden', borderRadius: 12, background: '#000', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '8px', background: 'rgba(30,41,59,0.9)' }}>
                  <button onClick={toggleMic} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isMicOn ? 'rgba(255,255,255,0.15)' : '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    {isMicOn ? <FiMic size={16} /> : <FiMicOff size={16} />}
                  </button>
                  <button onClick={toggleVideo} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isVideoOn ? 'rgba(255,255,255,0.15)' : '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    {isVideoOn ? <FiVideo size={16} /> : <FiVideoOff size={16} />}
                  </button>
                </div>
              </div>
            )}

            <canvas
              ref={whiteboardRef}
              width={1200}
              height={800}
              style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseUp={endDrawing}
              onMouseOut={endDrawing}
              onMouseMove={draw}
              onTouchStart={(e) => { e.preventDefault(); startDrawing(e) }}
              onTouchEnd={endDrawing}
              onTouchMove={(e) => { e.preventDefault(); draw(e) }}
            />
          </div>
          
          {/* Active Participants Sidebar */}
          <div style={{ width: 280, display: 'flex', flexDirection: 'column', background: '#f8f9fe', borderRadius: 16, border: '1px solid #e2e8f0', padding: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Participants (5)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
              {[
                { name: 'Rahul Sharma', color: '#3b82f6', active: true },
                { name: 'Priya Verma', color: '#10b981', active: false },
                { name: 'Amit Singh', color: '#f59e0b', active: true },
                { name: 'Neha Gupta', color: '#8b5cf6', active: true },
                { name: 'Karan Patel', color: '#ec4899', active: true },
              ].map((student, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: student.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    {student.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#334155', flex: 1 }}>{student.name}</span>
                  {student.active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} title="Online / Active" />}
                </div>
              ))}
            </div>
            
            <button className="ins-btn-secondary" style={{ marginTop: 'auto', padding: '10px' }}>
              <FiUsers style={{ marginRight: 6 }} /> Invite
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderForum = () => (
    <div className="ins-full-panel">
      <h2 className="ins-section-title">Discussion Forum</h2>
      <Empty text="The forum is currently empty for your active courses." />
    </div>
  )

  const renderMessages = () => (
    <div className="ins-full-panel">
      <h2 className="ins-section-title">Messages</h2>
      <Empty text="Your inbox is empty." />
    </div>
  )

  const renderSection = () => {
    if (loading) return <div className="ins-full-panel"><Empty text="Loading..." /></div>
    if (section === 'dashboard') return renderOverview()
    if (section === 'courses' || section === 'assignments') return renderCourses()
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
