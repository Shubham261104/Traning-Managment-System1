import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { FiMail, FiLock, FiArrowRight, FiCommand } from 'react-icons/fi'
import WelcomeScreen from '../components/WelcomeScreen'
import './Login.css'

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showWelcome, setShowWelcome] = useState(false)
    const [loggedInUser, setLoggedInUser] = useState(null)
    const { login } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const user = await login(formData.email, formData.password)
            console.log('Logged in user:', user)
            console.log('User profile:', user.profile)
            setLoggedInUser(user)
            setShowWelcome(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
            setLoading(false)
        }
    }

    const handleWelcomeComplete = () => {
        if (loggedInUser) {
            navigate(`/${loggedInUser.role}`)
        }
    }

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
            {/* Animated Background */}
            <div className="bg-mesh">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <main className="login-container">
                {/* Left Side: Illustration */}
                <section className="login-visual">
                    <img
                        src="/login-bg.png"
                        alt="SkillBridge Platform"
                        className="visual-image"
                    />
                    <div className="visual-content">
                        {/* <h2>SkillBridge</h2>
                        <p>Bridging gaps in knowledge, empowering futures through modern learning solutions.</p> */}
                    </div>
                </section>

                {/* Right Side: Form */}
                <section className="login-form-side">
                    <div className="login-logo mb-8">
                        <Link to="/" className="flex items-center gap-2">
                            <FiCommand size={32} className="text-blue-500" />
                            <span className="text-2xl font-black text-white tracking-tight">SkillBridge</span>
                        </Link>
                    </div>
                    <div className="login-header">
                        <h1>Welcome Back</h1>
                        <p>Sign in to your SkillBridge account</p>
                    </div>

                    {error && (
                        <div className="error-alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    autoComplete="email"
                                    required
                                />
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
                                    autoComplete="current-password"
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
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Sign In <FiArrowRight />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            Don't have an account?
                            <Link to="/register">Create Account</Link>
                        </p>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default Login
