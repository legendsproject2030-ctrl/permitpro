'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[#6B7280]">Loading...</div>}>
      <AuthPageInner />
    </Suspense>
  )
}

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  )
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
    })
  }, [])

  useEffect(() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    setStrength(s)
  }, [password])

  const strengthColor = ['bg-[#E5E7EB]', 'bg-[#DC2626]', 'bg-[#B45309]', 'bg-[#2E7D52]', 'bg-[#2E7D52]'][strength]
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName } }
        })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-1/2 bg-[#0F2137] flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="relative text-center px-12">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <span className="text-white text-xl font-bold">P</span>
          </div>
          <div className="text-white text-2xl font-bold mb-3">PermitPro</div>
          <div className="text-white/50 text-sm leading-relaxed max-w-xs">
            Ontario permit filing, simplified. Upload, answer, download.
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-10 block">
            <- Back to home
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-[#6B7280] text-sm mb-8">
            {mode === 'signup' ? 'Start filing Ontario permits in minutes.' : 'Log in to access your permit sessions.'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">First Name</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className="w-full bg-[#F7F7F8] border border-[#E5E7EB] rounded-md px-4 py-3 text-sm placeholder-[#9CA3AF]" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="w-full bg-[#F7F7F8] border border-[#E5E7EB] rounded-md px-4 py-3 text-sm placeholder-[#9CA3AF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" className="w-full bg-[#F7F7F8] border border-[#E5E7EB] rounded-md px-4 py-3 text-sm placeholder-[#9CA3AF] pr-11" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-[#E5E7EB]'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-[#6B7280]">{strengthLabel}</div>
                </div>
              )}
              {mode === 'login' && (
                <button type="button" className="text-xs text-[#6B7280] hover:text-[#1B3A5C] mt-1.5 block">Forgot password?</button>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">{error}</div>
            )}
            <button type="submit" disabled={loading} className="w-full bg-[#1B3A5C] text-white py-3 rounded-md font-medium text-sm hover:bg-[#152E4D] disabled:opacity-60">
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          </form>
          <p className="text-sm text-[#6B7280] mt-6 text-center">
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }} className="text-[#1B3A5C] font-medium hover:underline">
              {mode === 'signup' ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
