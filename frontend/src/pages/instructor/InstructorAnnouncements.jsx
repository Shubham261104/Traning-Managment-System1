import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiBell, FiSend, FiTrash2, FiAlertCircle, FiVolume2, FiTarget, FiClock, FiActivity } from 'react-icons/fi'
import '../admin/AdminPremium.css'

const InstructorAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([])
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        recipientType: 'students',
        courseId: '',
        priority: 'medium',
        scheduledAt: new Date().toISOString().slice(0, 16)
    })
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [announcementsRes, coursesRes] = await Promise.all([
                axios.get('/api/announcements/sent'),
                axios.get('/api/instructor/courses')
            ])
            setAnnouncements(announcementsRes.data)
            setCourses(coursesRes.data)
        } catch (error) {
            console.error('Error fetching data:', error)
            setError('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!formData.title || !formData.message) {
            setError('Title and message are required')
            return
        }

        if (formData.recipientType === 'course' && !formData.courseId) {
            setError('Please select a course')
            return
        }

        setSending(true)
        try {
            await axios.post('/api/announcements', formData)
            setSuccess('Announcement sent successfully!')
            setFormData({
                title: '',
                message: '',
                recipientType: 'students',
                courseId: '',
                priority: 'medium',
                scheduledAt: new Date().toISOString().slice(0, 16)
            })
            fetchData()
            setTimeout(() => setSuccess(''), 3000)
        } catch (error) {
            console.error('Error sending announcement:', error)
            setError(error.response?.data?.message || 'Failed to send announcement')
        } finally {
            setSending(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) {
            return
        }

        try {
            await axios.delete(`/api/announcements/${id}`)
            setAnnouncements(announcements.filter(a => a._id !== id))
        } catch (error) {
            console.error('Error deleting announcement:', error)
        }
    }

    const getRecipientLabel = (announcement) => {
        switch (announcement.recipientType) {
            case 'students':
                return 'All My Students'
            case 'course':
                return `Course: ${announcement.course?.title || 'Unknown'}`
            default:
                return announcement.recipientType
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500" />
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="space-y-10 pb-12 animate-dashCardFadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
                            Broadcast <span className="text-premium-gradient">Station</span>
                        </h1>
                        <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Disseminate critical updates to your learning network</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-center space-x-4 animate-dashCardFadeIn">
                        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                            <FiAlertCircle size={20} />
                        </div>
                        <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center space-x-4 animate-dashCardFadeIn">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                            <FiBell size={20} />
                        </div>
                        <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {/* Create Announcement Form */}
                    <div className="admin-glass-card p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/5">
                                <FiVolume2 size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Compose Transmission</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Transmission Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                                    placeholder="Brief descriptive heading"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Message Content</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none min-h-[160px]"
                                    placeholder="Detailed announcement parameters..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Destination</label>
                                    <select
                                        value={formData.recipientType}
                                        onChange={(e) => setFormData({ ...formData, recipientType: e.target.value, courseId: '' })}
                                        className="w-full px-5 py-4 bg-[#0f172a] border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                                    >
                                        <option value="students">Global: All Students</option>
                                        <option value="course">Scoped: Course Level</option>
                                    </select>
                                </div>

                                {formData.recipientType === 'course' && (
                                    <div className="animate-dashCardFadeIn">
                                        <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Target Course</label>
                                        <select
                                            value={formData.courseId}
                                            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                            className="w-full px-5 py-4 bg-[#0f172a] border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                                            required
                                        >
                                            <option value="">Select registry...</option>
                                            {courses.map((course) => (
                                                <option key={course._id} value={course._id}>{course.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Priority Ranking</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-5 py-4 bg-[#0f172a] border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                                    >
                                        <option value="low">Standard Priority</option>
                                        <option value="medium">Elevated Priority</option>
                                        <option value="high">Critical Alert</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Deployment Time</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="datetime-local"
                                                value={formData.scheduledAt}
                                                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                                            />
                                            <FiClock className="absolute right-5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const now = new Date();
                                                const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                setFormData({ ...formData, scheduledAt: localDateTime });
                                            }}
                                            className="px-4 py-4 bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/20 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap"
                                        >
                                            Now
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <FiSend />
                                <span>{sending ? 'Processing...' : 'Deploy Broadcast'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Sent Announcements */}
                    <div className="admin-glass-card p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-purple-400 border border-white/5">
                                <FiActivity size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Broadcast History</h2>
                        </div>

                        {announcements.length === 0 ? (
                            <div className="text-center py-20 opacity-50 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <FiVolume2 size={48} className="mx-auto mb-4 text-[#475569]" />
                                <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-[10px]">Registry Empty</p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                                {announcements.map((announcement, idx) => (
                                    <div
                                        key={announcement._id}
                                        className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all group animate-dashCardFadeIn"
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                                    <h3 className="font-black text-white text-lg uppercase tracking-tight truncate">{announcement.title}</h3>
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${announcement.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                        announcement.priority === 'medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        }`}>
                                                        {announcement.priority}
                                                    </span>
                                                </div>
                                                <p className="text-[#94a3b8] text-sm mb-6 leading-relaxed line-clamp-3">{announcement.message}</p>

                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <FiTarget className="text-indigo-500" size={12} />
                                                        <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">{getRecipientLabel(announcement)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FiClock className="text-purple-500" size={12} />
                                                        <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(announcement._id)}
                                                className="w-10 h-10 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <FiTrash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default InstructorAnnouncements
