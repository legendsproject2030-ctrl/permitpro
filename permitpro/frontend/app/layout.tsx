import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'PermitPro — Ontario Permit Filing',
  description: 'Upload your Ontario permit, answer plain-English questions, and download a completed form ready for your municipality.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased bg-white text-[#1A1A1A]`}>
        {children}
      </body>
    </html>
  )
}
