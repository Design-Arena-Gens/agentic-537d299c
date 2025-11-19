import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prompt Maker AI',
  description: 'Design elite prompts with structure, constraints, and examples',
  metadataBase: new URL('https://agentic-537d299c.vercel.app')
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
