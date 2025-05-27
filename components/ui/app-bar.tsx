"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { LogOut, User, Briefcase, FileText } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface AppBarProps {
  title: string
  showProfile?: boolean
  actions?: React.ReactNode
}

export function AppBar({ title, showProfile = true, actions }: AppBarProps) {
  const { userProfile } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="bg-white border-b border-blue-100 shadow-sm app-bar-divider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href={userProfile?.role === "client" ? "/client" : "/freelancer"}>
              <h1 className="text-xl font-bold text-blue-600">ManPower</h1>
            </Link>
            <span className="text-gray-600">|</span>
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          </div>

          <div className="flex items-center space-x-4">
            {userProfile?.role === "client" && (
              <nav className="hidden md:flex space-x-4">
                <Link href="/client/jobs" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <Briefcase className="h-5 w-5" />
                </Link>
                <Link href="/client/freelancers" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <User className="h-5 w-5" />
                </Link>
              </nav>
            )}

            {userProfile?.role === "freelancer" && (
              <nav className="hidden md:flex space-x-4">
                <Link href="/freelancer/jobs" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <Briefcase className="h-5 w-5" />
                </Link>
                <Link href="/freelancer/contracts" className="text-gray-600 hover:text-blue-600 transition-colors">
                  <FileText className="h-5 w-5" />
                </Link>
              </nav>
            )}

            {actions}

            {showProfile && (
              <div className="flex items-center space-x-2">
                <Link href={`/${userProfile?.role}/profile`}>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
