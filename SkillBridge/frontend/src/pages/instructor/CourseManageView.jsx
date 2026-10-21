import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  FiUsers, FiCalendar, FiFile, FiVideo, FiLink, FiPlus, FiTrash2,
  FiClock, FiStar, FiSlash, FiCheck, FiX, FiBarChart2, FiEdit3,
  FiBookOpen, FiUploadCloud, FiAward, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi'

export default function CourseManageView({ courseId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('students') // 'students' | 'attendance' | 'materials' | 'settings'
  const [msg, setMsg] = useState({ type: '', text: '' })

  // Course Details edit state
  const [courseForm, setCourseForm] = useState({ thumbnail: '', difficulty: 'Intermediate', status: 'active' })
  const [updatingCourse, setUpdatingCourse] = useState(false)

  // Attendance state
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10))
  const [attState, setAttState] = useState({}) // studentId -> status ('present', 'absent', 'late')
  const [attNotes, setAttNotes] = useState({})
  const [savingAtt, setSavingAtt] = useState(false)

  // Rate modal/state
  const [ratingStudent, setRatingStudent] = useState(null) // studentObj
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingNotes, setRatingNotes] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  // Material upload state
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialForm, setMaterialForm] = useState({
    title: '', url: '', type: 'pdf', description: '', uploadMethod: 'file', scheduledAt: new Date().toISOString().slice(0, 16)
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingMat, setUploadingMat] = useState(false)

  const showNotification = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const fetchCourseManagementData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/instructor/courses/${courseId}/manage`)
      setData(res.data)
      if (res.data.course) {
        setCourseForm({
          thumbnail: res.data.course.thumbnail || '',
          difficulty: res.data.course.difficulty || 'Intermediate',
          status: res.data.course.status || 'active'
        })
      }
    } catch (err) {
      console.error('Failed to load course details:', err)
      showNotification('error', err.response?.data?.message || 'Failed to load course management data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (courseId) {
      fetchCourseManagementData()
    }
  }, [courseId])

  // Update Course Thumbnail & Difficulty
  const handleUpdateCourseDetails = async (e) => {
    e.preventDefault()
    try {
      setUpdatingCourse(true)
      await axios.put(`/api/instructor/courses/${courseId}/details`, courseForm)
      showNotification('success', 'Course details updated successfully!')
      fetchCourseManagementData()
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to update course details.')
    } finally {
      setUpdatingCourse(false)
    }
  }

  // Block Student for 2 Days (NO UNBLOCK option as strictly requested)
  const handleBlockStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to BLOCK ${studentName} from this course for 2 DAYS? The student will be restricted for 48 hours.`)) {
      return
    }
    try {
      const res = await axios.post(`/api/instructor/courses/${courseId}/students/${studentId}/block`)
      showNotification('success', res.data.message || `${studentName} has been blocked for 2 days.`)
      fetchCourseManagementData()
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to block student.')
    }
  }

  // Submit Rating for Student
  const handleSaveRating = async (e) => {
    e.preventDefault()
    if (!ratingStudent) return
    try {
      setSubmittingRating(true)
      await axios.post(`/api/instructor/courses/${courseId}/students/${ratingStudent.student._id}/rate`, {
        rating: ratingScore,
        notes: ratingNotes
      })
      showNotification('success', `Rating saved for ${ratingStudent.student?.profile?.firstName || 'Student'}!`)
      setRatingStudent(null)
      fetchCourseManagementData()
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to submit rating.')
    } finally {
      setSubmittingRating(false)
    }
  }

  // Mark Attendance
  const handleMarkAttendance = async (studentId, status) => {
    try {
      setAttState(prev => ({ ...prev, [studentId]: status }))
      await axios.post(`/api/instructor/courses/${courseId}/attendance`, {
        studentId,
        status,
        classDate: attDate,
        notes: attNotes[studentId] || ''
      })
      showNotification('success', 'Attendance marked!')
      fetchCourseManagementData()
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to mark attendance.')
    }
  }

  // Material Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const ext = file.name.split('.').pop().toLowerCase()
      let detectedType = 'document'
      if (ext === 'pdf') {
        detectedType = 'pdf'
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
        detectedType = 'video'
      }
      setMaterialForm(prev => ({ ...prev, type: detectedType, title: file.name }))
    }
  }

  const handleUploadMaterial = async (e) => {
    e.preventDefault()
    try {
      setUploadingMat(true)
      const formData = new FormData()
      if (materialForm.uploadMethod === 'file' && selectedFile) {
        formData.append('file', selectedFile)
        formData.append('title', materialForm.title || selectedFile.name)
        formData.append('type', materialForm.type)
        formData.append('description', materialForm.description)
      } else {
        formData.append('title', materialForm.title)
        formData.append('url', materialForm.url)
        formData.append('type', materialForm.type)
        formData.append('description', materialForm.description)
      }
      formData.append('scheduledAt', materialForm.scheduledAt)

      await axios.post(`/api/instructor/courses/${courseId}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showNotification('success', 'Material uploaded successfully from system!')
      setShowMaterialModal(false)
      setSelectedFile(null)
      setMaterialForm({ title: '', url: '', type: 'pdf', description: '', uploadMethod: 'file', scheduledAt: new Date().toISOString().slice(0, 16) })
      fetchCourseManagementData()
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to upload material.')
    } finally {
      setUploadingMat(false)
    }
  }

  const handleDeleteMaterial = async (index) => {
    if (!window.confirm('Delete this material from course?')) return
    try {
      await axios.delete(`/api/instructor/courses/${courseId}/materials/${index}`)
      showNotification('success', 'Material deleted!')
      fetchCourseManagementData()
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to delete material.')
    }
  }

  if (loading) {
    return (
      <div className="admin-glass-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Course Control Hub...</p>
      </div>
    )
  }

  const course = data?.course || {}
  const students = data?.students || []
  const materials = course?.materials || []

  return (
    <div className="bg-white text-slate-800 p-6 md:p-8 rounded-3xl min-h-screen border border-slate-200 shadow-2xl space-y-8 animate-dashCardFadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-8 border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-white/10"
            >
              ← Back to Courses
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  course.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  Status: {course.status || 'Active'}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  (course.deliveryType || 'LIVE_CLASS') === 'LIVE_CLASS'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : (course.deliveryType === 'RECORDED'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30')
                }`}>
                  Delivery: {(course.deliveryType || 'LIVE_CLASS').replace('_', ' ')}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Difficulty: {course.difficulty || 'Intermediate'}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Quizzes: {data?.quizzesCount || 0} Total ({data?.activeQuizzesCount || 0} Active)
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">{course.title}</h1>
              <p className="text-indigo-100 text-sm mt-1 max-w-2xl">{course.description}</p>
            </div>
          </div>

          {/* Course Thumbnail Preview */}
          <div className="w-32 h-20 rounded-2xl overflow-hidden border border-white/20 flex-shrink-0 bg-slate-800 relative group shadow-lg">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-black text-xl">
                {course.title?.charAt(0) || 'C'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Thumbnail</span>
            </div>
          </div>
        </div>

        {/* Global Notification Banner */}
        {msg.text && (
          <div className={`mt-6 p-4 rounded-2xl font-bold text-xs flex items-center gap-3 animate-dashCardFadeIn ${
            msg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {msg.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
            {msg.text}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4">
        {[
          { key: 'students', label: `Students (${students.length})`, icon: FiUsers },
          { key: 'attendance', label: 'Attendance', icon: FiCheckCircle },
          { key: 'materials', label: `Materials (${materials.length})`, icon: FiUploadCloud },
          { key: 'settings', label: 'Settings', icon: FiEdit3 }
        ].map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: STUDENT PERFORMANCE & ROSTER */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Enrolled</span>
              <p className="text-3xl font-black text-slate-800">{students.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Avg Progress</span>
              <p className="text-3xl font-black text-emerald-600">
                {students.length ? Math.round(students.reduce((a, b) => a + (b.progress || 0), 0) / students.length) : 0}%
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Active Quizzes</span>
              <p className="text-3xl font-black text-indigo-600">{data?.activeQuizzesCount || 0}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">Blocked</span>
              <p className="text-3xl font-black text-rose-500">
                {students.filter(s => s.isBlocked).length}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-6 flex items-center justify-between">
              <span>Student Performance & Management</span>
              <span className="text-xs font-semibold text-slate-400">Total: {students.length} Students</span>
            </h3>

            {students.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <FiUsers size={40} className="mx-auto mb-2 text-gray-500" />
                <p className="text-gray-400 font-bold uppercase text-xs">No active students enrolled in this course.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((item) => {
                  const student = item.student
                  const profile = student?.profile || {}
                  const studentName = `${profile.firstName || 'Student'} ${profile.lastName || ''}`.trim()
                  const isBlocked = item.isBlocked

                  return (
                    <div
                      key={item.enrollmentId}
                      className={`p-5 rounded-2xl border transition-all ${
                        isBlocked
                          ? 'bg-rose-50 border-rose-300'
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Student Info */}
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 ${
                            isBlocked ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            {profile.firstName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{studentName}</h4>
                            <p className="text-xs text-slate-500 truncate max-w-[180px]">{student?.email}</p>
                            
                            {/* Student Status Badge */}
                            <div className="mt-2 flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                isBlocked
                                  ? 'bg-rose-500 text-white'
                                  : item.completed
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                  : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                              }`}>
                                Status: {item.status}
                              </span>
                              {item.teacherRating && (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[10px] font-black flex items-center gap-1">
                                  <FiStar className="fill-amber-400 text-amber-400" size={10} />
                                  Rating: {item.teacherRating}/5
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-100 p-4 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Course Progress</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-slate-800">{item.progress}%</span>
                              <div className="flex-1 bg-slate-300 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.progress}%` }} />
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Quiz Avg</span>
                            <span className="text-sm font-extrabold text-indigo-600 mt-1 block">
                              {item.performance?.avgQuizScore || 0}%
                              <span className="text-xs font-medium text-slate-500 ml-1">({item.performance?.quizzesTaken || 0} taken)</span>
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Attendance</span>
                            <span className="text-sm font-extrabold text-purple-600 mt-1 block">
                              {item.performance?.attendancePercentage || 0}%
                              <span className="text-xs font-medium text-slate-500 ml-1">({item.performance?.attendanceCount || 0} classes)</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Teacher Rating Button */}
                          <button
                            onClick={() => {
                              setRatingStudent(item)
                              setRatingScore(item.teacherRating || 5)
                              setRatingNotes(item.teacherNotes || '')
                            }}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                          >
                            <FiStar size={14} /> Rate Student
                          </button>

                          {/* Block Student for 2 Days Button (ONLY Block button option, no unblock option as requested) */}
                          <button
                            onClick={() => handleBlockStudent(student._id, studentName)}
                            disabled={isBlocked}
                            className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                              isBlocked
                                ? 'bg-rose-100 text-rose-400 cursor-not-allowed border border-rose-200'
                                : 'bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-300'
                            }`}
                          >
                            <FiSlash size={14} />
                            {isBlocked ? 'Blocked (2 Days)' : 'Block for 2 Days'}
                          </button>
                        </div>
                      </div>

                      {/* Display Teacher Notes if any */}
                      {item.teacherNotes && (
                        <div className="mt-4 pt-3 border-t border-white/5 text-xs text-amber-300/80 italic flex items-center gap-2">
                          <FiStar size={12} className="text-amber-400 flex-shrink-0" />
                          <span>Teacher Note: "{item.teacherNotes}"</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER ATTENDANCE MARKING */}
      {activeTab === 'attendance' && (
        course.deliveryType && course.deliveryType !== 'LIVE_CLASS' ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <FiAlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Attendance is not applicable for this batch.</h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              This course is delivered as a <strong>{course.deliveryType === 'RECORDED' ? 'Recorded Video' : 'Material / Document Based'}</strong> batch. Attendance tracking is restricted to Live Classes. Student progress is automatically tracked through content completion, assignments, and quizzes.
            </p>
            <div className="pt-2">
              <span className="inline-flex px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                Delivery Type: <strong className="ml-1 text-indigo-600">{course.deliveryType}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Attendance Marker</h3>
              <p className="text-xs text-slate-500 mt-1">Mark attendance for <span className="font-bold text-indigo-600">{course.title}</span></p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Class Date:</label>
              <input
                type="date"
                value={attDate}
                onChange={e => setAttDate(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <p className="text-gray-400 font-bold uppercase text-xs">No students available to mark attendance.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((item) => {
                const student = item.student
                const profile = student?.profile || {}
                const studentName = `${profile.firstName || 'Student'} ${profile.lastName || ''}`.trim()
                const currentStatus = attState[student._id] || 'present'

                return (
                  <div key={student._id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {profile.firstName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{studentName}</h4>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{student.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {[
                        { status: 'present', label: 'Present', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500 hover:text-white' },
                        { status: 'absent', label: 'Absent', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500 hover:text-white' },
                        { status: 'late', label: 'Late', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500 hover:text-white' }
                      ].map(b => (
                        <button
                          key={b.status}
                          onClick={() => handleMarkAttendance(student._id, b.status)}
                          className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider border transition-all ${
                            currentStatus === b.status
                              ? b.status === 'present' ? 'bg-emerald-600 text-white border-emerald-500' : b.status === 'absent' ? 'bg-rose-600 text-white border-rose-500' : 'bg-amber-600 text-white border-amber-500'
                              : `${b.color} opacity-70`
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        )
      )}

      {/* TAB 3: STUDY MATERIAL UPLOAD FROM SYSTEM */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Study Materials</h3>
              <p className="text-xs text-slate-500 mt-1">Upload PDFs, videos, and documents directly from your system.</p>
            </div>
            <button
              onClick={() => setShowMaterialModal(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2"
            >
              <FiPlus size={18} /> Upload Local Material
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {materials.length === 0 ? (
              <div className="text-center py-16 opacity-60">
                <FiUploadCloud size={48} className="mx-auto mb-3 text-indigo-400" />
                <p className="text-slate-500 font-bold uppercase text-xs">No materials uploaded yet.</p>
                <button
                  onClick={() => setShowMaterialModal(true)}
                  className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-all"
                >
                  Upload First File
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((m, idx) => (
                  <div key={m._id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 hover:border-indigo-400 transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        {m.type === 'video' ? <FiVideo size={22} /> : <FiFile size={22} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-sm truncate uppercase tracking-tight">{m.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                            {m.type}
                          </span>
                          {m.fileSize && (
                            <span className="text-[10px] text-slate-500 font-bold">
                              {(m.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                        title="View Material"
                      >
                        <FiLink size={16} />
                      </a>
                      <button
                        onClick={() => handleDeleteMaterial(idx)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all"
                        title="Delete Material"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: COURSE THUMBNAIL & DIFFICULTY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-3xl shadow-sm">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Course Attributes & Media</h3>
          <p className="text-xs text-slate-500 mb-8">Update the thumbnail URL, difficulty level and publishing status.</p>

          <form onSubmit={handleUpdateCourseDetails} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Course Thumbnail Image URL</label>
              <input
                type="text"
                value={courseForm.thumbnail}
                onChange={e => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-2">Enter a direct image link to display as the course thumbnail card.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Difficulty Level</label>
                <select
                  value={courseForm.difficulty}
                  onChange={e => setCourseForm({ ...courseForm, difficulty: e.target.value })}
                  className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option className="bg-slate-900 text-white" value="Beginner">Beginner</option>
                  <option className="bg-slate-900 text-white" value="Intermediate">Intermediate</option>
                  <option className="bg-slate-900 text-white" value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Course Status</label>
                <select
                  value={courseForm.status}
                  onChange={e => setCourseForm({ ...courseForm, status: e.target.value })}
                  className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option className="bg-slate-900 text-white" value="active">Active / Published</option>
                  <option className="bg-slate-900 text-white" value="archived">Archived</option>
                  <option className="bg-slate-900 text-white" value="completed">Completed</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingCourse}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
            >
              {updatingCourse ? 'Saving Changes...' : 'Save Course Attributes'}
            </button>
          </form>
        </div>
      )}

      {/* RATING MODAL */}
      {ratingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-dashCardFadeIn">
          <div className="bg-white max-w-md w-full p-8 relative rounded-3xl shadow-2xl border border-slate-200">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Rate Student</h3>
            <p className="text-xs text-slate-500 mb-6">
              Assign rating and notes for <span className="text-indigo-600 font-bold">{ratingStudent.student?.profile?.firstName}</span>
            </p>

            <form onSubmit={handleSaveRating} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-3">Rating (1 - 5 Stars)</label>
                <div className="flex items-center gap-3 justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-2 transition-all hover:scale-125"
                    >
                      <FiStar
                        size={28}
                        className={star <= ratingScore ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Evaluation Notes</label>
                <textarea
                  value={ratingNotes}
                  onChange={e => setRatingNotes(e.target.value)}
                  placeholder="Enter remarks on student attendance, quiz performance..."
                  className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none h-28"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                >
                  {submittingRating ? 'Saving...' : 'Submit Rating'}
                </button>
                <button
                  type="button"
                  onClick={() => setRatingStudent(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MATERIAL UPLOAD MODAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-dashCardFadeIn">
          <div className="bg-white max-w-lg w-full p-8 relative rounded-3xl shadow-2xl border border-slate-200">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Upload Material</h3>
            <p className="text-xs text-slate-500 mb-6">Select a file from your system to share with enrolled students.</p>

            <form onSubmit={handleUploadMaterial} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-3">Upload Source</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'file', label: 'Local System File', icon: FiUploadCloud },
                    { value: 'url', label: 'External URL', icon: FiLink }
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-center gap-2.5 p-4 rounded-2xl border cursor-pointer font-bold text-xs uppercase tracking-wider transition-all ${
                        materialForm.uploadMethod === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="uploadMethod"
                        value={opt.value}
                        checked={materialForm.uploadMethod === opt.value}
                        onChange={e => setMaterialForm({ ...materialForm, uploadMethod: e.target.value })}
                        className="hidden"
                      />
                      <opt.icon size={16} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {materialForm.uploadMethod === 'file' ? (
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Choose Local File</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.mp4,.avi,.mov,.wmv,.doc,.docx,.ppt,.pptx,.txt"
                    className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-700 font-medium text-xs file:hidden cursor-pointer"
                    required
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <FiCheck size={14} /> Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Resource Endpoint URL</label>
                  <input
                    type="url"
                    value={materialForm.url}
                    onChange={e => setMaterialForm({ ...materialForm, url: e.target.value })}
                    placeholder="https://example.com/material.pdf"
                    className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Material Title</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })}
                  placeholder="e.g. Chapter 3 - Advanced React Concepts"
                  className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl text-slate-800 font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploadingMat}
                  className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                >
                  {uploadingMat ? 'Uploading File...' : 'Deploy Material'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
