'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Upload, LogOut, FileText, Trash2, Play, Download, User } from 'lucide-react'
import Link from 'next/link'

interface Session {
  id: string
  permit_name: string
  municipality: string
  created_at: string
  status: 'not_started' | 'in_progress' | 'completed'
  current_step: number
  total_steps: number
  completed_pdf_url?: string
}

const statusConfig = {
  not_started: { label: 'Not Started', classes: 'bg-[#F3F4F6] text-[#6B7280]' },
  in_progress: { label: 'In Progress', classes: 'bg-amber-50 text-[#B45309] border border-amber-200' },
  completed: { label: 'Completed', classes: 'bg-green-50 text-[#2E7D52] border border-green-200' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace('/auth'); return }
      setUser(data.session.user)
      loadSessions()
    })
  }, [])

  async function loadSessions() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    const data = await res.json()
    setSessions(data.sessions || [])
    setLoading(false)
  }

  async function deleteSession(id: string) {
    if (!confirm('Delete this permit session? This cannot be undone.')) return
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session!.access_token}` }
    })
    setSessions(s => s.filter(x => x.id !== id))
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const stats = {
    total: sessions.length,
    inProgress: sessions.filter(s => s.status === 'in_progress').length,
    completed: sessions.filter(s => s.status === 'completed').length,
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar */}
      <aside className="w-56 border-r border-[#E5E7EB] flex flex-col py-6 px-4 shrink-0">
        <div className="flex items-center gap-2 px-2 mb-10">
          <div className="w-7 h-7 bg-[#1B3A5C] rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-semibold text-[#1B3A5C]">PermitPro</span>
        </div>

        <nav className="space-y-1 flex-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#F7F7F8] text-[#1B3A5C] border-l-2 border-[#1B3A5C] font-medium text-sm">
            <FileText size={15} />
            Permits
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-[#6B7280] hover:bg-[#F7F7F8] text-sm cursor-pointer">
            <User size={15} />
            Account
          </div>
        </nav>

        <div className="border-t border-[#E5E7EB] pt-4 mt-4">
          <div className="px-3 mb-3">
            <div className="text-sm font-medium text-[#1A1A1A] truncate">{firstName}</div>
            <div className="text-xs text-[#6B7280] truncate">{user?.email}</div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-[#6B7280] hover:text-[#1A1A1A] px-3 py-1.5 w-full rounded-md hover:bg-[#F7F7F8]"
          >
            <LogOut size={13} /> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Your Permits</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Welcome back, {firstName}</p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-[#1B3A5C] text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[#152E4D]"
          >
            <Upload size={14} /> Upload New Permit
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Permits', value: stats.total, accent: 'border-l-[#1B3A5C]' },
            { label: 'In Progress', value: stats.inProgress, accent: 'border-l-[#B45309]' },
            { label: 'Completed', value: stats.completed, accent: 'border-l-[#2E7D52]' },
          ].map(stat => (
            <div key={stat.label} className={`bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-card border-l-4 ${stat.accent}`}>
              <div className="text-3xl font-bold text-[#1A1A1A]">{stat.value}</div>
              <div className="text-xs text-[#6B7280] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-[#6B7280] text-sm">Loading your permits...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#E5E7EB] rounded-xl">
            <FileText size={32} className="text-[#D1D5DB] mx-auto mb-4" />
            <div className="font-medium text-[#6B7280] mb-1">No permits yet</div>
            <div className="text-sm text-[#9CA3AF] mb-6">Upload your first Ontario permit to get started.</div>
            <Link href="/upload" className="inline-flex items-center gap-2 bg-[#1B3A5C] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#152E4D]">
              <Upload size={14} /> Upload Permit
            </Link>
          </div>
        ) : (
          <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F7F7F8]">
                  {['Permit Name', 'Municipality', 'Uploaded', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs uppercase tracking-wide text-[#6B7280] px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => {
                  const cfg = statusConfig[s.status]
                  return (
                    <tr key={s.id} className={`border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F7F7F8] ${i % 2 === 0 ? '' : ''}`}>
                      <td className="px-4 py-4">
                        <span className="font-medium text-[#1B3A5C] text-sm">{s.permit_name}</span>
                        {s.total_steps > 0 && s.status === 'in_progress' && (
                          <div className="text-xs text-[#9CA3AF] mt-0.5">
                            {s.current_step - 1} of {s.total_steps} fields completed
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#6B7280]">{s.municipality}</td>
                      <td className="px-4 py-4 text-sm text-[#6B7280]">
                        {new Date(s.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {s.status === 'completed' && s.completed_pdf_url ? (
                            <a href={s.completed_pdf_url} target="_blank" className="p-1.5 text-[#6B7280] hover:text-[#1B3A5C] hover:bg-[#F7F7F8] rounded">
                              <Download size={15} />
                            </a>
                          ) : (
                            <Link href={`/wizard/${s.id}`} className="p-1.5 text-[#6B7280] hover:text-[#1B3A5C] hover:bg-[#F7F7F8] rounded">
                              <Play size={15} />
                            </Link>
                          )}
                          <button
                            onClick={() => deleteSession(s.id)}
                            className="p-1.5 text-[#6B7280] hover:text-[#DC2626] hover:bg-red-50 rounded"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
