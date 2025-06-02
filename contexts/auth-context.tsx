"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

      if (error) throw error

      if (data) {
        setUserProfile(data)
        return data
      } else {
        console.log("No user profile found for ID:", userId)
        setUserProfile(null)
        return null
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setUserProfile(null)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const handleRoleBasedRedirect = (profile: User | null) => {
    // Only redirect if user is on auth pages or root page
    const isAuthPage = pathname?.startsWith("/auth") || pathname === "/"

    if (profile && isAuthPage) {
      if (profile.role === "client") {
        router.push("/client/dashboard")
      } else if (profile.role === "employee") {
        router.push("/employee/dashboard")
      }
    }
  }

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setUser(session?.user ?? null)

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        handleRoleBasedRedirect(profile)
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        if (event === "SIGNED_IN") {
          handleRoleBasedRedirect(profile)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserProfile(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
