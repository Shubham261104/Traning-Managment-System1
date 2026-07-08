import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { FiMail, FiLock, FiUser, FiPhone, FiArrowRight, FiShield, FiCommand, FiCheckCircle } from 'react-icons/fi'
import axios from 'axios'
import './Login.css'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'student'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Email verification state
  const [emailVerifyStep, setEmailVerifyStep] = useState(false)
  const [verificationOtp, setVerificationOtp] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendStatus, setResendStatus] = useState('')
  
  const { register, verifyEmail } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-gray-300', percent: '0%' }
    let score = 0
    if (pwd.length >= 6) score++
    if (pwd.length >= 10) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    
    if (score < 2) return { score, label: 'Weak 🔴', color: '#ef4444', percent: '33%' }
    if (score < 4) return { score, label: 'Medium 🟡', color: '#eab308', percent: '66%' }
    return { score, label: 'Strong 🟢', color: '#10b981', percent: '100%' }
  }

  const strength = getPasswordStrength(formData.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Enforce weak password prevention
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    try {
      const userObj = await register(formData)
      if (!userObj.isEmailVerified) {
        setEmailVerifyStep(true)
      } else {
        navigate(`/${userObj.role}`)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setVerifyError('')
    setVerifyLoading(true)
    
    try {
      const updatedUser = await verifyEmail(formData.email, verificationOtp)
      navigate(`/${updatedUser.role}`)
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'OTP verification failed. Please check the code.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setResendStatus('')
    try {
      await axios.post('/api/auth/resend-verification', { email: formData.email })
      setResendStatus('A new verification code has been sent!')
    } catch (err) {
      setResendStatus(err.response?.data?.message || 'Failed to resend code. Try again later.')
    }
  }

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="bg-mesh">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Top Navigation Links */}
      <div className="nav-links">
        <Link to="/about" className="nav-link">About Us</Link>
        <Link to="/contact" className="nav-link">Contact Us</Link>
      </div>

      <main className="login-container" style={{ maxWidth: '1100px' }}>
        {/* Left Side: Illustration */}
        <section className="login-visual">
          <img
            src="/login-bg.png"
            alt="SkillBridge Platform"
            className="visual-image"
          />
        </section>

        {/* Right Side: Form */}
        <section className="login-form-side" style={{ padding: '2.5rem 3rem' }}>
          <div className="login-logo mb-6">
            <Link to="/" className="flex items-center gap-2">
              <FiCommand size={32} className="text-blue-500" />
              <span className="text-2xl font-black text-white tracking-tight">SkillBridge</span>
            </Link>
          </div>

          {!emailVerifyStep ? (
            <>
              <div className="login-header">
                <h1>Create Account</h1>
                <p>Get started with your SkillBridge account</p>
              </div>

              {error && (
                <div className="error-alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-grid two-cols">
                  <div className="input-group">
                    <label htmlFor="firstName">First Name</label>
                    <div className="input-wrapper">
                      <FiUser className="input-icon" size={20} />
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="lastName">Last Name</label>
                    <div className="input-wrapper">
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        style={{ paddingLeft: '1rem' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <FiMail className="input-icon" size={20} />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid two-cols">
                  <div className="input-group">
                    <label htmlFor="phone">Phone Number</label>
                    <div className="input-wrapper">
                      <FiPhone className="input-icon" size={20} />
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 1234567890"
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="role">I am a...</label>
                    <div className="input-wrapper">
                      <FiShield className="input-icon" size={20} />
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        style={{ paddingLeft: '3rem' }}
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" size={20} />
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Password Strength:</span>
                        <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: strength.percent,
                            backgroundColor: strength.color,
                            transition: 'width 0.3s ease'
                          }}
                          className="h-full"
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-login"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account <FiArrowRight />
                    </span>
                  )}
                </button>
              </form>

              <div className="login-footer">
                <p>
                  Already have an account?
                  <Link to="/login">Sign In</Link>
                </p>
              </div>
            </>
          ) : (
            // Email Verification Step View
            <>
              <div className="login-header">
                <FiCheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <h1>Verify Your Email</h1>
                <p>We've sent a 6-digit verification code to <strong>{formData.email}</strong>. Please enter it below to activate your account.</p>
              </div>

              {verifyError && (
                <div className="error-alert">
                  {verifyError}
                </div>
              )}

              {resendStatus && (
                <div className="success-alert" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
                  {resendStatus}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="input-group">
                  <label htmlFor="otp">Verification Code (6-digit)</label>
                  <div className="input-wrapper">
                    <FiShield className="input-icon" size={20} />
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={verificationOtp}
                      onChange={(e) => setVerificationOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="btn-login"
                >
                  {verifyLoading ? 'Verifying OTP...' : 'Verify & Continue'}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-gray-400">
                <p>Didn't receive the email code?</p>
                <button
                  onClick={handleResendOtp}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', outline: 'none', padding: '0.5rem 0', fontWeight: 'bold' }}
                >
                  Resend Code
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default Register
