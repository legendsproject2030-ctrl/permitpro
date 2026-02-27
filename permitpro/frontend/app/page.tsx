'use client'
import Link from 'next/link'
import { ArrowRight, Upload, MessageSquare, Download, Shield, Clock, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#E5E7EB] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-navy-500 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-[#1B3A5C] text-lg tracking-tight">PermitPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] font-medium">
              Log in
            </Link>
            <Link href="/auth?mode=signup" className="text-sm bg-[#1B3A5C] text-white px-4 py-2 rounded-md font-medium hover:bg-[#152E4D]">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0F2137] text-white py-28 px-6 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-3 py-1 text-xs text-white/60 uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]" />
            Built for Ontario Residents
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Ontario Permit Filing,<br />
            <span className="text-white/50">Done Right.</span>
          </h1>
          <p className="text-white/60 text-xl leading-relaxed mb-10 max-w-xl">
            Upload your permit, answer plain-English questions, and download a completed form ready for your municipality — in minutes.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/auth?mode=signup" className="inline-flex items-center gap-2 bg-white text-[#1B3A5C] px-6 py-3 rounded-md font-semibold hover:bg-white/90">
              Start Filing Free <ArrowRight size={16} />
            </Link>
            <Link href="#how-it-works" className="text-white/60 hover:text-white text-sm font-medium">
              See how it works →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[#E5E7EB] py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { num: '2,400+', label: 'Permits Filed' },
            { num: '47', label: 'Municipalities Supported' },
            { num: '98%', label: 'Completion Rate' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-[#1B3A5C]">{s.num}</div>
              <div className="text-sm text-[#6B7280] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-[#6B7280] mb-3">How it works</div>
          <h2 className="text-3xl font-bold text-[#1B3A5C] mb-16">Three steps to a completed permit</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: Upload, title: 'Upload Your Permit', desc: 'Upload any Ontario municipal permit PDF — building, zoning, business licence, and more.' },
              { icon: MessageSquare, title: 'Answer Plain Questions', desc: 'We guide you through each field one at a time in plain English. No legal jargon.' },
              { icon: Download, title: 'Download & Submit', desc: 'Download your completed, submission-ready permit with a pre-submission checklist.' },
            ].map((step, i) => (
              <div key={step.title}>
                <div className="w-10 h-10 bg-[#F7F7F8] rounded-lg flex items-center justify-center mb-4 border border-[#E5E7EB]">
                  <step.icon size={18} className="text-[#1B3A5C]" />
                </div>
                <div className="text-xs text-[#6B7280] mb-2">Step {i + 1}</div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">{step.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F7F7F8] border-t border-b border-[#E5E7EB] py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1B3A5C] mb-12">Everything you need to file with confidence</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Shield, title: 'Secure & Private', desc: 'Your documents are encrypted in transit and stored securely. We never share your files.' },
              { icon: Clock, title: 'Save & Resume Anytime', desc: 'Your progress is auto-saved. Pick up exactly where you left off from your dashboard.' },
              { icon: CheckCircle, title: 'Ontario-Specific Guidance', desc: 'Field explanations reference Ontario Building Code and use Ontario-specific terminology.' },
              { icon: Upload, title: 'Any Permit Format', desc: 'Supports both fillable PDFs and scanned permit documents from any Ontario municipality.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-lg p-6 border border-[#E5E7EB] shadow-card">
                <f.icon size={18} className="text-[#1B3A5C] mb-3" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1B3A5C] mb-12">Trusted by Ontario residents</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { quote: 'Filed my deck permit in under 20 minutes. The questions were so clear I didn\'t need to call the city once.', name: 'James T.', city: 'Mississauga, ON' },
              { quote: 'I\'m a contractor and use this for every job. Saves me hours on paperwork every single week.', name: 'Sandra K.', city: 'Hamilton, ON' },
              { quote: 'Finally a tool that doesn\'t assume I know what "GFA" means. The explanations are actually helpful.', name: 'Marcus L.', city: 'Ottawa, ON' },
              { quote: 'Used it for a business licence permit. The checklist at the end reminded me about documents I would have forgotten.', name: 'Priya M.', city: 'Brampton, ON' },
            ].map((t) => (
              <div key={t.name} className="border border-[#E5E7EB] rounded-lg p-6">
                <p className="text-sm text-[#1A1A1A] italic leading-relaxed mb-4">"{t.quote}"</p>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-[#6B7280]">{t.city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0F2137] py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to file your permit?</h2>
          <p className="text-white/60 mb-8">Join thousands of Ontario residents who\'ve simplified their permit process.</p>
          <Link href="/auth?mode=signup" className="inline-flex items-center gap-2 bg-white text-[#1B3A5C] px-8 py-3 rounded-md font-semibold hover:bg-white/90">
            Get Started — It\'s Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] py-10 px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1B3A5C] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-[#1B3A5C]">PermitPro</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#6B7280]">
            <Link href="/privacy" className="hover:text-[#1A1A1A]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#1A1A1A]">Terms of Use</Link>
            <Link href="mailto:hello@permitpro.ca" className="hover:text-[#1A1A1A]">Contact</Link>
          </div>
          <div className="text-xs text-[#9CA3AF]">Not affiliated with any Ontario municipal government</div>
        </div>
      </footer>
    </div>
  )
}
