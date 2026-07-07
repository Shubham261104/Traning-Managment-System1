import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiBook, FiUser, FiCalendar, FiUsers, FiClock, FiFile, FiCheckCircle, FiPlusCircle, FiArrowRight } from 'react-icons/fi'
import '../admin/AdminPremium.css'

const StudentCourses = () => {
  const [availableCourses, setAvailableCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [activeTab, setActiveTab] = useState('available')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        axios.get('/api/student/courses/available'),
        axios.get('/api/student/enrollments')
      ])
      setAvailableCourses(coursesRes.data || [])
      setEnrollments(enrollmentsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setAvailableCourses([])
      setEnrollments([])
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
    try {
      await axios.post('/api/student/enrollments', { courseId })
      fetchData()
    } catch (error) {
      console.error('Enrollment failed:', error)
    }
  }

  return (
    <Layout>
      <div className="space-y-10 pb-12 animate-dashCardFadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Catalog & <span className="text-premium-gradient">Learning</span>
            </h1>
            <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Browse available courses and manage your enrollments</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[24px] p-2 border border-white/10 w-fit">
          <div className="flex gap-2">
            {[
              { id: 'available', label: 'Available Courses', icon: FiPlusCircle },
              { id: 'enrolled', label: 'My Enrollments', icon: FiCheckCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-[#64748b] hover:text-white hover:bg-white/5'
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTab === 'available' ? (
              availableCourses.length > 0 ? (
                availableCourses.map((course, idx) => (
                  <div
                    key={course._id}
                    className="admin-glass-card group hover:border-indigo-500/30 transition-all animate-dashCardFadeIn"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <FiBook size={24} />
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-black text-[#64748b] uppercase tracking-widest">
                        CREDITS: {course.credits || '3.0'}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">{course.title}</h3>
                    <p className="text-[#94a3b8] text-sm mb-6 line-clamp-3 leading-relaxed">{course.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1">Instructor</p>
                        <p className="text-white text-xs font-bold truncate">
                          {course.instructor?.profile?.firstName} {course.instructor?.profile?.lastName}
                        </p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1">Duration</p>
                        <p className="text-white text-xs font-bold truncate">{course.duration} Hours</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center justify-between text-[10px] font-black text-[#64748b] uppercase tracking-widest">
                        <span>Enrollment Status</span>
                        <span className="text-indigo-400">{course.enrolledCount} / {course.capacity} SEATS</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${(course.enrolledCount / course.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleEnroll(course._id)}
                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                    >
                      Request Admission
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center admin-glass-card opacity-50 border-dashed">
                  <FiBook size={48} className="mx-auto mb-4 text-[#475569]" />
                  <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">No courses available for deployment</p>
                </div>
              )
            ) : (
              enrollments.filter(e => e.course !== null && e.course !== undefined).length > 0 ? (
                enrollments
                  .filter(e => e.course !== null && e.course !== undefined)
                  .map((enrollment, idx) => {
                    const courseTitle = enrollment.course?.title || 'Unknown Course'
                    const courseDescription = enrollment.course?.description || ''
                    const courseId = (enrollment.course && typeof enrollment.course === 'object')
                      ? (enrollment.course._id || enrollment.course)
                      : enrollment.course

                    return (
                      <div
                        key={enrollment._id}
                        className="admin-glass-card group hover:border-indigo-500/30 transition-all animate-dashCardFadeIn"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <h3 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">{courseTitle}</h3>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${enrollment.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            enrollment.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                            {enrollment.status}
                          </span>
                        </div>

                        <p className="text-[#94a3b8] text-sm mb-6 line-clamp-2 leading-relaxed">{courseDescription}</p>

                        {enrollment.status === 'approved' && (
                          <div className="mb-8">
                            <div className="flex items-center justify-between text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-2">
                              <span>Mastery Progress</span>
                              <span className="text-white px-2 py-0.5 bg-indigo-500/20 rounded border border-indigo-500/20">{enrollment.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                              <div
                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                style={{ width: `${enrollment.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {enrollment.adminNotes && (
                          <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/5 relative">
                            <div className="absolute top-2 right-4 text-[8px] font-black text-[#64748b] uppercase tracking-widest">Feedback</div>
                            <p className="text-xs text-[#94a3b8] italic">"{enrollment.adminNotes}"</p>
                          </div>
                        )}

                        {courseId && enrollment.status === 'approved' && (
                          <Link
                            to={`/student/courses/${courseId}/materials`}
                            className="w-full py-4 bg-white/5 hover:bg-white text-[#0f172a] hover:text-[#0f172a] bg-white group-hover:bg-indigo-500 group-hover:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-white/10"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                          >
                            <FiFile size={16} />
                            <span>Study Materials</span>
                            <FiArrowRight />
                          </Link>
                        )}

                        {enrollment.status !== 'approved' && (
                          <div className="w-full py-4 bg-white/5 rounded-2xl text-center border border-white/5">
                            <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Enagement Restricted</span>
                          </div>
                        )}
                      </div>
                    )
                  })
              ) : (
                <div className="col-span-full py-20 text-center admin-glass-card opacity-50 border-dashed">
                  <FiCheckCircle size={48} className="mx-auto mb-4 text-[#475569]" />
                  <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">No active enrollments found</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default StudentCourses

