import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiPlus, FiEdit, FiEye, FiBook } from 'react-icons/fi'

const InstructorQuizzes = () => {
  const [courses, setCourses] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: 30,
    scheduledAt: new Date().toISOString().slice(0, 16),
    questions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/instructor/courses')
      setCourses(res.data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizzes = async (courseId) => {
    try {
      const res = await axios.get(`/api/instructor/courses/${courseId}/quizzes`)
      setQuizzes(res.data)
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId)
    fetchQuizzes(courseId)
  }

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          type: 'multiple_choice',
          options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
          correctAnswer: '',
          points: 1
        }
      ]
    })
  }

  const updateQuestion = (index, field, value) => {
    const updated = [...formData.questions]
    updated[index][field] = value
    setFormData({ ...formData, questions: updated })
  }

  const updateOption = (qIndex, oIndex, field, value) => {
    const updated = [...formData.questions]
    updated[qIndex].options[oIndex][field] = value
    setFormData({ ...formData, questions: updated })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Process questions for submission
      const processedQuestions = formData.questions.map(q => {
        if (q.type === 'true_false') {
          return {
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            points: q.points
          }
        } else {
          return {
            question: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: q.options.find(opt => opt.isCorrect)?.text || '',
            points: q.points
          }
        }
      })

      await axios.post('/api/instructor/quizzes', {
        course: selectedCourse,
        ...formData,
        questions: processedQuestions
      })
      setShowModal(false)
      setFormData({
        title: '',
        description: '',
        passingScore: 70,
        timeLimit: 30,
        scheduledAt: new Date().toISOString().slice(0, 16),
        questions: []
      })
      fetchQuizzes(selectedCourse)
    } catch (error) {
      console.error('Error creating quiz:', error)
    }
  }

  return (
    <Layout>
      <div className="space-y-8 animate-dashFadeIn">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
              Quizzes
            </h1>
            <p className="text-[#94a3b8] font-medium tracking-wide">Create and manage quizzes for your courses</p>
          </div>
          {selectedCourse && (
            <button
              onClick={() => setShowModal(true)}
              className="admin-premium-btn flex items-center justify-center gap-3 px-8 py-4 shadow-2xl shadow-indigo-500/20 group"
            >
              <div className="bg-white/20 p-2 rounded-lg group-hover:rotate-90 transition-transform">
                <FiPlus size={20} />
              </div>
              <span className="font-black uppercase tracking-widest text-sm">Create Quiz</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {!selectedCourse ? (
              <div className="admin-glass-card p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <FiEye size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Select a Course</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <button
                      key={course._id}
                      onClick={() => handleCourseSelect(course._id)}
                      className="admin-glass-card group p-6 text-left hover:scale-[1.02] transition-all duration-300 border-white/5 hover:border-indigo-500/30"
                    >
                      <h3 className="text-lg font-black text-white mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-tight line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-[#64748b] font-medium leading-relaxed line-clamp-2 italic">{course.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10">
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                      Active Course
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      {courses.find(c => c._id === selectedCourse)?.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedCourse('')}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/10"
                  >
                    Change Course
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                      <div key={quiz._id} className="admin-glass-card group p-8 hover:translate-y-[-4px] transition-all duration-300 border-white/5">
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{quiz.title}</h3>
                        </div>
                        <p className="text-[#94a3b8] text-sm mb-8 line-clamp-2 font-medium italic">"{quiz.description}"</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-[#64748b] uppercase tracking-widest mb-1">Pass Rate</p>
                            <p className="text-lg font-black text-white">{quiz.passingScore}%</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-[#64748b] uppercase tracking-widest mb-1">Time</p>
                            <p className="text-lg font-black text-white">{quiz.timeLimit}m</p>
                          </div>
                        </div>

                        <Link
                          to={`/instructor/quizzes/${quiz._id}/attempts`}
                          className="flex items-center justify-center gap-3 w-full py-4 bg-indigo-500/10 text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em] border border-indigo-500/20 shadow-lg shadow-indigo-500/5 group/btn"
                        >
                          <FiEye className="group-hover:scale-110 transition-transform" />
                          View Submissions
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 admin-glass-card flex flex-col items-center justify-center border-dashed border-2">
                      <FiBook className="text-[#2d3a54] mb-4" size={48} />
                      <p className="text-[#64748b] font-black uppercase tracking-widest text-sm">No quizzes published yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
            {/* Modal Backdrop - Offset by sidebar width on desktop */}
            <div
              className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md lg:left-64"
              onClick={() => setShowModal(false)}
            />

            <div className="relative bg-[#0f172a] admin-glass-card max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(79,70,229,0.2)] border-white/10 lg:ml-64 animate-dashCardFadeIn">
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">Create Quiz</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[#94a3b8] hover:bg-rose-500 hover:text-white transition-all border border-white/5">
                  <FiPlus className="rotate-45" size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Quiz Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="admin-input"
                        placeholder="e.g. Master Class Examination"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1">Pass Score (%)</label>
                        <input
                          type="number"
                          value={formData.passingScore}
                          onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                          className="admin-input"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1">Minutes</label>
                        <input
                          type="number"
                          value={formData.timeLimit}
                          onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                          className="admin-input"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Global Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="admin-input min-h-[80px]"
                      placeholder="High-level overview of the assessment objectives..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#64748b] uppercase tracking-widest pl-1 leading-none">Schedule Release</label>
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="admin-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          setFormData({ ...formData, scheduledAt: localDateTime });
                        }}
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap"
                      >
                        Now
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Questions</h3>
                      </div>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest border border-indigo-500/20"
                      >
                        <FiPlus size={14} /> Add Question
                      </button>
                    </div>

                    <div className="space-y-6">
                      {formData.questions.map((q, qIndex) => (
                        <div key={qIndex} className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                          <div className="flex justify-between items-start">
                            <span className="w-8 h-8 rounded-lg bg-[#0f172a] border border-white/10 flex items-center justify-center text-indigo-400 font-black text-xs">
                              {qIndex + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.questions.filter((_, i) => i !== qIndex)
                                setFormData({ ...formData, questions: updated })
                              }}
                              className="text-rose-500/40 hover:text-rose-500 transition-colors uppercase font-black text-[9px] tracking-widest"
                            >
                              Remove Question
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[9px] font-black text-[#64748b] uppercase tracking-widest">Question Narrative</label>
                              <input
                                type="text"
                                value={q.question}
                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                className="admin-input"
                                placeholder="Enter the prompt text..."
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-[#64748b] uppercase tracking-widest">Points Value</label>
                              <input
                                type="number"
                                value={q.points}
                                onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                                className="admin-input"
                                min="1"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="text-[9px] font-black text-[#64748b] uppercase tracking-widest mb-4 block">Assessment Type</label>
                            <div className="flex gap-4">
                              {['multiple_choice', 'true_false'].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    updateQuestion(qIndex, 'type', type)
                                    if (type === 'true_false') {
                                      updateQuestion(qIndex, 'options', [])
                                    } else {
                                      updateQuestion(qIndex, 'options', [{ text: '', isCorrect: false }, { text: '', isCorrect: false }])
                                    }
                                  }}
                                  className={`flex-1 py-3 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${q.type === type
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                                    : 'bg-white/5 text-[#94a3b8] border-white/10 hover:border-white/20'
                                    }`}
                                >
                                  {type.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 space-y-3">
                            {q.type === 'multiple_choice' ? (
                              <>
                                {q.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex gap-4">
                                    <input
                                      type="text"
                                      value={option.text}
                                      onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                      className="flex-1 admin-input"
                                      placeholder={`Option Label ${oIndex + 1}`}
                                      required
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateOption(qIndex, oIndex, 'isCorrect', !option.isCorrect)}
                                      className={`px-4 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all border ${option.isCorrect
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-white/5 text-[#64748b] border-white/10'
                                        }`}
                                    >
                                      {option.isCorrect ? 'Correct' : 'Mark Correct'}
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.questions]
                                    updated[qIndex].options.push({ text: '', isCorrect: false })
                                    setFormData({ ...formData, questions: updated })
                                  }}
                                  className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                                >
                                  + Add Option
                                </button>
                              </>
                            ) : (
                              <div className="flex gap-4">
                                {['true', 'false'].map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => updateQuestion(qIndex, 'correctAnswer', val)}
                                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all border ${q.correctAnswer === val
                                      ? 'bg-indigo-600 text-white border-indigo-500'
                                      : 'bg-white/5 text-[#64748b] border-white/10'
                                      }`}
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20"
                >
                  Create Quiz
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-10 py-5 bg-white/5 hover:bg-rose-500 hover:text-white text-[#94a3b8] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default InstructorQuizzes


