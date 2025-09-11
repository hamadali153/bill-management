'use client'

import { useState, useEffect } from 'react'
import PasswordProtection from './PasswordProtection'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated (session stored in localStorage)
    // Only run on client side
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('bill-management-auth')
      if (authStatus === 'authenticated') {
        setIsAuthenticated(true)
      }
    }
    setIsLoading(false)
  }, [])

  const handleAuthenticated = () => {
    localStorage.setItem('bill-management-auth', 'authenticated')
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={handleAuthenticated} />
  }

  return <>{children}</>
}
