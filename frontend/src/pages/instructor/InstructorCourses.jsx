import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiUsers, FiCalendar, FiFile, FiVideo, FiLink, FiPlus, FiTrash2, FiClock, FiSettings, FiArrowRight, FiBookOpen } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course, idx) => (
                  <div
                    key={course._id}
                    className={`admin-glass-card group hover:border-indigo-500/30 transition-all cursor-pointer ${selectedCourse === course._id ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-500/20' : ''}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    onClick={() => fetchStudents(course._id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <FiBookOpen size={24} className="text-indigo-400" />
                      </div>
                      <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-black text-[#64748b] uppercase tracking-widest border border-white/5">
                        Course ID: {course._id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight group-hover:text-indigo-400 transition-colors line-clamp-1">{course.title}</h3>
                    <p className="text-[#94a3b8] text-sm mb-6 line-clamp-2 leading-relaxed">{course.description}</p>

                    <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center text-[10px] font-black text-[#64748b] uppercase tracking-widest">
                        <FiUsers size={14} className="mr-2 text-indigo-500" />
                        {course.enrolledCount} active students
                      </div>
                      <div className="flex items-center text-[10px] font-black text-[#64748b] uppercase tracking-widest">
                        <FiCalendar size={14} className="mr-2 text-purple-500" />
                        {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${selectedCourse === course._id
                        ? 'bg-white text-[#0f172a]'
                        : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white'
                        }`}
                    >
                      {selectedCourse === course._id ? 'Managing' : 'Manage Course'}
                      <FiArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="space-y-6 sticky top-6">
                <div className="admin-glass-card">
                  <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                      <FiVideo className="text-indigo-400" />
                      <h2 className="text-xl font-bold text-white uppercase tracking-tight">Study Materials</h2>
                    </div>
                    {selectedCourse && (
                      <button
                        onClick={() => setShowMaterialModal(true)}
                        className="w-10 h-10 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20"
                      >
                        <FiPlus size={20} />
                      </button>
                    )}
                  </div>

                  {selectedCourse ? (
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {materials.length === 0 ? (
                        <div className="text-center py-10 opacity-50 bg-white/5 rounded-2xl border border-dashed border-white/10">
                          <FiFile size={32} className="mx-auto mb-2 text-[#475569]" />
                          <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-[10px]">No materials added</p>
                        </div>
                      ) : (
                        materials.map((material, index) => (
                          <div key={material._id || index} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group/mat animate-dashCardFadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover/mat:bg-indigo-500 group-hover/mat:text-white transition-all">
                                {getMaterialIcon(material.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate uppercase tracking-tight">{material.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">{material.type}</span>
                                  {material.fileSize && (
                                    <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">• {(material.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteMaterial(material, index)}
                              className="w-8 h-8 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover/mat:opacity-100"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 opacity-50 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                      <FiSettings size={48} className="mx-auto mb-4 text-[#475569] animate-spin-slow" />
                      <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-[10px]">Select a course to manage</p>
                    </div>
                  )}
                </div>

                <div className="admin-glass-card">
                  <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
                    <FiUsers className="text-purple-400" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Active Students</h2>
                  </div>

                  {selectedCourse ? (
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {students.length === 0 ? (
                        <div className="text-center py-10 opacity-50 bg-white/5 rounded-2xl">
                          <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-[10px]">No students enrolled</p>
                        </div>
                      ) : (
                        students.map((enrollment, idx) => (
                          <div key={enrollment._id} className="p-5 bg-white/5 border border-white/5 rounded-2xl animate-dashCardFadeIn" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-bold text-white uppercase tracking-tight">
                                  {enrollment.student?.profile?.firstName} {enrollment.student?.profile?.lastName}
                                </p>
                                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mt-1">{enrollment.student?.email}</p>
                              </div>
                              <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                {enrollment.progress}%
                              </div>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}

                      <button
                        onClick={() => setSelectedCourse(null)}
                        className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-[#64748b] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                      >
                        De-select Course
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12 opacity-50 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                      <FiUsers size={48} className="mx-auto mb-4 text-[#475569]" />
                      <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-[10px]">Waiting for selection</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

