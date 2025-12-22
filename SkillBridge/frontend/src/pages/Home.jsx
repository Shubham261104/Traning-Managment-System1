import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FiCommand, FiArrowRight, FiMail, FiPhone, FiMapPin, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi'
import './Home.css'


const Home = () => {
    const [members, setMembers] = useState([])
    const [loadingTeam, setLoadingTeam] = useState(true)

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await axios.get('/api/team')
                console.log('Team API Response:', res.data)

                if (!res.data || res.data.length === 0) {
                    console.log('No team data, attempting to seed...')
                    try {
                        await axios.post('/api/team/seed')
                        const seedRes = await axios.get('/api/team')
                        console.log('Seeded team data:', seedRes.data)
                        setMembers(seedRes.data)
                    } catch (seedError) {
                        console.error('Seed error:', seedError)
                        // Use fallback data if seeding fails
                        setMembers([
                            {
                                memberId: 'shubham-kumar',
                                name: 'Shubham Kumar',
                                role: 'Full Stack Developer',
                                description: 'Passionate developer with expertise in MERN stack and cloud architecture.',
                            },
                            {
                                memberId: 'amrit-raj',
                                name: 'Amrit Raj',
                                role: 'Frontend Architect',
                                description: 'Creative UI/UX specialist focused on crafting intuitive user experiences.',
                            },
                            {
                                memberId: 'harsh-kumar',
                                name: 'Harsh Kumar',
                                role: 'Database Engineer',
                                description: 'Expert in database optimization and full-stack integration.',
                            }
                        ])
                    }
                } else {
                    setMembers(res.data)
                }
            } catch (error) {
                console.error('Error fetching team:', error)
                // Use fallback data if API fails
                setMembers([
                    {
                        memberId: 'shubham-kumar',
                        name: 'Shubham Kumar',
                        role: 'Full Stack Developer',
                        description: 'Passionate developer with expertise in MERN stack and cloud architecture.',
                    },
                    {
                        memberId: 'amrit-raj',
                        name: 'Amrit Raj',
                        role: 'Frontend Architect',
                        description: 'Creative UI/UX specialist focused on crafting intuitive user experiences.',
                    },
                    {
                        memberId: 'harsh-kumar',
                        name: 'Harsh Kumar',
                        role: 'Database Engineer',
                        description: 'Expert in database optimization and full-stack integration.',
                    }
                ])
            } finally {
                setLoadingTeam(false)
            }
        }
        fetchMembers()
    }, [])

    return (
        <div className="home-page">
            {/* Animated Background */}
            <div className="bg-mesh">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Navigation Bar */}
            <nav className="home-nav">
                <div className="nav-container">
                    <Link to="/" className="logo">
                        <FiCommand size={32} className="logo-icon" />
                        <span className="logo-text">SkillBridge</span>
                    </Link>
                    <div className="nav-actions">
                        <a href="#about" className="nav-link">About</a>
                        <a href="#contact" className="nav-link">Contact</a>
                        <Link to="/login" className="btn-login-nav">
                            Login <FiArrowRight />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        Welcome to SkillBridge
                    </div>
                    <h1 className="hero-title">
                        Bridging Gaps in Knowledge,
                        <span className="gradient-text"> Empowering Futures</span>
                    </h1>
                    <p className="hero-description">
                        Transform your learning journey with our comprehensive training center management system.
                        Connect with expert instructors, access premium courses, and achieve your goals.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/login" className="btn-primary">
                            Get Started <FiArrowRight />
                        </Link>
                        <Link to="/register" className="btn-secondary">
                            Create Account
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <h3>500+</h3>
                            <p>Active Students</p>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <h3>50+</h3>
                            <p>Expert Instructors</p>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <h3>100+</h3>
                            <p>Courses Available</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">About Us</span>
                        <h2 className="section-title">Transforming Education Through Technology</h2>
                        <p className="section-description">
                            SkillBridge is your comprehensive training center management platform,
                            designed to connect learners with world-class education.
                        </p>
                    </div>

                    <div className="about-grid">
                        <div className="about-card">
                            <div className="card-icon">📚</div>
                            <h3>Quality Education</h3>
                            <p>Access courses designed by industry experts with real-world applications and hands-on projects.</p>
                        </div>
                        <div className="about-card">
                            <div className="card-icon">🎯</div>
                            <h3>Personalized Learning</h3>
                            <p>Track your progress, take quizzes, and receive certificates upon course completion.</p>
                        </div>
                        <div className="about-card">
                            <div className="card-icon">👥</div>
                            <h3>Expert Instructors</h3>
                            <p>Learn from experienced professionals who are passionate about sharing their knowledge.</p>
                        </div>
                        <div className="about-card">
                            <div className="card-icon">🚀</div>
                            <h3>Modern Platform</h3>
                            <p>Enjoy a seamless learning experience with our cutting-edge technology and user-friendly interface.</p>
                        </div>
                    </div>

                    <div className="about-features">
                        <div className="feature-image">
                            <div className="image-placeholder">
                                <div className="placeholder-icon">🎓</div>
                            </div>
                        </div>
                        <div className="feature-content">
                            <h3>Why Choose SkillBridge?</h3>
                            <ul className="feature-list">
                                <li>
                                    <span className="check-icon">✓</span>
                                    <div>
                                        <strong>Comprehensive Course Management</strong>
                                        <p>Organize and access all your courses in one place</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <div>
                                        <strong>Interactive Quizzes & Assessments</strong>
                                        <p>Test your knowledge and track your progress</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <div>
                                        <strong>Digital Certificates</strong>
                                        <p>Earn recognized certificates upon completion</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="check-icon">✓</span>
                                    <div>
                                        <strong>Real-time Notifications</strong>
                                        <p>Stay updated with announcements and course updates</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Team Section */}
                    <div className="team-subsection">
                        <div className="section-header" style={{ marginTop: '5rem' }}>
                            <span className="section-badge">Our Team</span>
                            <h2 className="section-title">Meet the Visionaries</h2>
                            <p className="section-description">
                                The talented team behind SkillBridge who are dedicated to revolutionizing education.
                            </p>
                        </div>

                        {loadingTeam ? (
                            <div className="team-loading">
                                <div className="spinner"></div>
                                <p>Loading team members...</p>
                            </div>
                        ) : (
                            <div className="team-grid">
                                {members.slice(0, 4).map((member, idx) => (
                                    <div key={member.memberId || idx} className="team-card">
                                        <div className="team-card-banner"></div>
                                        <div className="team-card-content">
                                            <div className="team-avatar">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.name} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="team-member-name">{member.name}</h3>
                                            <div className="team-member-role">{member.role}</div>
                                            <p className="team-member-bio">
                                                {member.description || member.about || 'Passionate about transforming education through technology.'}
                                            </p>
                                            <Link to={`/about/${member.memberId}`} className="btn-view-profile">
                                                View Profile <FiArrowRight />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loadingTeam && members.length > 4 && (
                            <div className="team-view-all">
                                <Link to="/about" className="btn-view-all">
                                    View All Team Members <FiArrowRight />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="contact-section">
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-badge">Contact Us</span>
                        <h2 className="section-title">Get in Touch</h2>
                        <p className="section-description">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    <div className="contact-grid">
                        <div className="contact-info">
                            <div className="contact-card">
                                <div className="contact-icon">
                                    <FiMail />
                                </div>
                                <h4>Email Us</h4>
                                <p>support@skillbridge.com</p>
                                <p>info@skillbridge.com</p>
                            </div>
                            <div className="contact-card">
                                <div className="contact-icon">
                                    <FiPhone />
                                </div>
                                <h4>Call Us</h4>
                                <p>+1 (555) 123-4567</p>
                                <p>Mon-Fri, 9am-6pm EST</p>
                            </div>
                            <div className="contact-card">
                                <div className="contact-icon">
                                    <FiMapPin />
                                </div>
                                <h4>Visit Us</h4>
                                <p>123 Learning Street</p>
                                <p>Education City, EC 12345</p>
                            </div>
                        </div>

                        <div className="contact-form-wrapper">
                            <form className="contact-form">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        placeholder="How can we help?"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows="5"
                                        placeholder="Tell us more about your inquiry..."
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn-submit">
                                    Send Message <FiArrowRight />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <Link to="/" className="footer-logo">
                                <FiCommand size={28} />
                                <span>SkillBridge</span>
                            </Link>
                            <p>Empowering futures through modern learning solutions.</p>
                            <div className="social-links">
                                <a href="#" aria-label="GitHub"><FiGithub /></a>
                                <a href="#" aria-label="Twitter"><FiTwitter /></a>
                                <a href="#" aria-label="LinkedIn"><FiLinkedin /></a>
                            </div>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Platform</h4>
                                <Link to="/login">Login</Link>
                                <Link to="/register">Register</Link>
                                <Link to="/about">About Us</Link>
                                <Link to="/contact">Contact</Link>
                            </div>
                            <div className="footer-column">
                                <h4>Legal</h4>
                                <Link to="/privacy">Privacy Policy</Link>
                                <Link to="/terms">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2025 SkillBridge. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home
