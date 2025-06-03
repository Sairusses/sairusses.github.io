"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Users, FileText, Plus, Eye, Edit } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Job, Proposal } from "@/lib/types"

export default function ClientDashboard() {
  const { userProfile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData()
    }
  }, [userProfile])

  const fetchDashboardData = async () => {
    try {
      // Fetch jobs
      const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("client_id", userProfile?.id)
          .order("created_at", { ascending: false })

      // Fetch proposals for client's jobs
      const { data: proposalsData } = await supabase
          .from("proposals")
          .select(`
          *,
          job:jobs(*),
          employee:users(*)
        `)
          .in("job_id", jobsData?.map((job) => job.id) || [])
          .order("created_at", { ascending: false })

      setJobs(jobsData || [])
      setProposals(proposalsData || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((job) => job.status === "open").length,
    pendingProposals: proposals.filter((p) => p.status === "pending").length,
  }

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    )
  }

  return (
      <ProtectedRoute requiredRole="client">
        <div className="min-h-screen bg-gray-50">
          <Navbar />

          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userProfile?.full_name}</h1>
              <p className="text-gray-600">Manage your jobs and review proposals</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalJobs}</div>
                  <p className="text-xs text-muted-foreground">Jobs posted on platform</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeJobs}</div>
                  <p className="text-xs text-muted-foreground">Currently accepting proposals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Proposals</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingProposals}</div>
                  <p className="text-xs text-muted-foreground">Awaiting your review</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Jobs */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Jobs</CardTitle>
                    <CardDescription>Your latest job postings</CardDescription>
                  </div>
                  <Link href="/jobs/post">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Post Job
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-gray-600 truncate">{job.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={job.status === "open" ? "default" : "secondary"}>{job.status}</Badge>
                              {job.budget_min && job.budget_max && (
                                  <span className="text-sm text-gray-500">
                              ${job.budget_min} - ${job.budget_max}
                            </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/client/jobs/details?id=${job.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/jobs/${job.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                    ))}
                    {jobs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No jobs posted yet</p>
                          <Link href="/jobs/post">
                            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Post Your First Job</Button>
                          </Link>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Proposals */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Proposals</CardTitle>
                  <CardDescription>Latest proposals from freelancers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposals.slice(0, 5).map((proposal) => (
                        <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{proposal.job?.title}</h3>
                            <p className="text-sm text-gray-600">by {proposal.employee?.full_name}</p>
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
                          <Link href="/client/proposals">
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
                          <p className="text-sm">Post a job to start receiving proposals</p>
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
