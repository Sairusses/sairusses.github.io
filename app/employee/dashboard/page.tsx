"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, FileText, CheckCircle, Search, Eye } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Job, Proposal, Contract } from "@/lib/types"

export default function EmployeeDashboard() {
  const { userProfile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData()
    }
  }, [userProfile])

  const fetchDashboardData = async () => {
    try {
      // Fetch recent open jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select(`
          *,
          client:users(*)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5)

      // Fetch user's proposals
      const { data: proposalsData } = await supabase
        .from("proposals")
        .select(`
          *,
          job:jobs(*)
        `)
        .eq("employee_id", userProfile?.id)
        .order("created_at", { ascending: false })

      // Fetch user's contracts
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`
          *,
          job:jobs(*),
          client:users(*)
        `)
        .eq("employee_id", userProfile?.id)
        .order("created_at", { ascending: false })

      setJobs(jobsData || [])
      setProposals(proposalsData || [])
      setContracts(contractsData || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    activeContracts: contracts.filter((c) => c.status === "active").length,
    pendingProposals: proposals.filter((p) => p.status === "pending").length,
    completedContracts: contracts.filter((c) => c.status === "completed").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="employee">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userProfile?.full_name}</h1>
            <p className="text-gray-600">Find new opportunities and manage your work</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeContracts}</div>
                <p className="text-xs text-muted-foreground">Currently working on</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Proposals</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingProposals}</div>
                <p className="text-xs text-muted-foreground">Awaiting client response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedContracts}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Available Jobs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Available Jobs</CardTitle>
                  <CardDescription>Latest opportunities for you</CardDescription>
                </div>
                <Link href="/employee/jobs">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Search className="h-4 w-4 mr-2" />
                    Browse All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{job.title}</h3>
                        <p className="text-sm text-gray-600 truncate">{job.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{job.category}</Badge>
                          {job.budget_min && job.budget_max && (
                            <span className="text-sm text-gray-500">
                              ${job.budget_min} - ${job.budget_max}
                            </span>
                          )}
                        </div>
                        {job.required_skills && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.required_skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No jobs available</p>
                      <p className="text-sm">Check back later for new opportunities</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* My Proposals */}
            <Card>
              <CardHeader>
                <CardTitle>My Proposals</CardTitle>
                <CardDescription>Track your submitted proposals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposals.slice(0, 5).map((proposal) => (
                    <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{proposal.job?.title}</h3>
                        <p className="text-sm text-gray-600">
                          Submitted {new Date(proposal.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              proposal.status === "pending"
                                ? "default"
                                : proposal.status === "accepted"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {proposal.status}
                          </Badge>
                          {proposal.proposed_rate && (
                            <span className="text-sm text-gray-500">${proposal.proposed_rate}/hr</span>
                          )}
                        </div>
                      </div>
                      <Link href="/employee/proposals">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {proposals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No proposals yet</p>
                      <Link href="/employee/jobs">
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Browse Jobs</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
