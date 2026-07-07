import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiBook, FiClock, FiAward, FiCheckCircle, FiArrowRight, FiActivity, FiZap } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import '../admin/AdminPremium.css'

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/student/dashboard')
      setDashboardData(res.data || {
        enrolledCourses: 0,
        pendingEnrollments: 0,
        certificatesCount: 0,
        enrollments: [],
        certificates: []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData({
        enrolledCourses: 0,
        pendingEnrollments: 0,
        certificatesCount: 0,
        enrollments: [],
        certificates: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-10 pb-12 animate-dashCardFadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="student-dashboard-header">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              Student <span className="text-premium-gradient">Dashboard</span>
            </h1>
            <p className="text-gray-500 dark:text-[#94a3b8] font-medium text-lg">Welcome back! Here's your learning overview.</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Learning Active
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 student-stats">
          {[
            { label: 'Enrolled Courses', value: dashboardData.enrolledCourses || 0, icon: FiBook, color: 'from-blue-500 to-indigo-600' },
            { label: 'Pending Requests', value: dashboardData.pendingEnrollments || 0, icon: FiClock, color: 'from-amber-500 to-orange-600' },
            { label: 'Certificates', value: dashboardData.certificatesCount || (dashboardData.certificates?.length || 0), icon: FiAward, color: 'from-purple-500 to-pink-600' },
            { label: 'Completed', value: dashboardData.enrollments?.filter(e => e.completed).length || 0, icon: FiCheckCircle, color: 'from-emerald-500 to-teal-600' }
          ].map((stat, i) => (
            <div
              key={i}
              className="admin-glass-card group"
              style={{ animation: `dashCardFadeIn 0.5s ease-out backwards ${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-gray-500 dark:text-[#64748b] text-[10px] font-extrabold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Enrollments Section */}
          <div className="admin-glass-card h-fit my-enrollments-section">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <FiZap className="text-indigo-400" />
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">My Enrollments</h2>
              </div>
              <Link
                to="/student/courses"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 group"
              >
                View All <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.enrollments && dashboardData.enrollments.length > 0 ? (
                dashboardData.enrollments
                  .filter(e => e.course !== null && e.course !== undefined)
                  .slice(0, 4)
                  .map((enrollment, idx) => (
                    <div
                      key={enrollment._id}
                      className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all group/item animate-dashCardFadeIn"
                      style={{ animationDelay: `${0.4 + (idx * 0.1)}s` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white text-lg group-hover/item:text-indigo-400 transition-colors uppercase tracking-tight">
                          {enrollment.course?.title || 'Unknown Course'}
                        </h3>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${enrollment.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          enrollment.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                          {enrollment.status}
                        </span>
                      </div>
                      {enrollment.status === 'approved' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">
                            <span>Learning Progress</span>
                            <span className="text-white bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/20">{enrollment.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 ring-1 ring-white/5">
                            <div
                              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                              style={{ width: `${enrollment.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-center py-10 opacity-50 border border-dashed border-white/10 rounded-2xl">
                  <FiBook size={48} className="mx-auto mb-4 text-[#475569]" />
                  <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">No active enrollments</p>
                </div>
              )}
            </div>
          </div>

          {/* Certificates Section */}
          <div className="admin-glass-card h-fit certificates-section">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <FiAward className="text-amber-400" />
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Certificates</h2>
              </div>
              <Link
                to="/student/certificates"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 group"
              >
                View Repository <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4">
              {!dashboardData.certificates || dashboardData.certificates.length === 0 ? (
                <div className="text-center py-10 opacity-50 border border-dashed border-white/10 rounded-2xl">
                  <FiAward size={48} className="mx-auto mb-4 text-[#475569]" />
                  <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">Awaiting achievement</p>
                </div>
              ) : (
                dashboardData.certificates.slice(0, 4).map((cert, idx) => (
                  <div
                    key={cert._id || cert.certificateId}
                    className="p-5 bg-gradient-to-br from-amber-500/5 to-orange-600/5 border border-amber-500/10 rounded-2xl hover:border-amber-500/30 transition-all group/cert animate-dashCardFadeIn"
                    style={{ animationDelay: `${0.4 + (idx * 0.1)}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg group-hover/cert:text-amber-400 transition-colors uppercase tracking-tight truncate">
                          {cert.course?.title || 'Unknown Course'}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <FiClock className="text-amber-500/50" size={12} />
                          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
                            ISSUED: {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110 transition-all shadow-lg">
                        <FiAward size={24} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default StudentDashboard

