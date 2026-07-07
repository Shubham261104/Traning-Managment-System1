import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const StudentQuizzes = () => {
  const [enrollments, setEnrollments] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [loading, setLoading] = useState(true)

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

  const getAttemptForQuiz = (quizId) => {
    return attempts.find(a => a.quiz._id === quizId || a.quiz === quizId)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quizzes</h1>
          <p className="text-gray-600">Take quizzes for your enrolled courses</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {enrollments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-gray-600">You need to enroll in a course first to take quizzes.</p>
                <Link
                  to="/student/courses"
                  className="mt-4 inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl shadow-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {enrollments
                      .filter(e => e.status === 'approved' && e.course !== null && e.course !== undefined)
                      .map((enrollment) => {
                        const courseId = (enrollment.course && typeof enrollment.course === 'object') 
                          ? (enrollment.course._id || enrollment.course) 
                          : enrollment.course
                        const courseTitle = enrollment.course?.title || 
                                         (typeof enrollment.course === 'string' ? 'Course' : 'Unknown Course')
                        
                        return (
                          <option key={enrollment._id} value={courseId}>
                            {courseTitle}
                          </option>
                        )
                      })}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.map((quiz) => {
                    const attempt = getAttemptForQuiz(quiz._id)
                    return (
                      <div key={quiz._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-800">{quiz.title}</h3>
                          {attempt && (
                            attempt.passed ? (
                              <FiCheckCircle size={24} className="text-green-500" />
                            ) : (
                              <FiXCircle size={24} className="text-red-500" />
                            )
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">Questions: {quiz.questions?.length || 0}</p>
                          <p className="text-sm text-gray-600">Passing Score: {quiz.passingScore}%</p>
                          <p className="text-sm text-gray-600">Time Limit: {quiz.timeLimit} min</p>
                          {attempt && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-800">Your Score: {attempt.percentage.toFixed(1)}%</p>
                              <p className={`text-sm font-medium ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </p>
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/student/quiz/${quiz._id}`}
                          className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700"
                        >
                          {attempt ? 'Retake Quiz' : 'Take Quiz'}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default StudentQuizzes

