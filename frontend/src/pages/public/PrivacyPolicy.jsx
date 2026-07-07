import { Link } from 'react-router-dom'
import { FiCommand, FiShield, FiLock, FiEye, FiDatabase, FiUserCheck, FiMail } from 'react-icons/fi'
import './AboutUs.css'

const PrivacyPolicy = () => {
    const privacySections = [
        {
            icon: FiDatabase,
            title: 'Information We Collect',
            content: [
                'Personal information such as name, email address, and profile details when you register for an account.',
                'Educational data including course enrollments, quiz scores, progress tracking, and certificate achievements.',
                'Usage data including pages visited, features used, and interaction patterns to improve our platform.',
                'Device and technical information such as IP address, browser type, and operating system for security purposes.'
            ]
        },
        {
            icon: FiShield,
            title: 'How We Use Your Information',
            content: [
                'To provide and personalize your learning experience on SkillBridge.',
                'To track your progress, generate certificates, and maintain your educational records.',
                'To communicate important updates, announcements, and course-related notifications.',
                'To improve our platform, develop new features, and enhance user experience.',
                'To ensure platform security and prevent fraudulent activities.'
            ]
        },
        {
            icon: FiLock,
            title: 'Data Security',
            content: [
                'We implement enterprise-grade security measures to protect your personal information.',
                'All data transmissions are encrypted using industry-standard SSL/TLS protocols.',
                'Regular security audits and updates are performed to maintain the highest security standards.',
                'Access to personal data is strictly limited to authorized personnel only.'
            ]
        },
        {
            icon: FiUserCheck,
            title: 'Your Rights & Choices',
            content: [
                'You have the right to access, update, or delete your personal information at any time.',
                'You can manage your notification preferences through your profile settings.',
                'You may request a copy of all data we hold about you.',
                'You can withdraw consent for data processing where applicable.'
            ]
        },
        {
            icon: FiEye,
            title: 'Data Sharing',
            content: [
                'We do not sell, trade, or rent your personal information to third parties.',
                'Instructors may view relevant student data necessary for course management.',
                'We may share data with service providers who assist in operating our platform, under strict confidentiality agreements.',
                'We may disclose information when required by law or to protect our rights and safety.'
            ]
        }
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
                <div className="hero-tag">Your Data, Your Trust</div>
                <h1>Privacy Policy</h1>
                <p>
                    At SkillBridge, we are committed to protecting your privacy and ensuring the security of your personal information.
                    This policy explains how we collect, use, and safeguard your data as you learn and grow with us.
                </p>
            </header>

            {/* Privacy Content Sections */}
            <section className="highlights-container">
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {privacySections.map((section, idx) => (
                        <div key={idx} className="glass-card reveal" style={{
                            padding: '2.5rem',
                            marginBottom: '2rem',
                            animationDelay: `${idx * 0.1}s`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="icon-box" style={{ width: '50px', height: '50px', borderRadius: '12px' }}>
                                    <section.icon size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', margin: 0 }}>
                                    {section.title}
                                </h3>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {section.content.map((item, i) => (
                                    <li key={i} style={{
                                        color: '#94a3b8',
                                        lineHeight: '1.8',
                                        paddingLeft: '1.5rem',
                                        position: 'relative',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            color: '#6366f1'
                                        }}>•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Contact for Privacy */}
                    <div className="glass-card reveal" style={{
                        padding: '2.5rem',
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}>
                        <div className="icon-box" style={{ width: '60px', height: '60px', margin: '0 auto 1.5rem' }}>
                            <FiMail size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>
                            Questions About Your Privacy?
                        </h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            If you have any questions or concerns about our privacy practices or your personal data,
                            please don't hesitate to reach out to our dedicated privacy team.
                        </p>
                        <Link to="/contact" className="btn-profile" style={{ maxWidth: '300px', margin: '0 auto' }}>
                            Contact Us
                        </Link>
                    </div>

                    {/* Last Updated */}
                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '2rem' }}>
                        Last Updated: December 2025
                    </p>
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

export default PrivacyPolicy
