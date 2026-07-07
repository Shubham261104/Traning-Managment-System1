import React, { useEffect, useState } from 'react'
import './WelcomeScreen.css'

const WelcomeScreen = ({ userName, onComplete }) => {
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        // Start exit animation after 2.5 seconds
        const exitTimer = setTimeout(() => {
            setIsExiting(true)
        }, 2500)

        // Call onComplete after exit animation finishes (total 3s)
        const completeTimer = setTimeout(() => {
            onComplete()
        }, 3000)

        return () => {
            clearTimeout(exitTimer)
            clearTimeout(completeTimer)
        }
    }, [onComplete])

    return (
        <div className={`welcome-screen ${isExiting ? 'welcome-exit' : ''}`}>
            <div className="welcome-content">
                <h1 className="namaste-text">नमस्ते</h1>
                <div className="welcome-line"></div>
                <h2 className="role-text">{userName || 'User'}</h2>
            </div>

            {/* Optional decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
        </div>
    )
}

export default WelcomeScreen
