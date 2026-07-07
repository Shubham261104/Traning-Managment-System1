import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { FiMail, FiLock, FiUser, FiPhone, FiArrowRight, FiShield, FiCommand } from 'react-icons/fi'
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
  const { register } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await register(formData)
      navigate(`/${user.role}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
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
          <div className="visual-content">
            {/* <h2>Join SkillBridge</h2>
            <p>Start your journey with us today and unlock a world of knowledge and professional growth.</p> */}
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="login-form-side" style={{ padding: '2.5rem 3rem' }}>
          <div className="login-logo mb-6">
            <Link to="/" className="flex items-center gap-2">
              <FiCommand size={32} className="text-blue-500" />
              <span className="text-2xl font-black text-gray-900 tracking-tight">SkillBridge</span>
            </Link>
          </div>
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
        </section>
      </main>
    </div>
  )
}

export default Register
