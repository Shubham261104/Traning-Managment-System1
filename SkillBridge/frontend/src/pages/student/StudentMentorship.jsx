import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    FiVideo, FiCalendar, FiClock, FiSearch, FiFilter, FiUser,
    FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiBookOpen,
    FiAward, FiFileText, FiExternalLink, FiPlusCircle, FiX,
    FiStar, FiMessageSquare
} from 'react-icons/fi'
import MentorshipRoomModal from '../../components/MentorshipRoomModal'
import './StudentMentorship.css'

const StudentMentorship = () => {
    const [instructors, setInstructors] = useState([])
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCourseFilter, setSelectedCourseFilter] = useState('all')
    const [activeTab, setActiveTab] = useState('book') // 'book' | 'sessions'
    const [sessionFilter, setSessionFilter] = useState('all') // 'all' | 'pending' | 'approved' | 'completed' | 'cancelled'

    // Booking Modal
    const [selectedInstructor, setSelectedInstructor] = useState(null)
    const [bookingDate, setBookingDate] = useState('')
    const [bookingTimeSlot, setBookingTimeSlot] = useState('')
    const [bookingCourseId, setBookingCourseId] = useState('')
    const [bookingTopic, setBookingTopic] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Active Room Modal
    const [activeRoomSession, setActiveRoomSession] = useState(null)
    const [viewNotesSession, setViewNotesSession] = useState(null)

    useEffect(() => {
        fetchMentorshipData()
    }, [])

    const fetchMentorshipData = async () => {
        try {
            setLoading(true)
            const [instRes, histRes] = await Promise.all([
                axios.get('/api/mentorship/instructors'),
                axios.get('/api/mentorship/student/history')
            ])
            setInstructors(instRes.data || [])
            setHistory(histRes.data || [])
        } catch (err) {
            console.error('Error fetching mentorship data:', err)
            setError(err.response?.data?.message || 'Failed to load mentorship information.')
        } finally {
            setLoading(false)
        }
    }

    // Filtered Instructors
    const filteredInstructors = instructors.filter(inst => {
        const fullName = `${inst.firstName} ${inst.lastName}`.toLowerCase()
        const spec = (inst.specialization || '').toLowerCase()
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || spec.includes(searchQuery.toLowerCase())
        const matchesCourse = selectedCourseFilter === 'all' || inst.courses.some(c => c._id === selectedCourseFilter)
        return matchesSearch && matchesCourse
    })

    // Courses for filter dropdown
    const allCourses = Array.from(
        new Map(instructors.flatMap(i => i.courses).map(c => [c._id, c])).values()
    )

    // Filtered History
    const filteredHistory = history.filter(s => {
        if (sessionFilter === 'all') return true
        if (sessionFilter === 'approved') return ['approved', 'scheduled'].includes(s.status)
        if (sessionFilter === 'cancelled') return ['cancelled', 'rejected'].includes(s.status)
        return s.status === sessionFilter
    })

    // Check if student has an active/pending session this week
    const hasBookedThisWeek = history.some(s => {
        if (['cancelled', 'rejected'].includes(s.status)) return false
        const sDate = new Date(s.date)
        const now = new Date()
        const diffDays = Math.abs(now - sDate) / (1000 * 60 * 60 * 24)
        return diffDays <= 7
    })

    const handleOpenBookingModal = (instructor) => {
        setError('')
        setSuccess('')
        setSelectedInstructor(instructor)
        setBookingDate('')
        setBookingTimeSlot('')
        setBookingCourseId(instructor.courses[0]?._id || '')
        setBookingTopic('')
    }

    const handleBookingSubmit = async (e) => {
        e.preventDefault()
        if (!selectedInstructor || !bookingDate || !bookingTimeSlot || !bookingTopic.trim()) {
            setError('Please fill in all booking fields.')
            return
        }

        try {
            setIsSubmitting(true)
            setError('')
            await axios.post('/api/mentorship/request', {
                instructorId: selectedInstructor._id,
                courseId: bookingCourseId || null,
                date: bookingDate,
                timeSlot: bookingTimeSlot,
                topic: bookingTopic
            })
            setSuccess('Mentorship session request submitted successfully! Instructor has been notified.')
            setSelectedInstructor(null)
            await fetchMentorshipData()
            setActiveTab('sessions')
        } catch (err) {
            console.error('Booking failed:', err)
            setError(err.response?.data?.message || 'Failed to submit mentorship request.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelSession = async (sessionId) => {
        const reason = prompt('Please provide a reason for cancelling this session:')
        if (reason === null) return

        try {
            await axios.post(`/api/mentorship/student/cancel/${sessionId}`, { reason })
            setSuccess('Mentorship session cancelled.')
            await fetchMentorshipData()
        } catch (err) {
            console.error('Cancel failed:', err)
            setError(err.response?.data?.message || 'Failed to cancel session.')
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 w-fit"><FiClock /> Pending Approval</span>
            case 'approved':
            case 'scheduled':
                return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 w-fit"><FiCheckCircle /> Scheduled</span>
            case 'completed':
                return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 w-fit"><FiAward /> Completed</span>
            case 'rejected':
                return <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 w-fit"><FiXCircle /> Rejected</span>
            case 'cancelled':
                return <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 w-fit"><FiXCircle /> Cancelled</span>
            default:
                return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    )

    const pendingCount = history.filter(s => s.status === 'pending').length
    const upcomingCount = history.filter(s => ['approved', 'scheduled'].includes(s.status)).length
    const completedCount = history.filter(s => s.status === 'completed').length

    return (
        <div className="space-y-8 max-w-7xl mx-auto text-slate-800 pb-12">
            {/* Header Banner */}
            <div className="p-8 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/50 border border-indigo-100/80 rounded-3xl relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative z-10 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="px-3.5 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                            <FiVideo size={13} className="text-indigo-600" /> 1-TO-1 INTERACTIVE MENTORSHIP
                        </span>
                        {hasBookedThisWeek ? (
                            <span className="px-3.5 py-1 bg-amber-100/90 text-amber-800 border border-amber-300/80 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                                ⚠️ Weekly Limit Reached (1/1 Session)
                            </span>
                        ) : (
                            <span className="px-3.5 py-1 bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                                🟢 1 Session Available This Week
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        Connect with Expert Instructors
                    </h1>
                    <p className="text-slate-600 mt-2.5 text-sm leading-relaxed font-medium">
                        Book direct 1-to-1 guidance sessions with platform instructors to accelerate your learning, review complex topics, and resolve doubts.
                    </p>
                </div>

                {/* Right Hero Illustration Banner graphics */}
                <div className="hidden lg:flex items-center justify-center relative w-72 h-44 flex-shrink-0">
                    <div className="absolute inset-0 bg-indigo-200/40 rounded-full blur-2xl transform translate-x-4"></div>
                    <div className="relative z-10 bg-white/90 p-4 rounded-2xl border border-indigo-100 shadow-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                            <FiVideo size={22} />
                        </div>
                        <div>
                            <div className="text-xs font-black text-slate-900">Live 1-on-1 Room</div>
                            <div className="text-[11px] text-slate-500 font-semibold">HD Video & Whiteboard</div>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-extrabold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Ready to Connect
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex justify-between items-center shadow-sm">
                    <span className="font-semibold">{error}</span>
                    <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg text-red-500"><FiX /></button>
                </div>
            )}
            {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm flex justify-between items-center shadow-sm">
                    <span className="font-semibold">{success}</span>
                    <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-500"><FiX /></button>
                </div>
            )}

            {/* Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100/80 border border-purple-200/60 flex items-center justify-center text-purple-600 text-xl font-bold flex-shrink-0">
                        <FiUser />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">{instructors.length}</div>
                        <div className="text-xs text-slate-500 font-semibold">Active Instructors</div>
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-600 text-xl font-bold flex-shrink-0">
                        <FiClock />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
                        <div className="text-xs text-slate-500 font-semibold">Pending Requests</div>
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center text-emerald-600 text-xl font-bold flex-shrink-0">
                        <FiCalendar />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">{upcomingCount}</div>
                        <div className="text-xs text-slate-500 font-semibold">Upcoming Sessions</div>
                    </div>
                </div>

                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 border border-indigo-200/60 flex items-center justify-center text-indigo-600 text-xl font-bold flex-shrink-0">
                        <FiAward />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900">{completedCount}</div>
                        <div className="text-xs text-slate-500 font-semibold">Completed Sessions</div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200/80 gap-8">
                <button
                    onClick={() => setActiveTab('book')}
                    className={`pb-3.5 text-base font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'book' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <FiUser size={18} /> Browse & Book Instructors
                </button>
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={`pb-3.5 text-base font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'sessions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <FiCalendar size={18} /> My Mentorship Sessions ({history.length})
                </button>
            </div>

            {/* TAB 1: BROWSE INSTRUCTORS */}
            {activeTab === 'book' && (
                <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="relative w-full md:w-96">
                            <FiSearch className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by instructor name or specialization..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <FiFilter className="text-indigo-600" size={18} />
                            <select
                                value={selectedCourseFilter}
                                onChange={e => setSelectedCourseFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white w-full md:w-auto font-semibold cursor-pointer"
                            >
                                <option value="all">All Course Specializations</option>
                                {allCourses.map(c => (
                                    <option key={c._id} value={c._id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Instructor Cards Grid */}
                    {filteredInstructors.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 shadow-sm">
                            <FiUser size={48} className="mx-auto mb-3 text-slate-300" />
                            <h4 className="text-lg font-extrabold text-slate-800 mb-1">No Instructors Found</h4>
                            <p className="text-sm text-slate-500 font-medium">Try clearing search filters or checking back later.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredInstructors.map(inst => (
                                <div key={inst._id} className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group">
                                    <div>
                                        {/* Header / Avatar */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-md overflow-hidden flex-shrink-0">
                                                {inst.avatar ? (
                                                    <img src={inst.avatar} alt={inst.firstName} className="w-full h-full object-cover" />
                                                ) : (
                                                    `${inst.firstName?.charAt(0) || 'I'}${inst.lastName?.charAt(0) || ''}`
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                                                    {inst.firstName} {inst.lastName}
                                                </h3>
                                                <p className="text-xs text-indigo-600 font-bold">{inst.specialization || 'Senior Educator & Technical Expert'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="flex items-center gap-1 text-amber-700 text-xs font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                                                        <FiStar className="fill-amber-400 text-amber-500" size={12} /> {inst.rating || '4.9'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-semibold">• {inst.experience || '5+ Years Teaching'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Courses Taught */}
                                        <div className="mb-4">
                                            <div className="text-[11px] text-slate-400 font-black mb-1.5 uppercase tracking-wider">COURSES TAUGHT</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {inst.courses.map(c => (
                                                    <span key={c._id} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                                                        {c.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Weekly Available Slots Preview */}
                                        <div className="mb-6">
                                            <div className="text-[11px] text-indigo-600 font-black mb-2 uppercase tracking-wider flex items-center gap-1">
                                                <FiClock size={13} className="text-indigo-600" /> AVAILABLE WEEKLY SLOTS
                                            </div>
                                            <div className="space-y-1.5">
                                                {inst.weeklySlots && inst.weeklySlots.length > 0 ? (
                                                    inst.weeklySlots.slice(0, 3).map((slot, idx) => (
                                                        <div key={idx} className="text-xs bg-indigo-50/60 border border-indigo-100 text-slate-700 px-3.5 py-2 rounded-xl flex justify-between items-center font-medium">
                                                            <span className="font-bold text-indigo-700">{slot.day}</span>
                                                            <span className="text-slate-600 font-semibold">{slot.timeSlot}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <>
                                                        <div className="text-xs bg-indigo-50/60 border border-indigo-100 text-slate-700 px-3.5 py-2 rounded-xl flex justify-between items-center font-medium">
                                                            <span className="font-bold text-indigo-700">Monday</span>
                                                            <span className="text-slate-600 font-semibold">10:00 AM - 11:00 AM</span>
                                                        </div>
                                                        <div className="text-xs bg-indigo-50/60 border border-indigo-100 text-slate-700 px-3.5 py-2 rounded-xl flex justify-between items-center font-medium">
                                                            <span className="font-bold text-indigo-700">Wednesday</span>
                                                            <span className="text-slate-600 font-semibold">02:00 PM - 03:00 PM</span>
                                                        </div>
                                                        <div className="text-xs bg-indigo-50/60 border border-indigo-100 text-slate-700 px-3.5 py-2 rounded-xl flex justify-between items-center font-medium">
                                                            <span className="font-bold text-indigo-700">Friday</span>
                                                            <span className="text-slate-600 font-semibold">04:00 PM - 05:00 PM</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleOpenBookingModal(inst)}
                                        disabled={hasBookedThisWeek}
                                        className={`w-full py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${hasBookedThisWeek ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/80 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'}`}
                                    >
                                        <FiCalendar size={15} />
                                        {hasBookedThisWeek ? 'Weekly Limit Reached' : 'Book 1-to-1 Session'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: SESSIONS & HISTORY */}
            {activeTab === 'sessions' && (
                <div className="space-y-6">
                    {/* Status Filter */}
                    <div className="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
                        {['all', 'pending', 'approved', 'completed', 'cancelled'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setSessionFilter(tab)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all capitalize ${sessionFilter === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {filteredHistory.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 shadow-sm">
                            <FiCalendar size={48} className="mx-auto mb-3 text-slate-300" />
                            <h4 className="text-lg font-extrabold text-slate-800 mb-1">No Mentorship Sessions Found</h4>
                            <p className="text-sm text-slate-500 font-medium">You haven't booked any sessions matching this filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredHistory.map(session => {
                                const instName = `${session.instructor?.profile?.firstName || 'Instructor'} ${session.instructor?.profile?.lastName || ''}`
                                const canJoin = ['approved', 'scheduled'].includes(session.status)

                                return (
                                    <div key={session._id} className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm hover:border-slate-300 transition-all">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(session.status)}
                                                <span className="text-xs text-slate-500 font-semibold">
                                                    Requested on {new Date(session.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-black text-slate-900">
                                                Topic: <span className="text-slate-800">{session.topic}</span>
                                            </h3>

                                            <div className="flex flex-wrap gap-4 text-xs text-slate-600 font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    <FiUser className="text-indigo-600" /> Instructor: <strong className="text-slate-900">{instName}</strong>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <FiCalendar className="text-indigo-600" /> Date: <strong className="text-slate-900">{new Date(session.date).toLocaleDateString()}</strong>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <FiClock className="text-indigo-600" /> Time: <strong className="text-slate-900">{session.timeSlot}</strong>
                                                </span>
                                                {session.course && (
                                                    <span className="flex items-center gap-1.5">
                                                        <FiBookOpen className="text-indigo-600" /> Course: <strong className="text-slate-900">{session.course.title}</strong>
                                                    </span>
                                                )}
                                            </div>

                                            {session.rejectionReason && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                                                    <strong className="text-red-800">Rejection Reason:</strong> {session.rejectionReason}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                                            {canJoin && (
                                                <button
                                                    onClick={() => setActiveRoomSession(session)}
                                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20"
                                                >
                                                    <FiVideo size={16} /> Join Mentorship Room
                                                </button>
                                            )}

                                            {session.status === 'completed' && (
                                                <button
                                                    onClick={() => setViewNotesSession(session)}
                                                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                                >
                                                    <FiFileText size={16} /> View Notes & Feedback
                                                </button>
                                            )}

                                            {['pending', 'approved', 'scheduled'].includes(session.status) && (
                                                <button
                                                    onClick={() => handleCancelSession(session._id)}
                                                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all"
                                                >
                                                    Cancel Request
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* BOOKING MODAL */}
            {selectedInstructor && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-dashCardFadeIn text-slate-800">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 text-lg">Book 1-to-1 Mentorship</h3>
                            <button onClick={() => setSelectedInstructor(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"><FiX size={20} /></button>
                        </div>

                        <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">Selected Instructor</label>
                                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 font-extrabold text-sm">
                                    {selectedInstructor.firstName} {selectedInstructor.lastName} ({selectedInstructor.specialization || 'Technical Educator'})
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">Related Course (Optional)</label>
                                <select
                                    value={bookingCourseId}
                                    onChange={e => setBookingCourseId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                                >
                                    <option value="">General Technical Mentorship</option>
                                    {selectedInstructor.courses?.map(c => (
                                        <option key={c._id} value={c._id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">Preferred Date</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bookingDate}
                                        onChange={e => setBookingDate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">Available Time Slot</label>
                                    <select
                                        value={bookingTimeSlot}
                                        onChange={e => setBookingTimeSlot(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                                        required
                                    >
                                        <option value="">Select Time Slot</option>
                                        {selectedInstructor.weeklySlots && selectedInstructor.weeklySlots.length > 0 ? (
                                            selectedInstructor.weeklySlots.map((slot, idx) => (
                                                <option key={idx} value={slot.timeSlot}>
                                                    {slot.day} - {slot.timeSlot}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="10:00 AM - 11:00 AM">Monday - 10:00 AM - 11:00 AM</option>
                                                <option value="02:00 PM - 03:00 PM">Wednesday - 02:00 PM - 03:00 PM</option>
                                                <option value="04:00 PM - 05:00 PM">Friday - 04:00 PM - 05:00 PM</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">Mentorship Topic / Doubt Reason</label>
                                <textarea
                                    rows={3}
                                    value={bookingTopic}
                                    onChange={e => setBookingTopic(e.target.value)}
                                    placeholder="Describe what you would like to discuss (e.g. MERN project architecture guidance, career review, code debugging)..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none font-medium"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedInstructor(null)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-600/20"
                                >
                                    {isSubmitting ? 'Submitting Request...' : 'Confirm Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW NOTES MODAL */}
            {viewNotesSession && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-slate-800">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                            <h3 className="font-black text-slate-900 text-lg">Mentorship Notes & Resources</h3>
                            <button onClick={() => setViewNotesSession(null)} className="p-1 text-slate-400 hover:text-slate-700"><FiX size={20} /></button>
                        </div>
                        <div>
                            <div className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">Instructor Notes</div>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed font-medium">
                                {viewNotesSession.notes || 'No session notes provided.'}
                            </p>
                        </div>
                        <div>
                            <div className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">Feedback & Follow-up</div>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed font-medium">
                                {viewNotesSession.feedback || 'Great session! Keep practicing.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE ROOM MODAL */}
            {activeRoomSession && (
                <MentorshipRoomModal
                    session={activeRoomSession}
                    onClose={() => setActiveRoomSession(null)}
                    userRole="student"
                />
            )}
        </div>
    )
}

export default StudentMentorship
