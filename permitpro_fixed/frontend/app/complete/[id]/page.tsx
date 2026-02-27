'use client'
import { useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Download, Eye, ArrowLeft } from 'lucide-react'

export default function CompletePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const pdfUrl = searchParams.get('url') || ''

  const checklist = [
    'Confirm the correct municipal office to submit to',
    'Check whether supporting documents are required (site plans, surveys, drawings)',
    'Verify the applicable permit fee with your municipality',
    'Keep a copy of this completed form for your records',
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Green top accent */}
      <div className="h-1 bg-[#2E7D52]" />

      {/* Nav */}
      <nav className="border-b border-[#E5E7EB] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#1B3A5C] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-semibold text-[#1B3A5C] text-sm">PermitPro</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full border-2 border-[#2E7D52] flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-[#2E7D52]" />
          </div>

          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Your permit is ready.</h1>
          <p className="text-[#6B7280] text-sm mb-10">
            Review the completed document below before submitting to your municipality.
          </p>

          {/* Document card */}
          <div className="border border-[#E5E7EB] rounded-lg p-5 mb-6 text-left shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-10 h-12 bg-[#F7F7F8] border border-[#E5E7EB] rounded flex items-center justify-center text-xs text-[#9CA3AF] font-mono">
                PDF
              </div>
              <div>
                <div className="font-medium text-[#1A1A1A] text-sm">Completed Permit</div>
                <div className="text-xs text-[#6B7280] mt-0.5">Ready for submission</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-10">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 border border-[#1B3A5C] text-[#1B3A5C] py-3 rounded-md text-sm font-medium hover:bg-[#F7F7F8]"
              >
                <Eye size={15} /> Preview Document
              </a>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="flex-1 flex items-center justify-center gap-2 bg-[#1B3A5C] text-white py-3 rounded-md text-sm font-medium hover:bg-[#152E4D]"
              >
                <Download size={15} /> Download PDF
              </a>
            )}
          </div>

          {/* Checklist */}
          <div className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-lg p-5 text-left mb-8">
            <div className="font-semibold text-sm text-[#1A1A1A] mb-4">Before You Submit</div>
            <div className="space-y-3">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-4 h-4 border border-[#D1D5DB] rounded mt-0.5 shrink-0" />
                  <span className="text-sm text-[#374151] leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A]"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          <p className="text-xs text-[#9CA3AF] mt-8 leading-relaxed">
            This tool assists with form completion only and does not constitute legal advice.
            Always verify your submission requirements with the issuing municipality.
          </p>
        </div>
      </main>
    </div>
  )
}
