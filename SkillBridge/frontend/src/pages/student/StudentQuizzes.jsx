import { useState, useEffect, useMemo } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { 
  FiFileText, 
  FiCheckCircle, 
  FiXCircle, 
  FiBookOpen, 
  FiAward,
  FiActivity,
  FiClock, 
  FiTrendingUp,
  FiSearch,
  FiArrowRight,
  FiRotateCcw,
  FiPlay
} from 'react-icons/fi'

const StudentQuizzes = () => {
  const [enrollments, setEnrollments] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Search query for filtering quizzes inside the directory
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchEnrollments()
    fetchAttempts()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchQuizzes(selectedCourse)
    }
  }, [selectedCourse])

  const fetchEnrollments = async () => {
    try {
      const res = await axios.get('/api/student/enrollments')
      const approved = (res.data || []).filter(e => e.status === 'approved')
      setEnrollments(approved)
      if (approved.length > 0 && !selectedCourse) {
        setSelectedCourse(approved[0].course?._id || approved[0].course)
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        window.location.href = '/login'
      }
      setEnrollments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizzes = async (courseId) => {
    try {
      const res = await axios.get(`/api/student/courses/${courseId}/quizzes`)
      setQuizzes(res.data)
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const fetchAttempts = async () => {
    try {
      const res = await axios.get('/api/student/quizzes/attempts')
      setAttempts(res.data)
    } catch (error) {
      console.error('Error fetching attempts:', error)
    }
  }

  // Get best attempt score for a quiz
  const getAttemptForQuiz = (quizId) => {
    const quizAttempts = attempts.filter(a => (a.quiz?._id || a.quiz) === quizId || (a.quiz?.id || a.quiz) === quizId)
    if (quizAttempts.length === 0) return null
    return quizAttempts.reduce((max, current) => 
      (current.percentage > (max ? max.percentage : -1)) ? current : max
    , null)
  }

  // Calculate statistics across all attempts
  const stats = useMemo(() => {
    const totalAttempted = attempts.length
    const passedCount = attempts.filter(a => a.passed).length
    const averageScore = totalAttempted 
      ? Math.round(attempts.reduce((sum, curr) => sum + (curr.percentage || 0), 0) / totalAttempted)
      : 0
    // Find unique quizzes attempted
    const uniqueAttemptedIds = new Set(attempts.map(a => a.quiz?._id || a.quiz))
    
    return {
      totalAttempted,
      passedCount,
      averageScore,
      uniqueAttempted: uniqueAttemptedIds.size
    }
  }, [attempts])

  // Filter quizzes by search query
  const filteredQuizzes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return quizzes
    return quizzes.filter(q => 
      q.title.toLowerCase().includes(query) || 
      (q.description && q.description.toLowerCase().includes(query))
    )
  }, [quizzes, searchQuery])

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto px-2 py-4">
        
        {/* Light mode dashboard intro header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-8 rounded-2xl shadow-md">
          <div>
            <span className="bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider border border-indigo-100">
              Exam Center
            </span>
            <h1 className="text-3xl font-extrabold mt-3 tracking-tight text-slate-800">Interactive Quiz Dashboard</h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Evaluate your learnings, check detailed results logs, view sound to speech transcripts, and challenge yourself.
            </p>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-3 shrink-0 flex items-center gap-3">
            <FiActivity className="text-indigo-500 h-8 w-8" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Global Standing</span>
              <span className="font-extrabold text-lg text-slate-800">Active Practitioner</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-650 border-indigo-600"></div>
            <p className="text-slate-500 font-semibold mt-4 animate-pulse">Loading assessments index...</p>
          </div>
        ) : (
          <>
            {enrollments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-12 text-center max-w-xl mx-auto">
                <FiBookOpen size={48} className="text-slate-400 mx-auto mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Enrollments</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  You must be actively enrolled in at least one approved course to view quiz materials and proctored tasks.
                </p>
                <Link
                  to="/student/courses"
                  className="bg-indigo-600 text-white font-extrabold px-8 py-3.5 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition inline-flex items-center gap-2"
                >
                  Browse Available Courses <FiArrowRight />
                </Link>
              </div>
            ) : (
              <>
                {/* Statistics Row cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 hover:shadow hover:-translate-y-0.5 transition duration-200">
                    <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-xl shrink-0">
                      <FiFileText size={24} />
                    </div>
                    <div>
                      <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Total Attempts</span>
                      <span className="text-2xl font-black text-slate-805 text-slate-800 leading-none mt-1 block">{stats.totalAttempted}</span>
                      <small className="text-[10px] text-slate-400 block mt-1">Unique quizzes: {stats.uniqueAttempted}</small>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 hover:shadow hover:-translate-y-0.5 transition duration-200">
                    <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl shrink-0">
                      <FiCheckCircle size={24} />
                    </div>
                    <div>
                      <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Assessments Passed</span>
                      <span className="text-2xl font-black text-emerald-600 leading-none mt-1 block">{stats.passedCount}</span>
                      <small className="text-[10px] text-slate-400 block mt-1">Pass rate: {stats.totalAttempted ? Math.round((stats.passedCount / stats.totalAttempted) * 100) : 0}%</small>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 hover:shadow hover:-translate-y-0.5 transition duration-200">
                    <div className="bg-purple-50 text-purple-600 p-3.5 rounded-xl shrink-0">
                      <FiTrendingUp size={24} />
                    </div>
                    <div>
                      <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Average Proficiency</span>
                      <span className="text-2xl font-black text-purple-600 leading-none mt-1 block">{stats.averageScore}%</span>
                      <small className="text-[10px] text-slate-400 block mt-1">Overall attempts average</small>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 hover:shadow hover:-translate-y-0.5 transition duration-200">
                    <div className="bg-sky-50 text-sky-655 text-sky-600 p-3.5 rounded-xl shrink-0">
                      <FiAward size={24} />
                    </div>
                    <div>
                      <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block">Exams Pending</span>
                      <span className="text-2xl font-black text-sky-600 leading-none mt-1 block">
                        {Math.max(0, quizzes.length - stats.uniqueAttempted)}
                      </span>
                      <small className="text-[10px] text-slate-400 block mt-1">For currently selected course</small>
                    </div>
                  </div>

                </div>

                {/* Main Action Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Course Selector Folders Navigation (30% width) */}
                  <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden p-6 space-y-4">
                    <div className="border-b border-slate-100 pb-3 mb-2">
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <FiBookOpen className="text-indigo-600" /> Enrollments Index
                      </h3>
                      <p className="text-xxs text-slate-400 mt-1">Navigate folder tabs to view assigned quiz rosters.</p>
                    </div>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {enrollments
                        .filter(e => e.status === 'approved' && e.course)
                        .map((enrollment) => {
                          const courseId = (enrollment.course && typeof enrollment.course === 'object') 
                            ? (enrollment.course._id || enrollment.course) 
                            : enrollment.course
                          const courseTitle = enrollment.course?.title || 'Unknown Course'
                          const isActive = selectedCourse === courseId

                          return (
                            <button
                              key={enrollment._id}
                              onClick={() => {
                                setSelectedCourse(courseId)
                                setSearchQuery('')
                              }}
                              className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between gap-3 text-sm font-semibold ${isActive ? 'bg-indigo-50/70 border-indigo-255 border-indigo-200 text-indigo-900 shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-650 hover:bg-slate-50'}`}
                            >
                              <div className="truncate">
                                <span className={`text-[10px] uppercase font-bold block mb-0.5 tracking-wider ${isActive ? 'text-indigo-650' : 'text-slate-400'}`}>
                                  Course Folder
                                </span>
                                <span className={isActive ? 'font-bold' : 'font-medium'}>{courseTitle}</span>
                              </div>
                              <span className={`text-xxs text-center px-2 py-0.5 rounded-full shrink-0 font-extrabold ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                                {enrollment.progress || 0}% Progress
                              </span>
                            </button>
                          )
                        })}
                    </div>
                  </div>

                  {/* Right Column: Quiz Directories Grid (70% width) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Search & Filter Header card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-805 text-slate-800 tracking-tight">Quizzes Inventory</h2>
                        <p className="text-xs text-slate-400">Showing quizzes assigned under the active course fold.</p>
                      </div>

                      {/* Search box tool */}
                      <div className="relative max-w-xs w-full">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <FiSearch size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search quizzes..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-xs border border-slate-250 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400 transition"
                        />
                      </div>
                    </div>

                    {/* Quiz Listing grid */}
                    {filteredQuizzes.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500">
                        <FiFileText size={36} className="mx-auto text-slate-350 opacity-60 mb-2 animate-bounce" />
                        <p className="font-semibold text-sm">No quizzes found.</p>
                        <p className="text-xxs text-slate-400 mt-1 max-w-xs mx-auto">There are no quizzes matching your criteria under this folder roster.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredQuizzes.map((quiz) => {
                          const attempt = getAttemptForQuiz(quiz._id)
                          return (
                            <div 
                              key={quiz._id} 
                              className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition duration-300 relative overflow-hidden group shadow-md"
                            >
                              
                              {/* Glowing tag overlay if attempt passed */}
                              {attempt?.passed && (
                                <div className="absolute top-0 right-0 bg-emerald-55 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-sm">
                                  Passed
                                </div>
                              )}

                              <div>
                                <h3 className="text-lg font-bold text-slate-805 text-slate-800 tracking-tight pr-10 mb-2 group-hover:text-indigo-650 transition">
                                  {quiz.title}
                                </h3>
                                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-5 font-normal">{quiz.description}</p>
                                
                                <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-50 py-3.5 mb-6 text-xxs font-semibold text-slate-500">
                                  <div>
                                    <span className="text-[10px] text-slate-450 text-slate-400 block mb-0.5">Time Limit</span>
                                    <span className="text-slate-700 font-extrabold flex items-center gap-1">
                                      <FiClock className="text-indigo-650" /> {quiz.timeLimit} Mins
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 block mb-0.5">Passing Score</span>
                                    <span className="text-slate-700 font-extrabold flex items-center gap-1">
                                      <FiAward className="text-emerald-500" /> {quiz.passingScore}% Correct
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 block mb-0.5">Questions</span>
                                    <span className="text-slate-700 font-extrabold flex items-center gap-1">
                                      <FiFileText className="text-purple-550 text-purple-650" /> {quiz.questions?.length || 0} Questions
                                    </span>
                                  </div>
                                </div>

                                {attempt && (
                                  <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100/60 leading-tight">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your best score</span>
                                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {attempt.passed ? 'Cleared' : 'Failed'}
                                      </span>
                                    </div>
                                    <div className="text-xs font-black text-slate-700">{attempt.percentage.toFixed(1)}% Score</div>
                                  </div>
                                )}
                              </div>

                              {/* Button navigation section */}
                              <div className="flex gap-3">
                                {attempt ? (
                                  <>
                                    <Link
                                      to={`/student/quiz/${quiz._id}?view=analysis`}
                                      className="flex-1 text-center bg-slate-100 hover:bg-slate-205 text-slate-650 hover:bg-slate-200 border border-slate-200/65 py-2.5 rounded-xl text-xxs font-extrabold uppercase tracking-wider transition"
                                    >
                                      📊 Diagnostics
                                    </Link>
                                    <Link
                                      to={`/student/quiz/${quiz._id}`}
                                      className="flex-1 text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white py-2.5 rounded-xl text-xxs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
                                    >
                                      <FiRotateCcw size={12} /> Retake
                                    </Link>
                                  </>
                                ) : (
                                  <Link
                                    to={`/student/quiz/${quiz._id}`}
                                    className="w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1 shadow-sm shadow-indigo-15"
                                  >
                                    <FiPlay size={12} fill="currentColor" /> Take Assessment
                                  </Link>
                                )}
                              </div>

                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* Bottom Segment: Recent History Timeline layout */}
                {attempts.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl mt-10">
                    <div className="border-b border-slate-100 pb-3.5 mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <FiActivity className="text-indigo-650" /> Audited Quiz Attempt Logs
                        </h3>
                        <p className="text-xxs text-slate-400 mt-1">Review complete diagnostic breakdowns of all submitted sessions.</p>
                      </div>

                      <div className="text-xxs font-bold text-slate-400">
                        Total Sessions: {attempts.length}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                      {attempts.map((attempt) => (
                        <div key={attempt._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-extrabold text-sm text-slate-805 text-slate-800 leading-tight">
                                {attempt.quiz?.title || 'Unknown Quiz'}
                              </h5>
                              <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100/80 px-2 py-0.5 rounded font-medium">
                                {attempt.quiz?.course?.title || 'Course Component'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                              Duration: {attempt.timeSpent || 0} mins | Submitted on: {formatDate(attempt.completedAt || attempt.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-700 block">{attempt.percentage.toFixed(1)}% Score</span>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {attempt.passed ? 'Passed (Cleared)' : 'Failed (Retry)'}
                              </span>
                            </div>

                            <Link
                              to={`/student/quiz/${attempt.quiz?._id || attempt.quiz}?view=analysis`}
                              className="text-xs text-indigo-655 font-bold hover:text-indigo-755 hover:underline flex items-center gap-1 text-indigo-600"
                            >
                              Diagnostics <FiArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default StudentQuizzes
