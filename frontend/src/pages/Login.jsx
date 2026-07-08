import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { FiMail, FiLock, FiArrowRight, FiCommand, FiShield, FiArrowLeft } from 'react-icons/fi'
import { FaGoogle } from 'react-icons/fa'
import WelcomeScreen from '../components/WelcomeScreen'
import axios from 'axios'
import './Login.css'

// =========================================================
// NOTE: Real Google OAuth requires a valid GOOGLE_CLIENT_ID
// configured in both backend/.env and frontend/.env (as
// VITE_GOOGLE_CLIENT_ID). Until then, use the dev simulation.
// =========================================================

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showWelcome, setShowWelcome] = useState(false)
    const [loggedInUser, setLoggedInUser] = useState(null)

    // 2FA state
    const [twoFactorRequired, setTwoFactorRequired] = useState(false)
    const [twoFactorOtp, setTwoFactorOtp] = useState('')
    const [twoFactorError, setTwoFactorError] = useState('')
    const [twoFactorLoading, setTwoFactorLoading] = useState(false)
    const [twoFactorEmail, setTwoFactorEmail] = useState('')

    // Forgot Password state
    const [forgotPasswordStep, setForgotPasswordStep] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    const [resetOtp, setResetOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [forgotError, setForgotError] = useState('')
    const [forgotLoading, setForgotLoading] = useState(false)
    const [forgotStatus, setForgotStatus] = useState('')

    // Dev simulation Google modal state
    const [showDevGoogleModal, setShowDevGoogleModal] = useState(false)
    const [devGoogleEmail, setDevGoogleEmail] = useState('')
    const [devGoogleRole, setDevGoogleRole] = useState('student')

    const { login, verify2FA, googleLogin } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { color: '#6b7280', label: '', percent: '0%' }
        let score = 0
        if (pwd.length >= 6) score++
        if (pwd.length >= 10) score++
        if (/[A-Z]/.test(pwd)) score++
        if (/[0-9]/.test(pwd)) score++
        if (/[^A-Za-z0-9]/.test(pwd)) score++
        if (score < 2) return { color: '#ef4444', label: 'Weak 🔴', percent: '33%' }
        if (score < 4) return { color: '#eab308', label: 'Medium 🟡', percent: '66%' }
        return { color: '#10b981', label: 'Strong 🟢', percent: '100%' }
    }
    const resetStrength = getPasswordStrength(newPassword)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const rawRes = await login(formData.email, formData.password)
            if (rawRes?.twoFactorRequired) {
                setTwoFactorEmail(rawRes.email)
                setTwoFactorRequired(true)
                setLoading(false)
            } else if (rawRes) {
                setLoggedInUser(rawRes)
                setShowWelcome(true)
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
            setLoading(false)
        }
    }

    const handleVerify2FA = async (e) => {
        e.preventDefault()
        setTwoFactorError('')
        setTwoFactorLoading(true)
        try {
            const user = await verify2FA(twoFactorEmail, twoFactorOtp)
            setLoggedInUser(user)
            setShowWelcome(true)
        } catch (err) {
            setTwoFactorError(err.response?.data?.message || 'Invalid 2FA OTP. Check your email.')
        } finally {
            setTwoFactorLoading(false)
        }
    }

    const handleForgotRequest = async (e) => {
        e.preventDefault()
        setForgotError('')
        setForgotLoading(true)
        setForgotStatus('')
        try {
            const res = await axios.post('/api/auth/forgot-password', { email: forgotEmail })
            setForgotStatus(res.data.message)
            setForgotPasswordStep('reset')
        } catch (err) {
            setForgotError(err.response?.data?.message || 'Something went wrong. Check your email address.')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleResetSubmit = async (e) => {
        e.preventDefault()
        setForgotError('')
        setForgotLoading(true)
        if (newPassword.length < 6) {
            setForgotError('New password must be at least 6 characters.')
            setForgotLoading(false)
            return
        }
        try {
            const res = await axios.post('/api/auth/reset-password', { email: forgotEmail, otp: resetOtp, newPassword })
            alert(res.data.message)
            setForgotPasswordStep(false)
            setNewPassword('')
            setResetOtp('')
            setFormData({ ...formData, email: forgotEmail })
        } catch (err) {
            setForgotError(err.response?.data?.message || 'Failed to reset. Verify your OTP and try again.')
        } finally {
            setForgotLoading(false)
        }
    }

    // Dev simulation Google login - builds mock token matching backend's mock parser
    const handleDevGoogleLogin = async (e) => {
        e.preventDefault()
        if (!devGoogleEmail) return
        setShowDevGoogleModal(false)
        setError('')
        setLoading(true)

        const googleId = `google_${Date.now()}`
        const namePart = devGoogleEmail.split('@')[0] || 'Google'
        // Format: mock_token_success_{email}_{googleId}_{firstName}_User
        const mockToken = `mock_token_success_${devGoogleEmail.toLowerCase()}_${googleId}_${namePart}`

        try {
            const user = await googleLogin(mockToken, devGoogleRole)
            setLoggedInUser(user)
            setShowWelcome(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Google simulation login failed.')
            setLoading(false)
        }
    }

    const handleWelcomeComplete = () => {
        if (loggedInUser) navigate(`/${loggedInUser.role}`)
    }

    // Check if a real Google Client ID is configured
    const hasRealGoogleClientId = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID &&
        !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('dummy'))

    return (
        <div className="login-page">
            {showWelcome && loggedInUser && (
                <WelcomeScreen
                    userName={
                        loggedInUser.profile
                            ? `${loggedInUser.profile.firstName} ${loggedInUser.profile.lastName}`.trim()
                            : loggedInUser.email?.split('@')[0] || 'User'
                    }
                    onComplete={handleWelcomeComplete}
                />
            )}

            <div className="bg-mesh">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <main className="login-container">
                <section className="login-visual">
                    <img src="/login-bg.png" alt="SkillBridge Platform" className="visual-image" />
                </section>

                <section className="login-form-side">
                    <div className="login-logo mb-8">
                        <Link to="/" className="flex items-center gap-2">
                            <FiCommand size={32} className="text-blue-500" />
                            <span className="text-2xl font-black text-white tracking-tight">SkillBridge</span>
                        </Link>
                    </div>

                    {/* ========= 2FA VIEW ========= */}
                    {twoFactorRequired ? (
                        <>
                            <div className="login-header">
                                <FiShield size={48} className="text-blue-500 mx-auto mb-4" />
                                <h1>2-Factor Verification</h1>
                                <p>We've sent a 6-digit OTP to <strong>{twoFactorEmail}</strong>. Enter it below.</p>
                            </div>
                            {twoFactorError && <div className="error-alert">{twoFactorError}</div>}
                            <form onSubmit={handleVerify2FA} className="space-y-6">
                                <div className="input-group">
                                    <label htmlFor="otp">OTP Code</label>
                                    <div className="input-wrapper">
                                        <FiShield className="input-icon" size={20} />
                                        <input id="otp" type="text" maxLength={6}
                                            value={twoFactorOtp}
                                            onChange={(e) => setTwoFactorOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                            placeholder="123456"
                                            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px' }} required />
                                    </div>
                                </div>
                                <button type="submit" disabled={twoFactorLoading} className="btn-login">
                                    {twoFactorLoading ? 'Verifying...' : 'Verify & Sign In'}
                                </button>
                                <button type="button" onClick={() => setTwoFactorRequired(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.875rem', width: '100%', marginTop: '1rem' }}>
                                    <FiArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} /> Back to Sign In
                                </button>
                            </form>
                        </>

                    /* ========= FORGOT PASSWORD: EMAIL STEP ========= */
                    ) : forgotPasswordStep === 'request' ? (
                        <>
                            <div className="login-header">
                                <h1>Forgot Password</h1>
                                <p>Enter your registered email. We'll send an OTP to reset your password.</p>
                            </div>
                            {forgotError && <div className="error-alert">{forgotError}</div>}
                            <form onSubmit={handleForgotRequest} className="space-y-6">
                                <div className="input-group">
                                    <label htmlFor="forgotEmail">Email Address</label>
                                    <div className="input-wrapper">
                                        <FiMail className="input-icon" size={20} />
                                        <input id="forgotEmail" type="email" value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="name@company.com" required />
                                    </div>
                                </div>
                                <button type="submit" disabled={forgotLoading} className="btn-login">
                                    {forgotLoading ? 'Sending...' : 'Send Reset OTP'}
                                </button>
                                <button type="button" onClick={() => setForgotPasswordStep(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.875rem', width: '100%', marginTop: '1rem' }}>
                                    <FiArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} /> Back to Sign In
                                </button>
                            </form>
                        </>

                    /* ========= FORGOT PASSWORD: RESET STEP ========= */
                    ) : forgotPasswordStep === 'reset' ? (
                        <>
                            <div className="login-header">
                                <h1>Reset Password</h1>
                                <p>Enter the OTP sent to your email and set a new password.</p>
                            </div>
                            {forgotError && <div className="error-alert">{forgotError}</div>}
                            {forgotStatus && (
                                <div style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
                                    {forgotStatus}
                                </div>
                            )}
                            <form onSubmit={handleResetSubmit} className="space-y-4">
                                <div className="input-group">
                                    <label htmlFor="resetOtp">OTP Code</label>
                                    <div className="input-wrapper">
                                        <FiShield className="input-icon" size={20} />
                                        <input id="resetOtp" type="text" maxLength={6} value={resetOtp}
                                            onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                            placeholder="123456" style={{ textAlign: 'center', letterSpacing: '4px' }} required />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <div className="input-wrapper">
                                        <FiLock className="input-icon" size={20} />
                                        <input id="newPassword" type="password" value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••" required />
                                    </div>
                                    {newPassword && (
                                        <div className="mt-2 text-xs">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-gray-400">Strength:</span>
                                                <span style={{ color: resetStrength.color, fontWeight: 'bold' }}>{resetStrength.label}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                                <div style={{ width: resetStrength.percent, backgroundColor: resetStrength.color, transition: 'width 0.3s ease' }} className="h-full"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button type="submit" disabled={forgotLoading} className="btn-login">
                                    {forgotLoading ? 'Resetting...' : 'Set New Password'}
                                </button>
                                <button type="button" onClick={() => setForgotPasswordStep('request')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.875rem', width: '100%', marginTop: '1rem' }}>
                                    <FiArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} /> Re-request OTP
                                </button>
                            </form>
                        </>

                    /* ========= NORMAL LOGIN VIEW ========= */
                    ) : (
                        <>
                            <div className="login-header">
                                <h1>Welcome Back</h1>
                                <p>Sign in to your SkillBridge account</p>
                            </div>

                            {error && <div className="error-alert">{error}</div>}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="input-group">
                                    <label htmlFor="email">Email Address</label>
                                    <div className="input-wrapper">
                                        <FiMail className="input-icon" size={20} />
                                        <input id="email" type="email" name="email"
                                            value={formData.email} onChange={handleChange}
                                            placeholder="name@company.com" autoComplete="email" required />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="password" className="mb-0">Password</label>
                                        <button type="button" onClick={() => setForgotPasswordStep('request')}
                                            style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}>
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="input-wrapper">
                                        <FiLock className="input-icon" size={20} />
                                        <input id="password" type="password" name="password"
                                            value={formData.password} onChange={handleChange}
                                            placeholder="••••••••" autoComplete="current-password" required />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="btn-login">
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">Sign In <FiArrowRight /></span>
                                    )}
                                </button>
                            </form>

                            {/* Separator */}
                            <div className="flex items-center my-6">
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                                <span className="px-3 text-xs text-gray-500 uppercase tracking-widest font-bold">Or continue with</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                            </div>

                            {/* Google Login Button */}
                            <button
                                type="button"
                                onClick={() => setShowDevGoogleModal(true)}
                                disabled={loading}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '10px', backgroundColor: '#fff', color: '#1f1f1f', border: '1px solid #dadce0',
                                    borderRadius: '4px', padding: '10px 16px', fontWeight: '500', fontSize: '14px',
                                    cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'sans-serif'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                            >
                                <FaGoogle style={{ color: '#DB4437', fontSize: '18px' }} />
                                Sign in with Google
                            </button>

                            {!hasRealGoogleClientId && (
                                <p style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                                    ⚠️ Dev mode: Configure <code>VITE_GOOGLE_CLIENT_ID</code> for real Google Sign-In
                                </p>
                            )}

                            <div className="login-footer">
                                <p>
                                    Don't have an account?
                                    <Link to="/register">Create Account</Link>
                                </p>
                            </div>
                        </>
                    )}
                </section>
            </main>

            {/* ========= DEV GOOGLE SIMULATION MODAL ========= */}
            {showDevGoogleModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
                    <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '420px', color: '#f1f5f9', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <FaGoogle style={{ color: '#DB4437', fontSize: '22px' }} />
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Sign in with Google</h2>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.6, backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', padding: '10px', borderRadius: '8px' }}>
                            🔧 <strong>Dev Mode</strong> — Real Google Sign-In requires a valid Client ID in<br />
                            <code style={{ fontSize: '11px' }}>backend/.env → GOOGLE_CLIENT_ID</code><br />
                            <code style={{ fontSize: '11px' }}>frontend/.env → VITE_GOOGLE_CLIENT_ID</code>
                        </p>

                        <form onSubmit={handleDevGoogleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                                    Google Account Email
                                </label>
                                <input
                                    type="email"
                                    value={devGoogleEmail}
                                    onChange={(e) => setDevGoogleEmail(e.target.value)}
                                    placeholder="yourname@gmail.com"
                                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                                    Account Role
                                </label>
                                <select
                                    value={devGoogleRole}
                                    onChange={(e) => setDevGoogleRole(e.target.value)}
                                    style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px', padding: '10px 14px', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                                >
                                    <option value="student">Student</option>
                                    <option value="instructor">Instructor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowDevGoogleModal(false)}
                                    style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                    Cancel
                                </button>
                                <button type="submit"
                                    style={{ flex: 2, padding: '10px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <FaGoogle /> Continue as Google User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Login
