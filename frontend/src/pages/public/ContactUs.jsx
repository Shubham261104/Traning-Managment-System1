import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiMail, FiMapPin, FiPhone, FiSend, FiCheckCircle, FiCommand } from 'react-icons/fi'
import './ContactUs.css'

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    })
    const [status, setStatus] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        setStatus('sending')
        // Simulate API call
        setTimeout(() => {
            setStatus('sent')
            setFormData({ name: '', email: '', message: '' })
            setTimeout(() => setStatus(''), 5000) // Reset status after 5s
        }, 1500)
    }

    return (
        <div className="contact-page">
            {/* Animated Background Blobs */}
            <div className="bg-mesh">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            {/* Top Navigation Links */}
            <div className="top-nav-links">
                <Link to="/about" className="tnav-link ">About Us</Link>
                <Link to="/login" className="tnav-link">
                    <FiArrowLeft /> Login
                </Link>
            </div>

            <main className="contact-container">
                {/* Left Panel: High Impact Info */}
                <aside className="contact-sidebar">
                    <div className="sidebar-header">
                        <Link to="/" className="flex items-center gap-2 mb-8 group">
                            <FiCommand size={32} className="text-indigo-500 group-hover:rotate-12 transition-transform" />
                            <span className="text-2xl font-black text-white tracking-tight">SkillBridge</span>
                        </Link>
                        <div className="inline-block px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
                            Contact Us
                        </div>
                        <h1>Let's Start a Conversation</h1>
                        <p>
                            Have a question, feedback, or a partnership idea?
                            Reach out—we reach back with solutions.
                        </p>
                    </div>

                    <div className="contact-methods">
                        <div className="method-item">
                            <div className="method-icon">
                                <FiMail size={24} />
                            </div>
                            <div className="method-text">
                                <h4>Email Us</h4>
                                <p>subhamkumar260506@gmail.com</p>
                            </div>
                        </div>

                        <div className="method-item">
                            <div className="method-icon">
                                <FiPhone size={24} />
                            </div>
                            <div className="method-text">
                                <h4>Call Support</h4>
                                <p>+91 808 411 1304</p>
                            </div>
                        </div>

                        <div className="method-item">
                            <div className="method-icon">
                                <FiMapPin size={24} />
                            </div>
                            <div className="method-text">
                                <h4>Visit Global HQ</h4>
                                <p>Silicon Valley of India, Bengaluru</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 opacity-40 text-xs">
                        &copy; 2025 SkillBridge Inc. Excellence in every pixel.
                    </div>
                </aside>

                {/* Right Panel: Premium Interactive Form */}
                <section className="contact-form-side">
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <div className="input-container">
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your name"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Work Email Address</label>
                            <div className="input-container">
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="yourname@gmail.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Your Message</label>
                            <div className="input-container">
                                <textarea
                                    id="message"
                                    required
                                    rows="5"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="resize-none"
                                    placeholder="Tell us how we can help you..."
                                ></textarea>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'sending' || status === 'sent'}
                            className={`btn-send ${status === 'sent' ? 'success' : ''}`}
                        >
                            {status === 'sending' ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Transmitting...
                                </>
                            ) : status === 'sent' ? (
                                <>
                                    Message Delivered <FiCheckCircle />
                                </>
                            ) : (
                                <>
                                    Send Message <FiSend size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    )
}

export default ContactUs
