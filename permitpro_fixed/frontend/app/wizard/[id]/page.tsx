'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronUp, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Field {
  id: string
  field_name: string
  question: string
  helper: string
  input_type: 'text' | 'date' | 'number' | 'dropdown'
  dropdown_options: string
  step_number: number
  answer: string | null
}

export default function WizardPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [fields, setFields] = useState<Field[]>([])
  const [session, setSession] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [answer, setAnswer] = useState('')
  const [helperOpen, setHelperOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    loadSession()
  }, [sessionId])

  async function loadSession() {
    const { data: { session: authSession } } = await supabase.auth.getSession()
    if (!authSession) { router.push('/auth'); return }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session/${sessionId}`, {
      headers: { Authorization: `Bearer ${authSession.access_token}` }
    })
    if (!res.ok) { router.push('/dashboard'); return }

    const data = await res.json()
    setFields(data.fields)
    setSession(data.session)
    const step = Math.max(1, data.session.current_step || 1)
    setCurrentStep(step)

    // Pre-fill existing answer
    const currentField = data.fields.find((f: Field) => f.step_number === step)
    if (currentField?.answer) setAnswer(currentField.answer)

    setLoading(false)
  }

  const currentField = fields.find(f => f.step_number === currentStep)
  const totalSteps = fields.length
  const progress = totalSteps > 0 ? ((currentStep - 1) / totalSteps) * 100 : 0

  async function saveAnswer(goNext: boolean) {
    if (!currentField || !answer.trim()) return
    setSaving(true)

    const { data: { session: authSession } } = await supabase.auth.getSession()

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/save-answer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authSession!.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        field_id: currentField.id,
        answer: answer.trim()
      })
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    if (goNext) {
      if (currentStep >= totalSteps) {
        // All done — complete permit
        await completePermit(authSession!.access_token)
      } else {
        const nextStep = currentStep + 1
        setCurrentStep(nextStep)
        const nextField = fields.find(f => f.step_number === nextStep)
        setAnswer(nextField?.answer || '')
        setHelperOpen(false)
      }
    }
  }

  async function completePermit(token: string) {
    setCompleting(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complete-permit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id: sessionId })
    })
    const data = await res.json()
    setCompleting(false)
    router.push(`/complete/${sessionId}?url=${encodeURIComponent(data.completed_pdf_url)}`)
  }

  function goBack() {
    if (currentStep <= 1) return
    const prevStep = currentStep - 1
    setCurrentStep(prevStep)
    const prevField = fields.find(f => f.step_number === prevStep)
    setAnswer(prevField?.answer || '')
    setHelperOpen(false)
  }

  // Auto-save on answer change
  useEffect(() => {
    if (!answer || !currentField) return
    const timer = setTimeout(async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) return
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/save-answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId, field_id: currentField.id, answer })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }, 1000)
    return () => clearTimeout(timer)
  }, [answer])

  let dropdownOptions: string[] = []
  try {
    dropdownOptions = JSON.parse(currentField?.dropdown_options || '[]')
  } catch {}

  if (loading || completing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#6B7280] text-sm">
        {completing ? 'Generating your completed permit...' : 'Loading...'}
      </div>
    )
  }

  if (!currentField) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#6B7280] mb-4">No fields found for this session.</div>
          <Link href="/dashboard" className="text-[#1B3A5C] text-sm hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB]">
        {/* Progress bar */}
        <div className="h-1 bg-[#E5E7EB]">
          <div
            className="h-full bg-[#1B3A5C] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Nav */}
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1B3A5C] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
          </div>
          <div className="text-xs text-[#9CA3AF]">
            Step {currentStep} of {totalSteps}
          </div>
          <Link href="/dashboard" className="text-xs text-[#6B7280] hover:text-[#1A1A1A]">
            Save & Exit
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 pt-28 pb-32">
        <div className="w-full max-w-lg">
          {/* Question number */}
          <div className="text-xs uppercase tracking-widest text-[#9CA3AF] mb-4 font-medium">
            Question {currentStep}
          </div>

          {/* Question */}
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8 leading-tight">
            {currentField.question}
          </h1>

          {/* Input */}
          <div className="mb-6">
            {currentField.input_type === 'text' && (
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
                className="w-full border border-[#E5E7EB] rounded-md px-4 py-3.5 text-base bg-[#FAFAFA] placeholder-[#D1D5DB]"
              />
            )}
            {currentField.input_type === 'date' && (
              <input
                type="date"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                autoFocus
                className="w-full border border-[#E5E7EB] rounded-md px-4 py-3.5 text-base bg-[#FAFAFA]"
              />
            )}
            {currentField.input_type === 'number' && (
              <input
                type="number"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Enter a number..."
                autoFocus
                className="w-full border border-[#E5E7EB] rounded-md px-4 py-3.5 text-base bg-[#FAFAFA] placeholder-[#D1D5DB]"
              />
            )}
            {currentField.input_type === 'dropdown' && dropdownOptions.length > 0 && (
              <select
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-md px-4 py-3.5 text-base bg-[#FAFAFA]"
              >
                <option value="">Select an option...</option>
                {dropdownOptions.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>

          {/* Helper */}
          <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
            <button
              onClick={() => setHelperOpen(!helperOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#6B7280] hover:bg-[#F7F7F8]"
            >
              <span>Why is this asked?</span>
              {helperOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {helperOpen && (
              <div className="px-4 py-3 bg-[#F7F7F8] border-t border-[#E5E7EB] border-l-4 border-l-[#1B3A5C]">
                <p className="text-sm text-[#6B7280] leading-relaxed">{currentField.helper}</p>
              </div>
            )}
          </div>

          {/* Auto-save indicator */}
          {saved && (
            <div className="flex items-center gap-1 text-xs text-[#2E7D52] mt-3">
              <Check size={12} /> Saved
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={currentStep <= 1}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <button
            onClick={() => saveAnswer(true)}
            disabled={!answer.trim() || saving}
            className="flex items-center gap-2 bg-[#1B3A5C] text-white px-8 py-2.5 rounded-md text-sm font-medium hover:bg-[#152E4D] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentStep >= totalSteps ? 'Complete Permit' : 'Next'} →
          </button>
        </div>
      </div>
    </div>
  )
}
