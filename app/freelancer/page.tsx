"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { AppBar } from "@/components/ui/app-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Briefcase, FileText, TrendingUp, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function FreelancerDashboard() {
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

  const isProfileComplete = userProfile.name && userProfile.overview && userProfile.skills?.length

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar title="Dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userProfile.name || "Freelancer"}!</h1>
          <p className="text-gray-600">Find your next opportunity and grow your career</p>
        </div>

        {/* Profile Completion Alert */}
        {!isProfileComplete && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-yellow-800">Complete your profile</h3>
                  <p className="text-sm text-yellow-700">A complete profile helps you get more job opportunities</p>
                </div>
                <Link href="/freelancer/profile">
                  <Button variant="outline" size="sm">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No active contracts yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Start applying to jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Complete your first project</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Jobs</CardTitle>
              <CardDescription>New opportunities for you</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Briefcase}
                title="No jobs available"
                description="Check back later for new job opportunities that match your skills"
                action={
                  <Link href="/freelancer/jobs">
                    <Button>
                      <Briefcase className="h-4 w-4 mr-2" />
                      Browse Jobs
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Contracts</CardTitle>
              <CardDescription>Your ongoing projects</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FileText}
                title="No contracts yet"
                description="Once you get hired for projects, your contracts will appear here"
                action={
                  <Link href="/freelancer/contracts">
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Contracts
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Action Button */}
      <Link href="/freelancer/profile">
        <Button className="fab-button">
          <User className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  )
}
