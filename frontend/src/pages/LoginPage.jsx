import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { Eye, EyeOff, Lock, Mail, Shield, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext.jsx'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login, demoLogin } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.registeredMessage) {
      setSuccess(location.state.registeredMessage)
      if (location.state.email) {
        setEmail(location.state.email)
      }
    }
  }, [location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      let msg = 'Login failed. Please check your credentials.'
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        msg = detail
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ')
      } else if (detail && typeof detail === 'object') {
        msg = detail.msg || JSON.stringify(detail)
      } else if (err.message) {
        msg = err.message
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = () => {
    demoLogin()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-royal-600 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-royal-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 text-navy-300 hover:text-white transition-colors z-10">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-royal-600 rounded-2xl mb-4 shadow-xl">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">Urban Eye</h1>
          <p className="text-navy-300 mt-1 text-sm">Smart Urban Road &amp; Traffic Intelligence System</p>
          <p className="text-navy-400 text-xs mt-1">Government Smart City Initiative</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Sign In</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Access the Urban Intelligence Platform</p>

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center justify-between">
              <span>{success}</span>
              <button type="button" onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800 ml-2 text-xs font-bold">✕</button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="input pl-9" placeholder="official@smartcity.gov.in" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="input pl-9 pr-10" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-sm font-semibold">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
              New to Urban Eye?{' '}
              <Link
                to="/register"
                className="text-royal-600 dark:text-royal-400 hover:text-royal-700 dark:hover:text-royal-300 font-semibold transition-colors hover:underline"
              >
                Create Account
              </Link>
            </p>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 uppercase tracking-wider">
              <span className="bg-white dark:bg-slate-800 px-3">or</span>
            </div>
          </div>

          <button onClick={handleDemo}
            className="mt-4 w-full btn-secondary justify-center py-2.5 text-sm font-semibold border-dashed">
            🎭 Enter Demo Mode
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            Demo mode uses sample data. No backend required.
          </p>
        </div>

        <p className="text-center text-navy-400 text-xs mt-6">
          Urban Eye v1.0 • Authorized Personnel Only
        </p>
      </div>
    </div>
  )
}
