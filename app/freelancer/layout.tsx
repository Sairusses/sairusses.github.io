"use client"

import type React from "react"

import { useAuth } from "@/components/providers/auth-provider"
import { FreelancerNavigation } from "@/components/freelancer/navigation"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function FreelancerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== "freelancer")) {
      router.push("/")
    }
  }, [userProfile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== "freelancer") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FreelancerNavigation />
      {children}
    </div>
  )
}
