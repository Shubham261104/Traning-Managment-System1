import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiUsers, FiCalendar, FiFile, FiVideo, FiLink, FiPlus, FiTrash2, FiClock, FiSettings, FiArrowRight, FiBookOpen, FiCheckSquare, FiAward } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import CourseManageView from './CourseManageView'
import '../admin/AdminPremium.css'

const InstructorCourses = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [materials, setMaterials] = useState([])
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialForm, setMaterialForm] = useState({
    title: '',
    url: '',
    type: 'pdf',
    description: '',
    uploadMethod: 'url', // 'url' or 'file'
    scheduledAt: new Date().toISOString().slice(0, 16)
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchCourses()
  }, [])

  // Auto-select course from URL query param
  useEffect(() => {
    const courseIdFromUrl = searchParams.get('courseId')
    if (courseIdFromUrl && courses.length > 0 && !selectedCourse) {
      // Verify the course exists in the instructor's courses
      const courseExists = courses.find(c => c._id === courseIdFromUrl)
      if (courseExists) {
        fetchStudents(courseIdFromUrl)
      }
    }
  }, [courses, searchParams])

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

  const fetchStudents = async (courseId) => {
    try {
      const [studentsRes, materialsRes] = await Promise.all([
        axios.get(`/api/instructor/courses/${courseId}/students`),
        axios.get(`/api/instructor/courses/${courseId}/materials`)
      ])
      setStudents(studentsRes.data)
      setMaterials(materialsRes.data)
      setSelectedCourse(courseId)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      const formData = new FormData()

      if (materialForm.uploadMethod === 'file' && selectedFile) {
        formData.append('file', selectedFile)
        formData.append('title', materialForm.title || selectedFile.name)
        formData.append('type', materialForm.type)
        formData.append('description', materialForm.description)
      } else {
        formData.append('title', materialForm.title)
        formData.append('url', materialForm.url)
        formData.append('type', materialForm.type)
        formData.append('description', materialForm.description)
      }
      formData.append('scheduledAt', materialForm.scheduledAt)

      await axios.post(`/api/instructor/courses/${selectedCourse}/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setShowMaterialModal(false)
      setMaterialForm({ title: '', url: '', type: 'pdf', description: '', uploadMethod: 'url' })
      setSelectedFile(null)
      fetchStudents(selectedCourse)
    } catch (error) {
      console.error('Error adding material:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const ext = file.name.split('.').pop().toLowerCase()
      let detectedType = 'document'
      if (ext === 'pdf') {
        detectedType = 'pdf'
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
        detectedType = 'video'
      }
      setMaterialForm({ ...materialForm, type: detectedType, title: file.name })
    }
  }

  const handleDeleteMaterial = async (material, index) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return
    }
    try {
      await axios.delete(`/api/instructor/courses/${selectedCourse}/materials/${index}`)
      fetchStudents(selectedCourse)
    } catch (error) {
      console.error('Error deleting material:', error)
    }
  }

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return <FiFile size={20} />
      case 'video':
        return <FiVideo size={20} />
      case 'link':
        return <FiLink size={20} />
      default:
        return <FiFile size={20} />
    }
  }

  return (
    <Layout>
      <div className="space-y-10 pb-12 animate-dashCardFadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
              My <span className="text-premium-gradient">Courses</span>
            </h1>
            <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Manage your assigned courses and students</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
          </div>
        ) : selectedCourse ? (
          <CourseManageView courseId={selectedCourse} onBack={() => setSelectedCourse(null)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, idx) => (
              <div
                key={course._id}
                className="admin-glass-card group hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative"
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => setSelectedCourse(course._id)}
              >
                <div>
                  {/* Course Thumbnail */}
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-5 relative bg-slate-900 border border-white/10 group-hover:scale-[1.02] transition-transform">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-6 text-center">
                        <FiBookOpen size={48} className="text-indigo-400 opacity-60 mb-2" />
                      </div>
                    )}
                    
                    {/* Status & Difficulty Badges overlay */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/30">
                        {course.status || 'Active'}
                      </span>
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-indigo-300 uppercase tracking-widest border border-indigo-500/30">
                        {course.difficulty || 'Intermediate'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">{course.title}</h3>
                  </div>

                  <p className="text-[#94a3b8] text-sm mb-6 line-clamp-2 leading-relaxed">{course.description}</p>
                </div>

                <div>
                  {/* Course Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center text-[10px] font-black text-[#64748b] uppercase tracking-widest">
                      <FiUsers size={14} className="mr-2 text-indigo-500" />
                      {course.enrolledCount || course.studentCount || 0} Students
                    </div>
                    <div className="flex items-center text-[10px] font-black text-[#64748b] uppercase tracking-widest">
                      <FiCheckSquare size={14} className="mr-2 text-emerald-500" />
                      Active Quizzes
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCourse(course._id)}
                    className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
                  >
                    Manage Course
                    <FiArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showMaterialModal && (
          <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-dashCardFadeIn">
            <div className="admin-glass-card max-w-lg w-full p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Add Study Material</h2>
              <p className="text-[#64748b] font-bold uppercase tracking-widest text-[10px] mb-8">Deploy new resources to your students</p>

              <form onSubmit={handleAddMaterial} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Upload Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'file', label: 'Local File', icon: FiPlus },
                      { value: 'url', label: 'Resource URL', icon: FiLink }
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${materialForm.uploadMethod === opt.value
                          ? 'bg-indigo-500/10 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/5 text-[#64748b] hover:border-white/20'
                          }`}
                      >
                        <input
                          type="radio"
                          name="uploadMethod"
                          value={opt.value}
                          checked={materialForm.uploadMethod === opt.value}
                          onChange={(e) => setMaterialForm({ ...materialForm, uploadMethod: e.target.value, url: '' })}
                          className="hidden"
                        />
                        <opt.icon size={18} />
                        <span className="font-bold text-xs uppercase tracking-widest">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {materialForm.uploadMethod === 'file' ? (
                  <div className="animate-dashCardFadeIn">
                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Select Repository File</label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.mp4,.avi,.mov,.wmv,.flv,.webm,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                        className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all file:hidden cursor-pointer"
                        required={materialForm.uploadMethod === 'file'}
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400">
                        <FiPlus />
                      </div>
                    </div>
                    {selectedFile && (
                      <p className="mt-3 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <FiFile /> STAGED: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="animate-dashCardFadeIn">
                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Resource Endpoint URL</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={materialForm.url}
                        onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                        placeholder="HTTPS://EXAMPLE.COM/FILE.PDF"
                        required={materialForm.uploadMethod === 'url'}
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#64748b]">
                        <FiLink />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Material Title</label>
                    <input
                      type="text"
                      value={materialForm.title}
                      onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Type Classification</label>
                    <select
                      value={materialForm.type}
                      onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}
                      className="w-full px-5 py-4 bg-[#0f172a] border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                    >
                      <option value="pdf">PDF REPORT</option>
                      <option value="video">VIDEO STREAM</option>
                      <option value="document">DOC FILE</option>
                      <option value="link">EXT LINK</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3">Scheduling Payload</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="datetime-local"
                        value={materialForm.scheduledAt}
                        onChange={(e) => setMaterialForm({ ...materialForm, scheduledAt: e.target.value })}
                        className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-indigo-500 border-transparent transition-all outline-none"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#64748b]">
                        <FiClock />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setMaterialForm({ ...materialForm, scheduledAt: localDateTime });
                      }}
                      className="px-4 py-4 bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/20 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap"
                    >
                      Now
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20"
                  >
                    {uploading ? 'UPLOADING...' : 'DEPLOY MATERIAL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaterialModal(false)
                      setMaterialForm({ title: '', url: '', type: 'pdf', description: '', uploadMethod: 'url' })
                      setSelectedFile(null)
                    }}
                    className="flex-1 bg-white/5 text-[#64748b] hover:text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/5"
                  >
                    ABORT
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default InstructorCourses

