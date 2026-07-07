import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiBell, FiTrash2, FiAlertCircle, FiTarget, FiCalendar, FiPlus, FiX, FiUsers, FiSend, FiLayers, FiMessageSquare } from 'react-icons/fi'
import './AdminPremium.css'

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([])
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        recipientType: 'everyone',
        course: '',
        priority: 'medium',
        scheduledAt: new Date().toISOString().slice(0, 16)
    })
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [announcementsRes, coursesRes] = await Promise.all([
                axios.get('/api/announcements/sent'),
                axios.get('/api/courses')
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

        if (formData.recipientType === 'course' && !formData.course) {
            setError('Please select a course')
            return
        }

        setSending(true)
        try {
            await axios.post('/api/announcements', formData)
            setSuccess('Announcement sent successfully!')
            setShowModal(false)
            setFormData({
                title: '',
                message: '',
                recipientType: 'everyone',
                course: '',
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
            setSuccess('Announcement deleted successfully')
            setTimeout(() => setSuccess(''), 3000)
        } catch (error) {
            console.error('Error deleting announcement:', error)
            setError('Failed to delete announcement')
        }
    }

    const getRecipientLabel = (announcement) => {
        switch (announcement.recipientType) {
            case 'everyone':
                return 'Everyone'
            case 'instructors':
                return 'All Instructors'
            case 'students':
                return 'All Students'
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
                <header className="mb-16 relative">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                    <FiBell className="animate-pulse" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400/80">SkillBridge Admin</span>
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight">
                                <span className="text-premium-gradient">Announcements</span>
                            </h1>
                            <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Broadcast information across the SkillBridge ecosystem.</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="admin-premium-btn flex items-center gap-3 px-8 py-5 shadow-2xl shadow-indigo-500/20 group/btn"
                        >
                            <div className="bg-white/20 p-2 rounded-lg group-hover/btn:rotate-90 transition-transform">
                                <FiPlus size={20} />
                            </div>
                            <span className="font-black uppercase tracking-widest text-sm">Create New Announcement</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-12">
                        <div className="admin-glass-card p-10 border-white/5 relative overflow-hidden group">
                            <div className="flex items-center gap-5 mb-12">
                                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                    <FiSend className="animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Sent Announcements</h2>
                                    <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mt-0.5">Historical Broadcast Registry</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {announcements.length === 0 ? (
                                    <div className="text-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 backdrop-blur-sm">
                                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-inner opacity-40">
                                            <FiBell size={40} className="text-white" />
                                        </div>
                                        <p className="text-white font-black text-xl uppercase tracking-tight mb-2">No Announcements Yet</p>
                                        <p className="text-[#64748b] text-[10px] font-black uppercase tracking-[0.2em]">The communication array is currently silent.</p>
                                    </div>
                                ) : (
                                    announcements.map((announcement, idx) => (
                                        <div
                                            key={announcement._id}
                                            className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] hover:bg-white/10 hover:border-indigo-500/20 transition-all group/item shadow-2xl relative overflow-hidden"
                                            style={{ animation: `dashCardFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards ${idx * 0.1}s` }}
                                        >
                                            <div className="flex items-start justify-between relative z-10">
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover/item:text-indigo-400 transition-colors">{announcement.title}</h3>
                                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-md ${announcement.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                            announcement.priority === 'medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            }`}>
                                                            {announcement.priority}
                                                        </div>
                                                        {new Date(announcement.scheduledAt) > new Date() && (
                                                            <div className="px-4 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                                                SCHEDULED
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[#94a3b8] mb-8 leading-relaxed font-medium italic text-lg transition-all line-clamp-2 group-hover/item:line-clamp-none">
                                                        "{announcement.message}"
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <FiTarget className="text-indigo-500" />
                                                            <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">{getRecipientLabel(announcement)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <FiCalendar className="text-indigo-500" />
                                                            <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <FiUsers className="text-indigo-500" />
                                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-1 rounded-lg border border-indigo-500/10">{announcement.readBy?.length || 0} READ BY</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(announcement._id)}
                                                    className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all border border-rose-500/20 shadow-lg shadow-rose-500/10"
                                                    title="Delete Announcement"
                                                >
                                                    <FiTrash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 admin-modal-overlay flex items-center justify-center z-50 p-4 backdrop-blur-md">
                        <div className="admin-modal-content max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-dashCardFadeIn shadow-[0_0_100px_rgba(79,70,229,0.2)]">
                            {/* Modal Header */}
                            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">Post Announcement</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">SkillBridge Communication Protocol</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-[#94a3b8] hover:bg-rose-500 hover:text-white transition-all border border-white/5">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 bg-[#0f172a]/80 custom-scrollbar">
                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-8">
                                            <section>
                                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <FiTarget size={16} /> Basic Calibration
                                                </h3>
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Title</label>
                                                        <input
                                                            type="text"
                                                            value={formData.title}
                                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                            className="admin-input"
                                                            placeholder="IDENTIFICATION TAG"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Send To</label>
                                                        <select
                                                            value={formData.recipientType}
                                                            onChange={(e) => setFormData({ ...formData, recipientType: e.target.value, course: '' })}
                                                            className="admin-input appearance-none"
                                                        >
                                                            <option value="everyone" className="bg-[#1e293b]">EVERYONE</option>
                                                            <option value="instructors" className="bg-[#1e293b]">ALL INSTRUCTORS</option>
                                                            <option value="students" className="bg-[#1e293b]">ALL STUDENTS</option>
                                                            <option value="course" className="bg-[#1e293b]">BY COURSE</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </section>

                                            {formData.recipientType === 'course' && (
                                                <section className="animate-dashCardFadeIn">
                                                    <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                        <FiLayers size={16} /> Course Selection
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Target Course</label>
                                                        <select
                                                            value={formData.course}
                                                            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                                            className="admin-input appearance-none"
                                                            required
                                                        >
                                                            <option value="" className="bg-[#1e293b]">CHOOSE CURRICULUM</option>
                                                            {courses.map(course => (
                                                                <option key={course._id} value={course._id} className="bg-[#1e293b]">
                                                                    {course.title}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </section>
                                            )}
                                        </div>

                                        <div className="space-y-8">
                                            <section>
                                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <FiTarget size={16} /> Signal Strength
                                                </h3>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Priority</label>
                                                        <select
                                                            value={formData.priority}
                                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                            className="admin-input appearance-none"
                                                        >
                                                            <option value="low" className="bg-[#1e293b]">LOW</option>
                                                            <option value="medium" className="bg-[#1e293b]">MEDIUM</option>
                                                            <option value="high" className="bg-[#1e293b]">HIGH</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Schedule</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="datetime-local"
                                                                value={formData.scheduledAt}
                                                                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                                                className="admin-input text-[#94a3b8] flex-1"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const now = new Date();
                                                                    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                                    setFormData({ ...formData, scheduledAt: localDateTime });
                                                                }}
                                                                className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap"
                                                            >
                                                                Now
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <FiMessageSquare size={16} /> Message Body
                                                </h3>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Announcement Content</label>
                                                    <textarea
                                                        value={formData.message}
                                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                        rows="6"
                                                        className="admin-input py-6 resize-none"
                                                        placeholder="BROADCAST PAYLOAD..."
                                                        required
                                                    />
                                                </div>
                                            </section>
                                        </div>
                                    </div>

                                    <div className="flex gap-6 pt-10 border-t border-white/5">
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            className="admin-premium-btn flex-1 py-6 shadow-2xl shadow-indigo-500/20"
                                        >
                                            {sending ? 'COMMUNICATING...' : 'Broadcast Announcement'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-12 py-6 bg-white/5 text-[#64748b] rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-white/10 hover:text-white border border-white/5"
                                        >
                                            Abort Protocol
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

export default AdminAnnouncements
