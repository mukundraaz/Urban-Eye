import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Shield, User, Building2, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { DEPARTMENTS } from '../utils/constants.js'
import apiClient from '../api/client.js'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' }
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (score === 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' }
    if (score === 4) return { score: 3, label: 'Good', color: 'bg-royal-500' }
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
  }, [password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Client-side validations
    const cleanName = fullName.trim()
    if (cleanName.length < 2) {
      setError('Please enter your full name (minimum 2 characters).')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid official email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        full_name: cleanName,
        email: email.trim().toLowerCase(),
        password: password,
        department: department.trim() || undefined,
      }

      await apiClient.post('/auth/register', payload)

      setSuccess('Account created successfully! Redirecting to sign in...')

      // Redirect user to Sign In page with a success message
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredMessage: 'Account created successfully! You can now sign in with your credentials.',
            email: email.trim().toLowerCase(),
          },
        })
      }, 1500)
    } catch (err) {
      let message = 'Registration failed. Please check your details and try again.'
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail)) {
        message = detail.map(d => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ')
      } else if (detail && typeof detail === 'object') {
        message = detail.msg || JSON.stringify(detail)
      } else if (err.message) {
        message = err.message
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting matching LoginPage */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-royal-600 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-royal-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Theme toggle matching LoginPage */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 text-navy-300 hover:text-white transition-colors z-10"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-md relative z-10 my-6">
        {/* Header Branding matching LoginPage */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-royal-600 rounded-2xl mb-4 shadow-xl">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">Urban Eye</h1>
          <p className="text-navy-300 mt-1 text-sm">Smart Urban Road &amp; Traffic Intelligence System</p>
          <p className="text-navy-400 text-xs mt-1">Government Smart City Initiative</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create Account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">
            Register for official urban intelligence access
          </p>

          {/* Success Banner */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* 1. Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="input pl-9 text-sm"
                  placeholder="e.g. Inspector Ramesh Kulkarni"
                />
              </div>
            </div>

            {/* 2. Official Email Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input pl-9 text-sm"
                  placeholder="official@smartcity.gov.in"
                />
              </div>
            </div>

            {/* 3. Department (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input pl-9 text-sm"
                >
                  <option value="">Select your department (or leave blank)</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="Other">Other / Civic Authority</option>
                </select>
              </div>
            </div>

            {/* 4. Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pl-9 pr-10 text-sm"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Password Strength:</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="input pl-9 pr-10 text-sm"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-[11px] text-emerald-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Passwords match.
                </p>
              )}
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-sm font-semibold mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Navigation back to Sign In */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-royal-600 dark:text-royal-400 hover:text-royal-700 dark:hover:text-royal-300 font-semibold transition-colors hover:underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>

        {/* Footer info matching LoginPage */}
        <p className="text-center text-navy-400 text-xs mt-6">
          Urban Eye v1.0 • Authorized Personnel Registration
        </p>
      </div>
    </div>
  )
}
