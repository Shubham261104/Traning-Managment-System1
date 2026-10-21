import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FiCommand, FiArrowRight, FiMail, FiPhone, FiMapPin, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi'
import './Home.css'


const Home = () => {
    const [members, setMembers] = useState([])
    const [loadingTeam, setLoadingTeam] = useState(true)

    useEffect(() => {
        const shubhamFallback = {
            memberId: 'shubham-kumar',
            name: 'Shubham Kumar',
            role: 'Founder & Lead Architect',
            description: 'Passionate developer with expertise in MERN stack, cloud architecture, and system design. Architected the SkillBridge platform.',
            about: 'A dedicated Full Stack Developer with deep knowledge of MERN stack. Shubham architected the entire backend system & frontend experience of SkillBridge, ensuring high scalability, modern UX, and robust security.',
            skills: ['MERN Stack', 'Node.js', 'Express', 'MongoDB', 'React.js', 'System Architecture', 'Cloud Deployment'],
            linkedin: 'https://www.linkedin.com/in/shubham260606/',
            github: 'https://github.com/Shubham261104'
        }

        const fetchMembers = async () => {
            try {
                const res = await axios.get('/api/team')
                console.log('Team API Response:', res.data)

                if (!res.data || res.data.length === 0) {
                    console.log('No team data, attempting to seed...')
                    try {
                        await axios.post('/api/team/seed')
                        const seedRes = await axios.get('/api/team')
                        const shubham = seedRes.data.filter(m => m.name.toLowerCase().includes('shubham') || m.memberId === 'shubham-kumar')
                        setMembers(shubham.length > 0 ? shubham : [shubhamFallback])
                    } catch (seedError) {
                        console.error('Seed error:', seedError)
                        setMembers([shubhamFallback])
                    }
                } else {
                    const shubham = res.data.filter(m => m.name.toLowerCase().includes('shubham') || m.memberId === 'shubham-kumar')
                    setMembers(shubham.length > 0 ? shubham : [shubhamFallback])
                }
            } catch (error) {
                console.error('Error fetching team:', error)
                setMembers([shubhamFallback])
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

                    {/* Visionary Section */}
                    <div className="team-subsection">
                        <div className="section-header" style={{ marginTop: '5rem' }}>
                            <span className="section-badge">Project Visionary</span>
                            <h2 className="section-title">Meet the Visionary</h2>
                            <p className="section-description">
                                “Turning ideas into powerful digital learning experiences.”
                            </p>
                        </div>

                        {/* 3 Highlights Cards */}
                        <div className="visionary-highlights-grid">
                            <div className="v-highlight-card">
                                <div className="v-highlight-icon">💡</div>
                                <h3>Vision</h3>
                                <p>To create a unified platform that makes training management simple, smart, and accessible.</p>
                            </div>
                            <div className="v-highlight-card">
                                <div className="v-highlight-icon">⚡</div>
                                <h3>Innovation</h3>
                                <p>Combining modern web technologies with analytics, collaboration, automation, and AI-powered learning tools.</p>
                            </div>
                            <div className="v-highlight-card">
                                <div className="v-highlight-icon">🎯</div>
                                <h3>Mission</h3>
                                <p>Empowering students, instructors, and administrators with technology that improves the complete learning journey.</p>
                            </div>
                        </div>

                        {/* Profile Showcase Card (Without Photo) */}
                        <div className="visionary-showcase-container">
                            <div className="visionary-card-sleek">
                                <div className="visionary-header-row">
                                    <div className="visionary-title-wrap">
                                        <div className="visionary-icon-badge">👨‍💻</div>
                                        <div>
                                            <h3 className="visionary-name-clean">Shubham Kumar</h3>
                                            <span className="visionary-role-tag">Project Lead & Full-Stack Developer</span>
                                        </div>
                                    </div>
                                    <div className="visionary-socials">
                                        <a href="https://github.com/Shubham261104" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="GitHub">
                                            <FiGithub size={18} />
                                        </a>
                                        <a href="https://www.linkedin.com/in/shubham260606/" target="_blank" rel="noopener noreferrer" className="social-icon-btn" title="LinkedIn">
                                            <FiLinkedin size={18} />
                                        </a>
                                        <a href="mailto:support@skillbridge.com" className="social-icon-btn" title="Email">
                                            <FiMail size={18} />
                                        </a>
                                    </div>
                                </div>

                                <div className="visionary-quote-box">
                                    “Building smarter learning experiences through technology, innovation, and real-time collaboration.”
                                </div>

                                <div className="visionary-about-block">
                                    <h4 className="block-label">About</h4>
                                    <p className="about-text">
                                        Shubham Kumar is a passionate Full-Stack Developer focused on building scalable and user-friendly web applications. He envisioned the Training Center Management System to bring students, instructors, and administrators together on a single intelligent platform.
                                    </p>
                                </div>

                                <div className="visionary-expertise-block">
                                    <h4 className="block-label">Expertise</h4>
                                    <div className="expertise-chips-grid">
                                        {[
                                            'Full-Stack Web Development',
                                            'React.js & JavaScript',
                                            'Node.js & Express.js',
                                            'MongoDB',
                                            'REST API Development',
                                            'Authentication & Role-Based Access',
                                            'Dashboard & Analytics',
                                            'Real-Time Features'
                                        ].map((item, idx) => (
                                            <span key={idx} className="expertise-chip">
                                                <span className="chip-bullet"></span> {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="visionary-footer-row">
                                    <div className="focus-summary">
                                        <strong>Focus:</strong> Full-Stack Development • System Architecture • UI/UX • Real-Time Applications
                                    </div>
                                    <Link to="/about/shubham-kumar" className="btn-visionary-primary">
                                        Explore Profile <FiArrowRight />
                                    </Link>
                                </div>
                            </div>
                        </div>
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
