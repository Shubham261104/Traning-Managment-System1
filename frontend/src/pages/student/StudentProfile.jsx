import { useState, useEffect, useContext } from 'react'
import AuthContext from '../../context/AuthContext'
import axios from 'axios'
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiSave, FiCamera, FiBook, FiAward, FiX, FiShield, FiZap } from 'react-icons/fi'
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

    // Security configurations state
    const [loginHistory, setLoginHistory] = useState([])
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [loadingSecurity, setLoadingSecurity] = useState(false)

    useEffect(() => {
        fetchProfile()
        fetchSecuritySettings()
    }, [])

    useEffect(() => {
        if (user) {
            setTwoFactorEnabled(user.twoFactorEnabled || false)
        }
    }, [user])

    const fetchProfile = async () => {
        try {
            const [profileRes, userRes] = await Promise.all([
                axios.get('/api/student/profile'),
                axios.get('/api/auth/me')
            ])
            setProfile(profileRes.data)
            setUser(userRes.data?.user || userRes.data)
            setFormData(profileRes.data)
        } catch (error) {
            console.error('Error fetching profile:', error)
            setMessage({ type: 'error', text: 'Failed to load profile' })
        } finally {
            setLoading(false)
        }
    }

    const fetchSecuritySettings = async () => {
        try {
            const historyRes = await axios.get('/api/auth/login-history')
            setLoginHistory(historyRes.data.loginHistory || [])
        } catch (err) {
            console.error('Error fetching login history:', err)
        }
    }

    const handleToggle2FA = async () => {
        setLoadingSecurity(true)
        try {
            const res = await axios.post('/api/auth/toggle-2fa')
            setTwoFactorEnabled(res.data.twoFactorEnabled)
            setMessage({ type: 'success', text: res.data.message })
            setTimeout(() => setMessage({ type: '', text: '' }), 4000)
            await fetchProfile()
        } catch (err) {
            console.error(err)
            setMessage({ type: 'error', text: 'Failed to update 2FA configuration.' })
            setTimeout(() => setMessage({ type: '', text: '' }), 4000)
        } finally {
            setLoadingSecurity(false)
        }
    }

    const handleLogoutAllDevices = async () => {
        setLoadingSecurity(true)
        try {
            const res = await axios.post('/api/auth/logout-all-devices')
            setMessage({ type: 'success', text: res.data.message })
            setTimeout(() => setMessage({ type: '', text: '' }), 4000)
            fetchSecuritySettings()
        } catch (err) {
            console.error(err)
            setMessage({ type: 'error', text: 'Failed to clear other sessions.' })
            setTimeout(() => setMessage({ type: '', text: '' }), 4000)
        } finally {
            setLoadingSecurity(false)
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-dashCardFadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-800 mb-2 tracking-tight">
                            Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Profile</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-lg uppercase tracking-tightest">Synchronize your learning identity and credentials</p>
                    </div>

                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl px-5 py-3 font-semibold shadow-md flex items-center gap-3 py-4 shadow-xl shadow-indigo-500/20"
                        >
                            <FiEdit2 size={18} />
                            <span>Edit Profile</span>
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={handleCancel}
                                className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/10 border border-gray-200"
                            >
                                <FiX className="inline mr-2" />
                                Abort
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-gray-800 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-500/20 disabled:opacity-50"
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
                        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-10 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

                            <div className="relative mx-auto w-48 h-48 mb-8">
                                <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative w-full h-full rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center overflow-hidden shadow-2xl">
                                    {profile?.avatar ? (
                                        <img
                                            src={profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:5001${profile.avatar}`}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FiUser size={80} className="text-blue-400 opacity-20" />
                                    )}

                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center backdrop-blur-sm">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-2 right-2 w-12 h-12 bg-blue-500 text-gray-800 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/40 z-20 border-2 border-[#0f172a] active:scale-90">
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

                            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight mb-2">
                                {profile?.firstName} {profile?.lastName}
                            </h2>
                            <div className="flex flex-col items-center gap-3 mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 w-full justify-center">
                                    <FiMail className="text-blue-400" size={16} />
                                    <span className="text-sm font-bold text-gray-500">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 w-full justify-center">
                                    <FiShield className="text-blue-400" size={16} />
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{user?.role} User</span>
                                </div>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-indigo-400 border border-gray-200">
                                    <FiAward size={20} />
                                </div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Biography</h3>
                            </div>
                            {editing ? (
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[160px] text-sm leading-relaxed"
                                    placeholder="Write a brief introduction..."
                                />
                            ) : (
                                <p className="text-gray-500 text-sm leading-relaxed italic">{profile?.bio || 'Biography not yet defined.'}</p>
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-2 space-y-10">
                        {/* Personal Information */}
                        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-400 border border-gray-200">
                                    <FiUser size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Personal Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">First Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.firstName || ''}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 uppercase tracking-tight">{profile?.firstName || 'NULL'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">Last Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.lastName || ''}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 uppercase tracking-tight">{profile?.lastName || 'NULL'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <FiPhone size={12} className="text-blue-400" /> Phone Number
                                    </label>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 tracking-tight font-mono">{profile?.phone || 'UNSET'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <FiCalendar size={12} className="text-blue-400" /> Date of Birth
                                    </label>
                                    {editing ? (
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 tracking-tight uppercase">
                                            {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'UNDEFINED'}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <FiMapPin size={12} className="text-blue-400" /> Current Address
                                    </label>
                                    {editing ? (
                                        <textarea
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                                            rows="2"
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 tracking-tight uppercase">{profile?.address || 'ADDRESS NOT SET'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-indigo-400 border border-gray-200">
                                    <FiBook size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Academic Nexus</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">Student Identification</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.studentId || ''}
                                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 uppercase tracking-tight font-mono">{profile?.studentId || 'N/A'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">Primary Department</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 uppercase tracking-tight">{profile?.department || 'GENERAL'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">Educational Level</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={formData.education || ''}
                                            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Degree/Course Level"
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 uppercase tracking-tight">{profile?.education || 'UNDEFINED'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                        <FiCalendar size={12} className="text-blue-400" /> Enrollment Registry
                                    </label>
                                    <p className="text-gray-800 font-bold bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 tracking-tight uppercase">
                                        {profile?.enrollmentDate ? new Date(profile.enrollmentDate).toLocaleDateString() : 'PENDING'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Security Suite & Device Management */}
                        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-red-500 border border-gray-200">
                                    <FiShield size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Security & Device Registry</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-gray-500 uppercase tracking-wider">Access Controls</h4>
                                    
                                    <div className="flex flex-col gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-800 font-extrabold text-sm">Two-Factor Auth</p>
                                            <button
                                                onClick={handleToggle2FA}
                                                disabled={loadingSecurity}
                                                style={{
                                                    backgroundColor: twoFactorEnabled ? '#10b981' : '"#f9fafb"',
                                                    border: '1px solid',
                                                    borderColor: twoFactorEnabled ? '#10b981' : '"#e5e7eb"',
                                                    color: "#1f2937",
                                                    transition: 'all 0.3s ease'
                                                }}
                                                className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer outline-none"
                                            >
                                                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">Enabling code requests guards logins using direct OTP codes sent to your registered email address.</p>
                                    </div>

                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                        <p className="text-gray-800 font-extrabold text-sm">Session Expiry policy</p>
                                        <p className="text-xs text-gray-500 mt-1">Automatic account timeouts trigger after 15 minutes of user inactivity monitor detection.</p>
                                    </div>

                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-gray-800 font-extrabold text-sm font-bold">Device Sessions</p>
                                                <p className="text-xs text-gray-500 mt-1">Terminate every other active token session.</p>
                                            </div>
                                            <button
                                                onClick={handleLogoutAllDevices}
                                                disabled={loadingSecurity}
                                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer outline-none transition-all"
                                            >
                                                Logout All
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-gray-500 uppercase tracking-wider">Recent Login History Logs</h4>
                                    
                                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                        {loginHistory.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No registration history items logged yet.</p>
                                        ) : (
                                            loginHistory.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200 text-[11px]">
                                                    <div>
                                                        <p className="font-extrabold text-gray-800">{item.deviceType || 'Desktop Device'}</p>
                                                        <p className="text-gray-500 mt-1">IP: {item.ipAddress}</p>
                                                    </div>
                                                    <span className="text-gray-500 font-mono">{new Date(item.loginTime).toLocaleDateString()} {new Date(item.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default StudentProfile
