import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''
axios.defaults.headers.common['Content-Type'] = 'application/json'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Configure Axios Request & Response Interceptors for Refresh Token Rotation
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        // Avoid infinite loop if refresh itself fails
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          originalRequest.url !== '/api/auth/refresh' &&
          originalRequest.url !== '/api/auth/login' &&
          originalRequest.url !== '/api/auth/me'
        ) {
          originalRequest._retry = true
          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const res = await axios.post('/api/auth/refresh', { refreshToken })
              const { token, refreshToken: newRefreshToken } = res.data
              
              localStorage.setItem('token', token)
              localStorage.setItem('refreshToken', newRefreshToken)
              
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
              originalRequest.headers['Authorization'] = `Bearer ${token}`
              return axios(originalRequest)
            }
          } catch (refreshError) {
            // Revoke state if refresh token is expired/invalid
            logout()
          }
        }
        return Promise.reject(error)
      }
    )

    // Load initial user session
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  // Session Inactivity Timeout (e.g. 15 minutes of inactivity triggers logout)
  useEffect(() => {
    if (!user) return

    let timeoutId
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 mins

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        logout()
        alert('Your session has timed out due to inactivity. Please sign in again.')
      }, INACTIVITY_TIMEOUT)
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, resetTimer))

    resetTimer()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [user])

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me')
      setUser(res.data.user)
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      if (res.data.twoFactorRequired) {
        return { twoFactorRequired: true, email: res.data.email }
      }
      
      const { token, refreshToken, user: loggedUser } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(loggedUser)
      return loggedUser
    } catch (error) {
      throw error
    }
  }

  const verify2FA = async (email, otp) => {
    try {
      const res = await axios.post('/api/auth/verify-2fa', { email, otp })
      const { token, refreshToken, user: loggedUser } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(loggedUser)
      return loggedUser
    } catch (error) {
      throw error
    }
  }

  const googleLogin = async (googleToken, role) => {
    try {
      const res = await axios.post('/api/auth/google-login', { token: googleToken, role })
      const { token, refreshToken, user: loggedUser } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(loggedUser)
      return loggedUser
    } catch (error) {
      throw error
    }
  }

  const verifyEmail = async (email, otp) => {
    try {
      const res = await axios.post('/api/auth/verify-email', { email, otp })
      const { user: updatedUser } = res.data
      setUser(updatedUser)
      return updatedUser
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData)
      const { token, refreshToken, user: loggedUser } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(loggedUser)
      return loggedUser
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, verify2FA, googleLogin, verifyEmail, register, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
