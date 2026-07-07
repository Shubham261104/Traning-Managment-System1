import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiUsers, FiBook, FiUserCheck, FiClock, FiArrowRight, FiCheckCircle, FiXCircle, FiActivity, FiZap, FiTarget } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import './AdminPremium.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState({})
  const [pendingEnrollments, setPendingEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, enrollmentsRes] = await Promise.all([
        axios.get('/api/admin/dashboard/stats'),
        axios.get('/api/admin/enrollments/pending')
      ])
      setStats(statsRes.data)
      setPendingEnrollments(enrollmentsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollmentAction = async (id, status) => {
    try {
      await axios.put(`/api/admin/enrollments/${id}`, { status })
      fetchData()
    } catch (error) {
      console.error('Error updating enrollment:', error)
    }
  }

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: FiUsers, color: 'from-blue-500 to-indigo-600', trend: '+12%' },
    { label: 'Total Courses', value: stats.totalCourses, icon: FiBook, color: 'from-violet-500 to-purple-600', trend: '+4' },
    { label: 'Instructors', value: stats.totalInstructors, icon: FiUserCheck, color: 'from-emerald-500 to-teal-600', trend: 'Active' },
    { label: 'Pending Enrolls', value: stats.pendingEnrollments, icon: FiClock, color: 'from-orange-500 to-rose-600', trend: 'Critical' },
  ]

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
        <header className="mb-12 relative admin-dashboard-header">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[100px] rounded-full"></div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <FiTarget className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400/80">SkillBridge Admin</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-4">
            Admin <span className="text-premium-gradient">Dashboard</span>
          </h1>
          <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Comprehensive oversight of students, courses, and system status</p>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="admin-glass-card group hover:scale-[1.05] transition-all duration-500 border-white/5 relative overflow-hidden"
                style={{ animation: `dashCardFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards ${index * 0.1}s` }}
              >
                <div className="absolute top-0 right-0 p-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${index === 3 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-[#94a3b8] border-white/5'}`}>
                    {stat.trend}
                  </span>
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 group-hover:rotate-6 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
                    <div className="text-4xl font-black text-white tabular-nums tracking-tighter">{stat.value || 0}</div>
                  </div>
                </div>

                {/* Micro-sparkline effect */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${stat.color} opacity-50`}
                    style={{ width: `${Math.min((stat.value || 0) * 5, 100)}%`, transition: 'width 2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  ></div>
                </div>
              </div>
            )
          })}
        </section>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Pending Enrollments Panel */}
          <div className="lg:col-span-2 pending-enrollments">
            <div className="admin-glass-card p-10 border-white/5 h-full relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                    <FiActivity size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pending Enrollments</h2>
                    <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mt-0.5">Verification Queue</p>
                  </div>
                </div>
                <Link
                  to="/admin/students"
                  className="px-6 py-3 bg-white/5 text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/5 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 group/btn"
                >
                  View All <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="space-y-6">
                {pendingEnrollments.length === 0 ? (
                  <div className="text-center py-24 bg-[#0f172a]/40 rounded-[2.5rem] border border-dashed border-white/5 backdrop-blur-sm">
                    <div className="w-24 h-24 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                      <FiCheckCircle size={40} className="text-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-white font-black text-xl uppercase tracking-tight mb-2">No Pending Requests</p>
                    <p className="text-[#64748b] text-[10px] font-black uppercase tracking-[0.2em]">System is up to date.</p>
                  </div>
                ) : (
                  pendingEnrollments.slice(0, 4).map((enrollment, idx) => (
                    <div
                      key={enrollment._id}
                      className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/10 hover:border-indigo-500/20 transition-all group/item shadow-2xl relative overflow-hidden"
                      style={{ animation: `dashCardFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards ${0.4 + (idx * 0.1)}s` }}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-[#0f172a] flex items-center justify-center text-indigo-400 font-black border border-white/10 shadow-inner group-hover/item:scale-110 transition-transform">
                          {enrollment.student?.profile?.firstName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-white text-lg uppercase tracking-tight">
                            {enrollment.student?.profile?.firstName} {enrollment.student?.profile?.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <FiZap size={10} className="text-orange-400" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
                              {enrollment.course?.title}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 relative z-10">
                        <button
                          onClick={() => handleEnrollmentAction(enrollment._id, 'approved')}
                          className="px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleEnrollmentAction(enrollment._id, 'rejected')}
                          className="px-4 py-3 bg-rose-500/10 text-rose-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <FiXCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="lg:col-span-1 quick-actions">
            <div className="admin-glass-card p-10 border-white/5 h-full relative overflow-hidden group">
              <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/5 blur-[80px] rounded-full group-hover:bg-purple-500/10 transition-colors"></div>

              <div className="flex items-center gap-5 mb-12">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-purple-400">
                  <FiZap size={24} className="animate-bounce" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Quick Actions</h2>
                  <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mt-0.5">Rapid Control Hub</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { to: '/admin/announcements', label: 'Announcements', desc: 'Post updates', color: 'hover:border-purple-500/40 text-purple-400' },
                  { to: '/admin/courses', label: 'Manage Courses', desc: 'Curriculum control', color: 'hover:border-blue-500/40 text-blue-400' },
                  { to: '/admin/students', label: 'Manage Students', desc: 'Student oversight', color: 'hover:border-indigo-500/40 text-indigo-400' },
                  { to: '/admin/instructors', label: 'Manage Instructors', desc: 'Faculty profiles', color: 'hover:border-emerald-500/40 text-emerald-400' },
                  { to: '/admin/team', label: 'Team Management', desc: 'About Us section', color: 'hover:border-pink-500/40 text-pink-400' },
                ].map((action, idx) => (
                  <Link
                    key={idx}
                    to={action.to}
                    className={`p-6 bg-white/5 border border-white/5 rounded-2xl transition-all ${action.color} group/item hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <p className="font-black text-white px-1 uppercase tracking-tight mb-1">{action.label}</p>
                    <p className="text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em] px-1">{action.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AdminDashboard
