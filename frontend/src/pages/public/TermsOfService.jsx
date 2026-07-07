import { Link } from 'react-router-dom'
import { FiCommand, FiFileText, FiUsers, FiBook, FiAward, FiAlertTriangle, FiCheckCircle, FiMail } from 'react-icons/fi'
import './AboutUs.css'

const TermsOfService = () => {
    const termsSections = [
        {
            icon: FiCheckCircle,
            title: 'Acceptance of Terms',
            content: [
                'By accessing and using SkillBridge, you agree to be bound by these Terms of Service.',
                'These terms apply to all users including students, instructors, and administrators.',
                'If you do not agree with any part of these terms, please do not use our platform.',
                'We reserve the right to update these terms at any time, with notice provided through the platform.'
            ]
        },
        {
            icon: FiUsers,
            title: 'User Accounts & Responsibilities',
            content: [
                'You must provide accurate and complete information when creating your account.',
                'You are responsible for maintaining the confidentiality of your login credentials.',
                'Each account is personal and non-transferable. Sharing accounts is strictly prohibited.',
                'You must be at least 13 years of age to create an account, or have parental consent.',
                'You agree to notify us immediately of any unauthorized access to your account.'
            ]
        },
        {
            icon: FiBook,
            title: 'Use of Educational Content',
            content: [
                'All courses, materials, quizzes, and content on SkillBridge are protected by intellectual property laws.',
                'You are granted a limited, non-exclusive license to access content for personal educational use.',
                'Reproducing, distributing, or commercially exploiting any content without permission is prohibited.',
                'Instructors retain ownership of their original course materials uploaded to the platform.'
            ]
        },
        {
            icon: FiAward,
            title: 'Certificates & Achievements',
            content: [
                'Certificates are issued based on successful completion of courses and assessments.',
                'Certificates are for personal use and validation of skills acquired through SkillBridge.',
                'Falsifying progress or attempting to fraudulently obtain certificates will result in account termination.',
                'SkillBridge reserves the right to revoke certificates obtained through violation of these terms.'
            ]
        },
        {
            icon: FiAlertTriangle,
            title: 'Prohibited Activities',
            content: [
                'Cheating, plagiarism, or any form of academic dishonesty is strictly prohibited.',
                'Uploading malicious content, viruses, or any harmful material is not allowed.',
                'Harassment, bullying, or inappropriate behavior towards other users will not be tolerated.',
                'Attempting to disrupt or compromise the security of the platform is prohibited.',
                'Using the platform for any illegal activities is strictly forbidden.'
            ]
        },
        {
            icon: FiFileText,
            title: 'Instructor Terms',
            content: [
                'Instructors must provide accurate information and maintain the quality of their courses.',
                'All content uploaded must be original or properly licensed for use on SkillBridge.',
                'Instructors agree to respond to student inquiries in a timely manner.',
                'SkillBridge reserves the right to remove courses that violate our quality standards or policies.'
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
                <div className="hero-tag">Legal Agreement</div>
                <h1>Terms of Service</h1>
                <p>
                    Welcome to SkillBridge! These Terms of Service govern your use of our platform to ensure
                    a safe, productive, and fair learning environment for all users.
                </p>
            </header>

            {/* Terms Content Sections */}
            <section className="highlights-container">
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {termsSections.map((section, idx) => (
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

                    {/* Limitation of Liability */}
                    <div className="glass-card reveal" style={{
                        padding: '2.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="icon-box" style={{ width: '50px', height: '50px', borderRadius: '12px' }}>
                                <FiAlertTriangle size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', margin: 0 }}>
                                Limitation of Liability
                            </h3>
                        </div>
                        <p style={{ color: '#94a3b8', lineHeight: '1.8' }}>
                            SkillBridge provides educational content and services on an "as is" basis. While we strive to maintain
                            the highest quality standards, we do not guarantee that the platform will always be available,
                            error-free, or that learning outcomes will meet specific expectations. SkillBridge shall not be liable
                            for any indirect, incidental, or consequential damages arising from the use of our platform.
                        </p>
                    </div>

                    {/* Contact for Terms */}
                    <div className="glass-card reveal" style={{
                        padding: '2.5rem',
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}>
                        <div className="icon-box" style={{ width: '60px', height: '60px', margin: '0 auto 1.5rem' }}>
                            <FiMail size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>
                            Questions About Our Terms?
                        </h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            If you have any questions about these Terms of Service or need clarification
                            on any policies, our support team is here to help.
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

export default TermsOfService
