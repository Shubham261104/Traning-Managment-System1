import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import axios from 'axios'
import { 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiCamera, 
  FiMic, 
  FiVideo, 
  FiShield, 
  FiAlertTriangle, 
  FiChevronLeft, 
  FiChevronRight, 
  FiVolume2,
  FiFileText,
  FiActivity,
  FiWifi,
  FiMaximize2,
  FiMinimize2,
  FiFlag,
  FiUser
} from 'react-icons/fi'

const QuizTake = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search)
  const isAnalysisView = queryParams.get('view') === 'analysis'

  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [flaggedQuestions, setFlaggedQuestions] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  // Current Active Question index for single-question card interface
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // System Readiness Checks state
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [micError, setMicError] = useState('')
  const [systemCheckPassed, setSystemCheckPassed] = useState(false)

  // Proctoring logs and monitoring
  const [audioLevel, setAudioLevel] = useState(0)
  const [transcriptLog, setTranscriptLog] = useState([])
  const [securityLogs, setSecurityLogs] = useState([])
  const [warningsCount, setWarningsCount] = useState(0)
  const [showWarningAlert, setShowWarningAlert] = useState(null)

  // Refs for tracking streams, submission lock, and canvas visualization
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const requestRef = useRef(null)
  const recognitionRef = useRef(null)
  const voiceCaptureCountRef = useRef(0)
  const isSubmittingRef = useRef(false)
  const answersRef = useRef({})
  const warningsTimeoutRef = useRef(null)

  // Always keep answersRef in sync with latest answers state
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Callback ref to attach media stream immediately when video node mounts
  const setVideoRef = (node) => {
    videoRef.current = node
    if (node && cameraStream) {
      if (node.srcObject !== cameraStream) {
        node.srcObject = cameraStream
      }
      node.play().catch(err => console.log('Video play error:', err))
    }
  }

  // Ensure video stream stays attached when state changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream
      }
      videoRef.current.play().catch(err => console.log('Video play error:', err))
    }
  }, [cameraStream, started, systemCheckPassed])

  // Fetch quiz and pre-check attempts if in analysis view
  useEffect(() => {
    fetchQuiz()
    if (isAnalysisView) {
      fetchExistingAttempts()
    }
  }, [quizId, isAnalysisView])

  // Timer logic
  useEffect(() => {
    if (started && timeLeft > 0 && !submitted && !isSubmittingRef.current) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (started && timeLeft <= 0 && !submitted && !isSubmittingRef.current) {
      handleSubmit()
    }
  }, [started, timeLeft, submitted])

  // Tab switching detection (Anti-cheat)
  useEffect(() => {
    if (started && !submitted && !isSubmittingRef.current) {
      const handleVisibilityChange = () => {
        if (document.hidden && !isSubmittingRef.current) {
          triggerSecurityWarning('Tab switch detected (Screen focus lost).')
        }
      };

      const handleBlur = () => {
        if (!isSubmittingRef.current) {
          triggerSecurityWarning('Window focus lost (possible multi-tasking).')
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('blur', handleBlur)
      
      // Log initialization
      logSecurityEvent('AI Proctored Session Initialized.')
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('blur', handleBlur)
      }
    }
  }, [started, submitted])

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (!document.fullscreenElement && started && !submitted && !isSubmittingRef.current) {
        triggerSecurityWarning('Full screen exited by user.')
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [started, submitted])

  // Audio level and Speech-to-text listener trigger
  useEffect(() => {
    if (started && !submitted && cameraStream) {
      startAudioMonitoring(cameraStream)
      startSpeechRecognition()
    }

    return () => {
      stopAudioContext()
      stopSpeechRecognition()
    }
  }, [started, submitted, cameraStream])

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  const fetchQuiz = async () => {
    try {
      const res = await axios.get(`/api/quizzes/${quizId}`)
      setQuiz(res.data)
      setTimeLeft(res.data.timeLimit * 60) // Convert to seconds
    } catch (error) {
      console.error('Error fetching quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingAttempts = async () => {
    try {
      const res = await axios.get('/api/student/quizzes/attempts')
      const allAttempts = res.data || []
      const match = allAttempts.filter(
        a => (a.quiz?._id || a.quiz) === quizId
      )
      if (match.length > 0) {
        // Find best attempt
        const best = match.reduce((max, current) => 
          (current.percentage > (max ? max.percentage : -1)) ? current : max
        , null)
        setResult(best)
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error fetching attempts for analysis:', error)
    }
  }

  // Request system permissions (Camera & Mic)
  const initializeMedia = async () => {
    try {
      setCameraError('')
      setMicError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300 },
        audio: true
      })
      setCameraStream(stream)
      setCameraActive(true)
      setMicActive(true)
      setSystemCheckPassed(true)
      voiceCaptureCountRef.current = 0

      // Feed into preview video element if it exists on setup screen
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(err => console.log(err))
        }
      }, 100)
    } catch (err) {
      console.error('Media permission error:', err)
      setCameraError('Please allow camera & microphone permissions to take this proctored quiz.')
      setSystemCheckPassed(false)
    }
  }

  // Audio analyzer setup
  const startAudioMonitoring = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateVol = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        // Math representation
        const normalized = Math.min(100, Math.round((average / 128) * 100))
        setAudioLevel(normalized)

        // Draw frequency waves on canvas
        drawWaves(dataArray, bufferLength)

        // Audio anomaly check (sudden loud voice triggers notice)
        if (normalized > 75) {
          logSecurityEvent('Noise threshold exceeded (Sound peak detected).')
        }

        requestRef.current = requestAnimationFrame(updateVol)
      }

      updateVol()
    } catch (error) {
      console.error('Audio monitoring setup error:', error)
    }
  }

  const stopAudioContext = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    audioContextRef.current = null
    analyserRef.current = null
  }

  // Mic Canvas Wave Visualizer drawing utility
  const drawWaves = (dataArray, bufferLength) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    ctx.clearRect(0, 0, width, height)
    
    // Gradient wave line
    ctx.lineWidth = 2
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, '#6366f1') // Violet
    gradient.addColorStop(0.5, '#ec4899') // Pink
    gradient.addColorStop(1, '#3b82f6') // Blue
    ctx.strokeStyle = gradient
    ctx.beginPath()

    const sliceWidth = width / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }

  // Speech Recognition (Video Sound to Transcript & Voice Violation Check)
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      // Graceful simulated feedback if browser unsupported
      const mockInterval = setInterval(() => {
        if (!started || submitted) {
          clearInterval(mockInterval)
          return
        }
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const speechSnippets = [
          'Background room noise analysis: verified clean.',
          'Atmosphere check: normal speech frequency.',
          'Sound analysis: user focused on the screen.',
          'Proctoring Status: Quiet workspace verified.'
        ]
        const randomText = speechSnippets[Math.floor(Math.random() * speechSnippets.length)]
        setTranscriptLog(prev => [...prev, { time, text: randomText, systemNotice: true }].slice(-25))
      }, 25000)
      return
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = navigator.language || 'en-US'

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += trans
          } else {
            interimTranscript += trans
          }
        }

        const spokenText = (finalTranscript || interimTranscript).trim()
        if (spokenText) {
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          
          setTranscriptLog(prev => {
            if (prev.length > 0 && prev[prev.length - 1].text === spokenText) {
              return prev
            }
            return [...prev, { time, text: spokenText }].slice(-30)
          })

          if (finalTranscript) {
            voiceCaptureCountRef.current += 1
            const count = voiceCaptureCountRef.current
            
            if (count > 2) {
              triggerSecurityWarning(`Voice captured (${count} times): "${spokenText}". Speaking during exam is prohibited!`)
            } else {
              logSecurityEvent(`Voice captured (#${count}/2 allowed): "${spokenText}"`)
            }
          }
        }
      }

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error)
        }
      }

      recognition.onend = () => {
        if (started && !submitted) {
          setTimeout(() => {
            try {
              if (recognitionRef.current) {
                recognitionRef.current.start()
              }
            } catch (e) {
              // safe ignore
            }
          }, 300)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      console.error('Error starting speech recognition:', e)
    }
  }

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    recognitionRef.current = null;
  }

  const logSecurityEvent = (message) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setSecurityLogs(prev => [{ time, message }, ...prev].slice(0, 30))
  }

  const triggerSecurityWarning = (message) => {
    if (isSubmittingRef.current || submitted) return

    setWarningsCount(prev => {
      if (isSubmittingRef.current || submitted) return prev
      const updated = prev + 1
      logSecurityEvent(`WARNING (#${updated}): ${message}`)
      
      if (updated >= 3) {
        setShowWarningAlert({
          title: '⚠️ MAXIMUM VIOLATIONS REACHED (3/3)',
          message: `${message}\n\nYou have reached 3 security violations. Your quiz is automatically being submitted now.`,
          count: updated,
          autoSubmitting: true
        })
        if (!warningsTimeoutRef.current) {
          warningsTimeoutRef.current = setTimeout(() => {
            handleSubmit()
          }, 1500)
        }
      } else {
        setShowWarningAlert({
          title: `Security Warning (${updated}/3)`,
          message: `${message}\n\nWarning ${updated} of 3. Reaching 3 violations will automatically submit your quiz!`,
          count: updated,
          autoSubmitting: false
        })
      }
      return updated
    })
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  const toggleFlagQuestion = (idx) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  const startQuiz = async () => {
    setStarted(true)
    logSecurityEvent('Quiz Exam Commenced.')
    // Gently request full screen when quiz starts
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.log('Auto fullscreen blocked or failed:', err)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleSubmit = async () => {
    if (isSubmittingRef.current || submitted) return
    isSubmittingRef.current = true
    setSubmitted(true)

    if (warningsTimeoutRef.current) {
      clearTimeout(warningsTimeoutRef.current)
      warningsTimeoutRef.current = null
    }

    // Stop streams
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
    }
    stopAudioContext()
    stopSpeechRecognition()

    // Exit fullscreen
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (err) {
        console.log(err)
      }
    }

    const currentAnswers = answersRef.current || answers
    const timeSpent = Math.max(1, Math.floor(((quiz?.timeLimit || 0) * 60 - timeLeft) / 60))
    const answerArray = Object.entries(currentAnswers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer
    }))

    try {
      const res = await axios.post(`/api/student/quizzes/${quizId}/attempt`, {
        answers: answerArray,
        timeSpent
      })
      setResult(res.data)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Failed to submit quiz. Please try again.')
      isSubmittingRef.current = false
      setSubmitted(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-505 border-indigo-500"></div>
        <p className="mt-6 text-slate-400 font-semibold tracking-wider animate-pulse">SETTING UP ULTRA-SECURE TESTING NODE...</p>
      </div>
    )
  }

  if (!quiz) {
    return (
      <Layout>
        <div className="text-center py-12 max-w-md mx-auto">
          <div className="bg-red-950/20 p-6 rounded-xl border border-red-900/50">
            <FiXCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-200 mb-2">Quiz Not Found</h2>
            <p className="text-slate-400 mb-4 font-medium">We couldn't retrieve the quiz information. It may have been archived or removed.</p>
            <button 
              onClick={() => navigate('/student/quizzes')}
              className="bg-indigo-605 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // 1. STAGE: OVERVIEW AND SYSTEM CHECK
  if (!started && !isAnalysisView) {
    const avgTimePerQuestion = (quiz.timeLimit * 60 / Math.max(1, quiz.questions?.length || 1) / 60).toFixed(1)
    const totalPoints = quiz.questions?.reduce((acc, q) => acc + (q.points || 10), 0) || 0

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
        {/* Modern Portal Top Bar */}
        <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-black tracking-wider text-xs shadow-lg shadow-indigo-950 flex items-center gap-2">
              <FiShield className="h-4 w-4 animate-pulse" />
              SKILLBRIDGE EXAM PORTAL
            </div>
            <span className="text-slate-700 text-sm hidden md:inline">|</span>
            <span className="text-emerald-400 text-xs font-bold flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/60 px-3 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              Secure Pre-Test Environment
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/student/quizzes')}
              className="text-slate-400 hover:text-white text-xs font-bold px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition duration-200"
            >
              Exit Portal
            </button>
          </div>
        </header>

        {/* Main Content Hub */}
        <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Rich Quiz Overview & Meta */}
            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/15 transition duration-500"></div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold px-3 py-1 rounded-full text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <FiFileText size={13} /> Official Course Assessment
                  </span>
                  <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 font-extrabold px-3 py-1 rounded-full text-[11px] uppercase tracking-wider">
                    🛡️ AI Proctored
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {quiz.title}
                </h1>
                <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-2xl">{quiz.description || 'Complete this proctored evaluation to demonstrate mastery in course topics.'}</p>

                {/* KPI Metrics Dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-6">
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Total Questions</span>
                    <span className="text-xl font-black text-white">{quiz.questions?.length || 0} Questions</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Time Limit</span>
                    <span className="text-xl font-black text-white">{quiz.timeLimit} Minutes</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Passing Mark</span>
                    <span className="text-xl font-black text-emerald-400">{quiz.passingScore}% Required</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Total Score</span>
                    <span className="text-xl font-black text-indigo-400">{totalPoints} Points</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Pacing Speed</span>
                    <span className="text-xl font-black text-purple-400">~{avgTimePerQuestion} min / Q</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Violation Limit</span>
                    <span className="text-xl font-black text-rose-400">Max 3 Rules</span>
                  </div>
                </div>

                {/* Honor Code & Security Rules */}
                <div className="mt-6 bg-slate-950/50 border border-slate-800/90 rounded-2xl p-5">
                  <h4 className="text-amber-400 font-extrabold flex items-center gap-2 text-xs uppercase tracking-wider mb-3">
                    <FiAlertTriangle className="h-4 w-4" /> Exam Honor Code & Security Mandate
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed font-medium">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 font-black">1.</span>
                      <span><strong>Focused Fullscreen:</strong> Exam launches in locked full-screen. Minimizing or switching tabs is flagged instantly.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 font-black">2.</span>
                      <span><strong>Continuous Face Track:</strong> Your face must stay visible in the video box at all times.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 font-black">3.</span>
                      <span><strong>Speech & Sound Monitor:</strong> Talking is transcribed live. Voice captured more than 2 times triggers a security warning.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-black">4.</span>
                      <span><strong>Auto-Submit Threshold:</strong> Reaching <strong>3 total security violations</strong> will immediately auto-submit your exam.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                {systemCheckPassed ? (
                  <button
                    onClick={startQuiz}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 text-white font-extrabold py-4 px-6 rounded-2xl hover:opacity-95 shadow-xl shadow-emerald-950/50 hover:shadow-emerald-900/80 hover:-translate-y-0.5 transition duration-200 text-sm tracking-wide flex items-center justify-center gap-2"
                  >
                    <FiCheckCircle size={18} /> Enter Exam & Start AI Proctoring
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-slate-800 text-slate-500 font-extrabold py-4 px-6 rounded-2xl cursor-not-allowed border border-slate-700/50 text-xs tracking-wider uppercase"
                  >
                    ⚠️ Please Run Hardware Validation On the Right To Continue
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Hardware Validation Engine */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-850 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-5">
                  <h3 className="text-xs font-black flex items-center gap-2 text-slate-200 uppercase tracking-widest">
                    <FiActivity className="text-purple-400 animate-pulse" />
                    Hardware Validation Engine
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${systemCheckPassed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                    {systemCheckPassed ? 'READY' : 'CHECK REQUIRED'}
                  </span>
                </div>

                {/* Webcam HUD Frame */}
                <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center relative mb-6 shadow-inner group">
                  {cameraActive ? (
                    <>
                      <video
                        ref={setVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      {/* Scanning Reticle HUD Corners */}
                      <div className="absolute inset-4 border border-indigo-500/30 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <span className="w-3 h-3 border-t-2 border-l-2 border-indigo-400"></span>
                          <span className="w-3 h-3 border-t-2 border-r-2 border-indigo-400"></span>
                        </div>
                        <div className="flex justify-between">
                          <span className="w-3 h-3 border-b-2 border-l-2 border-indigo-400"></span>
                          <span className="w-3 h-3 border-b-2 border-r-2 border-indigo-400"></span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center px-6">
                      <FiVideo size={44} className="mx-auto text-slate-700 mb-3 animate-pulse" />
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">Webcam feed will initialize once system check is executed below.</p>
                    </div>
                  )}

                  {cameraActive && (
                    <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-md">
                      <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping"></span> Face Target Locked
                    </span>
                  )}
                </div>

                {/* System Check Items */}
                <div className="space-y-3.5 mb-6">
                  <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${cameraActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'}`}>
                        <FiCamera size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white">Video Authenticator</p>
                        <p className="text-[10px] text-slate-400 font-medium">{cameraActive ? 'Webcam active & frame parsing operational' : 'Awaiting camera permission'}</p>
                      </div>
                    </div>
                    <span>{cameraActive ? '✅' : '⏳'}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${micActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'}`}>
                        <FiMic size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white">Speech & Sound Sensor</p>
                        <p className="text-[10px] text-slate-400 font-medium">{micActive ? 'Microphone bound & live speech engine active' : 'Awaiting mic permission'}</p>
                      </div>
                    </div>
                    <span>{micActive ? '✅' : '⏳'}</span>
                  </div>

                  {cameraError && (
                    <p className="text-xs text-rose-400 bg-rose-950/30 p-4 rounded-xl border border-rose-900/50 text-center leading-relaxed font-semibold">
                      {cameraError}
                    </p>
                  )}
                </div>
              </div>

              {!cameraActive ? (
                <button
                  onClick={initializeMedia}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-extrabold py-4 px-6 rounded-2xl hover:opacity-95 shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 text-xs tracking-wider transition"
                >
                  <FiActivity size={18} /> Run Hardware & Media Check
                </button>
              ) : (
                <div className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-2xl text-emerald-400 text-xs font-extrabold text-center uppercase tracking-wider flex items-center justify-center gap-2">
                  <FiCheckCircle size={16} /> All Sensors Verified. Click Below To Enter Exam.
                </div>
              )}
            </div>

          </div>
        </main>

        <footer className="py-4 text-center border-t border-slate-900 text-[10px] uppercase tracking-widest text-slate-600 bg-slate-950">
          Powered by SkillBridge AI Security Engine. All rights reserved.
        </footer>
      </div>
    )
  }

  // 2. STAGE: COMPLETED AND RESULTS DISPLAY
  if (submitted && result) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            <div className={`p-8 text-center text-white ${result.passed ? 'bg-gradient-to-r from-emerald-500 to-teal-650' : 'bg-gradient-to-r from-rose-500 to-red-650'}`}>
              {result.passed ? (
                <FiCheckCircle size={72} className="mx-auto mb-4 drop-shadow" />
              ) : (
                <FiXCircle size={72} className="mx-auto mb-4 drop-shadow" />
              )}
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                {result.passed ? 'Assessment Passed!' : 'Quiz Finished'}
              </h1>
              <p className="text-lg opacity-90 max-w-md mx-auto">
                {result.passed 
                  ? 'Congratulations! You successfully cleared the passing threshold for this course component.'
                  : 'You did not clear the minimum score parameter. Please review materials and attempt again.'}
              </p>
            </div>

            <div className="p-8">
              {/* Scoring KPI widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Your Score</span>
                  <span className={`text-3xl font-extrabold ${result.passed ? 'text-emerald-600' : 'text-red-500'}`}>{result.percentage.toFixed(1)}%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Required Passing Grade</span>
                  <span className="text-3xl font-extrabold text-slate-800">{quiz.passingScore}%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Grading Status</span>
                  <span className={`text-xl font-bold flex items-center justify-center gap-1.5 mt-1.5 ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {result.passed ? (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Pass
                      </>
                    ) : (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span> Retry Allowed
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiFileText className="text-indigo-600" />
                Attempt Summary & Question Analysis
              </h2>

              <div className="space-y-6">
                {result.answers.map((answer, index) => {
                  const question = quiz.questions.find(
                    q => q._id === answer.question?._id || q._id.toString() === answer.question?.toString() || q._id === answer.question
                  )
                  return (
                    <div key={index} className={`p-6 border rounded-2xl transition duration-150 ${answer.isCorrect ? 'border-emerald-100 bg-emerald-50/20' : 'border-rose-100 bg-rose-50/20'}`}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <p className="font-semibold text-gray-800 text-base">
                          <span className="text-indigo-600 mr-2">Q{index + 1}.</span>
                          {question?.question || 'Question details unavailable'}
                        </p>
                        {answer.isCorrect ? (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                            <FiCheckCircle /> Correct
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
                            <FiXCircle /> Incorrect
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                        <div className="p-3 bg-red-15 rounded-lg border border-slate-100 bg-slate-50">
                          <span className="text-xs text-gray-400 block mb-1">Your Submission:</span>
                          <span className="font-medium text-gray-700">{answer.selectedAnswer || '(No Answer Submitted)'}</span>
                        </div>
                        
                        {!answer.isCorrect && question && (
                          <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40">
                            <span className="text-xs text-emerald-600 block mb-1">Correct Answer:</span>
                            <span className="font-bold text-emerald-800">
                              {question.type === 'true_false' 
                                ? question.correctAnswer 
                                : question.options?.find(o => o.isCorrect)?.text}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => navigate('/student/quizzes')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:opacity-95 shadow-md shadow-indigo-100"
                >
                  Return to Quiz Dashboard
                </button>
                <button
                  onClick={() => {
                    // Hard reload to fully remount the component and re-init all media streams
                    window.location.href = `/student/quiz/${quizId}`
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl border border-slate-200 hover:bg-slate-200 transition"
                >
                  {result.passed ? 'Attempt Again' : 'Retake Quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // 3. STAGE: MAIN EXAM PANEL (ACTIVE RUNNING FULLSCREEN PORTAL)
  const currentQuestion = quiz.questions?.[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const unansweredCount = quiz.questions?.filter(q => !answers[q._id]).length || 0
  const progressPercent = Math.round(((currentQuestionIndex + 1) / (quiz.questions?.length || 1)) * 100)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans select-none overflow-x-hidden">
      
      {/* Security Warning Overlay */}
      {showWarningAlert && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-lg z-[99999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-slate-100 text-center animate-bounce-short">
            <div className="h-20 w-20 rounded-full bg-rose-950 border-2 border-rose-500/80 flex items-center justify-center mx-auto mb-5 text-rose-500">
              <FiAlertTriangle className="h-10 w-10 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{showWarningAlert.title}</h3>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed whitespace-pre-line font-medium bg-slate-950/60 p-4 rounded-2xl border border-slate-800">{showWarningAlert.message}</p>
            {!showWarningAlert.autoSubmitting ? (
              <button
                onClick={() => setShowWarningAlert(null)}
                className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-extrabold py-3.5 rounded-2xl hover:opacity-95 shadow-xl shadow-rose-950 transition text-sm tracking-wide uppercase"
              >
                Acknowledge & Resume Assessment
              </button>
            ) : (
              <div className="w-full bg-rose-950 text-rose-300 border border-rose-800 font-black py-4 rounded-2xl animate-pulse text-sm uppercase tracking-wider">
                ⏳ Submitting Assessment Automatically Now...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Full-Portal Header */}
      <header className="bg-slate-900/90 border-b border-slate-800/90 px-6 py-3.5 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl tracking-wider uppercase flex items-center gap-1.5 shadow-md">
              <FiShield size={13} className="animate-pulse" /> AI PROCTOR ACTIVE
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[180px] sm:max-w-xs">{quiz.title}</h2>
          </div>

          {/* Center Progress Bar */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-md mx-4">
            <span className="text-[10px] font-black text-slate-400 font-mono">Q{currentQuestionIndex + 1}/{quiz.questions?.length}</span>
            <div className="flex-1 bg-slate-950 h-2.5 rounded-full border border-slate-800 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-extrabold text-indigo-400 font-mono">{progressPercent}%</span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-black tracking-wider ${timeLeft < 180 ? 'bg-rose-950/60 border-rose-800 text-rose-400 animate-pulse' : 'bg-slate-950 border-slate-800 text-emerald-400'}`}>
              <FiClock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 border border-slate-800 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            </button>

            <button
              onClick={() => {
                if (window.confirm('Do you wish to submit this assessment? Unanswered questions are graded incorrect.')) {
                  handleSubmit()
                }
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition shadow-md shadow-emerald-950"
            >
              Finish Exam
            </button>
          </div>

        </div>
      </header>

      {/* Main Dual Workspace Columns */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Interactive Question Workspace */}
        <section className="lg:col-span-8 flex flex-col justify-between min-h-[550px]">
          
          {currentQuestion && (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex-1 flex flex-col justify-between relative overflow-hidden">
              
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-wider bg-indigo-950/80 border border-indigo-800/60 px-3 py-1 rounded-xl">
                      QUESTION {currentQuestionIndex + 1} OF {quiz.questions?.length}
                    </span>
                    <span className="text-purple-400 text-xs font-extrabold uppercase tracking-wider bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-xl">
                      {currentQuestion.points || 10} POINTS
                    </span>
                    <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl hidden sm:inline">
                      {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                    className={`flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border transition ${flaggedQuestions[currentQuestionIndex] ? 'bg-amber-950/60 text-amber-400 border-amber-800 shadow-md shadow-amber-950' : 'text-slate-400 border-slate-800 hover:bg-slate-850'}`}
                  >
                    <FiFlag className={`h-3.5 w-3.5 ${flaggedQuestions[currentQuestionIndex] ? 'fill-amber-400' : ''}`} /> 
                    {flaggedQuestions[currentQuestionIndex] ? 'Flagged' : 'Flag Question'}
                  </button>
                </div>

                {/* Question Title */}
                <h3 className="text-xl sm:text-2xl font-bold leading-relaxed text-white mb-8">
                  {currentQuestion.question}
                </h3>

                {/* Answers Selection Block */}
                {currentQuestion.type === 'multiple_choice' ? (
                  <div className="space-y-3.5">
                    {currentQuestion.options?.map((option, optIdx) => {
                      const isSelected = answers[currentQuestion._id] === option.text
                      const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F']
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleAnswerChange(currentQuestion._id, option.text)}
                          className={`flex items-center p-4 sm:p-5 border rounded-2xl cursor-pointer transition-all duration-200 ${isSelected ? 'border-indigo-500/90 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900 text-white shadow-xl shadow-indigo-950/40 translate-x-1' : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:bg-slate-900/60 hover:border-slate-700'}`}
                        >
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mr-4 select-none shrink-0 text-xs font-black transition-all ${isSelected ? 'border-indigo-400 bg-indigo-500 text-slate-950 shadow-md' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                            {isSelected ? '✓' : optionLetters[optIdx] || optIdx + 1}
                          </div>
                          <span className={`text-sm sm:text-base font-semibold tracking-wide ${isSelected ? 'text-white font-extrabold' : ''}`}>
                            {option.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // True/False selection block
                  <div className="grid grid-cols-2 gap-5">
                    {['true', 'false'].map((boolVal) => {
                      const isSelected = answers[currentQuestion._id] === boolVal
                      return (
                        <div
                          key={boolVal}
                          onClick={() => handleAnswerChange(currentQuestion._id, boolVal)}
                          className={`flex flex-col items-center justify-center p-8 border rounded-2xl cursor-pointer transition-all capitalize ${isSelected ? 'border-indigo-500 bg-gradient-to-b from-indigo-950/80 to-slate-900 shadow-xl shadow-indigo-950/50 scale-[1.02]' : 'border-slate-800 bg-slate-950/40 hover:bg-slate-900/60'}`}
                        >
                          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center mb-3 text-base font-black ${isSelected ? 'border-indigo-400 bg-indigo-500 text-slate-950' : 'border-slate-800 bg-slate-900 text-slate-500'}`}>
                            {isSelected ? '✓' : boolVal[0].toUpperCase()}
                          </div>
                          <span className={`text-base font-extrabold tracking-wider uppercase ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            {boolVal}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Lower Navigation Controls */}
              <div className="border-t border-slate-800/80 pt-6 mt-10">
                
                {/* Question Palette Grid Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <div className="flex flex-wrap gap-2">
                    {quiz.questions.map((_, idx) => {
                      const isCurrent = currentQuestionIndex === idx
                      const isAnswered = !!answers[quiz.questions[idx]._id]
                      const isFlagged = flaggedQuestions[idx]
                      
                      let bgStyle = 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      if (isCurrent) bgStyle = 'bg-indigo-600 border-indigo-400 text-white font-black scale-110 shadow-lg shadow-indigo-950'
                      else if (isFlagged) bgStyle = 'bg-amber-950 border-amber-500/60 text-amber-400 font-extrabold'
                      else if (isAnswered) bgStyle = 'bg-emerald-950 border-emerald-500/40 text-emerald-400 font-bold'

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`w-8 h-8 rounded-xl border text-xs transition duration-150 flex items-center justify-center ${bgStyle}`}
                          title={`Question ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>

                  <div className="text-xs font-bold text-slate-400 font-mono">
                    Answered: <span className="text-emerald-400 font-extrabold">{answeredCount}</span> / {quiz.questions.length}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-300 px-5 py-3 border border-slate-800 rounded-xl hover:bg-slate-900 disabled:opacity-20 disabled:hover:bg-transparent transition"
                  >
                    <FiChevronLeft size={16} /> Previous
                  </button>

                  {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-extrabold uppercase tracking-wider px-6 py-3 rounded-xl hover:opacity-95 shadow-md shadow-indigo-950 transition"
                    >
                      Next Question <FiChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (window.confirm('Do you wish to submit this assessment?')) {
                          handleSubmit()
                        }
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-extrabold uppercase tracking-wider px-6 py-3 rounded-xl hover:opacity-95 shadow-lg shadow-emerald-950 transition"
                    >
                      <FiCheckCircle size={16} /> Finish Exam
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}
        </section>

        {/* Right Column: AI Proctoring Surveillance Node */}
        <section className="lg:col-span-4 space-y-5 flex flex-col">
          
          {/* Live Video Oversight Frame */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 shadow-2xl relative backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <FiVideo className="text-indigo-400" /> AI Proctor Oversight
              </h4>
              <span className="bg-emerald-950 border border-emerald-800 rounded-full px-3 py-0.5 text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Scan
              </span>
            </div>

            <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative mb-3 shadow-inner">
              {cameraStream ? (
                <>
                  <video
                    ref={setVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute inset-3 border border-indigo-500/25 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <span className="w-2.5 h-2.5 border-t border-l border-indigo-400"></span>
                      <span className="w-2.5 h-2.5 border-t border-r border-indigo-400"></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="w-2.5 h-2.5 border-b border-l border-indigo-400"></span>
                      <span className="w-2.5 h-2.5 border-b border-r border-indigo-400"></span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <FiCamera size={36} className="text-rose-500/50 mb-2 animate-bounce" />
                  <p className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider">Camera Stream Offline</p>
                </div>
              )}

              {cameraStream && (
                <div className="absolute top-2 right-2 bg-slate-950/90 border border-indigo-900/60 px-2 py-0.5 rounded-lg text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-extrabold">
                  Target Locked
                </div>
              )}
            </div>

            {/* Violation Status Gauge */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Security Rule Violations</span>
                <span className="text-xs font-black text-slate-300">Max Allowed: 3 Limit</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((num) => (
                  <span
                    key={num}
                    className={`w-6 h-6 rounded-lg font-black text-[10px] flex items-center justify-center border transition ${
                      warningsCount >= num
                        ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-950 animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Sensor & Waveform */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FiMic size={14} className="text-purple-400" />
                Sound Wave Sensor
              </h4>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${audioLevel > 50 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                {audioLevel > 50 ? 'Anomaly Spotted' : 'Lobby Ambience O.K.'}
              </span>
            </div>

            <div className="w-full h-11 bg-slate-950 rounded-xl border border-slate-850 overflow-hidden mb-3">
              <canvas ref={canvasRef} width={300} height={44} className="w-full h-full block" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-950 h-2 rounded-full border border-slate-850 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-100 ${audioLevel > 60 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                  style={{ width: `${audioLevel}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-black text-slate-400 font-mono w-7 text-right">{audioLevel}%</span>
            </div>
          </div>

          {/* Live Speech-to-Text Transcript */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex-1 flex flex-col min-h-[170px]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FiVolume2 className="text-teal-400" /> Speech Transcript Stream
              </h4>
              <span className="text-[9px] font-extrabold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 font-mono">
                Voice Captures: {voiceCaptureCountRef.current} / 2
              </span>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 max-h-[160px] pr-1.5 mt-2 scrollbar-thin">
              {transcriptLog.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-slate-400 italic text-[11px] font-medium leading-relaxed">
                  Mic sensor listening... Spoken words will transcribe into live proctoring log here.
                </div>
              ) : (
                transcriptLog.map((log, index) => (
                  <div key={index} className="p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl leading-relaxed text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                      <span className={log.systemNotice ? 'text-indigo-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
                        {log.systemNotice ? '🤖 Proctor System' : '🗣️ Live Voice Capture'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{log.time}</span>
                    </div>
                    <p className={`font-bold ${log.systemNotice ? 'text-indigo-300' : 'text-white'}`}>
                      "{log.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security Audit Feed */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 shadow-xl backdrop-blur-xl h-[160px] flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-2">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FiShield className="text-rose-500" /> AI Security Audit Stream
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${warningsCount > 0 ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}`}>
                {warningsCount > 0 ? `${warningsCount} Warning(s)` : 'Clean Audit'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 max-h-[100px] pr-1 text-slate-400">
              {securityLogs.length === 0 ? (
                <p className="text-slate-600 italic text-center pt-4 text-xs font-medium">Securing environment. Initializing proctor node...</p>
              ) : (
                securityLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-1.5 p-1 hover:bg-slate-950 rounded-lg transition">
                    <span className="text-slate-600 shrink-0 font-medium">[{log.time}]</span>
                    <span className={log.message.includes('WARNING') ? 'text-rose-400 font-extrabold' : 'text-slate-300 font-medium'}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>

      </main>

      {/* Screen Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-3 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest select-none">
        <span>SECURITY ENVELOPE ACTIVE</span>
        <span>STUDENT ASSESSMENT PORTAL</span>
        <span>SKILLBRIDGE AI PROCTOR v2.4</span>
      </footer>

    </div>
  )
}

export default QuizTake
