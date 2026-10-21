import { useState, useEffect, useCallback, useContext } from 'react'
import axios from 'axios'
import {
  FiUsers, FiCheckCircle, FiXCircle, FiClock, FiPercent, FiAlertTriangle,
  FiCalendar, FiDownload, FiSend, FiSearch, FiFilter, FiRefreshCw,
  FiAward, FiActivity, FiFileText, FiEdit3, FiInfo, FiCheck, FiPieChart, FiTrendingUp
} from 'react-icons/fi'
import { BsQrCode as FiQrCode } from 'react-icons/bs'
import AuthContext from '../context/AuthContext'
import './AttendanceManager.css'

export default function AttendanceManager({ courses = [] }) {
  const { user } = useContext(AuthContext)
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin'

  // State
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?._id || '')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [sessionData, setSessionData] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Overview & Analytics State
  const [overview, setOverview] = useState({
    totalStudents: 32,
    presentToday: 27,
    absentToday: 5,
    lateToday: 2,
    avgAttendancePercent: 84,
    lowAttendanceCount: 3,
    totalClassesConducted: 18,
    lowAttendanceStudents: []
  })
  const [analytics, setAnalytics] = useState(null)
  const [history, setHistory] = useState([])

  // Modals
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [qrTimer, setQrTimer] = useState(300) // 5 minutes
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null)
  const [auditReason, setAuditReason] = useState('')

  // Rule settings
  const lateGraceMinutes = 10
  const minRequiredAttendance = 75

  // Fetch KPI Overview
  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get('/api/attendance/overview')
      setOverview(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Fetch Session Data
  const fetchSession = useCallback(async () => {
    if (!selectedCourse) return
    try {
      setLoading(true)
      const res = await axios.get('/api/attendance/session', {
        params: { courseId: selectedCourse, date: selectedDate }
      })
      setSessionData(res.data)
      setRecords(res.data.records || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedCourse, selectedDate])

  // Fetch Analytics & History
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get('/api/attendance/analytics')
      setAnalytics(res.data)
      const histRes = await axios.get('/api/attendance/history')
      setHistory(histRes.data || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
    fetchAnalytics()

    // Real-time automatic polling every 5 seconds
    const pollInterval = setInterval(() => {
      fetchOverview()
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [fetchOverview, fetchAnalytics])

  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0]._id)
    }
  }, [courses, selectedCourse])

  useEffect(() => {
    fetchSession()

    // Real-time session refresh polling every 5 seconds
    const sessionInterval = setInterval(() => {
      fetchSession()
    }, 5000)

    return () => clearInterval(sessionInterval)
  }, [fetchSession])

  // Mark single student status
  const handleStatusChange = (studentId, status) => {
    setRecords(prev => prev.map(r => {
      const sId = r.student?._id || r.student
      if (sId === studentId) {
        return {
          ...r,
          status,
          joinedAt: status === 'present' || status === 'late' ? new Date() : null,
          lateMinutes: status === 'late' ? 15 : 0
        }
      }
      return r
    }))
  }

  // Remark change
  const handleRemarkChange = (studentId, remark) => {
    setRecords(prev => prev.map(r => {
      const sId = r.student?._id || r.student
      if (sId === studentId) {
        return { ...r, remark }
      }
      return r
    }))
  }

  // Bulk Actions
  const handleMarkAllPresent = () => {
    setRecords(prev => prev.map(r => ({
      ...r,
      status: 'present',
      joinedAt: new Date()
    })))
  }

  const handleResetAttendance = () => {
    if (sessionData) {
      setRecords(sessionData.records || [])
    }
  }

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedCourse) return
    setSaving(true)
    try {
      await axios.post('/api/attendance/save', {
        courseId: selectedCourse,
        classDate: selectedDate,
        records,
        auditReason: auditReason || 'Manual class attendance save'
      })
      alert('Attendance saved successfully! Real-time MongoDB updated.')
      fetchOverview()
      fetchSession()
      fetchAnalytics()
    } catch (e) {
      console.error(e)
      alert('Failed to save attendance.')
    } finally {
      setSaving(false)
    }
  }

  // Generate QR Code Attendance Session
  const handleGenerateQR = async () => {
    try {
      const res = await axios.post('/api/attendance/qr/generate', {
        courseId: selectedCourse,
        validMinutes: 5
      })
      setQrData(res.data)
      setQrTimer(300)
      setShowQRModal(true)
    } catch (e) {
      console.error(e)
    }
  }

  // Send Warning Message to Student with Low Attendance
  const handleSendWarning = async (studentId, studentName, currentPct) => {
    const courseObj = courses.find(c => c._id === selectedCourse)
    const courseTitle = courseObj?.title || 'Node.js'
    try {
      await axios.post('/api/attendance/warning', {
        studentId,
        courseTitle,
        attendancePct: currentPct
      })
      alert(`⚠️ Attendance warning successfully sent to ${studentName}!`)
    } catch (e) {
      console.error(e)
    }
  }

  // View Student Profile
  const handleOpenStudentProfile = async (studentId) => {
    try {
      const res = await axios.get(`/api/attendance/student-profile/${studentId}`)
      setSelectedStudentProfile(res.data)
      setShowProfileModal(true)
    } catch (e) {
      console.error(e)
    }
  }

  // Export CSV Report
  const handleExportReport = async () => {
    try {
      const response = await axios.get('/api/attendance/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Attendance_Report_${selectedDate}.csv`)
      document.body.appendChild(link)
      link.click()
    } catch (e) {
      console.error(e)
    }
  }

  // Filtered roster list
  const filteredRecords = records.filter(r => {
    const name = `${r.student?.profile?.firstName || ''} ${r.student?.profile?.lastName || ''}`.toLowerCase()
    const email = (r.student?.email || '').toLowerCase()
    const matchesQuery = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesQuery && matchesStatus
  })

  // Mock Calendar Heatmap Days (30 Days)
  const heatmapDays = Array.from({ length: 28 }, (_, i) => {
    const dayNum = i + 1
    const pct = Math.floor(Math.sin(i) * 20 + 82)
    const type = pct >= 88 ? 'high' : pct >= 75 ? 'med' : 'low'
    return { day: dayNum, pct, type }
  })

  const currentCourseObj = courses.find(c => c._id === selectedCourse)
  const isNonLiveBatch = currentCourseObj && currentCourseObj.deliveryType && currentCourseObj.deliveryType !== 'LIVE_CLASS'

  return (
    <div className="att-container">
      {/* 1. Header Title & Top Controls */}
      <div className="att-header">
        <div className="att-title-group">
          <h2>📅 Attendance Management System</h2>
          <p>Real-time class roster, automated QR check-in, low attendance alerts & analytics</p>
        </div>

        <div className="att-header-actions">
          <button className="att-btn-outline" onClick={handleExportReport}>
            <FiDownload /> Export CSV
          </button>
          {isInstructor && !isNonLiveBatch && (
            <button className="att-btn-primary" onClick={handleGenerateQR}>
              <FiQrCode /> Generate QR Attendance
            </button>
          )}
        </div>
      </div>

      {/* 2. Real-Time Overview KPI Cards */}
      <div className="att-kpi-grid">
        <div className="att-kpi-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <span className="att-kpi-title"><FiUsers /> Total Students</span>
          <span className="att-kpi-value" style={{ color: '#4338ca' }}>{overview.totalStudents}</span>
        </div>

        <div className="att-kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="att-kpi-title"><FiCheckCircle /> Present Today</span>
          <span className="att-kpi-value" style={{ color: '#059669' }}>{isNonLiveBatch ? 'N/A' : overview.presentToday}</span>
        </div>

        <div className="att-kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="att-kpi-title"><FiXCircle /> Absent Today</span>
          <span className="att-kpi-value" style={{ color: '#dc2626' }}>{isNonLiveBatch ? 'N/A' : overview.absentToday}</span>
        </div>

        <div className="att-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="att-kpi-title"><FiClock /> Late Students</span>
          <span className="att-kpi-value" style={{ color: '#d97706' }}>{isNonLiveBatch ? 'N/A' : overview.lateToday}</span>
        </div>

        <div className="att-kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="att-kpi-title"><FiPercent /> Avg Attendance</span>
          <span className="att-kpi-value" style={{ color: '#2563eb' }}>{isNonLiveBatch ? 'N/A' : `${overview.avgAttendancePercent}%`}</span>
        </div>

        <div className="att-kpi-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="att-kpi-title"><FiAlertTriangle /> Below 75% Alert</span>
          <span className="att-kpi-value" style={{ color: '#b91c1c' }}>{isNonLiveBatch ? 'N/A' : overview.lowAttendanceCount}</span>
        </div>
      </div>

      {/* 3. Toolbar Row (Course, Date, Search, Actions) */}
      <div className="att-toolbar">
        <div className="att-filter-group">
          <div>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4 }}>COURSE</label>
            <select className="att-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => (
                <option key={c._id} value={c._id}>
                  📚 {c.title} ({c.deliveryType || 'LIVE_CLASS'})
                </option>
              ))}
            </select>
          </div>

          {!isNonLiveBatch && (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4 }}>DATE</label>
                <input type="date" className="att-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4 }}>SEARCH</label>
                <input className="att-input" placeholder="Search student name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 4 }}>STATUS</label>
                <select className="att-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Bulk Action Buttons */}
        {!isNonLiveBatch && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="att-btn-outline" onClick={handleMarkAllPresent} title="Mark All Students Present">
              ⚡ Mark All Present
            </button>
            <button className="att-btn-outline" onClick={handleResetAttendance}>
              <FiRefreshCw /> Reset
            </button>
            <button className="att-btn-success" onClick={handleSaveAttendance} disabled={saving}>
              <FiCheck /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        )}
      </div>

      {/* 4. Main Section Layout Grid */}
      <div className="att-main-layout">
        {/* Left Column: Student Roster Table or Non-Live Notice */}
        {isNonLiveBatch ? (
          <div className="att-panel" style={{ padding: '50px 24px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#2563eb', border: '1px solid #bfdbfe' }}>
              <FiInfo size={36} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
              Attendance is not applicable for this batch.
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.6 }}>
              This course is configured as a <strong>{currentCourseObj.deliveryType === 'RECORDED' ? 'Recorded Video' : 'Material Based'}</strong> batch. Traditional attendance tracking is restricted to Live Classes. Student progress is automatically tracked through content completion, assignments, and quizzes.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 30, fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
              <span>Delivery Type: <strong style={{ color: '#2563eb' }}>{currentCourseObj.deliveryType}</strong></span>
            </div>
          </div>
        ) : (
          <div className="att-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              🧑‍🎓 Student Roster ({filteredRecords.length})
            </h3>
            {sessionData?.auditLogs?.length > 0 && (
              <button className="att-btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setShowAuditModal(true)}>
                <FiFileText /> Edit Audit Logs ({sessionData.auditLogs.length})
              </button>
            )}
          </div>

          {/* Roster Table */}
          <div className="att-table-container">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Attendance Status</th>
                  <th>Remarks / Notes</th>
                  <th>Join Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(rec => {
                  const student = rec.student
                  const sId = student?._id || student
                  const name = `${student?.profile?.firstName || 'Student'} ${student?.profile?.lastName || ''}`.trim()
                  const email = student?.email || 'student@example.com'

                  return (
                    <tr key={sId}>
                      {/* Name & Email */}
                      <td>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>{name}</strong>
                        <small style={{ color: '#64748b' }}>{email}</small>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td>
                        <div className="att-status-btn-group">
                          <button
                            className={`att-status-btn${rec.status === 'present' ? ' active present' : ''}`}
                            onClick={() => handleStatusChange(sId, 'present')}
                          >
                            Present
                          </button>
                          <button
                            className={`att-status-btn${rec.status === 'absent' ? ' active absent' : ''}`}
                            onClick={() => handleStatusChange(sId, 'absent')}
                          >
                            Absent
                          </button>
                          <button
                            className={`att-status-btn${rec.status === 'late' ? ' active late' : ''}`}
                            onClick={() => handleStatusChange(sId, 'late')}
                          >
                            Late
                          </button>
                          <button
                            className={`att-status-btn${rec.status === 'excused' ? ' active excused' : ''}`}
                            onClick={() => handleStatusChange(sId, 'excused')}
                          >
                            Excused
                          </button>
                        </div>
                      </td>

                      {/* Remark Input */}
                      <td>
                        <input
                          className="att-input"
                          style={{ padding: '5px 10px', fontSize: '0.82rem', width: 140 }}
                          placeholder="Add remark..."
                          value={rec.remark || ''}
                          onChange={e => handleRemarkChange(sId, e.target.value)}
                        />
                      </td>

                      {/* Join Method Badge */}
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: rec.joinMethod === 'qr' ? '#e0e7ff' : rec.joinMethod === 'live_whiteboard' ? '#dcfce7' : '#f1f5f9', color: rec.joinMethod === 'qr' ? '#4338ca' : rec.joinMethod === 'live_whiteboard' ? '#15803d' : '#475569' }}>
                          {rec.joinMethod === 'qr' ? '📱 QR Code' : rec.joinMethod === 'live_whiteboard' ? '🎥 Live Whiteboard' : '✍️ Manual'}
                        </span>
                      </td>

                      {/* Action */}
                      <td>
                        <button style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: 12 }} onClick={() => handleOpenStudentProfile(sId)}>
                          Profile →
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                      No student records found for selected course & filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Right Column: Low Attendance Alerts & Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Low Attendance Warning Panel */}
          <div className="att-panel" style={{ borderLeft: '4px solid #ef4444' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiAlertTriangle /> ⚠️ Low Attendance Alerts (&lt; 75%)
            </h4>

            {overview.lowAttendanceStudents.map(student => (
              <div key={student.studentId} className="att-alert-item">
                <div>
                  <strong>{student.name}</strong>
                  <small>{student.email}</small>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="att-alert-badge">{student.attendancePct}%</span>
                  <button className="att-btn-outline" style={{ padding: '4px 8px', fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => handleSendWarning(student.studentId, student.name, student.attendancePct)}>
                    <FiSend /> Warn
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Attendance + Quiz Performance Correlation */}
          <div className="att-panel">
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiTrendingUp /> Attendance vs Quiz Performance
            </h4>

            {(analytics?.performanceCorrelation || [
              { attendanceBucket: '90-100%', avgQuizScore: 92 },
              { attendanceBucket: '80-89%', avgQuizScore: 85 },
              { attendanceBucket: '70-79%', avgQuizScore: 68 },
              { attendanceBucket: '< 70%', avgQuizScore: 49 }
            ]).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Attendance {item.attendanceBucket}</span>
                <strong style={{ color: item.avgQuizScore >= 75 ? '#059669' : '#dc2626' }}>
                  Quiz Avg: {item.avgQuizScore}%
                </strong>
              </div>
            ))}
          </div>

          {/* 30-Day Monthly Calendar Heatmap */}
          <div className="att-panel">
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              📆 Monthly Attendance Heatmap
            </h4>

            <div className="att-heatmap-grid">
              {heatmapDays.map(d => (
                <div key={d.day} className={`att-heatmap-cell ${d.type}`} title={`Day ${d.day}: ${d.pct}% attendance`}>
                  {d.day}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#64748b', fontWeight: 700 }}>
              <span>🟢 High (&ge;88%)</span>
              <span>🟡 Med (&ge;75%)</span>
              <span>🔴 Low (&lt;75%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && qrData && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 420, textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>📱 Scan QR for Live Attendance</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 16px' }}>Students scan this QR code with their mobile device to register present.</p>

            <div className="att-qr-box">
              <img src={qrData.qrUrl} alt="QR Code" className="att-qr-img" />
              <p style={{ fontSize: 12, fontWeight: 800, color: '#4338ca', marginTop: 12 }}>Code: {qrData.qrToken}</p>
            </div>

            <div style={{ background: '#fef3c7', color: '#b45309', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, marginBottom: 16 }}>
              ⏰ Valid for 5 Minutes (Auto-expires)
            </div>

            <button className="att-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowQRModal(false)}>
              Close QR Session
            </button>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudentProfile && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>👤 Student Attendance Profile</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setShowProfileModal(false)}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: 16, color: '#0f172a' }}>{selectedStudentProfile.student?.name}</h4>
              <small style={{ color: '#64748b' }}>{selectedStudentProfile.student?.email}</small>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, fontWeight: 800 }}>
                <span style={{ color: '#059669' }}>Overall: {selectedStudentProfile.student?.overallPct}%</span>
                <span style={{ color: '#15803d' }}>Present: {selectedStudentProfile.student?.totalPresent}</span>
                <span style={{ color: '#b91c1c' }}>Absent: {selectedStudentProfile.student?.totalAbsent}</span>
              </div>
            </div>

            <h5 style={{ margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', color: '#64748b' }}>Course-wise Attendance Breakdown</h5>
            {selectedStudentProfile.courseBreakdown?.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                <strong>{c.courseTitle}</strong>
                <span style={{ fontWeight: 800, color: c.attendancePct >= 75 ? '#059669' : '#dc2626' }}>{c.attendancePct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && sessionData && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 550 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📜 Attendance Edit Audit Log</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setShowAuditModal(false)}>✕</button>
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {sessionData.auditLogs?.map((log, idx) => (
                <div key={idx} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <span>{log.oldStatus?.toUpperCase()} &rarr; {log.newStatus?.toUpperCase()}</span>
                    <small style={{ color: '#64748b' }}>{new Date(log.timestamp).toLocaleString()}</small>
                  </div>
                  <p style={{ margin: '4px 0 0', color: '#475569' }}>Reason: {log.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
