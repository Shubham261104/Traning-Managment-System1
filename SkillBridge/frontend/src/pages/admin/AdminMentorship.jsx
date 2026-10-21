import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    FiVideo, FiCalendar, FiClock, FiSearch, FiFilter, FiUser,
    FiCheckCircle, FiXCircle, FiSliders, FiShield, FiFileText,
    FiToggleLeft, FiToggleRight, FiEdit, FiTrash2, FiX, FiCheck, FiRefreshCw
} from 'react-icons/fi'
import './AdminMentorship.css'

const AdminMentorship = () => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [activeTab, setActiveTab] = useState('sessions') // 'sessions' | 'settings' | 'instructors' | 'logs'

    // Form settings
    const [settingsForm, setSettingsForm] = useState({
        isEnabled: true,
        maxSessionsPerStudentPerWeek: 1,
        maxStudentsPerInstructor: 10,
        minNoticeHours: 24,
        cancellationWindowHours: 12,
        sessionDurationMinutes: 45
    })

    useEffect(() => {
        fetchAdminData()
    }, [])

    const fetchAdminData = async () => {
        try {
            setLoading(true)
            const res = await axios.get('/api/mentorship/admin/data')
            setData(res.data)
            if (res.data.settings) {
                setSettingsForm(res.data.settings)
            }
        } catch (err) {
            console.error('Error fetching admin mentorship data:', err)
            setError(err.response?.data?.message || 'Failed to load admin mentorship data.')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (sessionId, action, extra = {}) => {
        try {
            await axios.post(`/api/mentorship/admin/session/${sessionId}/action`, { action, ...extra })
            setSuccess(`Action '${action}' executed successfully.`)
            await fetchAdminData()
        } catch (err) {
            setError(err.response?.data?.message || 'Action failed.')
        }
    }

    const handleSaveSettings = async (e) => {
        e.preventDefault()
        try {
            await axios.put('/api/mentorship/admin/settings', settingsForm)
            setSuccess('Global mentorship settings saved!')
            await fetchAdminData()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings.')
        }
    }

    const handleToggleInstructor = async (instructorId, currentStatus) => {
        try {
            await axios.put(`/api/mentorship/admin/instructor/${instructorId}/toggle`, { isEnabled: !currentStatus })
            setSuccess('Instructor mentorship status updated!')
            await fetchAdminData()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to toggle status.')
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    )

    const stats = data?.stats || {}
    const sessions = data?.sessions || []
    const instructors = data?.instructors || []
    const auditLogs = data?.auditLogs || []

    const filteredSessions = sessions.filter(s => {
        const studName = `${s.student?.profile?.firstName || ''} ${s.student?.profile?.lastName || ''}`.toLowerCase()
        const instName = `${s.instructor?.profile?.firstName || ''} ${s.instructor?.profile?.lastName || ''}`.toLowerCase()
        const topic = (s.topic || '').toLowerCase()
        const search = searchQuery.toLowerCase()

        const matchesSearch = studName.includes(search) || instName.includes(search) || topic.includes(search)
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="p-8 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/60 border border-white/10 rounded-3xl relative overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-widest">
                                Admin Control Panel
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                            Mentorship System Management
                        </h1>
                        <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
                            Monitor platform-wide mentorship sessions, enforce booking limits, enable/disable instructors, and adjust global configuration.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchAdminData}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 text-xs font-bold"
                        >
                            <FiRefreshCw /> Refresh Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="p-1 hover:bg-white/10 rounded-lg"><FiX /></button>
                </div>
            )}
            {success && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-200 text-sm flex justify-between items-center">
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="p-1 hover:bg-white/10 rounded-lg"><FiX /></button>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="p-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-md">
                    <div className="text-slate-300 text-xs font-extrabold uppercase tracking-wider mb-1">Total Requests</div>
                    <div className="text-2xl font-black text-white">{stats.totalRequests || 0}</div>
                </div>
                <div className="p-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-md">
                    <div className="text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-1">Pending</div>
                    <div className="text-2xl font-black text-amber-300">{stats.pendingCount || 0}</div>
                </div>
                <div className="p-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-md">
                    <div className="text-emerald-400 text-xs font-extrabold uppercase tracking-wider mb-1">Approved</div>
                    <div className="text-2xl font-black text-emerald-300">{stats.approvedCount || 0}</div>
                </div>
                <div className="p-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-md">
                    <div className="text-indigo-400 text-xs font-extrabold uppercase tracking-wider mb-1">Completed</div>
                    <div className="text-2xl font-black text-indigo-300">{stats.completedCount || 0}</div>
                </div>
                <div className="p-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-md">
                    <div className="text-red-400 text-xs font-extrabold uppercase tracking-wider mb-1">Cancelled</div>
                    <div className="text-2xl font-black text-red-300">{stats.cancelledCount || 0}</div>
                </div>
                <div className="p-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-md">
                    <div className="text-purple-400 text-xs font-extrabold uppercase tracking-wider mb-1">Active Mentors</div>
                    <div className="text-2xl font-black text-purple-300">{stats.activeMentors || 0}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700/80 gap-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={`pb-4 text-base font-extrabold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'sessions' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <FiCalendar size={18} /> Sessions Master Table ({sessions.length})
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-4 text-base font-extrabold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'settings' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <FiSliders size={18} /> Global System Rules
                </button>
                <button
                    onClick={() => setActiveTab('instructors')}
                    className={`pb-4 text-base font-extrabold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'instructors' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <FiUser size={18} /> Instructor Permissions ({instructors.length})
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`pb-4 text-base font-extrabold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'logs' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <FiShield size={18} /> Audit Log ({auditLogs.length})
                </button>
            </div>

            {/* TAB 1: SESSIONS MASTER TABLE */}
            {activeTab === 'sessions' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-md">
                        <div className="relative w-full md:w-96">
                            <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by student, instructor, or topic..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-400"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-full md:w-auto font-medium"
                        >
                            <option value="all" className="bg-slate-900 text-white">All Statuses</option>
                            <option value="pending" className="bg-slate-900 text-white">Pending</option>
                            <option value="approved" className="bg-slate-900 text-white">Approved</option>
                            <option value="scheduled" className="bg-slate-900 text-white">Scheduled</option>
                            <option value="completed" className="bg-slate-900 text-white">Completed</option>
                            <option value="cancelled" className="bg-slate-900 text-white">Cancelled</option>
                            <option value="rejected" className="bg-slate-900 text-white">Rejected</option>
                        </select>
                    </div>

                    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-200 text-xs font-black uppercase tracking-wider border-b border-slate-700">
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Instructor</th>
                                        <th className="p-4">Topic & Date</th>
                                        <th className="p-4">Time Slot</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Admin Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
                                    {filteredSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-300 font-medium">
                                                No sessions found matching filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSessions.map(s => {
                                            const studName = `${s.student?.profile?.firstName || 'Student'} ${s.student?.profile?.lastName || ''}`
                                            const instName = `${s.instructor?.profile?.firstName || 'Instructor'} ${s.instructor?.profile?.lastName || ''}`

                                            return (
                                                <tr key={s._id} className="hover:bg-slate-800/60 transition-colors">
                                                    <td className="p-4 font-extrabold text-white">{studName}</td>
                                                    <td className="p-4 text-indigo-300 font-bold">{instName}</td>
                                                    <td className="p-4">
                                                        <div className="font-extrabold text-white max-w-xs truncate">{s.topic}</div>
                                                        <div className="text-xs text-slate-300 font-medium">{new Date(s.date).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="p-4 font-bold text-slate-200">{s.timeSlot}</td>
                                                    <td className="p-4">
                                                        {getStatusBadge(s.status)}
                                                    </td>
                                                    <td className="p-4 text-right space-x-2">
                                                        {s.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleAction(s._id, 'approve')}
                                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs shadow-md"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        {['pending', 'approved', 'scheduled'].includes(s.status) && (
                                                            <button
                                                                onClick={() => handleAction(s._id, 'cancel', { reason: 'Admin override cancel' })}
                                                                className="px-3.5 py-1.5 bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900 rounded-lg text-xs font-bold"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: GLOBAL RULES */}
            {activeTab === 'settings' && (
                <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-8 max-w-2xl space-y-6 shadow-md text-slate-100">
                    <div>
                        <h3 className="text-xl font-extrabold text-white">Global Mentorship Rules & Controls</h3>
                        <p className="text-slate-300 text-xs font-medium mt-1">Configure global booking limits and cancellation policies for SkillBridge.</p>
                    </div>

                    <form onSubmit={handleSaveSettings} className="space-y-5">
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-700">
                            <div>
                                <h4 className="font-bold text-white text-sm">Enable Mentorship Globally</h4>
                                <p className="text-xs text-slate-300 font-medium">Master switch to turn on/off 1-to-1 mentorship across the platform.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettingsForm({ ...settingsForm, isEnabled: !settingsForm.isEnabled })}
                                className={`px-4 py-2 rounded-xl text-xs font-extrabold ${settingsForm.isEnabled ? 'bg-emerald-600 text-white shadow-md' : 'bg-red-950/80 text-red-300 border border-red-500/40'}`}
                            >
                                {settingsForm.isEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Max Sessions Per Student Per Week</label>
                            <input
                                type="number"
                                min={1}
                                max={5}
                                value={settingsForm.maxSessionsPerStudentPerWeek}
                                onChange={e => setSettingsForm({ ...settingsForm, maxSessionsPerStudentPerWeek: parseInt(e.target.value) || 1 })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Minimum Booking Notice (Hours)</label>
                            <input
                                type="number"
                                min={1}
                                value={settingsForm.minNoticeHours}
                                onChange={e => setSettingsForm({ ...settingsForm, minNoticeHours: parseInt(e.target.value) || 24 })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Session Duration (Minutes)</label>
                            <input
                                type="number"
                                min={15}
                                max={120}
                                value={settingsForm.sessionDurationMinutes}
                                onChange={e => setSettingsForm({ ...settingsForm, sessionDurationMinutes: parseInt(e.target.value) || 45 })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-indigo-600/30"
                        >
                            Save System Rules
                        </button>
                    </form>
                </div>
            )}

            {/* TAB 3: INSTRUCTOR PERMISSIONS */}
            {activeTab === 'instructors' && (
                <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4 text-slate-100">
                    <h3 className="text-xl font-extrabold text-white">Individual Instructor Mentorship Permissions</h3>
                    <div className="space-y-3">
                        {instructors.map(inst => (
                            <div key={inst._id} className="p-4 bg-slate-950 border border-slate-700 rounded-xl flex justify-between items-center">
                                <div>
                                    <h4 className="font-extrabold text-white text-sm">{inst.firstName} {inst.lastName}</h4>
                                    <p className="text-xs text-slate-300 font-medium">{inst.email}</p>
                                </div>
                                <button
                                    onClick={() => handleToggleInstructor(inst._id, inst.isEnabled)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${inst.isEnabled ? 'bg-emerald-600 text-white' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}
                                >
                                    {inst.isEnabled ? 'Mentorship Active' : 'Mentorship Disabled'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: AUDIT LOG */}
            {activeTab === 'logs' && (
                <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-md">
                    <h3 className="text-xl font-extrabold text-white">Mentorship System Audit Trail</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {auditLogs.map(log => (
                            <div key={log._id} className="p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-xs flex justify-between items-center">
                                <div>
                                    <span className="font-extrabold text-indigo-400 uppercase tracking-wider mr-2">[{log.action}]</span>
                                    <span className="text-slate-200 font-medium">{log.details}</span>
                                </div>
                                <span className="text-slate-400 font-semibold text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminMentorship
