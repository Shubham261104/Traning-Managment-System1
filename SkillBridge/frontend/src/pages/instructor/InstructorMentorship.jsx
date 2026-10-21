import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    FiVideo, FiCalendar, FiClock, FiUser, FiCheckCircle,
    FiXCircle, FiFileText, FiPlus, FiTrash2, FiEdit2, FiCheck,
    FiX, FiAward, FiSettings, FiBookOpen, FiExternalLink, FiShare2
} from 'react-icons/fi'
import MentorshipRoomModal from '../../components/MentorshipRoomModal'
import './InstructorMentorship.css'

const InstructorMentorship = () => {
    const [sessions, setSessions] = useState([])
    const [availability, setAvailability] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Navigation Tabs
    const [activeTab, setActiveTab] = useState('requests') // 'requests' | 'schedule'
    const [sessionFilter, setSessionFilter] = useState('pending') // 'pending' | 'upcoming' | 'completed' | 'cancelled'

    // Reschedule Modal
    const [rescheduleSession, setRescheduleSession] = useState(null)
    const [rescheduleDate, setRescheduleDate] = useState('')
    const [rescheduleSlot, setRescheduleSlot] = useState('')

    // Complete Session Modal
    const [completeSession, setCompleteSession] = useState(null)
    const [notes, setNotes] = useState('')
    const [feedback, setFeedback] = useState('')
    const [followUp, setFollowUp] = useState('')
    const [resourcesText, setResourcesText] = useState('')

    // Live Virtual Room Modal
    const [activeRoomSession, setActiveRoomSession] = useState(null)

    // Schedule Editor
    const [weeklySlots, setWeeklySlots] = useState([])
    const [newDay, setNewDay] = useState('Monday')
    const [newTimeSlot, setNewTimeSlot] = useState('10:00 AM - 11:00 AM')
    const [isMentorshipEnabled, setIsMentorshipEnabled] = useState(true)

    useEffect(() => {
        fetchInstructorData()
    }, [])

    const fetchInstructorData = async () => {
        try {
            setLoading(true)
            const [sessRes, availRes] = await Promise.all([
                axios.get('/api/mentorship/instructor/sessions'),
                axios.get('/api/mentorship/instructor/availability')
            ])
            setSessions(sessRes.data || [])
            setAvailability(availRes.data || {})
            setWeeklySlots(availRes.data?.weeklySlots || [])
            setIsMentorshipEnabled(availRes.data?.isEnabled !== false)
        } catch (err) {
            console.error('Error loading instructor mentorship data:', err)
            setError(err.response?.data?.message || 'Failed to load mentorship information.')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (sessionId) => {
        try {
            await axios.post(`/api/mentorship/session/${sessionId}/approve`)
            setSuccess('Mentorship request approved!')
            await fetchInstructorData()
        } catch (err) {
            setError(err.response?.data?.message || 'Approval failed.')
        }
    }

    const handleReject = async (sessionId) => {
        const reason = prompt('Reason for rejecting mentorship request:')
        if (reason === null) return
        try {
            await axios.post(`/api/mentorship/session/${sessionId}/reject`, { reason })
            setSuccess('Request rejected.')
            await fetchInstructorData()
        } catch (err) {
            setError(err.response?.data?.message || 'Rejection failed.')
        }
    }

    const handleRescheduleSubmit = async (e) => {
        e.preventDefault()
        if (!rescheduleSession || !rescheduleDate || !rescheduleSlot) return
        try {
            await axios.post(`/api/mentorship/session/${rescheduleSession._id}/reschedule`, {
                date: rescheduleDate,
                timeSlot: rescheduleSlot
            })
            setSuccess('Mentorship session rescheduled and student notified.')
            setRescheduleSession(null)
            await fetchInstructorData()
        } catch (err) {
            setError(err.response?.data?.message || 'Reschedule failed.')
        }
    }

    const handleCompleteSubmit = async (e) => {
        e.preventDefault()
        if (!completeSession) return
        try {
            const resources = resourcesText.split('\n').filter(Boolean).map(line => {
                const parts = line.split('|')
                return { title: parts[0]?.trim() || 'Resource Link', url: parts[1]?.trim() || line.trim() }
            })

            await axios.post(`/api/mentorship/session/${completeSession._id}/complete`, {
                notes,
                feedback,
                resources,
                followUpAction: followUp
            })
            setSuccess('Mentorship session marked as completed!')
            setCompleteSession(null)
            await fetchInstructorData()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete session.')
        }
    }

    const handleAddSlot = () => {
        const updated = [...weeklySlots, { day: newDay, timeSlot: newTimeSlot, isActive: true }]
        setWeeklySlots(updated)
    }

    const handleRemoveSlot = (index) => {
        const updated = weeklySlots.filter((_, i) => i !== index)
        setWeeklySlots(updated)
    }

    const handleSaveSchedule = async () => {
        try {
            await axios.put('/api/mentorship/instructor/availability', {
                weeklySlots,
                isEnabled: isMentorshipEnabled
            })
            setSuccess('Mentorship availability schedule updated!')
            await fetchInstructorData()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update schedule.')
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    )

    const pendingRequests = sessions.filter(s => s.status === 'pending')
    const upcomingSessions = sessions.filter(s => ['approved', 'scheduled'].includes(s.status))
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const cancelledSessions = sessions.filter(s => ['cancelled', 'rejected'].includes(s.status))

    const displayedSessions = sessionFilter === 'pending' ? pendingRequests :
        sessionFilter === 'upcoming' ? upcomingSessions :
            sessionFilter === 'completed' ? completedSessions : cancelledSessions

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="p-8 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/60 border border-white/10 rounded-3xl relative overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-widest">
                                Instructor Mentorship Hub
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                            1-to-1 Student Guidance & Sessions
                        </h1>
                        <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
                            Manage student mentorship requests, define your weekly availability slots, conduct live 1-to-1 video sessions, and provide feedback.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                        <span className="text-xs font-bold text-slate-300">Mentorship Status:</span>
                        <button
                            onClick={() => setIsMentorshipEnabled(!isMentorshipEnabled)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isMentorshipEnabled ? 'bg-emerald-600 text-white' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}
                        >
                            {isMentorshipEnabled ? 'Active (Accepting Requests)' : 'Disabled'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center gap-4 shadow-md">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl font-bold">
                        <FiClock />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">{pendingRequests.length}</div>
                        <div className="text-xs text-slate-300 font-semibold">Pending Requests</div>
                    </div>
                </div>

                <div className="p-6 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center gap-4 shadow-md">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl font-bold">
                        <FiCalendar />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">{upcomingSessions.length}</div>
                        <div className="text-xs text-slate-300 font-semibold">Upcoming Sessions</div>
                    </div>
                </div>

                <div className="p-6 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center gap-4 shadow-md">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-2xl font-bold">
                        <FiAward />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">{completedSessions.length}</div>
                        <div className="text-xs text-slate-300 font-semibold">Completed Sessions</div>
                    </div>
                </div>

                <div className="p-6 bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center gap-4 shadow-md">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-2xl font-bold">
                        <FiSettings />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">{weeklySlots.length}</div>
                        <div className="text-xs text-slate-300 font-semibold">Active Weekly Slots</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex border-b border-slate-700/80 gap-8">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-4 text-base font-extrabold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'requests' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <FiCalendar size={18} /> Student Requests & Sessions ({sessions.length})
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`pb-4 text-base font-extrabold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'schedule' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <FiSettings size={18} /> Weekly Availability Schedule
                </button>
            </div>

            {/* TAB 1: SESSIONS & REQUESTS */}
            {activeTab === 'requests' && (
                <div className="space-y-6">
                    <div className="flex gap-2 border-b border-slate-700/80 pb-4 overflow-x-auto">
                        <button
                            onClick={() => setSessionFilter('pending')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sessionFilter === 'pending' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'}`}
                        >
                            Pending ({pendingRequests.length})
                        </button>
                        <button
                            onClick={() => setSessionFilter('upcoming')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sessionFilter === 'upcoming' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'}`}
                        >
                            Upcoming ({upcomingSessions.length})
                        </button>
                        <button
                            onClick={() => setSessionFilter('completed')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sessionFilter === 'completed' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'}`}
                        >
                            Completed ({completedSessions.length})
                        </button>
                        <button
                            onClick={() => setSessionFilter('cancelled')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sessionFilter === 'cancelled' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'}`}
                        >
                            Cancelled / Rejected ({cancelledSessions.length})
                        </button>
                    </div>

                    {displayedSessions.length === 0 ? (
                        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-700 text-slate-300">
                            <FiCalendar size={48} className="mx-auto mb-3 text-slate-500" />
                            <h4 className="text-lg font-bold text-white mb-1">No Mentorship Sessions Found</h4>
                            <p className="text-sm text-slate-300">There are no records in this view.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayedSessions.map(session => {
                                const studName = `${session.student?.profile?.firstName || 'Student'} ${session.student?.profile?.lastName || ''}`
                                const studEmail = session.student?.email || ''

                                return (
                                    <div key={session._id} className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-md hover:border-slate-600 transition-all">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(session.status)}
                                                <span className="text-xs text-slate-300 font-semibold">
                                                    Requested: {new Date(session.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-extrabold text-white">
                                                Topic: <span className="text-slate-100">{session.topic}</span>
                                            </h3>

                                            <div className="flex flex-wrap gap-4 text-xs text-slate-200">
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <FiUser className="text-indigo-400" /> Student: <strong className="text-white">{studName}</strong> ({studEmail})
                                                </span>
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <FiCalendar className="text-indigo-400" /> Date: <strong className="text-white">{new Date(session.date).toLocaleDateString()}</strong>
                                                </span>
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <FiClock className="text-indigo-400" /> Slot: <strong className="text-white">{session.timeSlot}</strong>
                                                </span>
                                                {session.course && (
                                                    <span className="flex items-center gap-1.5 font-medium">
                                                        <FiBookOpen className="text-indigo-400" /> Course: <strong className="text-white">{session.course.title}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                                            {session.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(session._id)}
                                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                                                    >
                                                        <FiCheck size={16} /> Accept & Approve
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setRescheduleSession(session)
                                                            setRescheduleDate(new Date(session.date).toISOString().split('T')[0])
                                                            setRescheduleSlot(session.timeSlot)
                                                        }}
                                                        className="px-4 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Reschedule
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(session._id)}
                                                        className="px-4 py-2.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {['approved', 'scheduled'].includes(session.status) && (
                                                <>
                                                    <button
                                                        onClick={() => setActiveRoomSession(session)}
                                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                                                    >
                                                        <FiVideo size={16} /> Start Live Room
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setCompleteSession(session)
                                                            setNotes(session.notes || '')
                                                            setFeedback(session.feedback || '')
                                                            setFollowUp(session.followUpAction || '')
                                                            setResourcesText('')
                                                        }}
                                                        className="px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl text-xs font-extrabold shadow-lg transition-all"
                                                    >
                                                        Mark Complete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: WEEKLY SCHEDULE EDITOR */}
            {activeTab === 'schedule' && (
                <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-8 space-y-6 shadow-md">
                    <div>
                        <h3 className="text-xl font-extrabold text-white">Define Weekly Mentorship Availability</h3>
                        <p className="text-slate-300 text-xs font-medium mt-1">Students will be able to select from these time slots when booking sessions with you.</p>
                    </div>

                    {/* Add Slot Control */}
                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-700 flex flex-col sm:flex-row gap-4 items-center">
                        <select
                            value={newDay}
                            onChange={e => setNewDay(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-auto font-medium"
                        >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
                            ))}
                        </select>

                        <select
                            value={newTimeSlot}
                            onChange={e => setNewTimeSlot(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-auto font-medium"
                        >
                            <option value="09:00 AM - 10:00 AM" className="bg-slate-900 text-white">09:00 AM - 10:00 AM</option>
                            <option value="10:00 AM - 11:00 AM" className="bg-slate-900 text-white">10:00 AM - 11:00 AM</option>
                            <option value="11:00 AM - 12:00 PM" className="bg-slate-900 text-white">11:00 AM - 12:00 PM</option>
                            <option value="02:00 PM - 03:00 PM" className="bg-slate-900 text-white">02:00 PM - 03:00 PM</option>
                            <option value="04:00 PM - 05:00 PM" className="bg-slate-900 text-white">04:00 PM - 05:00 PM</option>
                            <option value="06:00 PM - 07:00 PM" className="bg-slate-900 text-white">06:00 PM - 07:00 PM</option>
                        </select>

                        <button
                            type="button"
                            onClick={handleAddSlot}
                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center shadow-md"
                        >
                            <FiPlus size={16} /> Add Slot
                        </button>
                    </div>

                    {/* Active Slots Table */}
                    <div className="space-y-2.5">
                        {weeklySlots.map((slot, idx) => (
                            <div key={idx} className="p-4 bg-slate-950 border border-slate-700/80 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold">
                                        {slot.day}
                                    </span>
                                    <span className="text-sm font-bold text-white">{slot.timeSlot}</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveSlot(idx)}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Remove Slot"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSaveSchedule}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/30"
                    >
                        Save Availability Schedule
                    </button>
                </div>
            )}

            {/* RESCHEDULE MODAL */}
            {rescheduleSession && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 text-slate-100">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                            <h3 className="font-extrabold text-white text-lg">Reschedule Mentorship Session</h3>
                            <button onClick={() => setRescheduleSession(null)} className="p-1 text-slate-400 hover:text-white"><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">New Date</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={rescheduleDate}
                                    onChange={e => setRescheduleDate(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">New Time Slot</label>
                                <select
                                    value={rescheduleSlot}
                                    onChange={e => setRescheduleSlot(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                                    required
                                >
                                    {weeklySlots.map((s, idx) => (
                                        <option key={idx} value={s.timeSlot} className="bg-slate-900 text-white">{s.day} - {s.timeSlot}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setRescheduleSession(null)} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-extrabold rounded-xl text-xs shadow-md">Confirm Reschedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* COMPLETE SESSION MODAL */}
            {completeSession && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-slate-100">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                            <h3 className="font-extrabold text-white text-lg">Complete Mentorship & Add Notes</h3>
                            <button onClick={() => setCompleteSession(null)} className="p-1 text-slate-400 hover:text-white"><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleCompleteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Session Notes & Guidance</label>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Summary of topics discussed and key solutions..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Student Performance & Feedback</label>
                                <textarea
                                    rows={2}
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="Encouragement, areas of improvement..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Recommended Resource Links (Title | URL per line)</label>
                                <textarea
                                    rows={3}
                                    value={resourcesText}
                                    onChange={e => setResourcesText(e.target.value)}
                                    placeholder="React Docs | https://react.dev&#10;Architecture Guide | https://example.com"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-mono text-[11px]"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setCompleteSession(null)} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md">Save & Complete</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIVE VIRTUAL ROOM */}
            {activeRoomSession && (
                <MentorshipRoomModal
                    session={activeRoomSession}
                    onClose={() => setActiveRoomSession(null)}
                    userRole="instructor"
                    onComplete={() => {
                        setActiveRoomSession(null)
                        setCompleteSession(activeRoomSession)
                    }}
                />
            )}
        </div>
    )
}

export default InstructorMentorship
