import { useState, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import AuthContext from '../context/AuthContext'
import {
    FiHome,
    FiBook,
    FiUsers,
    FiUserCheck,
    FiBell,
    FiLogOut,
    FiMenu,
    FiX,
    FiUser,
    FiAward,
    FiHelpCircle,
    FiInfo,
    FiCommand,
    FiSun,
    FiMoon
} from 'react-icons/fi'
import AnnouncementNotifications from './AnnouncementNotifications'
import NotificationBell from './NotificationBell'
import TourGuide from './TourGuide'
import './AdminLayout.css'

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext)
    const { theme, toggleTheme } = useTheme()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [runTour, setRunTour] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getNavItems = () => {
        const role = user?.role
        if (role === 'admin') {
            return [
                { path: '/admin', icon: FiHome, label: 'Dashboard' },
                { path: '/admin/courses', icon: FiBook, label: 'Manage Courses' },
                { path: '/admin/students', icon: FiUsers, label: 'Manage Students' },
                { path: '/admin/instructors', icon: FiUserCheck, label: 'Manage Instructors' },
                { path: '/admin/announcements', icon: FiBell, label: 'Announcements' },
                { path: '/admin/team', icon: FiInfo, label: 'Manage Team' },
                { path: '/admin/support', icon: FiHelpCircle, label: 'Support' },
            ]
        }
        if (role === 'instructor') {
            return [
                { path: '/instructor', icon: FiHome, label: 'Dashboard' },
                { path: '/instructor/courses', icon: FiBook, label: 'My Courses' },
                { path: '/instructor/quizzes', icon: FiBook, label: 'My Quizzes' },
                { path: '/instructor/announcements', icon: FiBell, label: 'Announcements' },
                { path: '/instructor/support', icon: FiHelpCircle, label: 'Support' },
            ]
        }
        if (role === 'student') {
            return [
                { path: '/student', icon: FiHome, label: 'Dashboard' },
                { path: '/student/courses', icon: FiBook, label: 'My Courses' },
                { path: '/student/quizzes', icon: FiBook, label: 'My Quizzes' },
                { path: '/student/certificates', icon: FiAward, label: 'Certificates' },
                { path: '/student/profile', icon: FiUser, label: 'My Profile' },
                { path: '/student/support', icon: FiHelpCircle, label: 'Support' },
            ]
        }
        return []
    }

    const navItems = getNavItems()
    const isPremium = ['admin', 'instructor', 'student'].includes(user?.role)
    const isAdmin = user?.role === 'admin'

    return (
        <div className={`min-h-screen flex ${isPremium ? `admin-theme-layout admin-premium-root ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}` : 'bg-gray-100'}`}>
            {isPremium && theme === 'dark' && (
                <div className="admin-layout-bg overflow-hidden">
                    <div className="dash-blob dash-blob-1 opacity-20"></div>
                    <div className="dash-blob dash-blob-2 opacity-10"></div>
                </div>
            )}

            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-white shadow-xl fixed h-full z-[60]">
                <div className="p-8">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-300">
                            <FiCommand size={22} />
                        </div>
                        <h2 className={`text-2xl font-black bg-clip-text text-transparent tracking-tighter bg-gradient-to-r ${theme === 'dark'
                            ? 'from-white via-blue-100 to-indigo-200'
                            : 'from-gray-900 via-blue-900 to-indigo-900'}`}>
                            SkillBridge
                        </h2>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? isAdmin ? 'sidebar-link-active' : 'bg-blue-600 text-white shadow-lg'
                                    : isAdmin ? `sidebar-link-hover ${theme === 'dark' ? 'text-[#94a3b8]' : 'text-gray-600'}` : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <FiLogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Sidebar - Mobile */}
            <div className={`lg:hidden fixed inset-0 z-[70] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)} />
                <aside className={`absolute inset-y-0 left-0 w-64 bg-white shadow-2xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <FiCommand size={24} className="text-blue-600" />
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">SkillBridge</h2>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <FiX size={24} className="text-gray-500" />
                        </button>
                    </div>
                    <nav className="px-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? isAdmin ? 'sidebar-link-active' : 'bg-blue-600 text-white shadow-lg'
                                        : isAdmin ? `sidebar-link-hover ${theme === 'dark' ? 'text-[#94a3b8]' : 'text-gray-600'}` : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all mt-4"
                        >
                            <FiLogOut size={20} />
                            <span className="font-medium">Logout</span>
                        </button>
                    </nav>
                </aside>
            </div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className={`${isPremium ? (theme === 'dark' ? 'bg-[#0f172a]/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl shadow-sm') : 'bg-white shadow-sm'} sticky top-0 z-[100] px-4 lg:px-8 py-4 flex justify-between items-center transition-all border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                    <button
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <FiMenu size={24} />
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        {isPremium && (
                            <div className="flex items-center gap-2 mr-2 border-r pr-4 border-white/5">
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2 rounded-xl transition-all ${theme === 'dark'
                                        ? 'bg-white/5 text-yellow-400 border border-white/10 hover:bg-white/10'
                                        : 'bg-gray-100 text-indigo-600 border border-gray-200 hover:bg-gray-200'
                                        }`}
                                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                >
                                    {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                                </button>
                                <button
                                    onClick={() => setRunTour(true)}
                                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${theme === 'dark'
                                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500 hover:text-white'
                                        : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white'
                                        }`}
                                >
                                    <FiInfo size={14} />
                                    Tour Guide
                                </button>
                            </div>
                        )}
                        <div className={`flex items-center gap-3 mr-4 border-r pr-4 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                            <AnnouncementNotifications />
                            <NotificationBell />
                        </div>
                        <div className="text-right hidden sm:block mr-2">
                            <p className={`text-sm font-extrabold leading-none mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {user?.profile?.firstName} {user?.profile?.lastName}
                            </p>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{user?.role}</p>
                        </div>
                        <Link
                            to={user?.role === 'instructor' ? '/instructor/profile' : user?.role === 'student' ? '/student/profile' : '#'}
                            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black border-2 border-white/10 shadow-lg hover:scale-110 transition-transform overflow-hidden user-profile-menu"
                        >
                            {user?.profile?.avatar ? (
                                <img
                                    src={user.profile.avatar}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                user?.profile?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()
                            )}
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className={`p-4 lg:p-8 flex-1 relative z-10 ${isAdmin ? 'admin-content-inner' : ''}`}>
                    {children}
                </main>
            </div>
            {isPremium && <TourGuide run={runTour} setRun={setRunTour} userRole={user?.role} />}
        </div>
    )
}

export default Layout
