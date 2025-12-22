import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiSearch, FiCheck, FiX, FiPlus, FiTrash2, FiEdit, FiUser, FiActivity, FiFilter, FiMoreVertical, FiArrowRight, FiCheckCircle, FiZap, FiTarget } from 'react-icons/fi'
import './AdminPremium.css'

const AdminStudents = () => {
  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [studentsRes, enrollmentsRes] = await Promise.all([
        axios.get('/api/admin/students'),
        axios.get('/api/admin/enrollments/pending')
      ])
      setStudents(studentsRes.data)
      setEnrollments(enrollmentsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollmentAction = async (id, status, notes = '') => {
    try {
      await axios.put(`/api/admin/enrollments/${id}`, { status, adminNotes: notes })
      fetchData()
    } catch (error) {
      console.error('Error updating enrollment:', error)
      alert(error.response?.data?.message || 'Failed to update enrollment')
    }
  }

  const handleAddStudent = () => {
    setEditingStudent(null)
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: ''
    })
    setShowModal(true)
  }

  const handleEditStudent = (student) => {
    setEditingStudent(student)
    setFormData({
      email: student.email,
      password: '',
      firstName: student.profile?.firstName || '',
      lastName: student.profile?.lastName || '',
      phone: student.profile?.phone || ''
    })
    setShowModal(true)
  }

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return
    }
    try {
      await axios.delete(`/api/admin/users/${id}`)
      fetchData()
    } catch (error) {
      console.error('Error deleting student:', error)
      alert(error.response?.data?.message || 'Failed to delete student')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingStudent) {
        await axios.put(`/api/admin/users/${editingStudent._id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        })
      } else {
        await axios.post('/api/admin/users', {
          ...formData,
          role: 'student'
        })
      }
      setShowModal(false)
      setEditingStudent(null)
      fetchData()
    } catch (error) {
      console.error('Error saving student:', error)
      alert(error.response?.data?.message || 'Failed to save student')
    }
  }

  const filteredStudents = students.filter(student =>
    `${student.profile?.firstName} ${student.profile?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Manage <span className="text-premium-gradient">Students</span>
            </h1>
            <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Archive oversight and enrollment management hub</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="admin-premium-btn flex items-center gap-3 py-4 shadow-xl shadow-indigo-500/20"
          >
            <FiPlus size={20} />
            <span>Enroll New Student</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Main Students List */}
          <div className="xl:col-span-2 space-y-10">
            <div className="admin-glass-card p-0 overflow-hidden relative border-white/5">
              <div className="p-8 pb-0">
                <div className="flex items-center gap-6 mb-10">
                  <div className="flex-1 relative group">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 group-focus-within:text-white transition-colors z-10" size={18} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="admin-input admin-search-input py-5 bg-white/5 border-white/10 rounded-2xl"
                    />
                  </div>
                  <button className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5 hover:bg-indigo-500 hover:text-white transition-all">
                    <FiFilter size={20} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="py-6 px-8 text-[10px] font-black text-[#64748b] uppercase tracking-widest">Student Name</th>
                      <th className="py-6 px-8 text-[10px] font-black text-[#64748b] uppercase tracking-widest">Email</th>
                      <th className="py-6 px-8 text-[10px] font-black text-[#64748b] uppercase tracking-widest">Progress</th>
                      <th className="py-6 px-8 text-[10px] font-black text-[#64748b] uppercase tracking-widest">Status</th>
                      <th className="py-6 px-8 text-[10px] font-black text-[#64748b] uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredStudents.map((student, idx) => (
                      <tr
                        key={student._id}
                        className="group hover:bg-white/5 transition-colors"
                        style={{ animation: `dashCardFadeIn 0.5s ease-out backwards ${idx * 0.05}s` }}
                      >
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform overflow-hidden">
                              {student.profile?.avatar ? (
                                <img
                                  src={student.profile.avatar}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <>{student.profile?.firstName?.charAt(0)}</>
                              )}
                            </div>
                            <div>
                              <span className="font-black text-white block uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                                {student.profile?.firstName} {student.profile?.lastName}
                              </span>
                              <span className="text-[10px] font-black text-[#475569] uppercase tracking-widest mt-0.5 block flex items-center gap-1">
                                <FiTarget size={10} className="text-indigo-500" /> Active Student
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <p className="text-sm text-[#94a3b8] font-bold tracking-tight">{student.email}</p>
                          <p className="text-[10px] font-black text-[#475569] uppercase tracking-tighter mt-1">{student.profile?.phone || 'NO PHONE'}</p>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="flex-1 w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                style={{ width: `${student.averageProgress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-white">{student.averageProgress || 0}%</span>
                          </div>
                          <p className="text-[10px] font-black text-[#475569] uppercase tracking-widest">{student.enrolledCoursesCount || 0} Courses Enrolled</p>
                        </td>
                        <td className="py-6 px-8">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${student.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${student.isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-400'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {student.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex items-center justify-end gap-3 translate-x-2 opacity-60 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="w-10 h-10 flex items-center justify-center bg-white/5 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-white/5"
                              title="Edit Student"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student._id)}
                              className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-500/20"
                              title="Delete Student"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && (
                  <div className="py-40 text-center">
                    <FiUser size={60} className="mx-auto text-white/5 mb-6" />
                    <p className="text-[#64748b] font-black uppercase tracking-widest text-sm">No students found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="xl:col-span-1 space-y-10">
            {/* Pending Enrollments Panel */}
            <div className="admin-glass-card p-10 border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500"></div>

              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                    <FiActivity className="animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Waitlist</h2>
                </div>
                {enrollments.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse shadow-lg shadow-rose-500/30">
                    {enrollments.length} Pending
                  </span>
                )}
              </div>

              {enrollments.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 group-hover:bg-white/10 transition-colors">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
                    <FiCheckCircle size={32} />
                  </div>
                  <p className="text-white font-black uppercase tracking-widest text-xs mb-2">Queue Balanced</p>
                  <p className="text-[#64748b] text-[10px] font-bold uppercase tracking-widest">No requests pending audit.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {enrollments.map((enrollment, idx) => (
                    <div
                      key={enrollment._id}
                      className="p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col gap-6 hover:bg-white/10 hover:border-indigo-500/30 transition-all group/item shadow-2xl relative overflow-hidden"
                      style={{ animation: `dashCardFadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) backwards ${idx * 0.12}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#0f172a] flex items-center justify-center text-indigo-400 font-black border border-white/10 shadow-inner group-hover/item:rotate-3 transition-transform overflow-hidden">
                          {enrollment.student?.profile?.avatar ? (
                            <img
                              src={enrollment.student.profile.avatar}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>{enrollment.student?.profile?.firstName?.charAt(0)}</>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white uppercase tracking-tight truncate">
                            {enrollment.student?.profile?.firstName} {enrollment.student?.profile?.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <FiZap size={10} className="text-orange-400" />
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter truncate">{enrollment.course?.title}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <p className="text-[10px] text-[#64748b] font-black uppercase tracking-widest">
                          Date: {new Date(enrollment.requestedAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEnrollmentAction(enrollment._id, 'approved')}
                            className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                            title="Approve"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() => handleEnrollmentAction(enrollment._id, 'rejected')}
                            className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-500/20"
                            title="Reject"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Subsystem */}
        {showModal && (
          <div className="fixed inset-0 admin-modal-overlay flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="admin-modal-content max-w-lg w-full animate-dashCardFadeIn shadow-[0_0_100px_rgba(79,70,229,0.2)]">
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                      {editingStudent ? 'Edit Student' : 'Add New Student'}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">Learner Registry Protocol</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#94a3b8] hover:bg-rose-500 hover:text-white transition-all border border-white/5">
                    <FiX size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="admin-input"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="admin-input"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="admin-input"
                      required
                      placeholder="student@skillbridge.com"
                      disabled={!!editingStudent}
                    />
                  </div>

                  {!editingStudent && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="admin-input"
                        required
                        minLength={6}
                        placeholder="••••••••"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="admin-input"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      className="admin-premium-btn flex-1 py-5 shadow-xl shadow-indigo-500/20"
                    >
                      {editingStudent ? 'Save Changes' : 'Enroll Student'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditingStudent(null)
                      }}
                      className="px-8 py-5 bg-white/5 text-[#64748b] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white/10 hover:text-white border border-white/5"
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

export default AdminStudents
