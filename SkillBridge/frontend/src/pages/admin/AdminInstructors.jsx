import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiBook, FiUsers, FiPlus, FiTrash2, FiEdit, FiShield, FiX, FiPhone, FiMail, FiCheck, FiAward, FiBriefcase } from 'react-icons/fi'
import './AdminPremium.css'

const AdminInstructors = () => {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  useEffect(() => {
    fetchInstructors()
  }, [])

  const fetchInstructors = async () => {
    try {
      const res = await axios.get('/api/admin/instructors')
      setInstructors(res.data)
    } catch (error) {
      console.error('Error fetching instructors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInstructor = () => {
    setEditingInstructor(null)
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: ''
    })
    setShowModal(true)
  }

  const handleEditInstructor = (instructor) => {
    setEditingInstructor(instructor)
    setFormData({
      email: instructor.email,
      password: '',
      firstName: instructor.profile?.firstName || '',
      lastName: instructor.profile?.lastName || '',
      phone: instructor.profile?.phone || ''
    })
    setShowModal(true)
  }

  const handleDeleteInstructor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) {
      return
    }
    try {
      await axios.delete(`/api/admin/users/${id}`)
      fetchInstructors()
    } catch (error) {
      console.error('Error deleting instructor:', error)
      alert(error.response?.data?.message || 'Failed to delete instructor')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingInstructor) {
        await axios.put(`/api/admin/users/${editingInstructor._id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        })
      } else {
        await axios.post('/api/admin/users', {
          ...formData,
          role: 'instructor'
        })
      }
      setShowModal(false)
      setEditingInstructor(null)
      fetchInstructors()
    } catch (error) {
      console.error('Error saving instructor:', error)
      alert(error.response?.data?.message || 'Failed to save instructor')
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Manage <span className="text-premium-gradient">Instructors</span>
            </h1>
            <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Personnel oversight and academic resource allocation</p>
          </div>
          <button
            onClick={handleAddInstructor}
            className="admin-premium-btn flex items-center gap-3 py-4 shadow-xl shadow-indigo-500/20"
          >
            <FiPlus size={20} />
            <span>Add New Instructor</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {instructors.map((instructor, idx) => (
            <div
              key={instructor._id}
              className="admin-glass-card group hover:scale-[1.02] transition-all duration-500 border-white/5 hover:border-indigo-500/30"
              style={{ animation: `dashCardFadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards ${idx * 0.1}s` }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <FiCheck size={14} />
                </div>
              </div>

              <div className="flex items-center space-x-6 mb-8 relative">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative bg-[#0f172a] border border-white/10 w-20 h-20 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl font-black shadow-2xl transform group-hover:-rotate-3 transition-transform overflow-hidden">
                    {instructor.profile?.avatar ? (
                      <img
                        src={instructor.profile.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>{instructor.profile?.firstName?.[0]}{instructor.profile?.lastName?.[0]}</>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-indigo-500 border-4 border-[#0f172a] rounded-full flex items-center justify-center" title="Core Faculty">
                    <FiShield size={10} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                    {instructor.profile?.firstName} {instructor.profile?.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <FiBriefcase className="text-indigo-400/60" size={12} />
                    <span className="text-[#64748b] text-[10px] font-black uppercase tracking-widest">Instructor</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10 px-1">
                <div className="flex items-center gap-4 text-[#94a3b8] group/item hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-indigo-400 border border-white/5">
                    <FiMail size={14} />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{instructor.email}</span>
                </div>
                <div className="flex items-center gap-4 text-[#94a3b8] group/item hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-indigo-400 border border-white/5">
                    <FiPhone size={14} />
                  </div>
                  <span className="text-sm font-bold tracking-tight font-mono">{instructor.profile?.phone || 'NO PHONE'}</span>
                </div>
              </div>

              <div className="p-5 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-center justify-around mb-8 group-hover:bg-indigo-500/10 transition-colors">
                <div className="text-center group/stat">
                  <div className="flex items-center justify-center gap-2 text-indigo-400 mb-1">
                    <FiBook size={16} className="group-hover/stat:scale-110 transition-transform" />
                    <span className="text-2xl font-black text-white tabular-nums">{instructor.courseCount || 0}</span>
                  </div>
                  <span className="text-[10px] uppercase font-black text-[#475569] tracking-widest">Courses</span>
                </div>
                <div className="w-px h-10 bg-indigo-500/20"></div>
                <div className="text-center group/stat">
                  <div className="flex items-center justify-center gap-2 text-indigo-400 mb-1">
                    <FiUsers size={16} className="group-hover/stat:scale-110 transition-transform" />
                    <span className="text-2xl font-black text-white tabular-nums">{instructor.studentCount || 0}</span>
                  </div>
                  <span className="text-[10px] uppercase font-black text-[#475569] tracking-widest">Students</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleEditInstructor(instructor)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest border border-white/5"
                >
                  <FiEdit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteInstructor(instructor._id)}
                  className="w-14 flex items-center justify-center bg-rose-500/10 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                  title="Delete Instructor"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 admin-modal-overlay flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="admin-modal-content max-w-lg w-full animate-dashCardFadeIn shadow-[0_0_100px_rgba(79,70,229,0.2)]">
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                      {editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">Faculty Identification System</p>
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
                      placeholder="instructor@skillbridge.com"
                      disabled={!!editingInstructor}
                    />
                  </div>

                  {!editingInstructor && (
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
                      {editingInstructor ? 'Save Changes' : 'Add Instructor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditingInstructor(null)
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

export default AdminInstructors
