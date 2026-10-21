import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import {
  FiEdit2, FiEdit3, FiFeather, FiTrash2, FiVideo, FiMic,
  FiShare2, FiDownload, FiUsers, FiMessageSquare, FiClock, FiPlus,
  FiMaximize, FiSquare, FiCircle, FiArrowRight, FiType, FiFileText,
  FiImage, FiRotateCcw, FiRotateCw, FiPlay, FiSend, FiMove, FiRadio,
  FiCheck, FiSidebar, FiBell, FiThumbsUp, FiHelpCircle, FiGrid,
  FiX, FiCheckSquare, FiUploadCloud, FiExternalLink, FiCpu, FiMinusSquare,
  FiFolder, FiInfo
} from 'react-icons/fi'
import './LiveWhiteboard.css'

const PRESET_COLORS = [
  '#0f172a', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'
]

const INITIAL_STUDENTS = [
  { studentId: 'std_1', name: 'Harsh Kumar', email: 'harsh@gmail.com', avatarBg: '#3b82f6', active: true, handRaised: true, status: 'present' },
  { studentId: 'std_2', name: 'Sahil Patel', email: 'sahil@gmail.com', avatarBg: '#10b981', active: true, handRaised: false, status: 'present' },
  { studentId: 'std_3', name: 'Priya Sharma', email: 'priya@gmail.com', avatarBg: '#8b5cf6', active: true, handRaised: true, status: 'present' },
  { studentId: 'std_4', name: 'Rahul Singh', email: 'rahul@gmail.com', avatarBg: '#f59e0b', active: false, handRaised: false, status: 'absent' },
  { studentId: 'std_5', name: 'Neha Gupta', email: 'neha@gmail.com', avatarBg: '#ec4899', active: true, handRaised: false, status: 'present' }
]

export default function LiveWhiteboard({ courses = [], onBack }) {
  // Course & Session State
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?._id || '')
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('Node.js Architecture & Event Loop')
  const [sessionTimer, setSessionTimer] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTimer, setRecordingTimer] = useState(0)
  const [lastSaved, setLastSaved] = useState(new Date())
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved', 'saving', 'error'

  // Socket State
  const [socketStatus, setSocketStatus] = useState('connected')
  const socketRef = useRef(null)

  // Pages State
  const [pages, setPages] = useState([
    { id: 'page_1', title: 'Page 1: Introduction', drawingData: null },
    { id: 'page_2', title: 'Page 2: Architecture', drawingData: null },
    { id: 'page_3', title: 'Page 3: Live Code', drawingData: null }
  ])
  const [activePageIndex, setActivePageIndex] = useState(0)

  // Tools & Properties State
  const [tool, setTool] = useState('pen') // select, pan, pen, highlighter, eraser, line, arrow, rectangle, circle, text, sticky, laser, image
  const [color, setColor] = useState('#0f172a')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [lineStyle, setLineStyle] = useState('solid')
  const [bgStyle, setBgStyle] = useState('grid') // white, grid, dots, lines, dark
  const [zoom, setZoom] = useState(100)

  // Undo / Redo Stacks
  const [history, setHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])

  // Sticky Notes & Floating Objects
  const [stickyNotes, setStickyNotes] = useState([
    { id: 'st_1', pageIndex: 0, text: '💡 Topic 1: Event Loop Phases\n- Timers\n- Poll\n- Check', color: 'yellow', x: 80, y: 80 }
  ])

  // Cursors & Laser State
  const [remoteCursors, setRemoteCursors] = useState({})
  const [laserPos, setLaserPos] = useState(null)

  // Right Dock State
  const [showRightDock, setShowRightDock] = useState(true)
  const [activeDockTab, setActiveDockTab] = useState('chat') // chat, users, files, info
  const [unreadChat, setUnreadChat] = useState(0)

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Harsh Kumar', role: 'student', text: 'Good evening sir! Ready for Node.js Event Loop class.', timestamp: '21:05', isQuestion: false },
    { id: 2, sender: 'Priya Sharma', role: 'student', text: 'Will call stack overflow be covered today?', timestamp: '21:07', isQuestion: true }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isQuestionFlag, setIsQuestionFlag] = useState(false)

  // Roster & Files
  const [students, setStudents] = useState(INITIAL_STUDENTS)
  const [studentSearch, setStudentSearch] = useState('')
  const [filesList, setFilesList] = useState([
    { id: 'f1', name: 'NodeJS_EventLoop_Diagram.pdf', size: '2.4 MB', date: 'Just now', url: '#' }
  ])

  // Modals State
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [timerMins, setTimerMins] = useState(10)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  const [showShareModal, setShowShareModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [pastSessions, setPastSessions] = useState([])

  const [showCalculatorModal, setShowCalculatorModal] = useState(false)
  const [calcDisplay, setCalcDisplay] = useState('0')

  // Toast Notification
  const [toast, setToast] = useState(null)

  // Refs
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const isDrawingRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const snapshotRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // 1. Socket.IO Real-time Initialization
  useEffect(() => {
    const roomId = `whiteboard_${selectedCourse || 'default'}`
    const socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setSocketStatus('connected')
      socket.emit('join-room', {
        roomId,
        user: { name: 'Shubham Kumar (Instructor)', role: 'instructor' }
      })
    })

    socket.on('disconnect', () => setSocketStatus('disconnected'))

    socket.on('whiteboard-draw', (data) => {
      if (data && data.pageIndex === activePageIndex) {
        drawStrokeFromSocket(data)
      }
    })

    socket.on('whiteboard-clear', (data) => {
      if (data.pageIndex === activePageIndex) {
        clearCanvasLocal()
      }
    })

    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg])
      if (activeDockTab !== 'chat') setUnreadChat(prev => prev + 1)
    })

    socket.on('cursor-move', (data) => {
      setRemoteCursors(prev => ({ ...prev, [data.socketId]: data }))
    })

    socket.on('laser-move', (data) => {
      setLaserPos(data)
    })

    return () => {
      socket.disconnect()
    }
  }, [selectedCourse, activePageIndex, activeDockTab])

  // 2. Fetch Course Students & Past Sessions from Database
  useEffect(() => {
    if (!selectedCourse) return
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`/api/instructor/courses/${selectedCourse}/students`)
        if (res.data && res.data.length > 0) {
          const list = res.data.map((s, idx) => ({
            studentId: s._id || `s_${idx}`,
            name: s.name || (s.profile ? `${s.profile.firstName || ''} ${s.profile.lastName || ''}`.trim() : '') || s.email || `Student ${idx + 1}`,
            email: s.email || '',
            avatarBg: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'][idx % 5],
            active: true,
            handRaised: false,
            status: 'present'
          }))
          setStudents(list)
        }
      } catch (err) {
        console.error('Failed to load course students:', err)
      }
    }
    fetchStudents()
  }, [selectedCourse])

  // 3. Timers Effect
  useEffect(() => {
    let interval = null
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sessionActive])

  useEffect(() => {
    let recInterval = null
    if (isRecording) {
      recInterval = setInterval(() => {
        setRecordingTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(recInterval)
  }, [isRecording])

  useEffect(() => {
    let tInterval = null
    if (timerRunning && timerSecondsLeft > 0) {
      tInterval = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false)
            showToast('⏰ Custom Timer Finished!')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(tInterval)
  }, [timerRunning, timerSecondsLeft])

  // 4. Responsive Canvas Resize Listener
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      
      const width = container.clientWidth
      const height = container.clientHeight

      if (canvas.width !== width || canvas.height !== height) {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext('2d')
        tempCtx.drawImage(canvas, 0, 0)

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 5. Canvas Drawing Operations
  const saveCanvasState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL()
    setHistory(prev => [...prev.slice(-20), dataUrl])
    setRedoStack([])

    // Update current page drawing
    setPages(prev => prev.map((p, idx) => idx === activePageIndex ? { ...p, drawingData: dataUrl } : p))
    setLastSaved(new Date())
    setSaveStatus('saved')
  }

  const startDrawing = (e) => {
    if (tool === 'select' || tool === 'sticky') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    isDrawingRef.current = true
    startPosRef.current = { x, y }

    const ctx = canvas.getContext('2d')
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = tool === 'highlighter' ? color + '66' : color
    ctx.lineWidth = tool === 'highlighter' ? strokeWidth * 2.5 : strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (lineStyle === 'dashed') ctx.setLineDash([10, 6])
    else if (lineStyle === 'dotted') ctx.setLineDash([3, 5])
    else ctx.setLineDash([])

    if (tool === 'laser') {
      const laserData = { x, y, active: true }
      setLaserPos(laserData)
      socketRef.current?.emit('laser-move', laserData)
    }
  }

  const draw = (e) => {
    if (!isDrawingRef.current) {
      if (tool === 'laser') {
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          socketRef.current?.emit('cursor-move', { x, y })
        }
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')

    if (tool === 'pen' || tool === 'highlighter') {
      ctx.lineTo(x, y)
      ctx.stroke()

      // Broadcast draw stroke via socket
      socketRef.current?.emit('whiteboard-draw', {
        pageIndex: activePageIndex,
        type: tool,
        x, y,
        color, strokeWidth
      })
    } else if (tool === 'eraser') {
      ctx.clearRect(x - strokeWidth * 3, y - strokeWidth * 3, strokeWidth * 6, strokeWidth * 6)
    } else if (['line', 'arrow', 'rectangle', 'circle'].includes(tool)) {
      ctx.putImageData(snapshotRef.current, 0, 0)
      ctx.beginPath()
      const startX = startPosRef.current.x
      const startY = startPosRef.current.y

      if (tool === 'line') {
        ctx.moveTo(startX, startY)
        ctx.lineTo(x, y)
      } else if (tool === 'arrow') {
        ctx.moveTo(startX, startY)
        ctx.lineTo(x, y)
        const angle = Math.atan2(y - startY, x - startX)
        ctx.lineTo(x - 12 * Math.cos(angle - Math.PI / 6), y - 12 * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(x, y)
        ctx.lineTo(x - 12 * Math.cos(angle + Math.PI / 6), y - 12 * Math.sin(angle + Math.PI / 6))
      } else if (tool === 'rectangle') {
        ctx.strokeRect(startX, startY, x - startX, y - startY)
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2))
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI)
      }
      ctx.stroke()
    } else if (tool === 'laser') {
      const laserData = { x, y, active: true }
      setLaserPos(laserData)
      socketRef.current?.emit('laser-move', laserData)
    }
  }

  const stopDrawing = (e) => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    if (tool === 'text') {
      const canvas = canvasRef.current
      if (canvas && startPosRef.current) {
        const input = prompt('Enter Text:', 'Key Concept')
        if (input) {
          const ctx = canvas.getContext('2d')
          ctx.font = `${strokeWidth * 4 + 12}px Inter, sans-serif`
          ctx.fillStyle = color
          ctx.fillText(input, startPosRef.current.x, startPosRef.current.y)
          saveCanvasState()
        }
      }
    } else {
      saveCanvasState()
    }
  }

  const drawStrokeFromSocket = (data) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.strokeStyle = data.color
    ctx.lineWidth = data.strokeWidth
    ctx.arc(data.x, data.y, 2, 0, 2 * Math.PI)
    ctx.stroke()
  }

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    saveCanvasState()
  }

  const handleClearCanvas = () => {
    if (window.confirm('Clear all drawings on the current page?')) {
      clearCanvasLocal()
      socketRef.current?.emit('whiteboard-clear', { pageIndex: activePageIndex })
      showToast('Canvas cleared')
    }
  }

  const handleUndo = () => {
    if (history.length <= 1) return
    const current = history[history.length - 1]
    const previous = history[history.length - 2]
    setRedoStack(prev => [...prev, current])
    setHistory(prev => prev.slice(0, -1))

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = previous
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack(prev => prev.slice(0, -1))
    setHistory(prev => [...prev, next])

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = next
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
  }

  // 6. Page Operations
  const handleAddPage = () => {
    const newIdx = pages.length + 1
    const newPage = { id: `page_${Date.now()}`, title: `Page ${newIdx}: Concept ${newIdx}`, drawingData: null }
    setPages(prev => [...prev, newPage])
    setActivePageIndex(pages.length)
    clearCanvasLocal()
    showToast(`Added Page ${newIdx}`)
  }

  const handleSwitchPage = (idx) => {
    setActivePageIndex(idx)
    const targetPage = pages[idx]
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (targetPage && targetPage.drawingData) {
      const img = new Image()
      img.src = targetPage.drawingData
      img.onload = () => ctx.drawImage(img, 0, 0)
    }
    socketRef.current?.emit('whiteboard-page-change', { activePageIndex: idx })
  }

  const handleDeletePage = (idx) => {
    if (pages.length <= 1) {
      showToast('Cannot delete the only page')
      return
    }
    if (window.confirm(`Delete page "${pages[idx].title}"?`)) {
      setPages(prev => prev.filter((_, i) => i !== idx))
      const nextIdx = Math.max(0, idx - 1)
      handleSwitchPage(nextIdx)
      showToast('Page deleted')
    }
  }

  // 7. Sticky Note Actions
  const handleAddSticky = () => {
    const newNote = {
      id: `st_${Date.now()}`,
      pageIndex: activePageIndex,
      text: 'New Sticky Note',
      color: ['yellow', 'green', 'blue', 'pink', 'purple'][stickyNotes.length % 5],
      x: 120 + (stickyNotes.length * 20) % 200,
      y: 120 + (stickyNotes.length * 20) % 150
    }
    setStickyNotes(prev => [...prev, newNote])
    showToast('Sticky note added')
  }

  const updateStickyText = (id, text) => {
    setStickyNotes(prev => prev.map(s => s.id === id ? { ...s, text } : s))
  }

  const deleteSticky = (id) => {
    setStickyNotes(prev => prev.filter(s => s.id !== id))
  }

  // 8. Session Control (Start, End, Save to DB)
  const handleToggleSession = async () => {
    if (!sessionActive) {
      setSessionActive(true)
      showToast('🚀 Live Session Started!')
      socketRef.current?.emit('session-status-change', { sessionActive: true })
    } else {
      if (window.confirm('End this Live Whiteboard session and save to history?')) {
        setSessionActive(false)
        setIsRecording(false)
        await handleSaveSessionToDB()
        showToast('✓ Session ended and saved to history!')
        socketRef.current?.emit('session-status-change', { sessionActive: false })
      }
    }
  }

  const handleSaveSessionToDB = async () => {
    setSaveStatus('saving')
    try {
      await axios.post('/api/instructor/whiteboard/sessions', {
        title: sessionTitle,
        courseId: selectedCourse,
        pages,
        durationSeconds: sessionTimer,
        participantsCount: students.filter(s => s.status === 'present').length,
        participantsList: students,
        isRecorded,
        settings: { tool, color, strokeWidth, bgStyle },
        chatMessages
      })
      setSaveStatus('saved')
      setLastSaved(new Date())
    } catch (err) {
      console.error('Failed to save session to DB:', err)
      setSaveStatus('error')
    }
  }

  const handleToggleRecord = () => {
    if (!isRecording) {
      if (window.confirm('Start Recording this whiteboard session?')) {
        setIsRecording(true)
        showToast('🔴 Recording started!')
      }
    } else {
      setIsRecording(false)
      showToast('Recording stopped. (Local log generated)')
    }
  }

  // 9. Modals Trigger Handlers
  const fetchPastSessions = async () => {
    try {
      const res = await axios.get('/api/instructor/whiteboard/sessions')
      setPastSessions(res.data || [])
      setShowHistoryModal(true)
    } catch (err) {
      showToast('Failed to fetch session history')
    }
  }

  const handleCalcClick = (val) => {
    if (val === 'C') setCalcDisplay('0')
    else if (val === '=') {
      try {
        setCalcDisplay(eval(calcDisplay.replace(/×/g, '*').replace(/÷/g, '/')).toString())
      } catch {
        setCalcDisplay('Error')
      }
    } else {
      setCalcDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val)
    }
  }

  const handleSendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const newMsg = {
      id: Date.now(),
      sender: 'Shubham Kumar',
      role: 'instructor',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isQuestion: isQuestionFlag
    }
    setChatMessages(prev => [...prev, newMsg])
    socketRef.current?.emit('chat-message', newMsg)
    setChatInput('')
    setIsQuestionFlag(false)
  }

  const handleEmojiReaction = (emoji) => {
    showToast(`Reaction sent: ${emoji}`)
    socketRef.current?.emit('reaction', { emoji, user: 'Instructor' })
  }

  const handleExportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${sessionTitle.replace(/\s+/g, '_')}_Page_${activePageIndex + 1}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('Exported page as PNG image!')
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const filteredStudents = students.filter(s => {
    const nameStr = (s?.name || '').toLowerCase()
    const emailStr = (s?.email || '').toLowerCase()
    const query = (studentSearch || '').toLowerCase()
    return nameStr.includes(query) || emailStr.includes(query)
  })

  return (
    <div className="lw-root">
      {/* Toast Notification Banner */}
      {toast && <div className="lw-toast-banner">{toast}</div>}

      {/* 1. TOP NAVIGATION HEADER */}
      <header className="lw-top-nav">
        <div className="lw-nav-left">
          <button className="lw-exit-btn" onClick={onBack} title="Return to Instructor Dashboard">
            <FiRotateCcw size={13} /> Dashboard
          </button>
          <input
            className="lw-session-title-input"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Session Title..."
          />
          {courses.length > 0 && (
            <select
              className="lw-course-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          )}

          {sessionActive ? (
            <span className="lw-pill-live"><span className="lw-pulse-green" /> LIVE</span>
          ) : (
            <span className="lw-page-chip" style={{ color: '#64748b' }}>OFFLINE</span>
          )}

          {isRecording && (
            <span className="lw-pill-rec"><span className="lw-pulse-red" /> REC {formatTime(recordingTimer)}</span>
          )}
        </div>

        <div className="lw-nav-center">
          <div className="lw-timer-display">
            <FiClock size={13} /> {formatTime(sessionTimer)}
          </div>

          <div className="lw-save-badge">
            {saveStatus === 'saved' ? `✓ Saved` : saveStatus === 'saving' ? `⟳ Saving...` : `⚠ Save Error`}
          </div>

          <span style={{ fontSize: 11, fontWeight: 700, color: socketStatus === 'connected' ? '#10b981' : '#ef4444' }}>
            {socketStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>

        <div className="lw-nav-right">
          <button
            className={`lw-action-btn ${sessionActive ? 'lw-btn-stop' : 'lw-btn-start'}`}
            onClick={handleToggleSession}
          >
            {sessionActive ? 'End Session' : 'Start Live Session'}
          </button>

          <button
            className={`lw-action-btn ${isRecording ? 'lw-btn-stop' : 'lw-btn-rec'}`}
            onClick={handleToggleRecord}
          >
            <FiRadio size={13} /> {isRecording ? 'Stop Rec' : 'Record'}
          </button>

          <button className="lw-action-btn" onClick={() => setShowTimerModal(true)} title="Custom Timer">
            <FiClock size={13} /> Timer
          </button>

          <button className="lw-action-btn" onClick={() => setShowCalculatorModal(true)} title="Calculator">
            <FiCpu size={13} /> Calc
          </button>

          <button className="lw-action-btn" onClick={() => setShowShareModal(true)} title="Share Session">
            <FiShare2 size={13} /> Share
          </button>

          <button className="lw-action-btn" onClick={handleExportPNG} title="Export Current Board">
            <FiDownload size={13} /> Export
          </button>

          <button className="lw-action-btn" onClick={fetchPastSessions} title="Session History">
            <FiFolder size={13} /> History
          </button>

          <button className="lw-action-btn" onClick={() => setShowRightDock(v => !v)} title="Toggle Side Dock">
            <FiSidebar size={13} />
          </button>

          <button className="lw-action-btn" onClick={handleToggleFullscreen} title="Fullscreen">
            <FiMaximize size={13} />
          </button>
        </div>
      </header>

      {/* 2. SECONDARY CONTROL & CANVAS PROPERTY BAR */}
      <div className="lw-control-strip">
        <div className="lw-pages-section">
          {pages.map((p, idx) => (
            <div
              key={p.id}
              className={`lw-page-chip ${activePageIndex === idx ? 'active' : ''}`}
              onClick={() => handleSwitchPage(idx)}
            >
              <span>{p.title}</span>
              {pages.length > 1 && (
                <FiX
                  size={12}
                  style={{ cursor: 'pointer', marginLeft: 4 }}
                  onClick={(e) => { e.stopPropagation(); handleDeletePage(idx); }}
                />
              )}
            </div>
          ))}
          <button className="lw-action-btn" style={{ padding: '3px 8px', fontSize: 11 }} onClick={handleAddPage}>
            <FiPlus size={12} /> Page
          </button>
        </div>

        <div className="lw-props-section">
          {/* Swatches */}
          <div className="lw-swatches-group">
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                className={`lw-swatch ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div className="lw-size-group">
            {[2, 4, 8, 12].map(w => (
              <div
                key={w}
                className={`lw-size-chip ${strokeWidth === w ? 'active' : ''}`}
                onClick={() => setStrokeWidth(w)}
              >
                {w}px
              </div>
            ))}
          </div>

          {/* Line Style */}
          <select className="lw-select-style" value={lineStyle} onChange={e => setLineStyle(e.target.value)}>
            <option value="solid">Solid Line</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>

          {/* Background Grid */}
          <select className="lw-select-style" value={bgStyle} onChange={e => setBgStyle(e.target.value)}>
            <option value="grid">Grid Paper</option>
            <option value="dots">Dotted</option>
            <option value="lines">Solid Lines</option>
            <option value="white">Blank White</option>
            <option value="dark">Dark Workspace</option>
          </select>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE BODY */}
      <div className="lw-body-layout">
        {/* LEFT TOOLBAR DOCK */}
        <aside className="lw-left-dock">
          {[
            { id: 'select', icon: FiMove, label: 'Select Object' },
            { id: 'pen', icon: FiEdit3, label: 'Pen Tool' },
            { id: 'highlighter', icon: FiFeather, label: 'Highlighter' },
            { id: 'eraser', icon: FiTrash2, label: 'Eraser' },
            { id: 'line', icon: FiMinusSquare, label: 'Straight Line' },
            { id: 'arrow', icon: FiArrowRight, label: 'Arrow Line' },
            { id: 'rectangle', icon: FiSquare, label: 'Rectangle' },
            { id: 'circle', icon: FiCircle, label: 'Circle' },
            { id: 'text', icon: FiType, label: 'Text Box' },
            { id: 'sticky', icon: FiFileText, label: 'Sticky Note' },
            { id: 'laser', icon: FiRadio, label: 'Laser Pointer' }
          ].map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                className={`lw-dock-tool-btn ${tool === t.id ? 'active' : ''}`}
                onClick={() => {
                  if (t.id === 'sticky') handleAddSticky()
                  else setTool(t.id)
                }}
                title={t.label}
              >
                <Icon />
              </button>
            )
          })}

          <div className="lw-dock-divider" />

          <button className="lw-dock-tool-btn" onClick={handleUndo} title="Undo (Ctrl+Z)">
            <FiRotateCcw />
          </button>
          <button className="lw-dock-tool-btn" onClick={handleRedo} title="Redo (Ctrl+Y)">
            <FiRotateCw />
          </button>
          <button className="lw-dock-tool-btn" onClick={handleClearCanvas} title="Clear Current Board" style={{ color: '#ef4444' }}>
            <FiTrash2 />
          </button>
        </aside>

        {/* CANVAS VIEWPORT */}
        <main className={`lw-canvas-viewport bg-${bgStyle}`} ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="lw-main-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          {/* Floating Sticky Notes */}
          {stickyNotes
            .filter(s => s.pageIndex === activePageIndex)
            .map(s => (
              <div
                key={s.id}
                className={`lw-sticky-element lw-sticky-${s.color}`}
                style={{ left: s.x, top: s.y }}
              >
                <div className="lw-sticky-header">
                  <span>📌 Note</span>
                  <FiX size={13} style={{ cursor: 'pointer' }} onClick={() => deleteSticky(s.id)} />
                </div>
                <textarea
                  className="lw-sticky-textarea"
                  value={s.text}
                  onChange={(e) => updateStickyText(s.id, e.target.value)}
                />
              </div>
            ))}

          {/* Laser Dot Indicator */}
          {laserPos && laserPos.active && (
            <div className="lw-laser-dot" style={{ left: laserPos.x, top: laserPos.y }} />
          )}

          {/* Remote Live Cursors */}
          {Object.values(remoteCursors).map((c, i) => (
            <div key={i} className="lw-live-cursor" style={{ left: c.x, top: c.y }}>
              <div className="lw-cursor-dot" style={{ background: c.user?.color || '#3b82f6' }} />
              <div className="lw-cursor-tag">{c.user?.name || 'Student'}</div>
            </div>
          ))}
        </main>

        {/* RIGHT DOCK SIDEBAR (RESPONSIVE DRAWER) */}
        <aside className={`lw-right-dock ${showRightDock ? 'open' : 'closed'}`}>
          <div className="lw-dock-header">
            <span>INSTRUCTOR DOCK</span>
            <button
              onClick={() => setShowRightDock(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <FiX size={15} />
            </button>
          </div>

          <div className="lw-dock-tabs">
            <button
              className={`lw-dock-tab ${activeDockTab === 'chat' ? 'active' : ''}`}
              onClick={() => { setActiveDockTab('chat'); setUnreadChat(0); }}
            >
              <FiMessageSquare size={13} /> Chat
              {unreadChat > 0 && <span className="lw-unread-badge">{unreadChat}</span>}
            </button>
            <button
              className={`lw-dock-tab ${activeDockTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveDockTab('users')}
            >
              <FiUsers size={13} /> Roster ({students.length})
            </button>
            <button
              className={`lw-dock-tab ${activeDockTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveDockTab('files')}
            >
              <FiFolder size={13} /> Files
            </button>
            <button
              className={`lw-dock-tab ${activeDockTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveDockTab('info')}
            >
              <FiInfo size={13} /> Info
            </button>
          </div>

          <div className="lw-dock-body">
            {/* 1. CHAT TAB */}
            {activeDockTab === 'chat' && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chatMessages.map(m => (
                    <div key={m.id} className={`lw-chat-item ${m.isQuestion ? 'question' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 10, fontWeight: 700 }}>
                        <span style={{ color: m.role === 'instructor' ? '#4f46e5' : '#0f172a' }}>
                          {m.sender} {m.role === 'instructor' && '• Instructor'}
                        </span>
                        <span>{m.timestamp}</span>
                      </div>
                      <div style={{ color: '#0f172a', fontWeight: m.isQuestion ? 700 : 500 }}>
                        {m.isQuestion && <span style={{ color: '#d97706', fontWeight: 800 }}>[QUESTION] </span>}
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lw-chat-form-box">
                  <div className="lw-emoji-row">
                    {['👍', '❓', '💡', '👏', '🔥', '✋'].map(e => (
                      <button key={e} className="lw-emoji-btn" onClick={() => handleEmojiReaction(e)}>{e}</button>
                    ))}
                  </div>

                  <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 6 }}>
                    <input
                      className="lw-session-title-input"
                      style={{ flex: 1, width: 'auto', fontSize: 12 }}
                      placeholder="Type chat message..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="lw-action-btn lw-btn-start" style={{ padding: '6px 10px' }}>
                      <FiSend size={13} />
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* 2. ROSTER TAB */}
            {activeDockTab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  className="lw-session-title-input"
                  style={{ width: '100%', fontSize: 11 }}
                  placeholder="Search enrolled students..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />

                {filteredStudents.map(s => (
                  <div key={s.studentId} className="lw-user-item">
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: s.avatarBg,
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800
                      }}
                    >
                      {(s.name || 'S').charAt(0)}
                    </div>
                    <div style={{ flex: 1, fontSize: 11 }}>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{s.name || 'Student'}</strong>
                      <span style={{ fontSize: 10, color: s.active ? '#16a34a' : '#94a3b8' }}>
                        {s.active ? '● Online' : '○ Offline'}
                      </span>
                    </div>
                    {s.handRaised && <span title="Hand Raised">✋</span>}
                  </div>
                ))}
              </div>
            )}

            {/* 3. FILES TAB */}
            {activeDockTab === 'files' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="lw-action-btn lw-btn-start"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => showToast('File upload modal opened')}
                >
                  <FiUploadCloud size={14} /> Upload Course Material
                </button>

                {filesList.map(f => (
                  <div key={f.id} className="lw-file-item">
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{f.name}</strong>
                      <span style={{ color: '#64748b', fontSize: 10 }}>{f.size} • {f.date}</span>
                    </div>
                    <FiDownload size={14} style={{ cursor: 'pointer', color: '#4f46e5' }} onClick={() => showToast(`Downloading ${f.name}`)} />
                  </div>
                ))}
              </div>
            )}

            {/* 4. SESSION INFO TAB */}
            {activeDockTab === 'info' && (
              <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', color: '#4f46e5' }}>Session Details</strong>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>Title: {sessionTitle}</p>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>Duration: {formatTime(sessionTimer)}</p>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>Status: {sessionActive ? 'Active LIVE' : 'Offline'}</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 4. FOOTER STATUS BAR */}
      <footer className="lw-footer-strip">
        <div className="lw-footer-group">
          <span>Active Tool: <strong>{tool.toUpperCase()}</strong></span>
          <span>• Page {activePageIndex + 1} of {pages.length}</span>
        </div>
        <div className="lw-footer-group">
          <button className="lw-zoom-btn" onClick={() => setZoom(z => Math.max(50, z - 10))}>-</button>
          <span>{zoom}%</span>
          <button className="lw-zoom-btn" onClick={() => setZoom(z => Math.min(200, z + 10))}>+</button>
          <button className="lw-zoom-btn" onClick={() => setZoom(100)}>Reset 100%</button>
        </div>
      </footer>

      {/* MODALS */}

      {/* A. TIMER MODAL */}
      {showTimerModal && (
        <div className="lw-modal-overlay">
          <div className="lw-modal-content">
            <h3 style={{ margin: '0 0 12px' }}>⏱ Custom Countdown Timer</h3>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Duration (Minutes):</label>
            <input
              type="number"
              className="lw-session-title-input"
              style={{ width: '100%', margin: '6px 0 14px' }}
              value={timerMins}
              onChange={e => setTimerMins(parseInt(e.target.value) || 1)}
            />
            {timerSecondsLeft > 0 && (
              <div style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', margin: '10px 0', color: '#4f46e5' }}>
                {formatTime(timerSecondsLeft)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="lw-action-btn lw-btn-start"
                onClick={() => {
                  setTimerSecondsLeft(timerMins * 60)
                  setTimerRunning(true)
                  setShowTimerModal(false)
                  showToast(`Timer set for ${timerMins} mins`)
                }}
              >
                Start Timer
              </button>
              <button className="lw-action-btn" onClick={() => setShowTimerModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* B. CALCULATOR MODAL */}
      {showCalculatorModal && (
        <div className="lw-modal-overlay">
          <div className="lw-modal-content" style={{ maxWidth: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>🧮 Calculator</h3>
              <FiX style={{ cursor: 'pointer' }} onClick={() => setShowCalculatorModal(false)} />
            </div>
            <div style={{ background: '#0f172a', color: '#fff', fontSize: 24, fontWeight: 800, padding: 12, borderRadius: 8, textAlign: 'right', marginBottom: 12 }}>
              {calcDisplay}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {['C', '÷', '×', '⌫', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'].map(b => (
                <button
                  key={b}
                  className="lw-action-btn"
                  style={{ padding: 12, fontSize: 14, justifyContent: 'center' }}
                  onClick={() => handleCalcClick(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* C. SHARE MODAL */}
      {showShareModal && (
        <div className="lw-modal-overlay">
          <div className="lw-modal-content">
            <h3 style={{ margin: '0 0 10px' }}>🔗 Share Live Whiteboard Session</h3>
            <p style={{ fontSize: 12, color: '#64748b' }}>Students can join this whiteboard session directly using the link below:</p>
            <input
              readOnly
              className="lw-session-title-input"
              style={{ width: '100%', margin: '8px 0 14px' }}
              value={`${window.location.origin}/instructor/whiteboard?session=${selectedCourse}`}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="lw-action-btn lw-btn-start"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/instructor/whiteboard?session=${selectedCourse}`)
                  showToast('Link copied to clipboard!')
                  setShowShareModal(false)
                }}
              >
                Copy Link
              </button>
              <button className="lw-action-btn" onClick={() => setShowShareModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* D. HISTORY MODAL */}
      {showHistoryModal && (
        <div className="lw-modal-overlay">
          <div className="lw-modal-content" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>📁 Saved Whiteboard Sessions</h3>
              <FiX style={{ cursor: 'pointer' }} onClick={() => setShowHistoryModal(false)} />
            </div>
            {pastSessions.length === 0 ? (
              <p style={{ fontSize: 12, color: '#64748b' }}>No saved sessions found in MongoDB database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pastSessions.map(s => (
                  <div key={s._id} className="lw-file-item">
                    <div>
                      <strong style={{ color: '#0f172a' }}>{s.title}</strong>
                      <span style={{ color: '#64748b', fontSize: 11 }}>
                        {new Date(s.createdAt).toLocaleDateString()} • {s.pages?.length || 1} Pages • {s.participantsCount || 0} Students
                      </span>
                    </div>
                    <button
                      className="lw-action-btn"
                      onClick={() => {
                        setSessionTitle(s.title)
                        if (s.pages && s.pages.length > 0) setPages(s.pages)
                        setShowHistoryModal(false)
                        showToast(`Restored session "${s.title}"`)
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
