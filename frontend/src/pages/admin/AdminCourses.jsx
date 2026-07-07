import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiPlus, FiEdit, FiArchive, FiUsers, FiClock, FiCalendar, FiX, FiLayers, FiBookOpen, FiDatabase, FiAward, FiActivity } from 'react-icons/fi'
import './AdminPremium.css'

const AdminCourses = () => {
  const [courses, setCourses] = useState([])
  const [instructors, setInstructors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    capacity: '',
    instructor: '',
    startDate: '',
    endDate: '',
    category: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
    fetchInstructors()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses')
      setCourses(res.data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstructors = async () => {
    try {
      const res = await axios.get('/api/admin/instructors')
      setInstructors(res.data)
    } catch (error) {
      console.error('Error fetching instructors:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCourse) {
        await axios.put(`/api/admin/courses/${editingCourse._id}`, formData)
      } else {
        await axios.post('/api/admin/courses', formData)
      }
      setShowModal(false)
      setEditingCourse(null)
      setFormData({
        title: '',
        description: '',
        duration: '',
        capacity: '',
        instructor: '',
        startDate: '',
        endDate: '',
        category: ''
      })
      fetchCourses()
    } catch (error) {
      console.error('Error saving course:', error)
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description,
      duration: course.duration,
      capacity: course.capacity,
      instructor: course.instructor?._id || course.instructor,
      startDate: course.startDate?.split('T')[0] || '',
      endDate: course.endDate?.split('T')[0] || '',
      category: course.category || ''
    })
    setShowModal(true)
  }

  const handleArchive = async (id) => {
    if (window.confirm('Are you sure you want to archive this course?')) {
      try {
        await axios.put(`/api/admin/courses/${id}/archive`)
        fetchCourses()
      } catch (error) {
        console.error('Error archiving course:', error)
      }
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-indigo-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-indigo-500/10 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pb-20 animate-dashCardFadeIn">
        {/* Module Header */}
        <header className="mb-16 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[100px] rounded-full"></div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <FiLayers className="animate-pulse" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400/80">SkillBridge Admin</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight">
                Manage <span className="text-premium-gradient">Courses</span>
              </h1>
              <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest max-w-2xl">
                Oversight and management of the SkillBridge curriculum.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCourse(null)
                setFormData({
                  title: '',
                  description: '',
                  duration: '',
                  capacity: '',
                  instructor: '',
                  startDate: '',
                  endDate: '',
                  category: ''
                })
                setShowModal(true)
              }}
              className="admin-premium-btn flex items-center gap-3 px-8 py-5 shadow-2xl shadow-indigo-500/20 group/btn"
            >
              <div className="bg-white/20 p-2 rounded-lg group-hover/btn:rotate-90 transition-transform">
                <FiPlus size={20} />
              </div>
              <span className="font-black uppercase tracking-widest text-sm">Add New Course</span>
            </button>
          </div>
        </header>

        {/* Modular Grid - Consistent 2-column layout for better width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {courses.map((course, idx) => (
            <div
              key={course._id}
              className="admin-glass-card group hover:translate-y-[-4px] transition-all duration-300 border-white/5 relative overflow-hidden flex flex-col h-full !p-0"
              style={{ animation: `dashCardFadeIn 0.8s cubic-bezier(0.2, 1, 0.2, 1) backwards ${idx * 0.1}s` }}
            >
              {/* Top Banner Area */}
              <div className="relative h-32 bg-slate-900/50 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-30"></div>
                <div className="absolute inset-0 flex items-center px-8">
                  <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <FiBookOpen size={24} />
                  </div>
                  <div className="ml-4">
                    <div className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${course.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-white/5 text-[#64748b] border-white/10'
                      }`}>
                      {course.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-[#94a3b8] mb-6 line-clamp-2 text-sm leading-relaxed">
                  {course.description}
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#64748b] uppercase tracking-widest">Enrolled</p>
                    <p className="text-sm font-bold text-white">{course.enrolledCount} / {course.capacity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#64748b] uppercase tracking-widest">Duration</p>
                    <p className="text-sm font-bold text-white">{course.duration}h</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#64748b] uppercase tracking-widest">Category</p>
                    <p className="text-sm font-bold text-white truncate">{course.category || 'N/A'}</p>
                  </div>
                </div>

                {/* Footer section: Instructor & Actions */}
                <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-[10px]">
                      {course.instructor?.profile?.firstName?.charAt(0)}
                    </div>
                    <p className="text-[11px] font-black text-white uppercase tracking-tight">
                      {course.instructor?.profile?.firstName}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(course)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all font-black text-[10px] uppercase tracking-widest border border-white/10"
                    >
                      <FiEdit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchive(course._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all font-black text-[10px] uppercase tracking-widest border border-rose-500/20"
                    >
                      <FiArchive size={14} />
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 admin-modal-overlay flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="admin-modal-content max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dashCardFadeIn shadow-[0_0_100px_rgba(79,70,229,0.2)]">
              {/* Modal Header */}
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                    Update SkillBridge Curriculum
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-[#94a3b8] hover:bg-rose-500 hover:text-white transition-all border border-white/5">
                  <FiX size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 bg-[#0f172a]/80">
                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <FiBookOpen size={16} /> Course Identity
                        </h3>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Course Title</label>
                            <input
                              type="text"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              className="admin-input"
                              placeholder="e.g. Advanced React Development"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Course Description</label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="admin-input py-6 min-h-[150px] resize-none"
                              placeholder="Enter course details..."
                              required
                            />
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <FiActivity size={16} /> Capacity & Duration
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Duration (Hrs)</label>
                            <input
                              type="number"
                              value={formData.duration}
                              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                              className="admin-input"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Max Capacity</label>
                            <input
                              type="number"
                              value={formData.capacity}
                              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                              className="admin-input"
                              required
                            />
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="space-y-8">
                      <section>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <FiAward size={16} /> Instructor Alignment
                        </h3>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Course Instructor</label>
                          <select
                            value={formData.instructor}
                            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                            className="admin-input appearance-none"
                            required
                          >
                            <option value="" className="bg-[#0f172a]">Select Instructor</option>
                            {instructors.map((instructor) => (
                              <option key={instructor._id} value={instructor._id} className="bg-[#0f172a]">
                                {instructor.profile?.firstName} {instructor.profile?.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <FiClock size={16} /> Time Schedule
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Start Date</label>
                            <input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              className="admin-input"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">End Date</label>
                            <input
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                              className="admin-input"
                              required
                            />
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <FiDatabase size={16} /> Classification
                        </h3>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Course Category</label>
                          <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="admin-input"
                            placeholder="e.g. Technology"
                          />
                        </div>
                      </section>
                    </div>
                  </div>

                  <div className="flex gap-6 pt-10 border-t border-white/5">
                    <button
                      type="submit"
                      className="admin-premium-btn flex-1 py-6 shadow-2xl shadow-indigo-500/20"
                    >
                      {editingCourse ? 'Save Changes' : 'Add Course'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditingCourse(null)
                      }}
                      className="px-12 py-6 bg-white/5 text-[#64748b] rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-white/10 hover:text-white border border-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

export default AdminCourses
