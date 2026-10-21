import { useState, useEffect, useCallback, useContext, useMemo } from 'react'
import axios from 'axios'
import {
  FiMessageSquare, FiPlus, FiSearch, FiFilter, FiThumbsUp, FiThumbsDown,
  FiCheckCircle, FiBookmark, FiTag, FiEye, FiUser, FiAward,
  FiPaperclip, FiMoreVertical, FiTrash2, FiEdit, FiLock, FiUnlock,
  FiFlag, FiPieChart, FiChevronDown, FiChevronRight, FiShare2, FiBell, FiCornerDownRight
} from 'react-icons/fi'
import { BsPinAngle as FiPin } from 'react-icons/bs'
import AuthContext from '../context/AuthContext'
import './DiscussionForum.css'

export default function DiscussionForum({ courses = [] }) {
  const { user } = useContext(AuthContext)
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin'

  const [discussions, setDiscussions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState([])
  const [analytics, setAnalytics] = useState(null)
  
  // Filters & State
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // all, my, bookmarks, unanswered, answered, pinned, popular, recent
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [selectedDiscussion, setSelectedDiscussion] = useState(null)
  const [reportingDiscussionId, setReportingDiscussionId] = useState(null)
  const [reportReason, setReportReason] = useState('Spam')
  const [reportComment, setReportComment] = useState('')

  // Create Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    courseId: '',
    category: 'Node.js',
    tags: '',
    privacy: 'everyone',
    attachmentName: '',
    attachmentUrl: ''
  })
  const [creating, setCreating] = useState(false)

  // Reply Form State
  const [replyText, setReplyText] = useState('')
  const [replyingToParent, setReplyingToParent] = useState(null) // parent reply ID for nested reply

  // Dynamic Categories from database and courses
  const categories = useMemo(() => {
    const set = new Set(['General', 'Doubt', 'Assignment', 'Announcement'])
    if (Array.isArray(courses)) {
      courses.forEach(item => {
        const c = item.course && typeof item.course === 'object' ? item.course : item
        if (c.category) set.add(c.category)
      })
    }
    if (Array.isArray(discussions)) {
      discussions.forEach(d => { if (d.category) set.add(d.category) })
    }
    return Array.from(set)
  }, [courses, discussions])

  // Dynamic Popular Tags from real database discussions
  const popularTags = useMemo(() => {
    const set = new Set()
    if (Array.isArray(discussions)) {
      discussions.forEach(d => {
        if (Array.isArray(d.tags)) {
          d.tags.forEach(t => {
            if (t && typeof t === 'string') set.add(`#${t.replace(/^#/, '')}`)
          })
        }
      })
    }
    return Array.from(set)
  }, [discussions])

  // Dynamic Course Tree Data from student's enrolled courses
  const courseTreeData = useMemo(() => {
    if (!courses || courses.length === 0) return []
    return courses.map(item => {
      const c = item.course && typeof item.course === 'object' ? item.course : item
      return {
        _id: c._id || item._id,
        name: c.title || 'Course',
        topics: (c.modules && c.modules.length > 0)
          ? c.modules.map(m => m.title)
          : ['General Doubts', 'Assignments & Homework', 'Lectures & Notes']
      }
    })
  }, [courses])

  const fetchDiscussions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/forum', {
        params: {
          courseId: selectedCourse,
          category: selectedCategory,
          tag: selectedTag,
          search: searchQuery,
          filter: activeFilter
        }
      })
      setDiscussions(res.data.discussions || [])
      setTotal(res.data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedCourse, selectedCategory, selectedTag, searchQuery, activeFilter])

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await axios.get('/api/forum/top-contributors')
      setLeaderboard(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const res = await axios.get('/api/forum/analytics')
      setAnalytics(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchDiscussions()
    fetchLeaderboard()
  }, [fetchDiscussions, fetchLeaderboard])

  const [allCourses, setAllCourses] = useState([])

  const getCourseId = (item) => {
    if (!item) return ''
    if (item.course) {
      if (typeof item.course === 'object' && item.course._id) return String(item.course._id)
      if (typeof item.course === 'string') return item.course
    }
    if (typeof item === 'object' && item._id) return String(item._id)
    if (typeof item === 'string') return item
    return ''
  }

  const getCourseTitle = (item) => {
    if (!item) return 'Course'
    if (item.course && typeof item.course === 'object' && item.course.title) return item.course.title
    if (typeof item === 'object' && item.title) return item.title
    return 'Course'
  }

  useEffect(() => {
    if (Array.isArray(courses) && courses.length > 0) {
      setAllCourses(courses)
    } else {
      axios.get('/api/courses').then(res => {
        setAllCourses(res.data || [])
      }).catch(err => console.error(err))
    }
  }, [courses])

  useEffect(() => {
    if (allCourses.length > 0 && !createForm.courseId) {
      const cid = getCourseId(allCourses[0])
      if (cid) {
        setCreateForm(prev => ({ ...prev, courseId: cid }))
      }
    }
  }, [allCourses, createForm.courseId])

  const handleCreateDiscussion = async (e) => {
    e.preventDefault()

    const targetCourseId = createForm.courseId || getCourseId(allCourses[0])

    if (!createForm.title || !createForm.title.trim()) {
      alert('Please enter a discussion title.')
      return
    }
    if (!createForm.description || !createForm.description.trim()) {
      alert('Please enter details or description for your discussion.')
      return
    }
    if (!targetCourseId) {
      alert('Please select a valid course.')
      return
    }

    setCreating(true)
    try {
      const attachments = createForm.attachmentName && createForm.attachmentUrl ? [
        { name: createForm.attachmentName, url: createForm.attachmentUrl, fileType: 'pdf', size: 1024 }
      ] : []

      const parsedTags = createForm.tags
        ? createForm.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
        : []

      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        courseId: targetCourseId,
        category: createForm.category || 'General',
        tags: parsedTags,
        privacy: createForm.privacy || 'everyone',
        attachments
      }

      const res = await axios.post('/api/forum', payload)

      setShowCreateModal(false)
      setCreateForm({
        title: '',
        description: '',
        courseId: targetCourseId,
        category: 'General',
        tags: '',
        privacy: 'everyone',
        attachmentName: '',
        attachmentUrl: ''
      })
      
      fetchDiscussions()
      if (res.data) {
        setSelectedDiscussion(res.data)
      }
    } catch (e) {
      console.error('Error creating discussion:', e)
      alert(e.response?.data?.message || 'Failed to publish discussion. Please check form entries and try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleVoteDiscussion = async (id, type) => {
    try {
      await axios.post(`/api/forum/${id}/vote`, { type })
      fetchDiscussions()
      if (selectedDiscussion && selectedDiscussion._id === id) {
        const res = await axios.get(`/api/forum/${id}`)
        setSelectedDiscussion(res.data)
      }
    } catch (e) { console.error(e) }
  }

  const handleBookmark = async (id) => {
    try {
      await axios.post(`/api/forum/${id}/bookmark`)
      fetchDiscussions()
    } catch (e) { console.error(e) }
  }

  const handleAddReply = async (e) => {
    e.preventDefault()
    if (!replyText || !selectedDiscussion) return
    try {
      const res = await axios.post(`/api/forum/${selectedDiscussion._id}/reply`, {
        content: replyText,
        parentReplyId: replyingToParent
      })
      setSelectedDiscussion(res.data)
      setReplyText('')
      setReplyingToParent(null)
      fetchDiscussions()
    } catch (e) { console.error(e) }
  }

  const handleVoteReply = async (replyId, type) => {
    if (!selectedDiscussion) return
    try {
      const res = await axios.post(`/api/forum/${selectedDiscussion._id}/reply/${replyId}/vote`, { type })
      setSelectedDiscussion(res.data)
      fetchDiscussions()
    } catch (e) { console.error(e) }
  }

  const handleToggleHelpful = async (replyId) => {
    if (!selectedDiscussion) return
    try {
      const res = await axios.post(`/api/forum/${selectedDiscussion._id}/reply/${replyId}/helpful`)
      setSelectedDiscussion(res.data)
      fetchDiscussions()
    } catch (e) { console.error(e) }
  }

  const handleAcceptAnswer = async (replyId) => {
    if (!selectedDiscussion) return
    try {
      const res = await axios.post(`/api/forum/${selectedDiscussion._id}/reply/${replyId}/accept`)
      setSelectedDiscussion(res.data)
      fetchDiscussions()
    } catch (e) { console.error(e) }
  }

  const handleTogglePin = async (id, currentVal) => {
    try {
      await axios.put(`/api/forum/${id}/controls`, { isPinned: !currentVal })
      fetchDiscussions()
      if (selectedDiscussion && selectedDiscussion._id === id) {
        setSelectedDiscussion(prev => ({ ...prev, isPinned: !currentVal }))
      }
    } catch (e) { console.error(e) }
  }

  const handleToggleLock = async (id, currentVal) => {
    try {
      await axios.put(`/api/forum/${id}/controls`, { isLocked: !currentVal })
      fetchDiscussions()
      if (selectedDiscussion && selectedDiscussion._id === id) {
        setSelectedDiscussion(prev => ({ ...prev, isLocked: !currentVal }))
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteDiscussion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return
    try {
      await axios.delete(`/api/forum/${id}`)
      if (selectedDiscussion && selectedDiscussion._id === id) {
        setSelectedDiscussion(null)
      }
      fetchDiscussions()
    } catch (e) { console.error(e) }
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (!reportingDiscussionId) return
    try {
      await axios.post(`/api/forum/${reportingDiscussionId}/report`, {
        reason: reportReason,
        comment: reportComment
      })
      setShowReportModal(false)
      setReportingDiscussionId(null)
      alert('Discussion reported to moderators.')
    } catch (e) { console.error(e) }
  }

  const openThread = async (disc) => {
    try {
      const res = await axios.get(`/api/forum/${disc._id}`)
      setSelectedDiscussion(res.data)
    } catch (e) {
      setSelectedDiscussion(disc)
    }
  }

  // Render Thread Reply List
  const renderReplies = (replies = []) => {
    const mainReplies = replies.filter(r => !r.parentReplyId)

    return mainReplies.map(reply => {
      const isAccepted = reply.isAccepted || selectedDiscussion?.acceptedAnswer === reply._id
      const childReplies = replies.filter(r => r.parentReplyId === reply._id)

      return (
        <div key={reply._id} className={`df-reply-card${isAccepted ? ' accepted' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div className="df-author-info">
              <div className="df-avatar">
                {reply.author?.profile?.firstName?.charAt(0) || reply.author?.email?.charAt(0) || 'U'}
              </div>
              <div className="df-author-meta">
                <strong>
                  {reply.author?.profile?.firstName} {reply.author?.profile?.lastName}
                  {reply.author?.role === 'instructor' && <span style={{ marginLeft: 6, fontSize: 10, background: '#ede9fe', color: '#6d28d9', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>Instructor</span>}
                </strong>
                <small>{new Date(reply.createdAt).toLocaleString()}</small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {isAccepted && (
                <span className="df-badge df-badge-answered" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiCheckCircle /> Accepted Answer
                </span>
              )}
              {reply.isHelpful && (
                <span style={{ fontSize: 11, fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6 }}>
                  ⭐ Helpful
                </span>
              )}
            </div>
          </div>

          <p style={{ margin: '8px 0 14px 0', fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>{reply.content}</p>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="df-vote-btn" onClick={() => handleVoteReply(reply._id, 'up')}>
                <FiThumbsUp /> {reply.upvotes?.length || 0}
              </button>
              <button className="df-vote-btn" onClick={() => handleVoteReply(reply._id, 'down')}>
                <FiThumbsDown /> {reply.downvotes?.length || 0}
              </button>
              <button style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setReplyingToParent(reply._id)}>
                <FiCornerDownRight /> Reply
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {isInstructor && (
                <button style={{ background: isAccepted ? '#dcfce7' : '#f1f5f9', color: isAccepted ? '#15803d' : '#475569', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => handleAcceptAnswer(reply._id)}>
                  {isAccepted ? '✓ Accepted' : 'Mark Accepted'}
                </button>
              )}
              <button style={{ background: reply.isHelpful ? '#fef3c7' : '#f1f5f9', color: reply.isHelpful ? '#b45309' : '#475569', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                onClick={() => handleToggleHelpful(reply._id)}>
                ⭐ Helpful
              </button>
            </div>
          </div>

          {/* Nested Replies */}
          {childReplies.map(child => (
            <div key={child._id} className="df-reply-card nested" style={{ marginTop: 12 }}>
              <div className="df-author-info" style={{ marginBottom: 6 }}>
                <div className="df-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                  {child.author?.profile?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="df-author-meta">
                  <strong style={{ fontSize: '0.82rem' }}>
                    {child.author?.profile?.firstName} {child.author?.profile?.lastName}
                  </strong>
                  <small>{new Date(child.createdAt).toLocaleTimeString()}</small>
                </div>
              </div>
              <p style={{ margin: '4px 0 8px', fontSize: '0.88rem', color: '#475569' }}>{child.content}</p>
            </div>
          ))}
        </div>
      )
    })
  }

  return (
    <div className="df-container">
      {/* Header Banner */}
      <div className="df-header">
        <div>
          <h2>💬 Discussion Forum</h2>
          <p>Public discussions, doubts, assignments & knowledge sharing</p>
        </div>

        <div className="df-header-actions">
          {isInstructor && (
            <button className="df-btn-analytics" onClick={() => { fetchAnalyticsData(); setShowAnalyticsModal(true) }}>
              <FiPieChart /> Forum Analytics
            </button>
          )}
          <button className="df-btn-create" onClick={() => setShowCreateModal(true)}>
            <FiPlus /> New Discussion
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="df-layout">
        {/* Left Sidebar: Categories & Course Topics */}
        <aside className="df-sidebar-card">
          <div>
            <h4 className="df-sidebar-title"><FiFilter /> Categories</h4>
            <ul className="df-nav-list">
              <li key="all">
                <button className={`df-nav-item${selectedCategory === 'all' ? ' active' : ''}`}
                  onClick={() => setSelectedCategory('all')}>
                  <span>All Categories</span>
                  <span className="df-nav-badge">{total}</span>
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat}>
                  <button className={`df-nav-item${selectedCategory === cat ? ' active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}>
                    <span>{cat}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {popularTags.length > 0 && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <h4 className="df-sidebar-title"><FiTag /> Realtime Tags</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {popularTags.map(tag => (
                  <span key={tag} className={`df-tag${selectedTag === tag.replace('#','') ? ' active' : ''}`}
                    onClick={() => setSelectedTag(selectedTag === tag.replace('#','') ? '' : tag.replace('#',''))}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {courseTreeData.length > 0 && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <h4 className="df-sidebar-title"><FiChevronRight /> Course Roster</h4>
              <div className="df-course-tree">
                {courseTreeData.map(c => (
                  <div key={c._id || c.name}>
                    <div 
                      className={`df-tree-course ${selectedCourse === c._id ? 'text-indigo-600 font-bold' : ''}`}
                      onClick={() => setSelectedCourse(c._id)}
                    >
                      📚 {c.name}
                    </div>
                    <div className="df-tree-sub">
                      {c.topics.map(t => (
                        <span 
                          key={t} 
                          className="df-tree-topic" 
                          onClick={() => { 
                            setSelectedCourse(c._id)
                            setSearchQuery(t) 
                          }}
                        >
                          ├── {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Center: Discussion List or Single Discussion Details */}
        <main className="df-main-content">
          {selectedDiscussion ? (
            /* Single Thread View */
            <div className="df-thread-view">
              <button style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}
                onClick={() => setSelectedDiscussion(null)}>
                ← Back to All Discussions
              </button>

              <div className="df-card-badges">
                {selectedDiscussion.isPinned && <span className="df-badge df-badge-pin">📌 Pinned</span>}
                {selectedDiscussion.acceptedAnswer && <span className="df-badge df-badge-answered">🟢 Answered</span>}
                <span className="df-badge df-badge-category">{selectedDiscussion.category}</span>
                <span className="df-badge df-badge-course">{selectedDiscussion.course?.title}</span>
              </div>

              <h2 style={{ margin: '8px 0 12px 0', fontSize: '1.4rem', fontWeight: 800 }}>{selectedDiscussion.title}</h2>

              <div className="df-author-info" style={{ marginBottom: 16 }}>
                <div className="df-avatar">
                  {selectedDiscussion.author?.profile?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="df-author-meta">
                  <strong>{selectedDiscussion.author?.profile?.firstName} {selectedDiscussion.author?.profile?.lastName}</strong>
                  <small>Asked on {new Date(selectedDiscussion.createdAt).toLocaleDateString()}</small>
                </div>
              </div>

              <p style={{ fontSize: '1rem', color: '#334155', lineHeight: 1.7, marginBottom: 20 }}>{selectedDiscussion.description}</p>

              {/* Attachments */}
              {selectedDiscussion.attachments?.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: 12, textTransform: 'uppercase', color: '#64748b' }}>📎 Attachments</h5>
                  {selectedDiscussion.attachments.map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#6366f1', fontWeight: 700, textDecoration: 'underline' }}>
                      📄 {att.name || 'Attachment File'}
                    </a>
                  ))}
                </div>
              )}

              {/* Discussion Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '12px 0', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button className="df-vote-btn" onClick={() => handleVoteDiscussion(selectedDiscussion._id, 'up')}>
                    <FiThumbsUp /> {selectedDiscussion.upvotes?.length || 0}
                  </button>
                  <button className="df-vote-btn" onClick={() => handleVoteDiscussion(selectedDiscussion._id, 'down')}>
                    <FiThumbsDown /> {selectedDiscussion.downvotes?.length || 0}
                  </button>
                  <button className="df-vote-btn" onClick={() => handleBookmark(selectedDiscussion._id)}>
                    <FiBookmark /> Bookmark
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#64748b', fontWeight: 700 }}>
                  <span>💬 {selectedDiscussion.replies?.length || 0} Replies</span>
                  <span>👁️ {selectedDiscussion.views || 0} Views</span>
                </div>
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleAddReply} style={{ marginBottom: 30 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 15, fontWeight: 800 }}>
                  {replyingToParent ? '↩️ Replying to comment' : '✍️ Write an Answer'}
                </h4>
                <textarea
                  className="df-form-textarea"
                  rows={4}
                  placeholder="Share your answer, code example, or detailed breakdown..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  {replyingToParent && (
                    <button type="button" style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setReplyingToParent(null)}>
                      Cancel Reply
                    </button>
                  )}
                  <button type="submit" className="df-btn-create" style={{ marginLeft: 'auto', padding: '10px 20px', fontSize: 13 }}>
                    Post Answer
                  </button>
                </div>
              </form>

              {/* Replies Section */}
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>
                Answers & Discussion ({selectedDiscussion.replies?.length || 0})
              </h3>
              {renderReplies(selectedDiscussion.replies)}
            </div>
          ) : (
            /* Discussion List View */
            <>
              {/* Search Bar */}
              <div className="df-search-bar">
                <FiSearch color="#94a3b8" size={18} />
                <input
                  placeholder="Search discussions by title, tags, course, author..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Chips */}
              <div className="df-filters-row">
                {[
                  { key: 'all', label: 'All Discussions' },
                  { key: 'my', label: 'My Discussions' },
                  { key: 'bookmarks', label: '🔖 Bookmarks' },
                  { key: 'unanswered', label: '❓ Unanswered' },
                  { key: 'answered', label: '🟢 Answered' },
                  { key: 'pinned', label: '📌 Pinned' },
                  { key: 'popular', label: '🔥 Popular' },
                  { key: 'recent', label: '🕒 Recent' }
                ].map(f => (
                  <button
                    key={f.key}
                    className={`df-filter-chip${activeFilter === f.key ? ' active' : ''}`}
                    onClick={() => setActiveFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Discussion Cards List */}
              {discussions.map(disc => (
                <div key={disc._id} className={`df-card${disc.isPinned ? ' pinned' : ''}`}>
                  <div className="df-card-badges">
                    {disc.isPinned && <span className="df-badge df-badge-pin">📌 Pinned</span>}
                    {disc.acceptedAnswer && <span className="df-badge df-badge-answered">🟢 Answered</span>}
                    <span className="df-badge df-badge-category">{disc.category}</span>
                    <span className="df-badge df-badge-course">{disc.course?.title}</span>
                  </div>

                  <h3 className="df-card-title" onClick={() => openThread(disc)}>
                    {disc.title}
                  </h3>

                  <p className="df-card-desc">{disc.description?.slice(0, 160)}...</p>

                  <div className="df-card-tags">
                    {disc.tags?.map((t, ti) => (
                      <span key={ti} className="df-tag">#{t}</span>
                    ))}
                  </div>

                  <div className="df-card-footer">
                    <div className="df-author-info">
                      <div className="df-avatar">
                        {disc.author?.profile?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div className="df-author-meta">
                        <strong>{disc.author?.profile?.firstName} {disc.author?.profile?.lastName}</strong>
                        <small>{new Date(disc.createdAt).toLocaleDateString()}</small>
                      </div>
                    </div>

                    <div className="df-stats-row">
                      <div className="df-stat-item"><FiThumbsUp /> {disc.upvotes?.length || 0}</div>
                      <div className="df-stat-item"><FiMessageSquare /> {disc.replies?.length || 0} replies</div>
                      <div className="df-stat-item"><FiEye /> {disc.views || 0} views</div>

                      {/* Instructor Controls */}
                      {isInstructor && (
                        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                          <button style={{ background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
                            title="Pin / Unpin" onClick={() => handleTogglePin(disc._id, disc.isPinned)}>
                            <FiPin color={disc.isPinned ? '#f59e0b' : '#64748b'} />
                          </button>
                          <button style={{ background: '#fee2e2', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
                            title="Delete" onClick={() => handleDeleteDiscussion(disc._id)}>
                            <FiTrash2 color="#ef4444" />
                          </button>
                        </div>
                      )}

                      <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 4 }}
                        title="Report" onClick={() => { setReportingDiscussionId(disc._id); setShowReportModal(true) }}>
                        <FiFlag />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && discussions.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <h3>No discussions found</h3>
                  <p style={{ color: '#64748b' }}>Be the first to start a conversation in this category!</p>
                  <button className="df-btn-create" style={{ margin: '14px auto 0' }} onClick={() => setShowCreateModal(true)}>
                    + Start New Discussion
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Sidebar: Top Contributors Leaderboard */}
        <aside>
          <div className="df-contributors-card">
            <h4 className="df-sidebar-title"><FiAward /> 🏆 Top Contributors</h4>
            {leaderboard.slice(0, 5).map((user, idx) => (
              <div key={user._id || idx} className="df-contributor-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="df-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', display: 'block', color: '#0f172a' }}>{user.name}</strong>
                    <small style={{ fontSize: '0.72rem', color: '#64748b' }}>{user.role}</small>
                  </div>
                </div>

                <span className="df-pts-badge">{user.points} pts</span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: '10px 0' }}>No top points yet.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <div className="df-modal-overlay">
          <div className="df-modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>📝 Create New Discussion</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateDiscussion}>
              <div className="df-form-group">
                <label>Discussion Title</label>
                <input className="df-form-input" placeholder="e.g. How does Node.js Event Loop work?" required value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="df-form-group">
                  <label>Select Course</label>
                  <select className="df-form-select" required value={createForm.courseId} onChange={e => setCreateForm({ ...createForm, courseId: e.target.value })}>
                    {allCourses.map(item => {
                      const cid = getCourseId(item)
                      const ctitle = getCourseTitle(item)
                      return <option key={cid} value={cid}>{ctitle}</option>
                    })}
                  </select>
                </div>

                <div className="df-form-group">
                  <label>Category</label>
                  <select className="df-form-select" value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="df-form-group">
                <label>Description / Question Detail</label>
                <textarea className="df-form-textarea" rows={5} placeholder="Describe your doubt, share code snippets or details..." required value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
              </div>

              <div className="df-form-group">
                <label>Tags (Comma Separated)</label>
                <input className="df-form-input" placeholder="e.g. nodejs, express, eventloop" value={createForm.tags} onChange={e => setCreateForm({ ...createForm, tags: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="df-form-group">
                  <label>Attachment Name (Optional)</label>
                  <input className="df-form-input" placeholder="e.g. Nodejs_Notes.pdf" value={createForm.attachmentName} onChange={e => setCreateForm({ ...createForm, attachmentName: e.target.value })} />
                </div>

                <div className="df-form-group">
                  <label>Attachment File Link / URL</label>
                  <input className="df-form-input" placeholder="e.g. https://..." value={createForm.attachmentUrl} onChange={e => setCreateForm({ ...createForm, attachmentUrl: e.target.value })} />
                </div>
              </div>

              <div className="df-form-group">
                <label>Discussion Privacy</label>
                <select className="df-form-select" value={createForm.privacy} onChange={e => setCreateForm({ ...createForm, privacy: e.target.value })}>
                  <option value="everyone">Everyone (Public)</option>
                  <option value="course_students">Course Students Only</option>
                  <option value="instructor_only">Instructor Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="df-btn-create" disabled={creating}>{creating ? 'Posting...' : 'Publish Discussion'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 450 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>🚨 Report Discussion</h3>
            <form onSubmit={handleReportSubmit}>
              <div className="df-form-group">
                <label>Reason for Report</label>
                <select className="df-form-select" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                  <option value="Spam">Spam</option>
                  <option value="Abuse">Abuse / Harassment</option>
                  <option value="Irrelevant">Irrelevant Content</option>
                  <option value="Offensive content">Offensive Content</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="df-form-group">
                <label>Additional Comment</label>
                <textarea className="df-form-textarea" rows={3} placeholder="Please explain..." value={reportComment} onChange={e => setReportComment(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontWeight: 700 }} onClick={() => setShowReportModal(false)}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="df-modal-overlay">
          <div className="df-modal-box" style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>📊 Forum Analytics Dashboard</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }} onClick={() => setShowAnalyticsModal(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', fontWeight: 700 }}>Total Discussions</small>
                <h2 style={{ margin: '4px 0 0', color: '#4338ca' }}>{analytics?.totalDiscussions || 0}</h2>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', fontWeight: 700 }}>Total Replies</small>
                <h2 style={{ margin: '4px 0 0', color: '#059669' }}>{analytics?.totalReplies || 0}</h2>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', fontWeight: 700 }}>Active Users</small>
                <h2 style={{ margin: '4px 0 0', color: '#d97706' }}>{analytics?.activeUsers || 0}</h2>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', fontWeight: 700 }}>Unanswered Doubts</small>
                <h2 style={{ margin: '4px 0 0', color: '#ef4444' }}>{analytics?.unansweredCount || 0}</h2>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
