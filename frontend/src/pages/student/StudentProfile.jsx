import { useState, useEffect, useContext } from 'react'
import Layout from '../../components/Layout'
import AuthContext from '../../context/AuthContext'
import axios from 'axios'
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiSave, FiCamera, FiBook, FiAward, FiX, FiShield, FiBriefcase, FiZap } from 'react-icons/fi'
import '../admin/AdminPremium.css'

const StudentProfile = () => {
    const { fetchUser } = useContext(AuthContext)
    const [profile, setProfile] = useState(null)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [formData, setFormData] = useState({})
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const [profileRes, userRes] = await Promise.all([
                axios.get('/api/student/profile'),
                axios.get('/api/auth/me')
            ])
            setProfile(profileRes.data)
            setUser(userRes.data)
            setFormData(profileRes.data)
        } catch (error) {
            console.error('Error fetching profile:', error)
            setMessage({ type: 'error', text: 'Failed to load profile' })
        } finally {
            setLoading(false)
        }
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('avatar', file)

        setUploadingAvatar(true)
        try {
            const res = await axios.post('/api/student/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setProfile({ ...profile, avatar: res.data.avatar })
            await fetchUser()
            setMessage({ type: 'success', text: 'Avatar updated successfully!' })
            setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        } catch (error) {
            console.error('Error uploading avatar:', error)
            setMessage({ type: 'error', text: 'Failed to upload avatar' })
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await axios.put('/api/student/profile', formData)
            setProfile(res.data)
            await fetchUser()
            setEditing(false)
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        } catch (error) {
            console.error('Error updating profile:', error)
            setMessage({ type: 'error', text: 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData(profile)
        setEditing(false)
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500" />
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto pb-20 animate-dashCardFadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
                            Academic <span className="text-premium-gradient">Profile</span>
                        </h1>
                        <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Synchronize your learning identity and credentials</p>
                    </div>

                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="admin-premium-btn flex items-center gap-3 py-4 shadow-xl shadow-indigo-500/20"
                        >
                            <FiEdit2 size={18} />
                            <span>Edit Profile</span>
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={handleCancel}
                                className="px-8 py-4 bg-white/5 text-[#94a3b8] rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/10 border border-white/5"
                            >
                                <FiX className="inline mr-2" />
                                Abort
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-500/20 disabled:opacity-50"
                            >
                                <FiSave className="inline mr-2" />
                                {saving ? 'Securing...' : 'Save Profile'}
                            </button>
                        </div>
                    )}
                </div>

                {message.text && (
                    <div className={`mb-10 p-5 rounded-2xl border flex items-center gap-4 animate-dashCardFadeIn ${message.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                        {message.type === 'success' ? <FiZap size={20} /> : <FiX size={20} />}
                        <p className="font-black uppercase tracking-widest text-xs">{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    <div className="xl:col-span-1 space-y-10">
                        {/* Avatar Card */}
                        <div className="admin-glass-card p-10 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

                            <div className="relative mx-auto w-48 h-48 mb-8">
                                <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative w-full h-full rounded-full bg-[#0f172a] border-4 border-white/5 flex items-center justify-center overflow-hidden shadow-2xl">
                                    {profile?.avatar ? (
                                        <img
                                            src={profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:5000${profile.avatar}`}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FiUser size={80} className="text-blue-400 opacity-20" />
                                    )}

                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 bg-[#0f172a]/80 flex items-center justify-center backdrop-blur-sm">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-2 right-2 w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/40 z-20 border-2 border-[#0f172a] active:scale-90">
                                    <FiCamera size={20} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        disabled={uploadingAvatar}
                                    />
                                </label>
                            </div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                                {profile?.firstName} {profile?.lastName}
                            </h2>
                            <div className="flex flex-col items-center gap-3 mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 w-full justify-center">
                                    <FiMail className="text-blue-400" size={16} />
                                    <span className="text-sm font-bold text-[#94a3b8]">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 w-full justify-center">
                                    <FiShield className="text-blue-400" size={16} />
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{user?.role} User</span>
                                </div>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="admin-glass-card p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/5">
                                    <FiAward size={20} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Biography</h3>
                            </div>
                            {editing ? (
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="admin-input min-h-[160px] text-sm leading-relaxed"
                                    placeholder="Write a brief introduction..."
                                />
                            ) : (
                                <p className="text-[#94a3b8] text-sm leading-relaxed italic">{profile?.bio || 'Biography not yet defined.'}</p>
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-2 space-y-10">
                        {/* Personal Information */}
                        <div className="admin-glass-card p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-400 border border-white/5">
                                    <FiUser size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Personal Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1">First Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.firstName || ''}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="admin-input"
                                        />
                                    ) : (
                                        <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 uppercase tracking-tight">{profile?.firstName || 'NULL'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1">Last Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.lastName || ''}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="admin-input"
                                        />
                                    ) : (
                                        <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 uppercase tracking-tight">{profile?.lastName || 'NULL'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <FiPhone size={12} className="text-blue-400" /> Phone Number
                                    </label>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="admin-input"
                                        />
                                    ) : (
                                        <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 tracking-tight font-mono">{profile?.phone || 'UNSET'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <FiCalendar size={12} className="text-blue-400" /> Date of Birth
                                    </label>
                                    {editing ? (
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="admin-input"
                                        />
                                    ) : (
                                        <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 tracking-tight uppercase">
                                            {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'UNDEFINED'}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <FiMapPin size={12} className="text-blue-400" /> Current Address
                                    </label>
                                    {editing ? (
                                        <textarea
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="admin-input min-h-[100px]"
                                            rows="2"
                                        />
                                    ) : (
                                        <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 tracking-tight uppercase">{profile?.address || 'ADDRESS NOT SET'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div className="admin-glass-card p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 border border-white/5">
                                    <FiBook size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Academic Nexus</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1">Student Identification</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.studentId || ''}
                                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            className="admin-input"
                                        />
                                    ) : (
                                        <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 uppercase tracking-tight font-mono">{profile?.studentId || 'N/A'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1">Primary Department</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="admin-input"
                                        />
                                    ) : (
                                        <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 uppercase tracking-tight">{profile?.department || 'GENERAL'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1">Educational Level</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.education || ''}
                                            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                            className="admin-input"
                                            placeholder="Degree/Course Level"
                                        />
                                    ) : (
                                        <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 uppercase tracking-tight">{profile?.education || 'UNDEFINED'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <FiCalendar size={12} className="text-blue-400" /> Enrollment Registry
                                    </label>
                                    <p className="text-white font-bold bg-white/5 px-5 py-4 rounded-2xl border border-white/5 tracking-tight uppercase">
                                        {profile?.enrollmentDate ? new Date(profile.enrollmentDate).toLocaleDateString() : 'PENDING'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default StudentProfile
