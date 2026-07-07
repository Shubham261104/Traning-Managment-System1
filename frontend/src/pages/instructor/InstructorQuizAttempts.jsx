import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi'

const InstructorQuizAttempts = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [quizId])

  const fetchData = async () => {
    try {
      const [quizRes, attemptsRes] = await Promise.all([
        axios.get(`/api/quizzes/${quizId}`),
        axios.get(`/api/instructor/quizzes/${quizId}/attempts`)
      ])
      setQuiz(quizRes.data)
      setAttempts(attemptsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load quiz attempts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!quiz) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-600">Quiz not found</p>
          <button
            onClick={() => navigate('/instructor/quizzes')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Quizzes
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/instructor/quizzes')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
            <p className="text-gray-600">View all quiz attempts by students</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-800">{attempts.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-green-600">
                {attempts.filter(a => a.passed).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {attempts.filter(a => !a.passed).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {attempts.length > 0
                  ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">No attempts yet for this quiz</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div key={attempt._id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {attempt.student?.profile?.firstName} {attempt.student?.profile?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{attempt.student?.email}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Score</p>
                      <p className={`text-xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {attempt.percentage.toFixed(1)}%
                      </p>
                    </div>
                    {attempt.passed ? (
                      <FiCheckCircle size={32} className="text-green-500" />
                    ) : (
                      <FiXCircle size={32} className="text-red-500" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiClock size={16} />
                    <span>Time Spent: {attempt.timeSpent || 0} min</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Completed: {new Date(attempt.completedAt).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded font-medium ${
                      attempt.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Answers:</h4>
                  <div className="space-y-2">
                    {attempt.answers?.map((answer, index) => {
                      const question = answer.question
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            answer.isCorrect ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-gray-800 text-sm">
                              Q{index + 1}: {question?.question}
                            </p>
                            {answer.isCorrect ? (
                              <FiCheckCircle size={18} className="text-green-500 flex-shrink-0 ml-2" />
                            ) : (
                              <FiXCircle size={18} className="text-red-500 flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Student Answer: <span className="font-medium">{answer.selectedAnswer || 'No answer'}</span>
                          </p>
                          {!answer.isCorrect && question && (
                            <p className="text-sm text-green-600 mt-1">
                              Correct Answer: {
                                question.type === 'true_false'
                                  ? question.correctAnswer
                                  : question.options?.find(o => o.isCorrect)?.text || 'N/A'
                              }
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default InstructorQuizAttempts

