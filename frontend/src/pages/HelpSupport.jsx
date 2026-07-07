import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import axios from 'axios'
import { FiPlus, FiMessageSquare, FiUser, FiClock, FiCheckCircle, FiXCircle, FiSend, FiArrowLeft, FiHash, FiZap, FiX } from 'react-icons/fi'
import './admin/AdminPremium.css'

const HelpSupport = () => {
    const [tickets, setTickets] = useState([])
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [instructors, setInstructors] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [userRole, setUserRole] = useState('')
    const [currentUserId, setCurrentUserId] = useState('')
    const [replyMessage, setReplyMessage] = useState('')
    const [sendingReply, setSendingReply] = useState(false)

    // New Ticket Form State
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        recipientRole: 'admin', // Default to admin
        recipientId: '',
        priority: 'medium',
        category: 'general'
    })
    const [creating, setCreating] = useState(false)

    const messagesEndRef = useRef(null)

    useEffect(() => {
        fetchData()
        fetchUserRole()
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [selectedTicket?.messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchUserRole = async () => {
        try {
            const res = await axios.get('/api/auth/me')
            setUserRole(res.data.user.role)
            setCurrentUserId(res.data.user._id)

            // If student, fetch instructors
            if (res.data.user.role === 'student') {
                const instrRes = await axios.get('/api/support/instructors')
                setInstructors(instrRes.data)
            }
        } catch (error) {
            console.error('Error fetching user role:', error)
        }
    }

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/support')
            setTickets(res.data)
        } catch (error) {
            console.error('Error fetching tickets:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTicket = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            // If recipient is Admin, clear recipientId
            const payload = { ...formData }
            if (payload.recipientRole === 'admin') {
                delete payload.recipientId
            }

            const res = await axios.post('/api/support', payload)
            setTickets([res.data, ...tickets])
            setShowModal(false)
            setFormData({
                subject: '',
                message: '',
                recipientRole: 'admin',
                recipientId: '',
                priority: 'medium',
                category: 'general'
            })
            // Select the new ticket
            setSelectedTicket(res.data)
        } catch (error) {
            console.error('Error creating ticket:', error)
            alert(error.response?.data?.message || 'Failed to create ticket')
        } finally {
            setCreating(false)
        }
    }

    const handleReply = async (e) => {
        e.preventDefault()
        if (!replyMessage.trim()) return

        setSendingReply(true)
        try {
            const res = await axios.post(`/api/support/${selectedTicket._id}/reply`, {
                message: replyMessage
            })

            // Update tickets list
            const updatedTickets = tickets.map(t =>
                t._id === selectedTicket._id ? res.data : t
            )
            setTickets(updatedTickets)
            setSelectedTicket(res.data)
            setReplyMessage('')
        } catch (error) {
            console.error('Error sending reply:', error)
            alert('Failed to send reply')
        } finally {
            setSendingReply(false)
        }
    }

    const handleUpdateStatus = async (status) => {
        try {
            const res = await axios.put(`/api/support/${selectedTicket._id}/status`, { status })

            // Update tickets list
            const updatedTickets = tickets.map(t =>
                t._id === selectedTicket._id ? { ...t, status: res.data.status } : t
            )
            setTickets(updatedTickets)
            setSelectedTicket({ ...selectedTicket, status: res.data.status })

            if (status === 'resolved') {
                alert('Ticket marked as resolved')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update ticket status')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-yellow-100 text-yellow-800'
            case 'in_progress': return 'bg-blue-100 text-blue-800'
            case 'resolved': return 'bg-green-100 text-green-800'
            case 'closed': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600'
            case 'medium': return 'text-orange-600'
            case 'low': return 'text-green-600'
            default: return 'text-gray-600'
        }
    }

    return (
        <Layout>
            <div className="h-[calc(100vh-120px)] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className={`text-4xl font-extrabold ${userRole === 'admin' ? 'text-white' : 'text-gray-800'} tracking-tight`}>Help & Support</h1>
                        <p className={userRole === 'admin' ? 'text-[#94a3b8]' : 'text-gray-600'}>
                            {userRole === 'admin' ? 'Technical ticket resolution and system assistance' : `Get help from ${userRole === 'instructor' ? 'administrators' : 'instructors or administrators'}`}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="admin-premium-btn flex items-center gap-2"
                    >
                        <FiPlus />
                        <span>New Ticket</span>
                    </button>
                </div>

                <div className="flex-1 flex gap-8 overflow-hidden">
                    {/* Tickets List */}
                    <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col ${userRole === 'admin' ? 'admin-glass-card' : 'bg-white shadow-lg'} p-0 overflow-hidden`}>
                        <div className={`p-6 border-b ${userRole === 'admin' ? 'border-white/5 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                            <h2 className={`font-bold uppercase tracking-widest text-xs ${userRole === 'admin' ? 'text-indigo-400' : 'text-gray-700'}`}>Your Tickets</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {tickets.length === 0 ? (
                                <div className="p-16 text-center">
                                    <FiMessageSquare className="mx-auto h-12 w-12 mb-4 opacity-30 text-gray-400" />
                                    <p className={`text-xs font-bold uppercase tracking-widest ${userRole === 'admin' ? 'text-gray-600' : 'text-gray-400'}`}>No tickets found</p>
                                </div>
                            ) : (
                                tickets.map(ticket => (
                                    <div
                                        key={ticket._id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        className={`p-6 border-b cursor-pointer transition-all ${userRole === 'admin' ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} ${selectedTicket?._id === ticket._id ? (userRole === 'admin' ? 'bg-indigo-500/10 border-r-4 border-r-indigo-500' : 'bg-blue-50 border-l-4 border-l-blue-600') : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-extrabold uppercase tracking-widest ${userRole === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : getStatusColor(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                            <span className={`text-[10px] font-bold ${userRole === 'admin' ? 'text-[#64748b]' : 'text-gray-500'}`}>
                                                {new Date(ticket.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className={`font-bold truncate mb-3 ${userRole === 'admin' ? 'text-white' : 'text-gray-800'}`}>{ticket.subject}</h3>
                                        <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${userRole === 'admin' ? 'text-[#64748b]' : 'text-gray-500'}`}>
                                            <div className="flex items-center gap-1">
                                                <FiHash className="text-indigo-500" />
                                                <span>{ticket.ticketId}</span>
                                            </div>
                                            <span className={`flex items-center gap-1 ${getPriorityColor(ticket.priority)}`}>
                                                <FiZap />
                                                {ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={`${!selectedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col ${userRole === 'admin' ? 'admin-glass-card' : 'bg-white shadow-lg'} p-0 overflow-hidden`}>
                        {!selectedTicket ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className={`w-20 h-20 rounded-3xl ${userRole === 'admin' ? 'bg-white/5 border border-white/10' : 'bg-gray-50'} flex items-center justify-center text-gray-400 mb-6`}>
                                    <FiMessageSquare size={32} />
                                </div>
                                <p className={`text-lg font-bold uppercase tracking-widest ${userRole === 'admin' ? 'text-gray-600' : 'text-gray-400'}`}>Select a ticket to view details</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className={`p-8 border-b ${userRole === 'admin' ? 'border-white/5 bg-white/5' : 'border-gray-200 bg-gray-50'} flex justify-between items-start`}>
                                    <div>
                                        <button
                                            onClick={() => setSelectedTicket(null)}
                                            className={`md:hidden flex items-center gap-2 text-sm mb-4 font-bold uppercase tracking-widest ${userRole === 'admin' ? 'text-indigo-400' : 'text-blue-600'}`}
                                        >
                                            <FiArrowLeft /> Back
                                        </button>
                                        <h2 className={`text-2xl font-extrabold mb-2 uppercase tracking-tight ${userRole === 'admin' ? 'text-white' : 'text-gray-800'}`}>{selectedTicket.subject}</h2>
                                        <div className={`flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest ${userRole === 'admin' ? 'text-[#64748b]' : 'text-gray-600'}`}>
                                            <span className="flex items-center gap-1"><FiHash className="text-indigo-500" /> {selectedTicket.ticketId}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                            <span className="text-indigo-400">{selectedTicket.category}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                            <span className="flex items-center gap-2">
                                                {selectedTicket.recipientRole === 'admin' ? 'To: Administrator' :
                                                    <span className="text-white bg-white/5 px-2 py-0.5 rounded">
                                                        To: {selectedTicket.recipient?.profile?.firstName} {selectedTicket.recipient?.profile?.lastName}
                                                    </span>}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {(userRole === 'admin' || (userRole === 'instructor' && selectedTicket.recipientRole === 'instructor')) && selectedTicket.status !== 'resolved' && (
                                            <button
                                                onClick={() => handleUpdateStatus('resolved')}
                                                className="admin-premium-btn py-2 px-4 flex items-center gap-2 text-xs"
                                            >
                                                <FiCheckCircle />
                                                <span>Resolve Ticket</span>
                                            </button>
                                        )}
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${userRole === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : getStatusColor(selectedTicket.status)}`}>
                                            {selectedTicket.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className={`flex-1 overflow-y-auto p-8 space-y-8 ${userRole === 'admin' ? 'bg-[#0f172a]/50' : 'bg-gray-50/50'} custom-scrollbar`}>
                                    {selectedTicket.messages.map((msg, idx) => {
                                        const isMe = msg.sender._id === currentUserId
                                        return (
                                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-dashCardFadeIn`} style={{ animationDelay: `${idx * 0.1}s` }}>
                                                <div className={`max-w-[80%] rounded-3xl p-6 ${!isMe
                                                    ? (userRole === 'admin' ? 'bg-white/5 border border-white/5' : 'bg-white border border-gray-200 shadow-sm')
                                                    : (userRole === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-md')
                                                    }`}>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-extrabold text-[10px] uppercase tracking-widest opacity-70">
                                                            {msg.sender.profile?.firstName ? `${msg.sender.profile.firstName} ${msg.sender.profile.lastName}` : msg.sender.email}
                                                        </span>
                                                        <span className="text-[10px] opacity-40 font-bold">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm leading-relaxed ${isMe ? 'text-white' : (userRole === 'admin' ? 'text-[#94a3b8]' : 'text-gray-800')} whitespace-pre-wrap`}>{msg.message}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Input */}
                                <div className={`p-6 ${userRole === 'admin' ? 'bg-white/5 border-t border-white/5' : 'bg-white border-t border-gray-200'}`}>
                                    <form onSubmit={handleReply} className="flex gap-4">
                                        <textarea
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Type your reply..."
                                            className={`${userRole === 'admin' ? 'admin-input' : 'border border-gray-300 rounded-xl px-4 py-3'} flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-[80px]`}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReply(e);
                                                }
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!replyMessage.trim() || sendingReply}
                                            className={`${userRole === 'admin' ? 'admin-premium-btn' : 'bg-blue-600'} text-white px-8 rounded-2xl hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xl`}
                                        >
                                            <FiSend size={20} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 admin-modal-overlay flex items-center justify-center z-50 p-4">
                        <div className="admin-modal-content max-w-lg w-full max-h-[90vh] overflow-y-auto animate-dashCardFadeIn">
                            <div className="p-10">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-3xl font-bold text-white uppercase tracking-tight">Create Support Ticket</h2>
                                    <button onClick={() => setShowModal(false)} className="text-[#94a3b8] hover:text-white transition-colors">
                                        <FiX size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateTicket} className="space-y-6">
                                    {userRole === 'student' && (
                                        <div>
                                            <label className="admin-label">Recipient</label>
                                            <div className="flex gap-6 mb-4">
                                                <label className="flex items-center space-x-3 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        checked={formData.recipientRole === 'admin'}
                                                        onChange={() => setFormData({ ...formData, recipientRole: 'admin' })}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.recipientRole === 'admin' ? 'border-indigo-500' : 'border-[#1e293b]'}`}>
                                                        {formData.recipientRole === 'admin' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase tracking-widest ${formData.recipientRole === 'admin' ? 'text-white' : 'text-[#64748b]'}`}>Administrator</span>
                                                </label>
                                                <label className="flex items-center space-x-3 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        checked={formData.recipientRole === 'instructor'}
                                                        onChange={() => setFormData({ ...formData, recipientRole: 'instructor' })}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.recipientRole === 'instructor' ? 'border-indigo-500' : 'border-[#1e293b]'}`}>
                                                        {formData.recipientRole === 'instructor' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase tracking-widest ${formData.recipientRole === 'instructor' ? 'text-white' : 'text-[#64748b]'}`}>Instructor</span>
                                                </label>
                                            </div>

                                            {formData.recipientRole === 'instructor' && (
                                                <select
                                                    value={formData.recipientId}
                                                    onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                                                    className="admin-input"
                                                    required
                                                >
                                                    <option value="" className="bg-[#0f172a]">Select Instructor</option>
                                                    {instructors.map(inst => (
                                                        <option key={inst.id} value={inst.id} className="bg-[#0f172a]">
                                                            {inst.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="admin-label">Subject</label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="admin-input"
                                            placeholder="Subject"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="admin-label">Priority</label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="admin-input"
                                            >
                                                <option value="low" className="bg-[#0f172a]">Low</option>
                                                <option value="medium" className="bg-[#0f172a]">Medium</option>
                                                <option value="high" className="bg-[#0f172a]">High</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="admin-label">Category</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="admin-input"
                                            >
                                                <option value="general" className="bg-[#0f172a]">General</option>
                                                <option value="technical" className="bg-[#0f172a]">Technical</option>
                                                <option value="academic" className="bg-[#0f172a]">Academic</option>
                                                <option value="billing" className="bg-[#0f172a]">Billing</option>
                                                <option value="other" className="bg-[#0f172a]">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="admin-label">Message</label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            rows="4"
                                            className="admin-input"
                                            placeholder="Write your message here..."
                                            required
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            className="admin-premium-btn flex-1 py-4 uppercase font-bold tracking-widest"
                                        >
                                            {creating ? 'Creating...' : 'Create Ticket'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="admin-secondary-btn flex-1 py-4 uppercase font-bold tracking-widest"
                                        >
                                            Cancel
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

export default HelpSupport
