import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { AuthLayout } from '../components/AuthLayout'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  })
  const navigate = useNavigate()

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length >= 6
  const formValid = emailValid && passwordValid

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!formValid) return

    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/dashboard')
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to your wallet"
      subtitle="Pick up where your spending insights left off."
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
          <label htmlFor="email" className="block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
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
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm text-mint font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••••"
              aria-invalid={touched.password && !passwordValid}
              aria-describedby={touched.password && !passwordValid ? 'password-hint' : undefined}
              className={`w-full p-3 pr-16 rounded-xl border outline-none transition-shadow focus:ring-2 focus:ring-mint-soft ${
                touched.password && !passwordValid ? 'border-red-400' : 'border-line focus:border-mint'
              }`}
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
          {touched.password && !passwordValid && (
            <span id="password-hint" className="text-sm text-red-600">
              Password must be at least 6 characters.
            </span>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-ink text-parchment font-semibold hover:bg-ink-soft transition-colors disabled:opacity-60"
          disabled={loading || !formValid}
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-ink/60">
        Don't have an account?{' '}
        <Link className="text-ink font-semibold" to="/signup">
          Sign up
        </Link>
      </div>
    </AuthLayout>
  )
}