import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiArrowLeft, FiFile, FiVideo, FiLink, FiCheckCircle, FiExternalLink } from 'react-icons/fi'

const StudentCourseMaterials = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    try {
      const [materialsRes, courseRes, enrollmentsRes] = await Promise.all([
        axios.get(`/api/student/courses/${courseId}/materials`),
        axios.get(`/api/courses/${courseId}`),
        axios.get('/api/student/enrollments')
      ])
      setMaterials(materialsRes.data || [])
      setCourse(courseRes.data)
      const enrollmentData = (enrollmentsRes.data || []).find(
        e => (e.course?._id || e.course) === courseId
      )
      setEnrollment(enrollmentData)
    } catch (error) {
      console.error('Error fetching data:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        window.location.href = '/login'
        return
      }
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewMaterial = async (material) => {
    // Construct full URL for uploaded files
    let materialUrl = material.url
    if (material.url && material.url.startsWith('/uploads')) {
      // Use relative path for proxy
      materialUrl = material.url
    }
    
    // Open material in new tab
    window.open(materialUrl, '_blank')

    // Mark as viewed
    try {
      const res = await axios.post(
        `/api/student/courses/${courseId}/materials/${material._id}/view`
      )
      
      // Update local state
      setMaterials(materials.map(m => 
        m._id === material._id ? { ...m, viewed: true } : m
      ))
      
      // Update enrollment
      if (res.data.enrollment) {
        setEnrollment(res.data.enrollment)
      }

      // Show completion message if course is completed
      if (res.data.completed) {
        alert('Congratulations! You have completed all materials. You can now generate your certificate!')
      }
    } catch (error) {
      console.error('Error marking material as viewed:', error)
    }
  }

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FiFile size={24} className="text-red-600" />
      case 'video':
        return <FiVideo size={24} className="text-blue-600" />
      case 'link':
        return <FiLink size={24} className="text-green-600" />
      default:
        return <FiFile size={24} className="text-gray-600" />
    }
  }

  const getMaterialTypeLabel = (type) => {
    switch (type) {
      case 'pdf':
        return 'PDF Document'
      case 'video':
        return 'Video'
      case 'document':
        return 'Document'
      case 'link':
        return 'External Link'
      default:
        return type
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

  if (!course) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-600">Course not found</p>
          <button
            onClick={() => navigate('/student/courses')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </Layout>
    )
  }

  const viewedCount = materials.filter(m => m.viewed).length
  const totalMaterials = materials.length
  const progress = totalMaterials > 0 ? Math.round((viewedCount / totalMaterials) * 100) : 0

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/student/courses')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.title}</h1>
            <p className="text-gray-600">Study Materials</p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Your Progress</h2>
              <p className="text-gray-600">
                {viewedCount} of {totalMaterials} materials viewed
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{progress}%</p>
              {enrollment?.completed && (
                <p className="text-sm text-green-600 font-medium mt-1">Course Completed!</p>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {enrollment?.completed && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ You have completed all materials! You can now generate your certificate.
              </p>
            </div>
          )}
        </div>

        {/* Materials List */}
        {materials.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <FiFile size={64} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No study materials available for this course yet.</p>
            <p className="text-sm text-gray-500 mt-2">Check back later or contact your instructor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material, index) => (
              <div
                key={material._id}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${
                  material.viewed ? 'border-2 border-green-500' : 'border border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getMaterialIcon(material.type)}
                    <div>
                      <h3 className="font-bold text-gray-800">{material.title}</h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {getMaterialTypeLabel(material.type)}
                      </p>
                    </div>
                  </div>
                  {material.viewed && (
                    <FiCheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  )}
                </div>

                {material.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{material.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <p>Material {index + 1} of {totalMaterials}</p>
                    {material.fileSize && (
                      <p className="mt-1">Size: {(material.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewMaterial(material)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 text-sm"
                  >
                    <span>{material.viewed ? 'View Again' : 'View'}</span>
                    <FiExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Click "View" on each material to open it. Once you view all materials, 
            your course will be marked as completed and you'll be eligible to generate a certificate.
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default StudentCourseMaterials

