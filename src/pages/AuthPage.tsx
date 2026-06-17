import { useState, type FormEvent } from 'react'
import { Mail, ArrowRight, Loader2, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

type Step = 'email' | 'sent'

export default function AuthPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSendLink(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('sent')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-wc-dark px-4 pt-safe pb-safe">
      {/* Logo / header */}
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">⚽</div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          World Cup Companion
        </h1>
        <p className="mt-1 text-sm text-gray-400">2026</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl bg-wc-surface p-6 shadow-xl ring-1 ring-white/10">
        {step === 'email' && (
          <>
            <h2 className="mb-1 text-lg font-semibold text-white">Sign in</h2>
            <p className="mb-6 text-sm text-gray-400">
              We'll email you a secure sign-in link — no password needed.
            </p>

            <form onSubmit={handleSendLink} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-white/10 transition focus:ring-wc-gold"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-wc-gold py-3 text-sm font-semibold text-wc-dark transition hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send sign-in link <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {step === 'sent' && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <MailCheck className="h-10 w-10 text-wc-gold" />
            <div>
              <p className="font-semibold text-white">Check your inbox</p>
              <p className="mt-1 text-sm text-gray-400">
                We sent a sign-in link to{' '}
                <span className="text-white">{email}</span>.
                <br />
                Click the link in the email to continue.
              </p>
            </div>
            <button
              onClick={() => { setStep('email'); setError(null) }}
              className="text-xs text-gray-500 underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
