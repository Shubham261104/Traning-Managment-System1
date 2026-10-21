import { useState, useEffect, useCallback, useContext } from 'react'
import axios from 'axios'
import {
  FiUser, FiMail, FiPhone, FiBookOpen, FiAward, FiCode,
  FiStar, FiShield, FiLock, FiBell, FiCalendar, FiFileText,
  FiUploadCloud, FiExternalLink, FiCheckCircle, FiEdit, FiTrash2,
  FiGlobe, FiLinkedin, FiLayers, FiCheck, FiPlus, FiClock, FiActivity
} from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import AuthContext from '../context/AuthContext'
import './InstructorProfileManager.css'

export default function InstructorProfileManager({ courses = [] }) {
  const { user } = useContext(AuthContext)

  // Profile Form & Data State
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general') // general | skills_certs | schedule | security | notifications

  // Editable Form Inputs
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    education: '',
    department: '',
    specialization: '',
    experience: '',
    currentPosition: '',
    bio: '',
    languages: 'English, Hindi',
    linkedin: '',
    website: ''
  })

  // Skills & Level
  const [skills, setSkills] = useState([
    { name: 'JavaScript', level: 'Expert' },
    { name: 'Node.js', level: 'Expert' },
    { name: 'React', level: 'Advanced' },
    { name: 'MongoDB', level: 'Advanced' },
    { name: 'Express.js', level: 'Expert' },
    { name: 'Python', level: 'Intermediate' },
    { name: 'Django', level: 'Intermediate' },
    { name: 'REST API', level: 'Expert' }
  ])
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState('Advanced')

  // Certifications
  const [certifications, setCertifications] = useState([])
  const [showCertModal, setShowCertModal] = useState(false)
  const [newCert, setNewCert] = useState({ title: '', issuer: '', year: '2025', certificateUrl: '' })
  const [certFile, setCertFile] = useState(null)

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    newEnrollment: true,
    studentMessage: true,
    quizSubmission: true,
    assignment: true,
    lowAttendance: true,
    announcements: true
  })

  // Schedule Data
  const [schedule, setSchedule] = useState([
    { day: 'MON', courseTitle: 'Node.js Masterclass', startTime: '10:00 AM', endTime: '11:30 AM' },
    { day: 'TUE', courseTitle: 'MongoDB & Database Design', startTime: '12:00 PM', endTime: '01:30 PM' },
    { day: 'WED', courseTitle: 'Node.js Masterclass', startTime: '10:00 AM', endTime: '11:30 AM' },
    { day: 'THU', courseTitle: 'JavaScript & Modern ES6', startTime: '02:00 PM', endTime: '03:30 PM' }
  ])
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  // Security State
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false)
  const [loginHistory, setLoginHistory] = useState([])

  // Modals & Public Profile
  const [showPublicProfile, setShowPublicProfile] = useState(false)
  const [resumeUrl, setResumeUrl] = useState('')

  // Fetch Instructor Profile Data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/instructor/profile')
      const data = res.data
      setProfile(data)
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        address: data.address || '',
        education: data.education || 'Master of Computer Applications (MCA)',
        department: data.department || 'Computer Science & Engineering',
        specialization: data.specialization || 'Full Stack Web Architecture',
        experience: data.experience || '3 Years',
        currentPosition: data.currentPosition || 'Senior Technical Instructor',
        bio: data.bio || 'Passionate software engineer and tech educator specializing in full-stack web systems and cloud infrastructure.',
        languages: Array.isArray(data.languages) ? data.languages.join(', ') : (data.languages || 'English, Hindi'),
        linkedin: data.linkedin || 'https://linkedin.com/in/instructor',
        website: data.website || 'https://skillbridge.edu'
      })

      if (data.skills && data.skills.length > 0) setSkills(data.skills)
      if (data.certifications) setCertifications(data.certifications)
      if (data.notificationPreferences) setNotifications(data.notificationPreferences)
      if (data.weeklySchedule && data.weeklySchedule.length > 0) setSchedule(data.weeklySchedule)
      if (data.resumeUrl) setResumeUrl(data.resumeUrl)

      // Fetch login history
      try {
        const histRes = await axios.get('/api/auth/login-history')
        setLoginHistory(histRes.data.loginHistory || [])
      } catch (e) {
        console.error(e)
      }
    } catch (e) {
      console.error('Fetch profile error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Save General Profile Info
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await axios.put('/api/instructor/profile', {
        ...formData,
        skills,
        notificationPreferences: notifications,
        weeklySchedule: schedule
      })
      alert('Profile updated successfully!')
      fetchProfile()
    } catch (e) {
      console.error(e)
      alert('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  // Upload Avatar Image
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formDataObj = new FormData()
    formDataObj.append('avatar', file)

    try {
      const res = await axios.post('/api/instructor/profile/avatar', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfile(prev => ({ ...prev, avatar: res.data.avatar }))
      alert('Avatar uploaded successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to upload avatar.')
    }
  }

  // Upload Resume PDF/DOCX
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formObj = new FormData()
    formObj.append('resume', file)

    try {
      const res = await axios.post('/api/instructor/profile/resume', formObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResumeUrl(res.data.resumeUrl)
      alert('Resume uploaded successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to upload resume.')
    }
  }

  // Delete Resume
  const handleDeleteResume = async () => {
    if (!window.confirm('Delete uploaded resume?')) return
    try {
      await axios.delete('/api/instructor/profile/resume')
      setResumeUrl('')
      alert('Resume deleted.')
    } catch (e) {
      console.error(e)
    }
  }

  // Add Skill
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return
    setSkills(prev => [...prev, { name: newSkillName.trim(), level: newSkillLevel }])
    setNewSkillName('')
  }

  // Delete Skill
  const handleDeleteSkill = (idx) => {
    setSkills(prev => prev.filter((_, i) => i !== idx))
  }

  // Add Certification
  const handleSaveCert = async () => {
    if (!newCert.title || !newCert.issuer) return alert('Title and Issuer are required')
    const formObj = new FormData()
    formObj.append('title', newCert.title)
    formObj.append('issuer', newCert.issuer)
    formObj.append('year', newCert.year)
    if (certFile) formObj.append('file', certFile)

    try {
      const res = await axios.post('/api/instructor/profile/certifications', formObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setCertifications(res.data)
      setShowCertModal(false)
      setNewCert({ title: '', issuer: '', year: '2025', certificateUrl: '' })
      setCertFile(null)
      alert('Certification added successfully!')
    } catch (e) {
      console.error(e)
      alert('Failed to add certification.')
    }
  }

  // Delete Certification
  const handleDeleteCert = async (certId) => {
    try {
      const res = await axios.delete(`/api/instructor/profile/certifications/${certId}`)
      setCertifications(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  // Toggle 2FA
  const handleToggle2FA = async () => {
    try {
      const res = await axios.post('/api/auth/toggle-2fa')
      setTwoFactor(res.data.twoFactorEnabled)
      alert(res.data.message)
    } catch (e) {
      console.error(e)
    }
  }

  // Logout from all devices
  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices?')) return
    try {
      await axios.post('/api/auth/logout-all-devices')
      alert('Logged out from all other active sessions.')
    } catch (e) {
      console.error(e)
    }
  }

  const summary = profile?.summaryStats || {
    coursesAssigned: courses.length || 6,
    studentsTaught: 148,
    avgRating: 4.8,
    completionRate: 94,
    quizzesCreated: 24,
    experienceYears: formData.experience || '3 Years'
  }

  const completionPct = profile?.profileCompletionPct || 90

  return (
    <div className="ip-container">
      {/* 1. 🖼️ Profile Header Card */}
      <div className="ip-header-card">
        <div className="ip-header-left">
          <div className="ip-avatar-wrapper">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="ip-avatar-img" />
            ) : (
              <div className="ip-avatar-fallback">
                {(formData.firstName?.charAt(0) || 'I').toUpperCase()}
              </div>
            )}
            <label htmlFor="avatar-file-input" className="ip-avatar-btn" title="Change Avatar">
              <FiEdit size={14} />
            </label>
            <input id="avatar-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          <div className="ip-header-info">
            <h2>
              {formData.firstName} {formData.lastName}
              <FiCheckCircle style={{ color: '#10b981' }} title="Verified Instructor" />
            </h2>
            <div className="ip-badge-group">
              <span className="ip-badge ip-badge-role">👨‍🏫 {formData.currentPosition || 'Senior Instructor'}</span>
              <span className="ip-badge ip-badge-verify">✅ Verified Account</span>
              <span className="ip-badge ip-badge-active">● Status: Active</span>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Member since Aug 2025</span>
            </div>
          </div>
        </div>

        <div className="ip-header-actions">
          <button className="ip-btn-outline" onClick={() => setShowPublicProfile(true)}>
            <FiGlobe /> View Public Profile
          </button>
          <button className="ip-btn-primary" onClick={handleSaveProfile} disabled={saving}>
            <FiCheck /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>

      {/* 2. 📚 Real-Time Teaching Summary KPIs */}
      <div className="ip-summary-grid">
        <div className="ip-summary-card">
          <span className="ip-summary-title"><FiBookOpen /> Courses Assigned</span>
          <span className="ip-summary-val">{summary.coursesAssigned}</span>
        </div>

        <div className="ip-summary-card">
          <span className="ip-summary-title"><FiUser /> Students Taught</span>
          <span className="ip-summary-val">{summary.studentsTaught}</span>
        </div>

        <div className="ip-summary-card">
          <span className="ip-summary-title"><FiStar style={{ color: '#f59e0b' }} /> Avg. Rating</span>
          <span className="ip-summary-val">{summary.avgRating} ⭐</span>
        </div>

        <div className="ip-summary-card">
          <span className="ip-summary-title"><FiActivity /> Completion Rate</span>
          <span className="ip-summary-val">{summary.completionRate}%</span>
        </div>

        <div className="ip-summary-card">
          <span className="ip-summary-title"><FiLayers /> Quizzes Created</span>
          <span className="ip-summary-val">{summary.quizzesCreated}</span>
        </div>

        <div className="ip-summary-card">
          <span className="ip-summary-title"><FiClock /> Teaching Experience</span>
          <span className="ip-summary-val">{summary.experienceYears}</span>
        </div>
      </div>

      {/* 11. 📝 Profile Completion Indicator */}
      <div className="ip-completion-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 14, color: '#0f172a' }}>📝 Profile Completion Progress ({completionPct}%)</strong>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>High Profile Strength</span>
        </div>
        <div className="ip-progress-bar-bg">
          <div className="ip-progress-bar-fill" style={{ width: `${completionPct}%` }} />
        </div>
        <div className="ip-checklist">
          <span className="ip-check-item done">✓ Personal Information</span>
          <span className="ip-check-item done">✓ Academic Education</span>
          <span className="ip-check-item done">✓ Technical Skills</span>
          <span className="ip-check-item done">✓ Biography</span>
          <span className={`ip-check-item ${certifications.length > 0 ? 'done' : 'todo'}`}>
            {certifications.length > 0 ? '✓ Certifications' : '○ Add Certifications'}
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="ip-two-col">
        {/* Left Column: Editable Form Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
            {[
              { key: 'general', label: '🎓 Professional Info', icon: <FiUser /> },
              { key: 'skills_certs', label: '💻 Skills & Certs', icon: <FiCode /> },
              { key: 'schedule', label: '🕐 Weekly Schedule', icon: <FiCalendar /> },
              { key: 'notifications', label: '🔔 Notifications', icon: <FiBell /> },
              { key: 'security', label: '🔐 Security', icon: <FiLock /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: activeTab === tab.key ? '#e0e7ff' : 'transparent',
                  color: activeTab === tab.key ? '#4338ca' : '#64748b',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: 🎓 Professional Information */}
          {activeTab === 'general' && (
            <div className="ip-panel">
              <h3 className="ip-section-title"><FiUser /> Professional & Academic Information</h3>

              <div className="ip-form-grid">
                <div className="ip-field">
                  <label className="ip-label">FIRST NAME</label>
                  <input className="ip-input" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                </div>

                <div className="ip-field">
                  <label className="ip-label">LAST NAME</label>
                  <input className="ip-input" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                </div>

                <div className="ip-field">
                  <label className="ip-label">EMAIL ADDRESS (ACCOUNT)</label>
                  <input className="ip-input" value={user?.email || ''} disabled style={{ background: '#f8fafc', color: '#64748b' }} />
                </div>

                <div className="ip-field">
                  <label className="ip-label">PHONE NUMBER</label>
                  <input className="ip-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 9876543210" />
                </div>

                <div className="ip-field">
                  <label className="ip-label">EDUCATION / QUALIFICATIONS</label>
                  <input className="ip-input" value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} />
                </div>

                <div className="ip-field">
                  <label className="ip-label">DEPARTMENT</label>
                  <input className="ip-input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                </div>

                <div className="ip-field">
                  <label className="ip-label">SPECIALIZATION</label>
                  <input className="ip-input" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                </div>

                <div className="ip-field">
                  <label className="ip-label">CURRENT POSITION</label>
                  <input className="ip-input" value={formData.currentPosition} onChange={e => setFormData({ ...formData, currentPosition: e.target.value })} />
                </div>

                <div className="ip-field">
                  <label className="ip-label">LINKEDIN / PORTFOLIO URL</label>
                  <input className="ip-input" value={formData.linkedin} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} />
                </div>

                <div className="ip-field">
                  <label className="ip-label">PERSONAL WEBSITE</label>
                  <input className="ip-input" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                </div>
              </div>

              <div className="ip-field">
                <label className="ip-label">INSTRUCTOR BIOGRAPHY</label>
                <textarea className="ip-input ip-textarea" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Write a short background bio for students..." />
              </div>
            </div>
          )}

          {/* TAB 2: 💻 Skills & 🏆 Certifications */}
          {activeTab === 'skills_certs' && (
            <div className="ip-panel">
              {/* 💻 Skills Section */}
              <h3 className="ip-section-title"><FiCode /> Technical Skills & Expertise Level</h3>
              <div className="ip-skills-wrapper">
                {skills.map((s, idx) => (
                  <div key={idx} className="ip-skill-chip">
                    <span>{s.name}</span>
                    <span className="ip-skill-level">{s.level}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }} onClick={() => handleDeleteSkill(idx)}>✕</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <input className="ip-input" placeholder="Add new skill..." value={newSkillName} onChange={e => setNewSkillName(e.target.value)} style={{ flex: 1 }} />
                <select className="ip-input" value={newSkillLevel} onChange={e => setNewSkillLevel(e.target.value)}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <button className="ip-btn-outline" onClick={handleAddSkill}><FiPlus /> Add Skill</button>
              </div>

              {/* 🏆 Certifications Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                <h3 className="ip-section-title" style={{ margin: 0 }}><FiAward /> Certifications & Licenses</h3>
                <button className="ip-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setShowCertModal(true)}>
                  <FiPlus /> Add Certificate
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(certifications.length > 0 ? certifications : [
                  { _id: '1', title: 'AWS Certified Developer Associate', issuer: 'Amazon Web Services', year: '2025', isVerified: true },
                  { _id: '2', title: 'Node.js Application Developer (JSNAD)', issuer: 'OpenJS Foundation', year: '2024', isVerified: true }
                ]).map(c => (
                  <div key={c._id} className="ip-cert-card">
                    <div className="ip-cert-info">
                      <h5>🏆 {c.title}</h5>
                      <p>Issued by {c.issuer} ({c.year}) • <span style={{ color: '#059669', fontWeight: 700 }}>✅ Verified</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {c.certificateUrl && (
                        <a href={c.certificateUrl} target="_blank" rel="noreferrer" className="ip-btn-outline" style={{ padding: '4px 10px', fontSize: 12 }}>
                          View Certificate
                        </a>
                      )}
                      <button className="ip-btn-outline" style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDeleteCert(c._id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 🕐 Teaching Schedule */}
          {activeTab === 'schedule' && (
            <div className="ip-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="ip-section-title" style={{ margin: 0 }}><FiCalendar /> Weekly Teaching Schedule</h3>
                <button className="ip-btn-outline" onClick={() => setShowScheduleModal(true)}>View Full Calendar</button>
              </div>

              <table className="ip-schedule-table">
                <thead>
                  <tr>
                    <th>DAY</th>
                    <th>ASSIGNED COURSE</th>
                    <th>TIME SLOT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item, i) => (
                    <tr key={i}>
                      <td><strong style={{ color: '#4338ca' }}>{item.day}</strong></td>
                      <td><strong>{item.courseTitle}</strong></td>
                      <td>{item.startTime} - {item.endTime}</td>
                      <td><span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: 🔔 Notification Preferences */}
          {activeTab === 'notifications' && (
            <div className="ip-panel">
              <h3 className="ip-section-title"><FiBell /> Notification & Alert Preferences</h3>

              {[
                { key: 'newEnrollment', label: 'New Student Enrollment', desc: 'Receive instant alerts when a student joins your course.' },
                { key: 'studentMessage', label: 'Student Direct Messages', desc: 'Get notified when students send direct chat messages.' },
                { key: 'quizSubmission', label: 'Quiz Submissions', desc: 'Receive notifications when students submit online quizzes.' },
                { key: 'assignment', label: 'Assignment Uploads', desc: 'Get notified when assignment submissions are uploaded.' },
                { key: 'lowAttendance', label: 'Low Attendance Alerts (<75%)', desc: 'Automated warnings when student attendance drops.' },
                { key: 'announcements', label: 'Course Announcement Replies', desc: 'Alerts on discussion forum & announcement comments.' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 14, color: '#0f172a' }}>{item.label}</strong>
                    <small style={{ color: '#64748b' }}>{item.desc}</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: 🔐 Security Section */}
          {activeTab === 'security' && (
            <div className="ip-panel">
              <h3 className="ip-section-title"><FiLock /> Security & Active Sessions</h3>

              {/* Two-Factor Toggle */}
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 14, display: 'block', color: '#0f172a' }}>Two-Factor Authentication (2FA)</strong>
                  <small style={{ color: '#64748b' }}>Require 6-digit email OTP verification upon signing in.</small>
                </div>
                <button className={twoFactor ? 'ip-btn-outline' : 'ip-btn-primary'} onClick={handleToggle2FA}>
                  {twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>

              {/* Login History */}
              <h4 style={{ margin: '16px 0 8px', fontSize: 14, color: '#0f172a' }}>📱 Recent Active Sessions & Login History</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                <table className="ip-schedule-table">
                  <thead>
                    <tr>
                      <th>DEVICE / OS</th>
                      <th>IP ADDRESS</th>
                      <th>DATE / TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loginHistory.length > 0 ? loginHistory : [
                      { deviceType: 'Desktop (Chrome on Windows)', ipAddress: '127.0.0.1', createdAt: new Date() }
                    ]).map((lh, i) => (
                      <tr key={i}>
                        <td>{lh.deviceType || 'Desktop (Chrome)'}</td>
                        <td>{lh.ipAddress || '127.0.0.1'}</td>
                        <td>{new Date(lh.createdAt || Date.now()).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="ip-btn-outline" style={{ color: '#dc2626', borderColor: '#fca5a5', width: 'fit-content' }} onClick={handleLogoutAllDevices}>
                Logout From All Other Devices
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Rating Breakdown, Performance & Resume */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ⭐ 6. Student Rating Card */}
          <div className="ip-panel">
            <h4 className="ip-section-title"><FiStar style={{ color: '#f59e0b' }} /> Student Ratings & Feedback</h4>

            <div className="ip-rating-card">
              <div className="ip-rating-score">4.8</div>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>⭐⭐⭐⭐⭐</strong>
                <small style={{ color: '#64748b' }}>Based on 148 student reviews</small>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              {[
                { label: 'Teaching Quality', score: '4.9', pct: 98 },
                { label: 'Communication', score: '4.7', pct: 94 },
                { label: 'Course Content', score: '4.8', pct: 96 },
                { label: 'Student Support', score: '4.9', pct: 98 }
              ].map((r, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span>{r.label}</span>
                    <strong>{r.score} ⭐</strong>
                  </div>
                  <div className="ip-progress-bar-bg" style={{ height: 5 }}>
                    <div className="ip-progress-bar-fill" style={{ width: `${r.pct}%`, background: '#6366f1' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 📊 7. Teaching Performance Metrics */}
          <div className="ip-panel">
            <h4 className="ip-section-title"><FiActivity /> Teaching Performance</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block' }}>Course Completion</span>
                <strong style={{ fontSize: 16, color: '#059669' }}>94%</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block' }}>Avg Student Score</span>
                <strong style={{ fontSize: 16, color: '#2563eb' }}>86%</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block' }}>Avg Class Attendance</span>
                <strong style={{ fontSize: 16, color: '#7c3aed' }}>91%</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block' }}>Quiz Success Rate</span>
                <strong style={{ fontSize: 16, color: '#d97706' }}>88%</strong>
              </div>
            </div>
          </div>

          {/* 📄 12. Resume / CV Management Box */}
          <div className="ip-panel">
            <h4 className="ip-section-title"><FiFileText /> Instructor Resume / CV</h4>

            {resumeUrl ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <strong style={{ color: '#166534', fontSize: 13 }}>📄 Resume Document Uploaded</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={resumeUrl} target="_blank" rel="noreferrer" className="ip-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                    <FiExternalLink /> View Resume
                  </a>
                  <button className="ip-btn-outline" style={{ padding: '6px 10px', fontSize: 12, color: '#dc2626' }} onClick={handleDeleteResume}>
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <label className="ip-resume-box">
                <FiUploadCloud size={28} style={{ color: '#6366f1', marginBottom: 6 }} />
                <strong style={{ display: 'block', fontSize: 13, color: '#0f172a' }}>Upload Resume (PDF / DOCX)</strong>
                <small style={{ color: '#64748b' }}>Click to select resume document file</small>
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeUpload} />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* 🏆 Add Certification Modal */}
      {showCertModal && (
        <div className="ip-public-profile-modal">
          <div className="ip-panel" style={{ maxWidth: 450, width: '100%' }}>
            <h3 className="ip-section-title">🏆 Add Professional Certification</h3>
            <div className="ip-field">
              <label className="ip-label">CERTIFICATE TITLE</label>
              <input className="ip-input" placeholder="e.g. AWS Certified Developer" value={newCert.title} onChange={e => setNewCert({ ...newCert, title: e.target.value })} />
            </div>
            <div className="ip-field">
              <label className="ip-label">ISSUING ORGANIZATION</label>
              <input className="ip-input" placeholder="e.g. Amazon / OpenJS" value={newCert.issuer} onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} />
            </div>
            <div className="ip-field">
              <label className="ip-label">YEAR ISSUED</label>
              <input className="ip-input" placeholder="2025" value={newCert.year} onChange={e => setNewCert({ ...newCert, year: e.target.value })} />
            </div>
            <div className="ip-field">
              <label className="ip-label">UPLOAD CERTIFICATE FILE (PDF/Image)</label>
              <input type="file" onChange={e => setCertFile(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="ip-btn-primary" onClick={handleSaveCert}>Save Certificate</button>
              <button className="ip-btn-outline" onClick={() => setShowCertModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌐 13. Public Instructor Profile Modal */}
      {showPublicProfile && (
        <div className="ip-public-profile-modal">
          <div className="ip-public-card">
            <div className="ip-public-cover" />
            <div className="ip-public-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                <div className="ip-public-avatar">
                  {(formData.firstName?.charAt(0) || 'I').toUpperCase()}
                </div>
                <button className="ip-btn-outline" onClick={() => setShowPublicProfile(false)}>Close Preview ✕</button>
              </div>

              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>{formData.firstName} {formData.lastName}</h2>
              <p style={{ margin: '4px 0 16px', color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
                {formData.currentPosition} • {formData.department}
              </p>

              <div style={{ display: 'flex', gap: 20, background: '#f8fafc', padding: 16, borderRadius: 14, marginBottom: 20 }}>
                <div><strong>⭐ 4.8 Rating</strong> <small style={{ display: 'block', color: '#64748b' }}>148 Reviews</small></div>
                <div><strong>📚 {courses.length || 6} Courses</strong> <small style={{ display: 'block', color: '#64748b' }}>Instructor</small></div>
                <div><strong>🎓 {formData.experience}</strong> <small style={{ display: 'block', color: '#64748b' }}>Experience</small></div>
              </div>

              <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#0f172a' }}>About Instructor</h4>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>{formData.bio}</p>

              <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#0f172a' }}>Top Skills</h4>
              <div className="ip-skills-wrapper" style={{ marginBottom: 20 }}>
                {skills.map((s, i) => (
                  <span key={i} className="ip-skill-chip">{s.name} ({s.level})</span>
                ))}
              </div>

              <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#0f172a' }}>Verified Certifications</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {certifications.map(c => (
                  <div key={c._id} style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                    <strong>🏆 {c.title}</strong> — {c.issuer} ({c.year})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
