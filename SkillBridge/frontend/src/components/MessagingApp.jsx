import { useState, useEffect, useCallback, useContext, useRef } from 'react'
import axios from 'axios'
import {
  FiSend, FiPaperclip, FiImage, FiSmile, FiPhone, FiVideo, FiSearch,
  FiMoreVertical, FiCheck, FiCheckCircle, FiStar, FiCornerUpLeft,
  FiTrash2, FiEdit2, FiVolumeX, FiArchive, FiSlash, FiUsers, FiPlus,
  FiPieChart, FiRadio, FiMic, FiMicOff, FiVideoOff, FiMonitor, FiX
} from 'react-icons/fi'
import { BsPinAngle as FiPin } from 'react-icons/bs'
import AuthContext from '../context/AuthContext'
import './MessagingApp.css'

export default function MessagingApp({ courses = [] }) {
  const { user } = useContext(AuthContext)
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin'

  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState([])
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [replyToMsg, setReplyToMsg] = useState(null)
  const [editingMsg, setEditingMsg] = useState(null)
  const [typingUser, setTypingUser] = useState(null)

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showMassMsgModal, setShowMassMsgModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [callType, setCallType] = useState('video') // 'video' or 'voice'

  // Form states
  const [groupName, setGroupName] = useState('')
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([])
  const [massCourseId, setMassCourseId] = useState('')
  const [massMsgText, setMassMsgText] = useState('')
  const [massMsgTitle, setMassMsgTitle] = useState('')
  const [analytics, setAnalytics] = useState(null)

  // Media Attachment inputs
  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')

  // Media Call Controls
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get('/api/messages/conversations')
      setConversations(res.data || [])
      if (!activeConv && res.data?.length > 0) {
        setActiveConv(res.data[0])
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [activeConv])

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return
    try {
      const res = await axios.get(`/api/messages/conversations/${convId}/messages`)
      setMessages(res.data || [])
      scrollToBottom()
    } catch (e) { console.error(e) }
  }, [])

  const fetchContacts = useCallback(async () => {
    try {
      const res = await axios.get('/api/messages/users')
      setContacts(res.data || [])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    fetchConversations()
    fetchContacts()
  }, [fetchConversations, fetchContacts])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv._id)
      const interval = setInterval(() => {
        fetchMessages(activeConv._id)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [activeConv, fetchMessages])

  useEffect(() => {
    if (courses.length > 0 && !massCourseId) {
      setMassCourseId(courses[0]._id)
    }
  }, [courses, massCourseId])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText && !attachmentUrl) return
    if (!activeConv) return

    try {
      let msgType = 'text'
      const attachments = []

      if (attachmentName && attachmentUrl) {
        msgType = attachmentUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'file'
        attachments.push({ name: attachmentName, url: attachmentUrl, fileType: msgType, size: 2048 })
      }

      if (editingMsg) {
        await axios.put(`/api/messages/messages/${editingMsg._id}`, { content: inputText })
        setEditingMsg(null)
      } else {
        await axios.post(`/api/messages/conversations/${activeConv._id}/messages`, {
          content: inputText,
          messageType: msgType,
          attachments,
          replyTo: replyToMsg?._id || null
        })
      }

      setInputText('')
      setAttachmentName('')
      setAttachmentUrl('')
      setReplyToMsg(null)
      fetchMessages(activeConv._id)
      fetchConversations()
    } catch (e) { console.error(e) }
  }

  const handleStartDirectChat = async (recipientId) => {
    try {
      const res = await axios.post('/api/messages/conversations', { recipientId, isGroup: false })
      setActiveConv(res.data)
      setShowNewChatModal(false)
      fetchConversations()
    } catch (e) { console.error(e) }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!groupName) return
    try {
      const res = await axios.post('/api/messages/conversations', {
        isGroup: true,
        name: groupName,
        memberIds: selectedGroupMembers
      })
      setActiveConv(res.data)
      setShowGroupModal(false)
      setGroupName('')
      setSelectedGroupMembers([])
      fetchConversations()
    } catch (e) { console.error(e) }
  }

  const handleSendMassMessage = async (e) => {
    e.preventDefault()
    if (!massCourseId || !massMsgText) return
    try {
      const res = await axios.post('/api/messages/course-mass-message', {
        courseId: massCourseId,
        title: massMsgTitle || 'Announcement',
        messageText: massMsgText
      })
      setShowMassMsgModal(false)
      setMassMsgText('')
      setMassMsgTitle('')
      alert(res.data.message)
      fetchConversations()
    } catch (e) { console.error(e) }
  }

  const handleReactMessage = async (msgId, emoji) => {
    try {
      await axios.post(`/api/messages/messages/${msgId}/react`, { emoji })
      fetchMessages(activeConv._id)
    } catch (e) { console.error(e) }
  }

  const handleStarMessage = async (msgId) => {
    try {
      await axios.post(`/api/messages/messages/${msgId}/star`)
      fetchMessages(activeConv._id)
    } catch (e) { console.error(e) }
  }

  const handleDeleteMessage = async (msgId, mode = 'me') => {
    try {
      await axios.delete(`/api/messages/messages/${msgId}?mode=${mode}`)
      fetchMessages(activeConv._id)
    } catch (e) { console.error(e) }
  }

  const handleToggleMute = async (convId) => {
    try {
      await axios.post(`/api/messages/conversations/${convId}/mute`)
      fetchConversations()
    } catch (e) { console.error(e) }
  }

  const handleToggleArchive = async (convId) => {
    try {
      await axios.post(`/api/messages/conversations/${convId}/archive`)
      fetchConversations()
    } catch (e) { console.error(e) }
  }

  const fetchAnalyticsData = async () => {
    try {
      const res = await axios.get('/api/messages/analytics')
      setAnalytics(res.data)
      setShowAnalyticsModal(true)
    } catch (e) { console.error(e) }
  }

  const getConvName = (conv) => {
    if (conv.type === 'group') return conv.name || 'Group Chat'
    const otherMember = conv.members?.find(m => m.user?._id !== user?._id)
    if (!otherMember) return 'Direct Chat'
    const p = otherMember.user?.profile
    return `${p?.firstName || 'User'} ${p?.lastName || ''}`.trim() || otherMember.user?.email || 'User'
  }

  const filteredConversations = conversations.filter(c => 
    getConvName(c).toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="msg-container">
      {/* Sidebar Left */}
      <aside className="msg-sidebar">
        <div className="msg-sidebar-header">
          <h3>✉️ Messages</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {isInstructor && (
              <button className="msg-new-btn" style={{ background: '#059669' }} onClick={() => setShowMassMsgModal(true)} title="Send Course Mass Message">
                <FiRadio /> Mass Msg
              </button>
            )}
            <button className="msg-new-btn" onClick={() => setShowNewChatModal(true)}>
              <FiPlus /> New Chat
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="msg-search-box">
          <input
            className="msg-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversation List */}
        <div className="msg-conv-list">
          {filteredConversations.map(conv => {
            const name = getConvName(conv)
            const isActive = activeConv?._id === conv._id
            return (
              <div
                key={conv._id}
                className={`msg-conv-item${isActive ? ' active' : ''}`}
                onClick={() => setActiveConv(conv)}
              >
                <div className="msg-avatar-wrap">
                  <div className="msg-avatar">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="msg-status-dot online" />
                </div>

                <div className="msg-conv-info">
                  <div className="msg-conv-info-head">
                    <span className="msg-conv-name">{name}</span>
                    <span className="msg-conv-time">
                      {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="msg-conv-last">
                      {conv.lastMessage?.content || 'Started conversation'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="msg-badge-unread">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {filteredConversations.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20, fontSize: 13 }}>No chats found.</p>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="msg-chat-area">
        {activeConv ? (
          <>
            {/* Header */}
            <header className="msg-chat-header">
              <div className="msg-chat-header-user">
                <div className="msg-avatar">
                  {getConvName(activeConv).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{getConvName(activeConv)}</h4>
                  <small style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.78rem' }}>🟢 Online</small>
                </div>
              </div>

              <div className="msg-chat-actions">
                <button className="msg-action-icon" title="Voice Call" onClick={() => { setCallType('voice'); setShowCallModal(true) }}>
                  <FiPhone />
                </button>
                <button className="msg-action-icon" title="Video Call" onClick={() => { setCallType('video'); setShowCallModal(true) }}>
                  <FiVideo />
                </button>
                {isInstructor && (
                  <button className="msg-action-icon" title="Analytics" onClick={fetchAnalyticsData}>
                    <FiPieChart />
                  </button>
                )}
                <button className="msg-action-icon" title="Mute Chat" onClick={() => handleToggleMute(activeConv._id)}>
                  <FiVolumeX />
                </button>
                <button className="msg-action-icon" title="Archive Chat" onClick={() => handleToggleArchive(activeConv._id)}>
                  <FiArchive />
                </button>
              </div>
            </header>

            {/* Pinned Banner */}
            <div className="msg-pinned-banner">
              <span>📌 <strong>Pinned Announcement:</strong> Class test starts tomorrow at 10:00 AM. Prepare Chapter 3!</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="msg-body">
              {messages.map(msg => {
                const isMe = msg.sender?._id === user?._id
                const senderName = `${msg.sender?.profile?.firstName || 'User'} ${msg.sender?.profile?.lastName || ''}`.trim()

                return (
                  <div key={msg._id} className={`msg-bubble-wrap ${isMe ? 'me' : 'other'}`}>
                    {!isMe && <span className="msg-sender-name">{senderName}</span>}

                    <div className={`msg-bubble ${isMe ? 'me' : 'other'}`}>
                      {/* Quoted Reply */}
                      {msg.replyTo && (
                        <div className="msg-reply-quote">
                          <strong>Reply to:</strong> {msg.replyTo.content?.slice(0, 50)}...
                        </div>
                      )}

                      {/* Content */}
                      <p style={{ margin: 0 }}>{msg.content}</p>

                      {/* Attachments */}
                      {msg.attachments?.map((att, idx) => (
                        <div key={idx} style={{ marginTop: 8, background: 'rgba(0,0,0,0.06)', padding: 6, borderRadius: 8 }}>
                          <a href={att.url} target="_blank" rel="noreferrer" style={{ color: isMe ? '#fff' : '#4338ca', fontWeight: 700, fontSize: 12 }}>
                            📎 {att.name || 'Attachment'}
                          </a>
                        </div>
                      ))}

                      {/* Meta info & Status ticks */}
                      <div className="msg-bubble-meta">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (
                          <span style={{ color: '#38bdf8', marginLeft: 4 }}>
                            <FiCheckCircle size={12} />
                          </span>
                        )}
                        {msg.isEdited && <span>(edited)</span>}
                      </div>

                      {/* Quick Hover Reactions Row */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        {['👍', '❤️', '😂', '🎉', '🙏'].map(emoji => (
                          <span key={emoji} style={{ cursor: 'pointer', fontSize: 12 }} onClick={() => handleReactMessage(msg._id, emoji)}>
                            {emoji}
                          </span>
                        ))}
                        <span style={{ cursor: 'pointer', fontSize: 11, color: '#6366f1' }} onClick={() => setReplyToMsg(msg)}>
                          <FiCornerUpLeft />
                        </span>
                        {isMe && (
                          <span style={{ cursor: 'pointer', fontSize: 11, color: '#ef4444' }} onClick={() => handleDeleteMessage(msg._id, 'everyone')}>
                            <FiTrash2 />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Reactions */}
                    {msg.reactions?.length > 0 && (
                      <div className="msg-reactions-row">
                        {msg.reactions.map((r, ri) => (
                          <span key={ri} className="msg-reaction-badge">{r.emoji}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quoted Message bar if replying */}
            {replyToMsg && (
              <div style={{ background: '#ede9fe', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span>↩️ Replying to: <strong>{replyToMsg.content}</strong></span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }} onClick={() => setReplyToMsg(null)}>✕</button>
              </div>
            )}

            {/* Typing Indicator */}
            <div className="msg-typing">Harsh Kumar is typing...</div>

            {/* Input Box */}
            <form onSubmit={handleSendMessage} className="msg-input-area">
              {(attachmentName || attachmentUrl) && (
                <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, fontSize: 12, display: 'flex', gap: 10 }}>
                  <span>📎 Attached: {attachmentName || attachmentUrl}</span>
                  <button type="button" onClick={() => { setAttachmentName(''); setAttachmentUrl('') }}>Remove</button>
                </div>
              )}

              <div className="msg-input-row">
                <input
                  className="msg-text-input"
                  placeholder="Type a message, paste a link or ask a doubt..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />

                <input
                  style={{ display: 'none' }}
                  id="msg-file-input"
                  type="file"
                  onChange={e => {
                    if (e.target.files[0]) {
                      setAttachmentName(e.target.files[0].name)
                      setAttachmentUrl(URL.createObjectURL(e.target.files[0]))
                    }
                  }}
                />
                <label htmlFor="msg-file-input" className="msg-action-icon" style={{ cursor: 'pointer' }} title="Attach File / Image">
                  <FiPaperclip />
                </label>

                <button type="submit" className="msg-send-btn">
                  <FiSend /> Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Select a conversation to start chatting
          </div>
        )}
      </main>

      {/* New Direct Chat Modal */}
      {showNewChatModal && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 450 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>👤 Start One-to-One Chat</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setShowNewChatModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Select a student or instructor to message:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {contacts.map(c => (
                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, cursor: 'pointer' }}
                  onClick={() => handleStartDirectChat(c._id)}>
                  <div>
                    <strong style={{ fontSize: 14, display: 'block' }}>{c.profile?.firstName} {c.profile?.lastName}</strong>
                    <small style={{ color: '#64748b' }}>{c.email} ({c.role})</small>
                  </div>
                  <button className="msg-new-btn" style={{ padding: '4px 10px', fontSize: 11 }}>Message</button>
                </div>
              ))}
            </div>
            <button className="df-btn-create" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }} onClick={() => { setShowNewChatModal(false); setShowGroupModal(true) }}>
              + Create Group Chat Instead
            </button>
          </div>
        </div>
      )}

      {/* Create Group Chat Modal */}
      {showGroupModal && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>👥 Create Group Chat</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setShowGroupModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateGroup}>
              <div className="df-form-group">
                <label>Group Name</label>
                <input className="df-form-input" placeholder="e.g. Node.js Study Group" required value={groupName} onChange={e => setGroupName(e.target.value)} />
              </div>

              <div className="df-form-group">
                <label>Select Members</label>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: 10, padding: 10 }}>
                  {contacts.map(c => (
                    <label key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedGroupMembers.includes(c._id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedGroupMembers([...selectedGroupMembers, c._id])
                          else setSelectedGroupMembers(selectedGroupMembers.filter(id => id !== c._id))
                        }}
                      />
                      <span style={{ fontSize: 13 }}>{c.profile?.firstName} {c.profile?.lastName} ({c.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8 }} onClick={() => setShowGroupModal(false)}>Cancel</button>
                <button type="submit" className="msg-send-btn">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Mass Message Modal for Instructors */}
      {showMassMsgModal && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📢 Course-Based Mass Message</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setShowMassMsgModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSendMassMessage}>
              <div className="df-form-group">
                <label>Select Course</label>
                <select className="df-form-select" value={massCourseId} onChange={e => setMassCourseId(e.target.value)}>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>

              <div className="df-form-group">
                <label>Announcement Title</label>
                <input className="df-form-input" placeholder="e.g. Tomorrow's Node.js Class Update" value={massMsgTitle} onChange={e => setMassMsgTitle(e.target.value)} />
              </div>

              <div className="df-form-group">
                <label>Message Content</label>
                <textarea className="df-form-textarea" rows={4} placeholder="Type the message to send to all enrolled students..." required value={massMsgText} onChange={e => setMassMsgText(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8 }} onClick={() => setShowMassMsgModal(false)}>Cancel</button>
                <button type="submit" className="msg-send-btn" style={{ background: '#059669' }}>📢 Broadcast Message</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice / Video Call Modal */}
      {showCallModal && (
        <div className="msg-call-modal">
          <div className="msg-call-box">
            <div className="msg-call-screen">
              {callType === 'video' ? (
                <div style={{ textAlign: 'center' }}>
                  <p>📹 {callType.toUpperCase()} CALL ACTIVE</p>
                  <small style={{ color: '#94a3b8', fontSize: 14 }}>Connecting to {getConvName(activeConv)}...</small>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p>📞 VOICE CALL IN PROGRESS</p>
                  <small style={{ color: '#22c55e', fontSize: 14 }}>00:42</small>
                </div>
              )}
            </div>

            <div className="msg-call-controls">
              <button className={`msg-call-btn toggle${isMicOn ? ' active' : ''}`} onClick={() => setIsMicOn(!isMicOn)}>
                {isMicOn ? <FiMic /> : <FiMicOff />}
              </button>
              <button className={`msg-call-btn toggle${isVideoOn ? ' active' : ''}`} onClick={() => setIsVideoOn(!isVideoOn)}>
                {isVideoOn ? <FiVideo /> : <FiVideoOff />}
              </button>
              <button className={`msg-call-btn toggle${isScreenSharing ? ' active' : ''}`} onClick={() => setIsScreenSharing(!isScreenSharing)}>
                <FiMonitor />
              </button>
              <button className="msg-call-btn end" onClick={() => setShowCallModal(false)}>
                <FiPhone />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📊 Message Analytics</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setShowAnalyticsModal(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b' }}>Total Messages</small>
                <h3 style={{ margin: '4px 0 0', color: '#4338ca' }}>{analytics?.totalMessages || 0}</h3>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b' }}>Active Chats</small>
                <h3 style={{ margin: '4px 0 0', color: '#059669' }}>{analytics?.totalConversations || 0}</h3>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b' }}>Avg Response Time</small>
                <h3 style={{ margin: '4px 0 0', color: '#d97706' }}>{analytics?.avgResponseTime || '5m'}</h3>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b' }}>Active Users Today</small>
                <h3 style={{ margin: '4px 0 0', color: '#ec4899' }}>{analytics?.activeUsers || 0}</h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
