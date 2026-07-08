import { useState, useEffect, useContext, useRef } from 'react'
import Layout from '../../components/Layout'
import AuthContext from '../../context/AuthContext'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  FiBook, FiClock, FiAward, FiCheckCircle, FiArrowRight, FiZap, FiTrendingUp,
  FiTarget, FiUpload, FiUser, FiStar, FiBookmark, FiFileText,
  FiBarChart2, FiShield, FiActivity, FiEdit2, FiPlusCircle, FiCheck, FiX, FiBell
} from 'react-icons/fi'
import { FaFire, FaTrophy, FaCrown, FaMedal } from 'react-icons/fa'
import '../admin/AdminPremium.css'
import './StudentDashboard.css'

// ─── Mock / static data (replace with real API when backend is ready) ─────────
const MOCK_ATTENDANCE = [
  { date: '2026-07-01', status: 'present' }, { date: '2026-07-02', status: 'present' },
  { date: '2026-07-03', status: 'absent' },  { date: '2026-07-04', status: 'present' },
  { date: '2026-07-07', status: 'present' }, { date: '2026-07-08', status: 'late' },
]
const MOCK_SKILLS = [
  { name: 'JavaScript', level: 78 }, { name: 'React', level: 65 },
  { name: 'Node.js', level: 50 },    { name: 'MongoDB', level: 42 },
  { name: 'Python', level: 30 },
]
const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Priya Sharma', xp: 4820, avatar: '👑' },
  { rank: 2, name: 'Arjun Patel', xp: 4310, avatar: '🥈' },
  { rank: 3, name: 'Sneha Gupta', xp: 3990, avatar: '🥉' },
  { rank: 4, name: 'Rahul Verma', xp: 3740, avatar: '🎖️' },
  { rank: 5, name: 'You', xp: 3250, avatar: '⭐', isYou: true },
]
const BADGES = [
  { icon: '🔥', label: 'On Fire',       earned: true,  desc: '7-day Streak' },
  { icon: '📚', label: 'Book Worm',     earned: true,  desc: '10 Courses Enrolled' },
  { icon: '⚡', label: 'Speed Reader',  earned: true,  desc: 'Completed in Record Time' },
  { icon: '🏆', label: 'Top Scorer',    earned: false, desc: 'Score 100% on Quiz' },
  { icon: '💡', label: 'Innovator',     earned: false, desc: 'Submit 5 Assignments' },
  { icon: '🌍', label: 'Global Learner',earned: false, desc: 'Complete 3 Languages' },
]
const DAILY_GOALS = [
  { id: 1, goal: 'Complete 1 lesson',           done: true  },
  { id: 2, goal: 'Review notes for 15 minutes', done: true  },
  { id: 3, goal: 'Attempt a quiz question',      done: false },
  { id: 4, goal: 'Watch 1 course video',         done: false },
]

const StudentDashboard = () => {
  const { user } = useContext(AuthContext)
  const [dashboardData, setDashboardData] = useState({})
  const [loading, setLoading] = useState(true)

  // Tab & modal states
  const [activeTab, setActiveTab] = useState('overview')
  const [goals, setGoals] = useState(DAILY_GOALS)
  const [newGoal, setNewGoal] = useState('')
  const [notes, setNotes] = useState(localStorage.getItem('student_notes') || '')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeName, setResumeName] = useState(localStorage.getItem('resume_name') || '')
  const [parentEmail, setParentEmail] = useState(localStorage.getItem('parent_email') || '')
  const [parentEmailSaved, setParentEmailSaved] = useState(false)
  const resumeInputRef = useRef()

  const streak = 7   // Mock streak days
  // FaFire replaces FiFlame (not in react-icons 4.11)
  const xp     = 3250

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/student/dashboard')
      setDashboardData(res.data || {})
    } catch {
      setDashboardData({ enrolledCourses: 0, pendingEnrollments: 0, certificatesCount: 0, enrollments: [], certificates: [] })
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  const toggleGoal = (id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g))
  const addGoal = () => {
    if (!newGoal.trim()) return
    setGoals(prev => [...prev, { id: Date.now(), goal: newGoal.trim(), done: false }])
    setNewGoal('')
  }
  const saveNotes = () => {
    localStorage.setItem('student_notes', notes)
    alert('Notes saved!')
  }
  const handleResumeUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResumeUploading(true)
    setTimeout(() => {
      setResumeName(file.name)
      localStorage.setItem('resume_name', file.name)
      setResumeUploading(false)
      setResumeFile(file)
    }, 1500)
  }
  const saveParentEmail = () => {
    if (!parentEmail) return
    localStorage.setItem('parent_email', parentEmail)
    setParentEmailSaved(true)
    setTimeout(() => setParentEmailSaved(false), 2000)
  }

  const completedGoals = goals.filter(g => g.done).length
  const attendancePresent = MOCK_ATTENDANCE.filter(a => a.status === 'present').length
  const attendancePct = Math.round((attendancePresent / MOCK_ATTENDANCE.length) * 100)

  const TABS = [
    { key: 'overview',     label: 'Overview',     icon: <FiActivity /> },
    { key: 'analytics',    label: 'Analytics',    icon: <FiBarChart2 /> },
    { key: 'leaderboard',  label: 'Leaderboard',  icon: <FaTrophy /> },
    { key: 'goals',        label: 'Daily Goals',  icon: <FiTarget /> },
    { key: 'notes',        label: 'My Notes',     icon: <FiFileText /> },
    { key: 'portfolio',    label: 'Portfolio',    icon: <FiUser /> },
    { key: 'parent',       label: 'Parent Portal',icon: <FiBell /> },
  ]

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="space-y-8 pb-16 animate-dashCardFadeIn">

        {/* ── Hero Header ──────────────────────────────── */}
        <div className="dash-hero">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-1 tracking-tight">
              Student <span className="text-premium-gradient">Command Center</span>
            </h1>
            <p className="text-[#94a3b8] font-medium text-base">
              Welcome back{user?.profile?.firstName ? `, ${user.profile.firstName}` : ''}! Keep the momentum going.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap mt-4">
            <div className="streak-badge">
              <FaFire className="text-orange-400" />
              <span>{streak} Day Streak</span>
            </div>
            <div className="xp-badge">
              <FiZap className="text-yellow-400" />
              <span>{xp.toLocaleString()} XP</span>
            </div>
            <div className="rank-badge">
              <FaCrown className="text-purple-400" />
              <span>Rank #5</span>
            </div>
          </div>
        </div>

        {/* ── Key Stats ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'Enrolled',    value: dashboardData.enrolledCourses || 0,                                              icon: FiBook,         color: '#6366f1' },
            { label: 'Completed',   value: dashboardData.enrollments?.filter(e => e.completed).length || 0,               icon: FiCheckCircle,  color: '#10b981' },
            { label: 'Certificates',value: dashboardData.certificatesCount || dashboardData.certificates?.length || 0,    icon: FiAward,        color: '#f59e0b' },
            { label: 'Attendance',  value: `${attendancePct}%`,                                                             icon: FiActivity,     color: '#3b82f6' },
            { label: 'Goals Done',  value: `${completedGoals}/${goals.length}`,                                            icon: FiTarget,       color: '#8b5cf6' },
            { label: 'Streak Days', value: streak,                                                                          icon: FaFire,        color: '#f97316' },
          ].map((s, i) => (
            <div key={i} className="admin-glass-card stat-mini"
              style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="stat-icon" style={{ backgroundColor: `${s.color}22`, border: `1px solid ${s.color}44` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Achievement Badges ──────────────────────── */}
        <div className="admin-glass-card">
          <div className="section-header">
            <FaMedal className="text-yellow-400" size={20} />
            <h2 className="text-white font-black text-xl uppercase tracking-tight">Achievement Badges</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-4">
            {BADGES.map((b, i) => (
              <div key={i} className={`badge-card ${!b.earned ? 'badge-locked' : ''}`}
                title={b.desc}>
                <div className="badge-icon">{b.icon}</div>
                <p className="badge-label">{b.label}</p>
                {!b.earned && <div className="badge-lock-overlay">🔒</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Switcher ────────────────────────────── */}
        <div className="tab-switcher">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`tab-btn ${activeTab === t.key ? 'tab-active' : ''}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Enrollments */}
            <div className="admin-glass-card">
              <div className="section-header mb-6">
                <FiZap className="text-indigo-400" />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">My Enrollments</h2>
                <Link to="/student/courses" className="ml-auto tab-link">View All <FiArrowRight /></Link>
              </div>
              <div className="space-y-4">
                {dashboardData.enrollments?.filter(e => e.course).slice(0, 4).map((en, i) => (
                  <div key={i} className="enroll-card">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-sm">{en.course?.title || 'Unknown'}</h3>
                      <span className={`status-chip ${en.status}`}>{en.status}</span>
                    </div>
                    {en.status === 'approved' && (
                      <>
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                          <span>Progress</span><span className="text-indigo-400">{en.progress || 0}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${en.progress || 0}%` }} />
                        </div>
                      </>
                    )}
                  </div>
                )) || <div className="empty-state"><FiBook size={36} /><p>No active enrollments</p></div>}
              </div>
            </div>

            {/* Certificates */}
            <div className="admin-glass-card">
              <div className="section-header mb-6">
                <FiAward className="text-amber-400" />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Certificates</h2>
                <Link to="/student/certificates" className="ml-auto tab-link">View All <FiArrowRight /></Link>
              </div>
              <div className="space-y-4">
                {dashboardData.certificates?.length > 0 ? dashboardData.certificates.slice(0, 4).map((cert, i) => (
                  <div key={i} className="cert-card">
                    <FiAward className="text-amber-400" size={24} />
                    <div>
                      <p className="text-white font-bold text-sm">{cert.course?.title || 'Certificate'}</p>
                      <p className="text-gray-500 text-[11px]">Issued: {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                )) : <div className="empty-state"><FiAward size={36} /><p>No certificates yet</p></div>}
              </div>
            </div>

            {/* Attendance */}
            <div className="admin-glass-card">
              <div className="section-header mb-6">
                <FiActivity className="text-blue-400" />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Attendance Record</h2>
                <span className="ml-auto text-blue-400 font-black text-lg">{attendancePct}%</span>
              </div>
              <div className="attendance-grid">
                {MOCK_ATTENDANCE.map((a, i) => (
                  <div key={i} className={`att-dot att-${a.status}`} title={`${a.date} — ${a.status}`} />
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-[11px]">
                <span className="flex items-center gap-1"><span className="att-dot att-present inline-block" />Present</span>
                <span className="flex items-center gap-1"><span className="att-dot att-absent inline-block" />Absent</span>
                <span className="flex items-center gap-1"><span className="att-dot att-late inline-block" />Late</span>
              </div>
            </div>

            {/* Assignments */}
            <div className="admin-glass-card">
              <div className="section-header mb-6">
                <FiFileText className="text-emerald-400" />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Assignment Submission</h2>
              </div>
              <div className="space-y-3">
                {['React App Project', 'MongoDB Schema Design', 'JS Algorithms Task'].map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-white text-sm font-semibold">{a}</p>
                      <p className="text-gray-500 text-[11px]">Due: {new Date(Date.now() + (i + 1) * 86400000 * 3).toLocaleDateString()}</p>
                    </div>
                    <button className="submit-btn">
                      <FiUpload size={14} /> Submit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            ANALYTICS TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Performance Chart */}
            <div className="admin-glass-card xl:col-span-2">
              <div className="section-header mb-6">
                <FiTrendingUp className="text-indigo-400" />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Performance Overview</h2>
              </div>
              <div className="perf-bars">
                {[
                  { subject: 'JavaScript',     score: 88 },
                  { subject: 'React',           score: 76 },
                  { subject: 'Node.js',         score: 65 },
                  { subject: 'Database',        score: 72 },
                  { subject: 'Data Structures', score: 58 },
                  { subject: 'Algorithms',      score: 81 },
                ].map((p, i) => (
                  <div key={i} className="perf-bar-item">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{p.subject}</span>
                      <span className="text-white font-bold">{p.score}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill"
                        style={{ width: `${p.score}%`, background: p.score >= 80 ? '#10b981' : p.score >= 60 ? '#6366f1' : '#f59e0b', animationDelay: `${i * 0.1}s` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Tracker */}
            <div className="admin-glass-card">
              <div className="section-header mb-6">
                <FiShield className="text-purple-400" />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Skill Tracker</h2>
              </div>
              <div className="space-y-5">
                {MOCK_SKILLS.map((sk, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300 font-semibold">{sk.name}</span>
                      <span style={{ color: sk.level >= 70 ? '#10b981' : sk.level >= 50 ? '#6366f1' : '#f59e0b', fontWeight: 'bold' }}>
                        {sk.level < 40 ? 'Beginner' : sk.level < 65 ? 'Intermediate' : 'Advanced'} — {sk.level}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${sk.level}%`,
                        background: sk.level >= 70 ? 'linear-gradient(90deg,#10b981,#34d399)' :
                          sk.level >= 50 ? 'linear-gradient(90deg,#6366f1,#a855f7)' :
                            'linear-gradient(90deg,#f59e0b,#fbbf24)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Streak Calendar */}
            <div className="admin-glass-card">
              <div className="section-header mb-6">
                <FaFire className="text-orange-500" />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Learning Streak</h2>
                <span className="ml-auto streak-num">{streak} 🔥</span>
              </div>
              <div className="streak-calendar">
                {Array.from({ length: 28 }).map((_, i) => {
                  const active = Math.random() > 0.3
                  return (
                    <div key={i}
                      className={`streak-cell ${i >= 28 - streak ? 'streak-active' : active ? 'streak-past' : 'streak-empty'}`}
                      title={`Day ${i + 1}`}
                    />
                  )
                })}
              </div>
              <p className="text-center text-gray-500 text-sm mt-4">Keep studying daily to grow your streak!</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            LEADERBOARD TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'leaderboard' && (
          <div className="admin-glass-card">
            <div className="section-header mb-8">
              <FaTrophy className="text-yellow-400" size={24} />
              <h2 className="text-white font-black text-2xl uppercase tracking-tight">Student Leaderboard</h2>
              <span className="ml-auto text-sm text-gray-500">Your Rank: <strong className="text-purple-400">#5</strong></span>
            </div>
            <div className="space-y-4">
              {MOCK_LEADERBOARD.map((s, i) => (
                <div key={i}
                  className={`leaderboard-row ${s.isYou ? 'leaderboard-you' : ''}`}>
                  <div className="rank-num"
                    style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#6366f1' }}>
                    #{s.rank}
                  </div>
                  <div className="avatar-circle">{s.avatar}</div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${s.isYou ? 'text-purple-400' : 'text-white'}`}>
                      {s.name} {s.isYou && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full ml-1">YOU</span>}
                    </p>
                    <div className="progress-bar mt-1" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${(s.xp / 5000) * 100}%` }} />
                    </div>
                  </div>
                  <div className="xp-count">{s.xp.toLocaleString()} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            DAILY GOALS TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'goals' && (
          <div className="admin-glass-card">
            <div className="section-header mb-6">
              <FiTarget className="text-green-400" size={20} />
              <h2 className="text-white font-black text-xl uppercase tracking-tight">Daily Goals</h2>
              <span className="ml-auto text-gray-400 text-sm">{completedGoals}/{goals.length} completed</span>
            </div>
            <div className="progress-bar mb-6" style={{ height: '8px' }}>
              <div className="progress-fill" style={{ width: `${(completedGoals / goals.length) * 100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
            </div>
            <div className="space-y-3 mb-6">
              {goals.map(g => (
                <div key={g.id} className={`goal-item ${g.done ? 'goal-done' : ''}`}
                  onClick={() => toggleGoal(g.id)}>
                  <div className={`goal-check ${g.done ? 'goal-check-done' : ''}`}>
                    {g.done && <FiCheck size={14} />}
                  </div>
                  <span>{g.goal}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGoal()}
                placeholder="Add a new goal..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-indigo-500 placeholder-gray-600"
              />
              <button onClick={addGoal} className="submit-btn px-4">
                <FiPlusCircle size={16} /> Add
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            NOTES TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'notes' && (
          <div className="admin-glass-card">
            <div className="section-header mb-6">
              <FiEdit2 className="text-blue-400" size={20} />
              <h2 className="text-white font-black text-xl uppercase tracking-tight">My Learning Notes</h2>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Write your study notes here... Use this space to jot down key concepts, formulas, or anything you want to remember."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-indigo-500 placeholder-gray-600 resize-none"
              style={{ minHeight: '300px' }}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-500 text-xs">{notes.length} characters</span>
              <button onClick={saveNotes} className="submit-btn">
                <FiCheck size={14} /> Save Notes
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PORTFOLIO TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Resume Upload */}
            <div className="admin-glass-card">
              <div className="section-header mb-6">
                <FiUpload className="text-indigo-400" size={20} />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Resume Upload</h2>
              </div>
              <div className="upload-zone" onClick={() => resumeInputRef.current.click()}>
                <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                {resumeUploading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Uploading...</p>
                  </div>
                ) : resumeName ? (
                  <div className="text-center">
                    <FiFileText size={40} className="text-green-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">{resumeName}</p>
                    <p className="text-green-400 text-sm mt-1">✅ Resume Uploaded!</p>
                    <button className="mt-3 text-xs text-gray-500 underline">Replace</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FiUpload size={40} className="text-gray-500 mx-auto mb-3" />
                    <p className="text-white font-semibold">Click to upload Resume</p>
                    <p className="text-gray-500 text-sm mt-1">PDF, DOC, DOCX supported</p>
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio Links */}
            <div className="admin-glass-card">
              <div className="section-header mb-6">
                <FiUser className="text-purple-400" size={20} />
                <h2 className="text-white font-black text-xl uppercase tracking-tight">Student Portfolio</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'GitHub Profile',   placeholder: 'https://github.com/username', icon: '🐙' },
                  { label: 'LinkedIn Profile',  placeholder: 'https://linkedin.com/in/name', icon: '💼' },
                  { label: 'Portfolio Website', placeholder: 'https://yourportfolio.com',    icon: '🌐' },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">
                      {f.icon} {f.label}
                    </label>
                    <input
                      type="url"
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 placeholder-gray-600"
                    />
                  </div>
                ))}
                <button className="submit-btn w-full mt-2"><FiCheck size={14} /> Save Portfolio</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PARENT PORTAL TAB
        ══════════════════════════════════════════════ */}
        {activeTab === 'parent' && (
          <div className="admin-glass-card">
            <div className="section-header mb-8">
              <FiBell className="text-pink-400" size={20} />
              <h2 className="text-white font-black text-xl uppercase tracking-tight">Parent Portal</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-4">Connect Parent / Guardian</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Add your parent or guardian's email to share weekly progress reports, attendance summaries, and achievement updates automatically.
                </p>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-2">Parent Email Address</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={e => setParentEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-pink-500 placeholder-gray-600 mb-4"
                />
                <button onClick={saveParentEmail} className="submit-btn w-full"
                  style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
                  {parentEmailSaved ? <><FiCheck /> Saved!</> : <><FiBell size={14} /> Link Parent Account</>}
                </button>
              </div>
              <div>
                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-4">Progress Summary (Sent to Parent)</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Attendance Rate',    value: `${attendancePct}%`,         icon: '📅' },
                    { label: 'Courses Enrolled',   value: dashboardData.enrolledCourses || 0, icon: '📚' },
                    { label: 'Certificates Earned',value: dashboardData.certificatesCount || 0, icon: '🏆' },
                    { label: 'Current Streak',     value: `${streak} days`,             icon: '🔥' },
                    { label: 'Daily Goal Progress',value: `${completedGoals}/${goals.length}`, icon: '🎯' },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 text-sm">
                      <span className="text-gray-400">{r.icon} {r.label}</span>
                      <span className="text-white font-bold">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

export default StudentDashboard
