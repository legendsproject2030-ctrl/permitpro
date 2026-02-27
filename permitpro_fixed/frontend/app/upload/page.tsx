'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, Lock, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Stage = 'upload' | 'loading' | 'confirm'

export default function UploadPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loadingText, setLoadingText] = useState('Reading your permit document...')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    if (f.size > 20 * 1024 * 1024) { setError('File too large. Maximum 20MB.'); return }
    setFile(f)
    setError('')
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  async function uploadPermit() {
    if (!file) return
    setStage('loading')
    setError('')

    const texts = [
      'Reading your permit document...',
      'Identifying form fields...',
      'Generating plain-English questions...',
      'Almost ready...'
    ]
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % texts.length
      setLoadingText(texts[i])
    }, 2000)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-permit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Upload failed')
      }

      const data = await res.json()
      clearInterval(interval)
      setResult(data)
      setStage('confirm')
    } catch (err: any) {
      clearInterval(interval)
      setError(err.message || 'Something went wrong. Please try again.')
      setStage('upload')
    }
  }

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 bg-[#1B3A5C] rounded-lg flex items-center justify-center mb-10">
          <span className="text-white text-sm font-bold">P</span>
        </div>
        {/* Top loading bar */}
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-[#E5E7EB]">
          <div className="h-full bg-[#1B3A5C] animate-[loading_2s_ease-in-out_infinite]" style={{width: '60%'}} />
        </div>
        <style>{`@keyframes loading { 0% { width: 0% } 50% { width: 80% } 100% { width: 100% } }`}</style>
        <div className="text-[#6B7280] text-sm mt-4">{loadingText}</div>
      </div>
    )
  }

  if (stage === 'confirm' && result) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-[#2E7D52] text-xs px-3 py-1 rounded-full mb-6">
            <CheckCircle size={12} /> Document Analysed
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">{result.permit_name}</h1>
          <p className="text-[#6B7280] text-sm mb-6">
            Issued by {result.municipality} · {file?.name}
          </p>
          <div className="border-t border-[#E5E7EB] pt-6 mb-6">
            <div className="font-semibold text-[#1A1A1A] mb-1">{result.total_fields} fields detected</div>
            <div className="text-sm text-[#6B7280] mb-4">We'll guide you through each one.</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.fields_preview?.map((field: string, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-b-0">
                  <span className="text-sm text-[#1A1A1A]">
                    <span className="text-[#9CA3AF] mr-3 text-xs">{i + 1}</span>
                    {field}
                  </span>
                  <ChevronRight size={14} className="text-[#D1D5DB]" />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => router.push(`/wizard/${result.session_id}`)}
            className="w-full bg-[#1B3A5C] text-white py-3 rounded-md font-medium text-sm hover:bg-[#152E4D]"
          >
            Begin Filing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#E5E7EB] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1B3A5C] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-semibold text-[#1B3A5C] text-sm">PermitPro</span>
        </div>
        <Link href="/dashboard" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] flex items-center gap-1">
          <ArrowLeft size={14} /> Dashboard
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Breadcrumb */}
        <div className="w-full max-w-lg mb-8">
          <div className="text-xs text-[#6B7280]">
            <Link href="/dashboard" className="hover:text-[#1A1A1A]">Permits</Link>
            <span className="mx-2">›</span>
            <span>Upload New Permit</span>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Upload Your Permit Document</h1>
          <p className="text-[#6B7280] text-sm mb-8">
            We support all Ontario municipal permit forms in PDF format.
          </p>

          {!file ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              className={`border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-[#1B3A5C] bg-blue-50/30'
                  : 'border-[#D1D5DB] hover:border-[#9CA3AF] bg-[#FAFAFA]'
              }`}
            >
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Upload size={28} className="text-[#9CA3AF] mx-auto mb-4" />
              <div className="font-medium text-[#374151] mb-1">Drag your Ontario permit PDF here</div>
              <div className="text-sm text-[#6B7280]">or click to browse your files — PDF only, max 20MB</div>
            </div>
          ) : (
            <div className="border border-[#E5E7EB] rounded-lg p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F7F7F8] rounded-lg flex items-center justify-center border border-[#E5E7EB] shrink-0">
                  <FileText size={18} className="text-[#1B3A5C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[#1A1A1A] truncate">{file.name}</div>
                  <div className="text-xs text-[#6B7280]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button
                  onClick={() => { setFile(null); setError('') }}
                  className="text-xs text-[#1B3A5C] hover:underline shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded-md px-4 py-3">
              {error}
            </div>
          )}

          {file && (
            <button
              onClick={uploadPermit}
              className="mt-4 w-full bg-[#1B3A5C] text-white py-3 rounded-md font-medium text-sm hover:bg-[#152E4D]"
            >
              Continue
            </button>
          )}

          {/* Security note */}
          <div className="mt-6 flex items-start gap-3 bg-[#F7F7F8] border border-[#E5E7EB] rounded-lg px-4 py-3">
            <Lock size={14} className="text-[#6B7280] mt-0.5 shrink-0" />
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Your document is encrypted in transit and stored securely. We never share or sell your files.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
