import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FiX, FiAlertCircle, FiInfo, FiCheckCircle, FiVolume2 } from 'react-icons/fi'

const AnnouncementNotifications = () => {
    const [announcements, setAnnouncements] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnnouncements()
        fetchUnreadCount()
        // Poll for new announcements every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount()
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get('/api/announcements?limit=10')
            setAnnouncements(res.data)
        } catch (error) {
            console.error('Error fetching announcements:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get('/api/announcements/unread-count')
            setUnreadCount(res.data.count)
        } catch (error) {
            console.error('Error fetching unread count:', error)
        }
    }

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/announcements/${id}/read`)
            setAnnouncements(announcements.map(a =>
                a._id === id ? { ...a, isRead: true } : a
            ))
            setUnreadCount(Math.max(0, unreadCount - 1))
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high':
                return <FiAlertCircle className="text-red-500" size={20} />
            case 'medium':
                return <FiInfo className="text-blue-500" size={20} />
            case 'low':
                return <FiCheckCircle className="text-green-500" size={20} />
            default:
                return <FiInfo className="text-blue-500" size={20} />
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'border-l-4 border-red-500 bg-red-50'
            case 'medium':
                return 'border-l-4 border-blue-500 bg-blue-50'
            case 'low':
                return 'border-l-4 border-green-500 bg-green-50'
            default:
                return 'border-l-4 border-gray-500 bg-gray-50'
        }
    }

    const formatDate = (date) => {
        const now = new Date()
        const announcementDate = new Date(date)
        const diffInHours = Math.floor((now - announcementDate) / (1000 * 60 * 60))

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - announcementDate) / (1000 * 60))
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
        } else {
            return announcementDate.toLocaleDateString()
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="admin-header-btn"
                title="Announcements"
            >
                <FiVolume2 size={20} />
                {unreadCount > 0 && (
                    <span className="admin-header-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <>
                    <div
                        className="fixed inset-0 z-[99998]"
                        onClick={() => setShowNotifications(false)}
                    />
                    <div className="admin-dropdown max-h-[600px] overflow-hidden flex flex-col animate-dashCardFadeIn">
                        <div className="admin-dropdown-header flex items-center justify-between">
                            <h3 className="font-bold text-white text-base">Announcements</h3>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="text-[#94a3b8] hover:text-white transition-colors p-1"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center p-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="p-12 text-center">
                                    <FiVolume2 size={48} className="mx-auto mb-4 text-[#475569] opacity-50" />
                                    <p className="text-[#94a3b8] font-medium">No bulletins available</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {announcements.map((announcement) => (
                                        <div
                                            key={announcement._id}
                                            className={`admin-dropdown-item cursor-pointer ${!announcement.isRead ? 'unread' : ''
                                                }`}
                                            onClick={() => !announcement.isRead && markAsRead(announcement._id)}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getPriorityIcon(announcement.priority)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1 gap-2">
                                                        <h4 className={`text-sm truncate ${!announcement.isRead ? 'font-bold text-white' : 'font-semibold text-slate-200'
                                                            }`}>
                                                            {announcement.title}
                                                        </h4>
                                                        {!announcement.isRead && (
                                                            <span className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-300 mb-3 line-clamp-2 leading-relaxed">
                                                        {announcement.message}
                                                    </p>
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <span className="truncate">
                                                            {announcement.sender?.profile?.firstName} {announcement.sender?.profile?.lastName}
                                                            {announcement.course && ` • ${announcement.course.title}`}
                                                        </span>
                                                        <span className="flex-shrink-0">{formatDate(announcement.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {announcements.length > 0 && (
                            <div className="p-4 admin-dropdown-header bg-white/0 border-t border-white/5">
                                <Link
                                    to="/admin/announcements"
                                    onClick={() => setShowNotifications(false)}
                                    className="block w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors"
                                >
                                    View Repository
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default AnnouncementNotifications
