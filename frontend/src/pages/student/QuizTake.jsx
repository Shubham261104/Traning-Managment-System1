import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'

const QuizTake = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  useEffect(() => {
    if (started && timeLeft > 0 && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [started, timeLeft, submitted])

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

  const startQuiz = () => {
    setStarted(true)
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleSubmit = async () => {
    if (submitted) return

    const timeSpent = Math.floor((quiz.timeLimit * 60 - timeLeft) / 60)
    const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer
    }))

    try {
      const res = await axios.post(`/api/student/quizzes/${quizId}/attempt`, {
        answers: answerArray,
        timeSpent
      })
      setResult(res.data)
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Failed to submit quiz')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
        </div>
      </Layout>
    )
  }

  if (!started) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{quiz.title}</h1>
            <p className="text-gray-600 mb-6">{quiz.description}</p>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Questions</span>
                <span className="font-semibold">{quiz.questions?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Time Limit</span>
                <span className="font-semibold">{quiz.timeLimit} minutes</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Passing Score</span>
                <span className="font-semibold">{quiz.passingScore}%</span>
              </div>
            </div>
            <button
              onClick={startQuiz}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (submitted && result) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              {result.passed ? (
                <FiCheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              ) : (
                <FiXCircle size={64} className="text-red-500 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {result.passed ? 'Congratulations!' : 'Quiz Completed'}
              </h1>
              <p className="text-gray-600">Your Score: {result.percentage.toFixed(1)}%</p>
              <p className={`text-lg font-semibold mt-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.passed ? 'You Passed!' : `You need ${quiz.passingScore}% to pass`}
              </p>
            </div>
            <div className="space-y-4 mb-6">
              {result.answers.map((answer, index) => {
                const question = quiz.questions.find(q => q._id === answer.question._id || q._id.toString() === answer.question.toString())
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-800">{question?.question}</p>
                      {answer.isCorrect ? (
                        <FiCheckCircle size={20} className="text-green-500" />
                      ) : (
                        <FiXCircle size={20} className="text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Your answer: {answer.selectedAnswer}</p>
                    {!answer.isCorrect && question && (
                      <p className="text-sm text-green-600 mt-1">
                        Correct answer: {question.type === 'true_false' ? question.correctAnswer : question.options?.find(o => o.isCorrect)?.text}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => navigate('/student/quizzes')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
            <div className="flex items-center space-x-2 text-red-600">
              <FiClock size={20} />
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {quiz.questions?.map((question, index) => (
            <div key={question._id} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Question {index + 1}: {question.question}
              </h3>
              {question.type === 'multiple_choice' ? (
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${question._id}`}
                        value={option.text}
                        checked={answers[question._id] === option.text}
                        onChange={() => handleAnswerChange(question._id, option.text)}
                        className="mr-3"
                      />
                      <span className="text-gray-700">{option.text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value="true"
                      checked={answers[question._id] === 'true'}
                      onChange={() => handleAnswerChange(question._id, 'true')}
                      className="mr-3"
                    />
                    <span className="text-gray-700">True</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value="false"
                      checked={answers[question._id] === 'false'}
                      onChange={() => handleAnswerChange(question._id, 'false')}
                      className="mr-3"
                    />
                    <span className="text-gray-700">False</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default QuizTake

