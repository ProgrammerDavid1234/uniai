import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { AuthLayout } from '../components/AuthLayout'

function passwordStrength(pw: string): { label: string; score: number } {
  if (!pw) return { label: '', score: 0 }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Strong']
  return { label: labels[score], score }
}

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })
  const navigate = useNavigate()

  const nameValid = fullName.trim().length >= 2
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length >= 8
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const formValid = nameValid && emailValid && passwordValid && passwordsMatch

  const strength = passwordStrength(password)
  const strengthColor = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-amber-400', 'bg-mint', 'bg-mint'][strength.score]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true })
    if (!formValid) return

    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/dashboard')
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your wallet"
      subtitle="Set up in under a minute — no paperwork, no queues."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
            placeholder="Favour Adebayo"
            aria-invalid={touched.fullName && !nameValid}
            aria-describedby={touched.fullName && !nameValid ? 'name-hint' : undefined}
            className={`w-full mt-2 p-3 rounded-xl border outline-none transition-shadow focus:ring-2 focus:ring-mint-soft ${
              touched.fullName && !nameValid ? 'border-red-400' : 'border-line focus:border-mint'
            }`}
            required
          />
          {touched.fullName && !nameValid && (
            <span id="name-hint" className="text-sm text-red-600">
              Enter your full name.
            </span>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="you@university.edu.ng"
            aria-invalid={touched.email && !emailValid}
            aria-describedby={touched.email && !emailValid ? 'email-hint' : undefined}
            className={`w-full mt-2 p-3 rounded-xl border outline-none transition-shadow focus:ring-2 focus:ring-mint-soft ${
              touched.email && !emailValid ? 'border-red-400' : 'border-line focus:border-mint'
            }`}
            required
          />
          {touched.email && !emailValid && (
            <span id="email-hint" className="text-sm text-red-600">
              Enter a valid email address.
            </span>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="At least 8 characters"
              aria-invalid={touched.password && !passwordValid}
              aria-describedby="password-strength"
              className={`w-full p-3 pr-16 rounded-xl border outline-none transition-shadow focus:ring-2 focus:ring-mint-soft ${
                touched.password && !passwordValid ? 'border-red-400' : 'border-line focus:border-mint'
              }`}
              minLength={8}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-mint"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {password.length > 0 && (
            <div id="password-strength" className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < strength.score ? strengthColor : 'bg-line'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-ink/50 mt-1 block">{strength.label}</span>
            </div>
          )}
          {touched.password && !passwordValid && (
            <span className="text-sm text-red-600 block mt-1">Password must be at least 8 characters.</span>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
            placeholder="Re-enter your password"
            aria-invalid={touched.confirmPassword && !passwordsMatch}
            aria-describedby={touched.confirmPassword && !passwordsMatch ? 'confirm-hint' : undefined}
            className={`w-full mt-2 p-3 rounded-xl border outline-none transition-shadow focus:ring-2 focus:ring-mint-soft ${
              touched.confirmPassword && !passwordsMatch ? 'border-red-400' : 'border-line focus:border-mint'
            }`}
            required
          />
          {touched.confirmPassword && !passwordsMatch && (
            <span id="confirm-hint" className="text-sm text-red-600">
              Passwords don't match.
            </span>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-ink text-parchment font-semibold hover:bg-ink-soft transition-colors disabled:opacity-60"
          disabled={loading || !formValid}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link className="text-ink font-semibold" to="/login">
          Log in
        </Link>
      </div>
    </AuthLayout>
  )
}