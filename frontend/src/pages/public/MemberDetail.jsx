import { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import {
    FiArrowLeft, FiMail, FiPhone, FiMapPin, FiLinkedin,
    FiGithub, FiEye, FiCode, FiDatabase, FiLayout,
    FiEdit2, FiCamera, FiSave, FiX, FiUpload, FiUser, FiTerminal
} from 'react-icons/fi'
import './MemberDetail.css'

const MemberDetail = () => {
    const { id } = useParams()
    const { user } = useContext(AuthContext)
    const isAdmin = Boolean(user && user.role === 'admin')

    const [member, setMember] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({})

    useEffect(() => {
        fetchMember()
    }, [id])

    const fetchMember = async () => {
        try {
            const res = await axios.get(`/api/team/${id}`)
            setMember(res.data)
            setFormData(res.data)
        } catch (error) {
            console.error('Error fetching member:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleUpdate = async () => {
        try {
            const dataToSend = { ...formData }
            if (typeof dataToSend.skills === 'string') {
                dataToSend.skills = dataToSend.skills.split(',').map(s => s.trim())
            }
            await axios.put(`/api/team/${id}`, dataToSend)
            setMember(dataToSend)
            setIsEditing(false)
        } catch (error) {
            console.error('Update failed:', error)
        }
    }

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0]
        if (!file) return
        const uploadData = new FormData()
        uploadData.append(type, file)
        setUploading(true)
        try {
            await axios.post(`/api/team/${id}/${type}`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            fetchMember()
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setUploading(false)
        }
    }

    if (loading) return (
        <div className="profile-detail-page flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
        </div>
    )

    if (!member) return (
        <div className="profile-detail-page flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold mb-4">Member Not Found</h2>
            <Link to="/about" className="text-indigo-400 hover:text-white transition-colors">Return to Team</Link>
        </div>
    )

    let Icon = FiCode
    if (member.memberId === 'amrit-raj') Icon = FiLayout
    if (member.memberId === 'harsh-kumar') Icon = FiDatabase

    return (
        <div className="profile-detail-page">
            {/* Animated Background */}
            <div className="bg-mesh">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <main className="profile-content-wrapper">
                <Link to="/about" className="back-btn-top">
                    <FiArrowLeft /> Back to Visionaries
                </Link>

                <div className="glass-detail-card">
                    {/* Admin Badge/Toggle */}
                    {isAdmin && (
                        <div className="admin-badge-overlay">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button onClick={handleUpdate} className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-xl transition-all">
                                        <FiSave size={20} />
                                    </button>
                                    <button onClick={() => { setIsEditing(false); setFormData(member); }} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-xl transition-all">
                                        <FiX size={20} />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-xl transition-all">
                                    <FiEdit2 size={20} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Banner */}
                    <div className="profile-banner"></div>

                    {/* Header Info */}
                    <div className="profile-header-main">
                        <div className="detail-avatar-container group">
                            {member.avatar ? (
                                <img src={member.avatar} alt={member.name} />
                            ) : (
                                <div className="detail-avatar-initial">{member.name.charAt(0)}</div>
                            )}

                            {isAdmin && (
                                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <FiCamera className="text-white text-4xl" />
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} disabled={uploading} />
                                </label>
                            )}
                        </div>

                        <div className="profile-name-title">
                            {isEditing ? (
                                <div className="flex flex-col gap-3 max-w-md mx-auto">
                                    <input name="name" value={formData.name} onChange={handleInputChange} className="edit-mode-input text-2xl text-center" placeholder="Name" />
                                    <input name="role" value={formData.role} onChange={handleInputChange} className="edit-mode-input text-center text-indigo-400" placeholder="Role" />
                                </div>
                            ) : (
                                <>
                                    <h1>{member.name}</h1>
                                    <div className="role-tag">{member.role}</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="detail-grid">
                        <div className="detail-main-side">
                            <section className="info-section">
                                <h3><FiUser className="text-indigo-500" /> About the Visionary</h3>
                                {isEditing ? (
                                    <textarea name="about" value={formData.about} onChange={handleInputChange} rows="8" className="edit-mode-input" />
                                ) : (
                                    <p>{member.about}</p>
                                )}
                            </section>

                            <section className="info-section">
                                <h3><FiTerminal className="text-indigo-500" /> Project Role</h3>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6">
                                    <div className="p-4 bg-indigo-500/10 rounded-xl">
                                        <Icon className="text-indigo-400 text-3xl" />
                                    </div>
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <input name="projectRole" value={formData.projectRole} onChange={handleInputChange} className="edit-mode-input mb-2" placeholder="Project Role" />
                                        ) : (
                                            <h4 className="text-xl font-bold text-white mb-1">{member.projectRole}</h4>
                                        )}
                                        <p className="text-indigo-300 text-sm font-medium">Primary Implementation Authority</p>
                                    </div>
                                </div>
                            </section>

                            <section className="info-section">
                                <h3><FiCode className="text-indigo-500" /> Technical Mastery</h3>
                                {isEditing ? (
                                    <input name="skills" value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills} onChange={handleInputChange} className="edit-mode-input" placeholder="Skill 1, Skill 2, ..." />
                                ) : (
                                    <div className="skills-flex">
                                        {(member.skills || []).map(skill => (
                                            <div key={skill} className="skill-pill">{skill}</div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        <aside className="detail-sidebar-side">
                            <div className="sidebar-glass-box">
                                <h3 className="text-xl font-bold mb-6">Connect</h3>
                                <div className="contact-list">
                                    <div className="contact-item">
                                        <FiMail className="text-indigo-500" />
                                        {isEditing ? (
                                            <input name="email" value={formData.email} onChange={handleInputChange} className="edit-mode-input text-sm" />
                                        ) : (
                                            <span>{member.email}</span>
                                        )}
                                    </div>
                                    <div className="contact-item">
                                        <FiPhone className="text-indigo-500" />
                                        {isEditing ? (
                                            <input name="phone" value={formData.phone} onChange={handleInputChange} className="edit-mode-input text-sm" />
                                        ) : (
                                            <span>{member.phone}</span>
                                        )}
                                    </div>
                                    <div className="contact-item">
                                        <FiMapPin className="text-indigo-500" />
                                        {isEditing ? (
                                            <input name="location" value={formData.location} onChange={handleInputChange} className="edit-mode-input text-sm" />
                                        ) : (
                                            <span>{member.location}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/10">
                                    {member.cv ? (
                                        <a href={member.cv} className="btn-cv-download">
                                            <FiEye /> View CV
                                        </a>
                                    ) : (
                                        <div className="btn-cv-download opacity-50 cursor-not-allowed grayscale">
                                            <FiEye /> CV Not Available
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <label className="btn-cv-upload-admin">
                                            <FiUpload /> {member.cv ? 'Update Document' : 'Upload CV (PDF)'}
                                            <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'cv')} disabled={uploading} />
                                        </label>
                                    )}
                                </div>

                                <div className="flex justify-center gap-6 mt-8">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            <input name="linkedin" value={formData.linkedin || ''} onChange={handleInputChange} className="edit-mode-input text-sm" placeholder="LinkedIn URL" />
                                            <input name="github" value={formData.github || ''} onChange={handleInputChange} className="edit-mode-input text-sm" placeholder="GitHub URL" />
                                        </div>
                                    ) : (
                                        <>
                                            {member.linkedin && (
                                                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-all transform hover:scale-110">
                                                    <FiLinkedin size={24} />
                                                </a>
                                            )}
                                            {member.github && (
                                                <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-all transform hover:scale-110">
                                                    <FiGithub size={24} />
                                                </a>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default MemberDetail
