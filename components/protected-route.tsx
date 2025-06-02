"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/lib/types"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  redirectTo?: string
}

export default function ProtectedRoute({ children, requiredRole, redirectTo = "/auth/login" }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && userProfile?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (userProfile?.role === "client") {
          router.push("/client/dashboard")
        } else if (userProfile?.role === "employee") {
          router.push("/employee/dashboard")
        } else {
          router.push("/")
        }
        return
      }
    }
  }, [user, userProfile, loading, requiredRole, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || (requiredRole && userProfile?.role !== requiredRole)) {
    return null
  }

  return <>{children}</>
}
