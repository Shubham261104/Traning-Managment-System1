import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiBook, FiUsers, FiArrowRight, FiActivity, FiVideo, FiBarChart2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import '../admin/AdminPremium.css'

const InstructorDashboard = () => {
  const [dashboardData, setDashboardData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/instructor/dashboard')
      setDashboardData(res.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
          <div className="instructor-dashboard-header">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              Instructor <span className="text-premium-gradient">Dashboard</span>
            </h1>
            <p className="text-gray-500 dark:text-[#94a3b8] font-medium text-lg">Welcome back! Here's your teaching overview.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 instructor-stats">
          {[
            { label: 'Assigned Courses', value: dashboardData.assignedCourses || 0, icon: FiBook, color: 'from-blue-500 to-indigo-600' },
            { label: 'Total Students', value: dashboardData.totalStudents || 0, icon: FiUsers, color: 'from-violet-500 to-purple-600' },
            { label: 'Active Courses', value: dashboardData.courses?.length || 0, icon: FiActivity, color: 'from-emerald-500 to-teal-600' }
          ].map((stat, i) => (
            <div
              key={i}
              className="admin-glass-card group"
              style={{ animation: `dashCardFadeIn 0.5s ease-out backwards ${i * 0.1}s` }}
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-gray-500 dark:text-[#64748b] text-[10px] font-extrabold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <stat.icon size={28} />
                </div>
              </div>
              <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${stat.color} w-2/3 group-hover:w-full transition-all duration-1000 opacity-60`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8 my-courses-section">
            <div className="admin-glass-card h-full">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <FiBook className="text-indigo-400" />
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tight">My Courses</h2>
                </div>
                <Link
                  to="/instructor/courses"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 group"
                >
                  View All <FiArrowRight className="group-hover:translateX-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboardData.courses?.slice(0, 4).map((course, idx) => (
                  <div
                    key={course._id}
                    className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all group/course animate-dashCardFadeIn"
                    style={{ animationDelay: `${0.4 + (idx * 0.1)}s` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-white text-lg leading-tight group-hover/course:text-indigo-400 transition-colors line-clamp-1">{course.title}</h3>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/10 text-white/50 border border-white/10'
                        }`}>
                        {course.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#94a3b8] mb-6 line-clamp-2 leading-relaxed">{course.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                      <div className="flex items-center gap-2">
                        <FiUsers className="text-indigo-500" />
                        <span className="text-white">{course.studentCount} STUDENTS</span>
                      </div>
                      <Link to={`/instructor/courses?courseId=${course._id}`} className="hover:text-white transition-colors">MANAGE</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 instructor-quick-actions">
            <div className="admin-glass-card">
              <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">Quick Actions</h2>
              <div className="space-y-4">
                <Link
                  to="/instructor/announcements"
                  className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl hover:from-indigo-500/20 hover:to-purple-600/20 transition-all group"
                >
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <FiVideo size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Send Announcements</p>
                    <p className="text-xs text-[#94a3b8] mt-1">Notify students about updates</p>
                  </div>
                </Link>

                <Link
                  to="/instructor/profile"
                  className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <FiUsers size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Profile Settings</p>
                    <p className="text-xs text-[#94a3b8] mt-1">Manage your identity</p>
                  </div>
                </Link>

                <Link
                  to="/instructor/courses"
                  className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <FiBarChart2 size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Course Insights</p>
                    <p className="text-xs text-[#94a3b8] mt-1">Track student progress</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default InstructorDashboard

