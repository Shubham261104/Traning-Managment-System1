import { useState } from 'react'
import { FiX, FiVideo, FiMic, FiMicOff, FiVideoOff, FiMessageSquare, FiSend, FiCheckCircle, FiFileText, FiShare2 } from 'react-icons/fi'

const MentorshipRoomModal = ({ session, onClose, userRole, onComplete }) => {
    const [micOn, setMicOn] = useState(true)
    const [videoOn, setVideoOn] = useState(true)
    const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'notes'
    const [messages, setMessages] = useState([
        { sender: 'System', text: 'Welcome to your 1-to-1 Mentorship session. Room is secure and live.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ])
    const [chatInput, setChatInput] = useState('')
    const [notes, setNotes] = useState(session?.notes || '')
    const [feedback, setFeedback] = useState(session?.feedback || '')

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        const newMsg = {
            sender: userRole === 'instructor' ? 'Instructor' : 'Student',
            text: chatInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, newMsg])
        setChatInput('')
    }

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-6">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-500/50"></div>
                        <div>
                            <h3 className="font-extrabold text-white text-lg tracking-tight">1-to-1 Live Mentorship Room</h3>
                            <p className="text-xs text-slate-300 font-medium">
                                Topic: <span className="text-indigo-300 font-bold">{session?.topic}</span> | Slot: <span className="text-slate-200 font-bold">{session?.timeSlot}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors"
                        title="Close Room"
                    >
                        <FiX size={22} />
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
                    {/* Video Area */}
                    <div className="lg:col-span-2 bg-slate-950 p-4 md:p-6 flex flex-col justify-between relative border-r border-slate-800">
                        {/* Video Window */}
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative flex items-center justify-center shadow-inner">
                            {videoOn ? (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center relative p-4 text-center">
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center text-4xl text-white font-black shadow-xl border-4 border-slate-700">
                                        {userRole === 'instructor' ? '🎓' : '👨‍💻'}
                                    </div>
                                    <h4 className="mt-4 text-white font-bold text-lg">Live Mentorship Video Stream</h4>
                                    <p className="text-xs text-indigo-300 font-semibold mt-1 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                        HD Stream Active • Encrypted Audio & Video
                                    </p>
                                    <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-white shadow-lg">
                                        {userRole === 'instructor' ? (session?.student?.profile?.firstName || 'Student') : (session?.instructor?.profile?.firstName || 'Instructor')} (Connected)
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-slate-400">
                                    <FiVideoOff size={48} className="mb-2 text-slate-500" />
                                    <span className="font-semibold text-sm">Camera Turned Off</span>
                                </div>
                            )}

                            {/* Self PIP */}
                            <div className="absolute top-4 right-4 w-36 h-24 bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-xl flex items-center justify-center text-xs font-bold text-slate-200">
                                You ({userRole === 'instructor' ? 'Instructor' : 'Student'})
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-lg">
                            <button
                                onClick={() => setMicOn(!micOn)}
                                className={`p-3 rounded-xl transition-all font-bold ${micOn ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}
                                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
                            >
                                {micOn ? <FiMic size={20} /> : <FiMicOff size={20} />}
                            </button>
                            <button
                                onClick={() => setVideoOn(!videoOn)}
                                className={`p-3 rounded-xl transition-all font-bold ${videoOn ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}
                                title={videoOn ? 'Turn Off Video' : 'Turn On Video'}
                            >
                                {videoOn ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
                            </button>
                            <button
                                className="p-3 bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
                                title="Share Screen"
                            >
                                <FiShare2 size={20} />
                            </button>
                            {userRole === 'instructor' && onComplete && (
                                <button
                                    onClick={onComplete}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all flex items-center gap-2 text-xs shadow-lg shadow-emerald-600/30"
                                >
                                    <FiCheckCircle size={16} /> Finish Mentorship
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl transition-all text-xs shadow-lg shadow-red-600/30"
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>

                    {/* Side Panel (Chat & Notes) */}
                    <div className="bg-slate-900 flex flex-col h-full overflow-hidden border-t lg:border-t-0 border-slate-800">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-800 bg-slate-950">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-300 bg-slate-900' : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                <FiMessageSquare size={16} /> Live Chat
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'notes' ? 'border-indigo-500 text-indigo-300 bg-slate-900' : 'border-transparent text-slate-400 hover:text-white'}`}
                            >
                                <FiFileText size={16} /> Session Notes
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'chat' ? (
                            <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden bg-slate-900">
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                    {messages.map((m, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl max-w-[88%] text-xs leading-relaxed ${m.sender === 'System' ? 'bg-indigo-950/70 text-indigo-200 border border-indigo-500/30 mx-auto text-center font-medium' : m.sender === (userRole === 'instructor' ? 'Instructor' : 'Student') ? 'bg-indigo-600 text-white font-medium ml-auto shadow-md' : 'bg-slate-800 text-slate-200 font-medium border border-slate-700'}`}>
                                            <div className="font-extrabold mb-1 opacity-90">{m.sender} • <span className="text-[10px] font-normal">{m.time}</span></div>
                                            <div>{m.text}</div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="Type message..."
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                                    />
                                    <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors shadow-md">
                                        <FiSend size={16} />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Session Key Takeaways & Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={8}
                                        placeholder="Document discussion points, guidance, and recommendations..."
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none font-medium leading-relaxed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">Action Items / Resources</label>
                                    <textarea
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        rows={4}
                                        placeholder="Recommended links, tutorials, or follow-up exercises..."
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none font-medium leading-relaxed"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MentorshipRoomModal

