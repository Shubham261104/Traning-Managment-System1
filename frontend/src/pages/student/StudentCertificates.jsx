import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiDownload, FiAward, FiPlus, FiCheckCircle, FiShare2, FiShield, FiEye } from 'react-icons/fi'
import '../admin/AdminPremium.css'
import CertificateModal from '../../components/CertificateModal'

const StudentCertificates = () => {
  const [certificates, setCertificates] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchCertificates()
    fetchEnrollments()
  }, [])

  const fetchCertificates = async () => {
    try {
      const res = await axios.get('/api/student/certificates')
      setCertificates(res.data || [])
    } catch (error) {
      console.error('Error fetching certificates:', error)
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollments = async () => {
    try {
      const res = await axios.get('/api/student/enrollments')
      const completed = (res.data || []).filter(e => e.completed && e.status === 'approved')
      setEnrollments(completed)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      setEnrollments([])
    }
  }

  const downloadCertificate = async (certificateId) => {
    try {
      const res = await axios.get(`/api/certificates/${certificateId}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `certificate-${certificateId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading certificate:', error)
    }
  }

  const generateCertificate = async (courseId) => {
    try {
      await axios.post('/api/certificates/generate', { courseId })
      fetchCertificates()
    } catch (error) {
      console.error('Failed to generate certificate:', error)
    }
  }

  const getCompletedCoursesWithoutCert = () => {
    const certCourseIds = certificates
      .map(c => {
        if (c.course && typeof c.course === 'object') {
          return c.course._id || c.course
        }
        return c.course
      })
      .filter(id => id !== null && id !== undefined)

    return enrollments.filter(e => {
      if (!e.course) return false
      const courseId = (e.course && typeof e.course === 'object') ? (e.course._id || e.course) : e.course
      return courseId && !certCourseIds.some(certId =>
        String(certId) === String(courseId)
      )
    })
  }

  return (
    <>
      <Layout>
        <div className="space-y-10 pb-12 animate-dashCardFadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
                Academic <span className="text-premium-gradient">Honors</span>
              </h1>
              <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">View and manage your verified credentials</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
              {getCompletedCoursesWithoutCert().length > 0 && (
                <div className="admin-glass-card p-8 border-indigo-500/20 shadow-indigo-500/10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <FiAward size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pending Issuance</h2>
                      <p className="text-[#64748b] font-bold uppercase tracking-widest text-[10px]">Generate certificates for completed modules</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getCompletedCoursesWithoutCert()
                      .filter(e => e.course !== null && e.course !== undefined)
                      .map((enrollment, idx) => {
                        const courseTitle = enrollment.course?.title || 'Course'
                        const courseId = (enrollment.course && typeof enrollment.course === 'object')
                          ? (enrollment.course._id || enrollment.course)
                          : enrollment.course

                        return (
                          <div key={enrollment._id} className="p-6 bg-white/5 border border-white/10 rounded-3xl group transition-all hover:bg-white/10 animate-dashCardFadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <p className="font-black text-white uppercase tracking-tight mb-4 text-lg">{courseTitle}</p>
                            <div className="flex items-center gap-3 mb-6">
                              <FiCheckCircle className="text-emerald-500" />
                              <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Marked as Complete</span>
                            </div>
                            {courseId && (
                              <button
                                onClick={() => generateCertificate(courseId)}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-indigo-500/20"
                              >
                                <FiPlus size={16} />
                                Generate Document
                              </button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-amber-500 border border-white/5">
                    <FiShield size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Verified Archive</h2>
                </div>

                {certificates.length === 0 ? (
                  <div className="text-center py-32 admin-glass-card opacity-50 border-dashed">
                    <FiAward size={64} className="mx-auto mb-6 text-[#475569]" />
                    <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-sm mb-2">Honors Registry Empty</p>
                    <p className="text-[#475569] font-medium text-xs uppercase tracking-tight">Complete your assigned curriculums to earn credentials</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certificates.map((cert, idx) => {
                      const courseTitle = cert.course?.title || 'Unknown Course'
                      const issuedDate = cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'N/A'
                      const certId = cert.certificateId || cert._id?.slice(-12).toUpperCase() || 'N/A'

                      return (
                        <div
                          key={cert._id || cert.certificateId}
                          className="admin-glass-card group hover:border-amber-500/30 transition-all animate-dashCardFadeIn relative overflow-hidden"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          <div className="absolute top-0 right-0 p-4">
                            <FiShare2 className="text-[#475569] hover:text-white cursor-pointer transition-colors" />
                          </div>

                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                              <FiAward size={32} />
                            </div>
                            <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                              Verified
                            </div>
                          </div>

                          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-amber-400 transition-colors">{courseTitle}</h3>

                          <div className="space-y-4 mb-8 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-[#64748b]">Issue Date</span>
                              <span className="text-white">{issuedDate}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-[#64748b]">Credential ID</span>
                              <span className="text-white font-mono">{certId}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => {
                                setSelectedCertificate(cert);
                                setIsModalOpen(true);
                              }}
                              className="flex items-center justify-center gap-2 py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-amber-500/20 shadow-xl"
                            >
                              <FiEye size={16} />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => downloadCertificate(cert._id)}
                              className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-amber-500 text-[#94a3b8] hover:text-[#0f172a] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5 hover:border-amber-500 shadow-xl"
                            >
                              <FiDownload size={16} />
                              <span>PDF</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>

      {/* Modal rendered outside Layout to avoid sidebar overlap */}
      <CertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificate={selectedCertificate}
        onDownload={downloadCertificate}
      />
    </>
  )
}

export default StudentCertificates

