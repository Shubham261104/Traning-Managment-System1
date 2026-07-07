import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import axios from 'axios'
import { FiPlus, FiTrash2, FiEdit, FiSearch, FiLayers, FiX, FiExternalLink, FiUsers, FiActivity, FiUpload, FiImage } from 'react-icons/fi'
import './AdminPremium.css'

const AdminTeam = () => {
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        image: '',
        slug: ''
    })
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        fetchMembers()
    }, [])

    const fetchMembers = async () => {
        try {
            const res = await axios.get('/api/team')
            setMembers(res.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this member?')) return
        try {
            await axios.delete(`/api/team/${id}`)
            fetchMembers()
        } catch (error) {
            console.error(error)
        }
    }

    const handleEdit = (member) => {
        setEditingMember(member)
        setFormData({
            name: member.name,
            role: member.role,
            image: member.avatar || member.image || '',
            slug: member.slug || ''
        })
        setAvatarFile(null)
        setAvatarPreview(member.avatar || member.image || null)
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setUploading(true)
        try {
            let memberId = editingMember ? (editingMember.memberId || editingMember.slug || editingMember._id) : formData.slug

            // If editing, update member data first
            if (editingMember) {
                await axios.put(`/api/team/${memberId}`, formData)
            } else {
                // If creating new, create member first
                const createData = { ...formData, memberId: formData.slug }
                const response = await axios.post('/api/team', createData)
                memberId = response.data.memberId || response.data.slug || response.data._id
            }

            // Upload avatar if a file is selected
            if (avatarFile) {
                const formDataUpload = new FormData()
                formDataUpload.append('avatar', avatarFile)

                const token = localStorage.getItem('token')
                await axios.post(`/api/team/${memberId}/avatar`, formDataUpload, {
                    headers: {
                        'Content-Type': undefined,
                        'Authorization': `Bearer ${token}`
                    }
                })
            }

            setShowModal(false)
            setFormData({ name: '', role: '', image: '', slug: '' })
            setEditingMember(null)
            setAvatarFile(null)
            setAvatarPreview(null)
            fetchMembers()
        } catch (error) {
            console.error(error)
            alert(error.response?.data?.message || 'Error saving member')
        } finally {
            setUploading(false)
        }
    }

    const handleAvatarChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setAvatarFile(file)
            // Create preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setAvatarPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-indigo-500"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 bg-indigo-500/10 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto pb-20 animate-dashCardFadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2 tracking-tight">
                            Manage <span className="text-premium-gradient">Team</span>
                        </h1>
                        <p className="text-[#94a3b8] font-medium text-lg uppercase tracking-tightest">Architect the public identity of SkillBridge</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingMember(null)
                            setFormData({ name: '', role: '', image: '', slug: '' })
                            setAvatarFile(null)
                            setAvatarPreview(null)
                            setShowModal(true)
                        }}
                        className="admin-premium-btn flex items-center gap-3 py-4 shadow-xl shadow-indigo-500/20"
                    >
                        <FiPlus size={20} />
                        <span>Add Team Member</span>
                    </button>
                </div>

                <div className="admin-glass-card p-0 overflow-hidden border-indigo-500/10">
                    <div className="p-8 border-b border-white/5 flex items-center gap-4 bg-white/5">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <FiUsers size={20} />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Team Members</h2>
                        <div className="ml-auto flex items-center gap-2">
                            <FiActivity className="text-emerald-500 animate-pulse" size={14} />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{members.length} Members</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-visible">
                        <table className="admin-table w-full">
                            <thead>
                                <tr>
                                    <th className="text-left py-6 px-10 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Member</th>
                                    <th className="text-left py-6 px-10 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Role</th>
                                    <th className="text-left py-6 px-10 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Slug</th>
                                    <th className="text-right py-6 px-10 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {members.map((member, idx) => (
                                    <tr
                                        key={member._id}
                                        className="group hover:bg-white/[0.02] transition-colors animate-dashCardFadeIn"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-14 w-14 flex-shrink-0 relative group">
                                                    <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                                    {member.avatar || member.image ? (
                                                        <img className="h-14 w-14 rounded-2xl object-cover border border-white/10 relative z-10" src={member.avatar || member.image} alt="" />
                                                    ) : (
                                                        <div className={`h-14 w-14 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center justify-center text-indigo-400 font-black text-xl relative z-10 shadow-xl`}>
                                                            {member.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-5">
                                                    <div className="text-base font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{member.name}</div>
                                                    <div className="text-[10px] text-[#64748b] font-black uppercase tracking-[0.1em] mt-0.5">Team Member</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 py-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10 shadow-sm shadow-indigo-500/10">
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap">
                                            <code className="text-[10px] font-mono text-[#64748b] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 group-hover:border-indigo-500/20 transition-colors">/{member.slug || member.memberId}</code>
                                        </td>
                                        <td className="px-10 py-6 whitespace-nowrap text-right overflow-visible">
                                            <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                <button onClick={() => handleEdit(member)} className="w-11 h-11 flex items-center justify-center bg-white/5 text-[#94a3b8] rounded-xl hover:bg-indigo-500 hover:text-white transition-all border border-white/5 active:scale-95" title="Edit Member">
                                                    <FiEdit size={18} />
                                                </button>
                                                <Link to={`/about/${member.slug || member.memberId}`} className="w-11 h-11 flex items-center justify-center bg-white/5 text-[#94a3b8] rounded-xl hover:bg-indigo-500 hover:text-white transition-all border border-white/5 active:scale-95" title="Preview Public">
                                                    <FiExternalLink size={18} />
                                                </Link>
                                                <button onClick={() => handleDelete(member.slug || member._id)} className="w-11 h-11 flex items-center justify-center bg-rose-500/5 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10 active:scale-95" title="Delete Member">
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {members.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-32 text-center bg-white/5 rounded-b-3xl">
                                            <div className="flex flex-col items-center gap-6 opacity-40">
                                                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-[#475569] border border-dashed border-white/10">
                                                    <FiLayers size={40} />
                                                </div>
                                                <div>
                                                    <p className="text-white font-black uppercase tracking-[0.2em] text-sm">No Members Found</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 admin-modal-overlay flex items-center justify-center z-[100] p-4 backdrop-blur-md">
                    <div className="admin-modal-content max-w-lg w-full animate-dashCardFadeIn shadow-[0_0_100px_rgba(79,70,229,0.1)]">
                        <div className="p-12">
                            <div className="flex justify-between items-center mb-12">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                                        {editingMember ? 'Edit' : 'Add'} <span className="text-premium-gradient">Member</span>
                                    </h2>
                                    <p className="text-[#64748b] font-bold uppercase tracking-widest text-[10px] mt-2">Update team member details</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors bg-white/5 rounded-2xl hover:bg-rose-500 transition-all">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 text-left pl-1">Name</label>
                                        <input
                                            type="text"
                                            className="admin-input py-5"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="Member Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 text-left pl-1">Role</label>
                                        <input
                                            type="text"
                                            className="admin-input py-5"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            required
                                            placeholder="Role"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 text-left pl-1">Profile Picture</label>

                                        {/* Avatar Preview */}
                                        {avatarPreview && (
                                            <div className="mb-4 flex items-center gap-4">
                                                <div className="relative group">
                                                    <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur opacity-30"></div>
                                                    <img
                                                        src={avatarPreview}
                                                        alt="Avatar preview"
                                                        className="h-24 w-24 rounded-2xl object-cover border border-white/10 relative z-10"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAvatarFile(null)
                                                        setAvatarPreview(null)
                                                    }}
                                                    className="px-4 py-2 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}

                                        {/* File Upload Input */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="block w-full py-6 px-6 bg-white/5 border-2 border-dashed border-indigo-500/20 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-indigo-500/40 transition-all group"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                                        <FiUpload size={24} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-white uppercase tracking-wide">
                                                            {avatarFile ? avatarFile.name : 'Click to upload profile picture'}
                                                        </p>
                                                        <p className="text-[10px] text-[#64748b] uppercase tracking-wider mt-1">
                                                            PNG, JPG up to 10MB
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-3 text-left pl-1">Slug</label>
                                        <input
                                            type="text"
                                            className="admin-input py-5 font-mono"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            required
                                            placeholder="slug"
                                            disabled={!!editingMember}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-1 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {uploading ? 'Uploading...' : (editingMember ? 'Save Changes' : 'Add Member')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-10 py-5 bg-white/5 text-[#94a3b8] rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-white/10 border border-white/5"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default AdminTeam
