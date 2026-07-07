import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FiBell, FiCheck } from 'react-icons/fi'

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    const fetchNotifications = async () => {
        try {
            const [listRes, countRes] = await Promise.all([
                axios.get('/api/notifications?limit=5'),
                axios.get('/api/notifications/unread-count')
            ])
            setNotifications(listRes.data.notifications)
            setUnreadCount(countRes.data.count)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const markAsRead = async (id, link) => {
        try {
            await axios.put(`/api/notifications/${id}/read`)
            // Update local state
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ))
            setUnreadCount(prev => Math.max(0, prev - 1))

            if (link) {
                navigate(link)
                setShowDropdown(false)
            }
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const markAllRead = async () => {
        try {
            await axios.put('/api/notifications/read-all')
            setNotifications(notifications.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all read:', error)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="admin-header-btn"
            >
                <FiBell size={20} />
                {unreadCount > 0 && (
                    <span className="admin-header-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-[99998]"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="admin-dropdown overflow-hidden animate-dashCardFadeIn">
                        <div className="admin-dropdown-header flex justify-between items-center">
                            <h3 className="font-bold text-white text-base">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                                    No new notifications
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        onClick={() => markAsRead(notification._id, notification.link)}
                                        className={`p-5 admin-dropdown-item cursor-pointer ${!notification.isRead ? 'unread' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm mb-1 line-clamp-1 ${!notification.isRead ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="h-2 w-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default NotificationBell
