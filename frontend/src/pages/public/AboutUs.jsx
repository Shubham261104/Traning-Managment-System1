import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FiUsers, FiBook, FiAward, FiCheck, FiArrowRight, FiCommand } from 'react-icons/fi'
import './AboutUs.css'

const AboutUs = () => {
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await axios.get('/api/team')
                if (res.data.length === 0) {
                    await axios.post('/api/team/seed')
                    const seedRes = await axios.get('/api/team')
                    setMembers(seedRes.data)
                } else {
                    setMembers(res.data)
                }
            } catch (error) {
                console.error('Error fetching team:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchMembers()
    }, [])

    const highlights = [
        { icon: FiUsers, title: 'Intelligent Role Access', desc: 'Enterprise-grade security portals tailored specifically for Admins, Instructors, and Students.' },
        { icon: FiBook, title: 'Dynamic Learning', desc: 'Powerful, intuitive tools to build, manage, and scale engaging courses effortlessly.' },
        { icon: FiAward, title: 'Automated Excellence', desc: 'Precision-driven certificate generation to validate success and professional growth.' },
        { icon: FiCheck, title: 'Real-time Insight', desc: 'High-performance interactive quizzes with instant algorithmic feedback and analytics.' }
    ]

    return (
        <div className="about-page">
            {/* Animated Background */}
            <div className="bg-mesh">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Premium Sticky Navigation */}
            <nav className="public-nav">
                <Link to="/" className="nav-logo flex items-center gap-2">
                    <FiCommand className="text-blue-500" />
                    <span>SkillBridge</span>
                </Link>
                <div className="nav-links-container">
                    <Link to="/about" className="nav-item">About</Link>
                    <Link to="/contact" className="nav-item">Contact</Link>
                    <Link to="/login" className="nav-item">Login</Link>
                    <Link to="/register" className="nav-item bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors">Sign Up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="about-hero">
                <div className="hero-tag">The Future of Education</div>
                <h1>We’re Bridging the Gap in Digital Learning</h1>
                <p>
                    SkillBridge is a state-of-the-art ecosystem designed to transform how knowledge is shared.
                    We empower educators and inspire learners through modern, high-performance technology.
                </p>
            </header>

            {/* Highlights Section */}
            <section className="highlights-container">
                <div className="highlights-grid">
                    {highlights.map((item, idx) => (
                        <div key={idx} className="glass-card highlight-item reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="icon-box">
                                <item.icon size={28} />
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Creators Section */}
            <section className="team-section">
                <div className="section-header reveal">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Meet the Visionaries</h2>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto">The engineering and design team behind the SkillBridge experience.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <div className="team-grid">
                        {members.map((member, idx) => (
                            <div key={member.memberId} className="glass-card team-card reveal" style={{ animationDelay: `${idx * 0.15}s` }}>
                                <div className="card-banner"></div>
                                <div className="card-info">
                                    <div className="profile-img-container">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt={member.name} />
                                        ) : (
                                            <div className="avatar-initial">{member.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <h3>{member.name}</h3>
                                    <div className="member-role">{member.role}</div>
                                    <p className="member-bio">{member.description || member.about}</p>
                                    <Link to={`/about/${member.memberId}`} className="btn-profile">
                                        Professional Profile <FiArrowRight />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Call to Action */}
            <section className="footer-cta reveal">
                <div className="cta-box">
                    <h2 className="text-4xl font-bold mb-6">Start Your Learning Legacy</h2>
                    <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto">
                        Join thousands of students and instructors already leveraging the power of SkillBridge.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <Link to="/register" className="btn-cta">Get Started </Link>
                        <Link to="/contact" className="px-8 py-3.5 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-colors">Contact Expert</Link>
                    </div>
                </div>
            </section>

            {/* Sticky Footer */}
            <footer className="py-12 border-t border-white/5 text-center text-gray-500 relative z-10 bg-black/20">
                <div className="flex justify-center gap-8 mb-4">
                    <Link to="/about" className="hover:text-white transition-colors">About</Link>
                    <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                </div>
                <p>© 2025 SkillBridge Inc. All rights reserved.</p>
            </footer>
        </div>
    )
}

export default AboutUs
