import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import DashboardLayout from '@/components/DashboardLayout'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Sonic Dashboard',
  description: 'Sonic billing and revenue management dashboard',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <SignedIn>
            <DashboardLayout>{children}</DashboardLayout>
          </SignedIn>
          <SignedOut>
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
              }}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '2rem',
                  borderRadius: '0.9rem',
                  border: '1px solid #000000',
                  textAlign: 'center',
                }}
              >
                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                  color: '#000000',
                    marginBottom: '1rem',
                  }}
                >
                  Welcome to Sonic Dashboard
                </h1>
                <p style={{ color: '#000000', marginBottom: '1.5rem' }}>
                  Please sign in to continue.
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: '999px',
                        border: '1px solid #000000',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: '999px',
                        border: '1px solid #000000',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Sign up
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  )
}