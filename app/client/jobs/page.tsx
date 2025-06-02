"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, DollarSign, Plus, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Job } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ClientJobsPage() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (userProfile) {
      fetchJobs()
    }
  }, [userProfile, searchTerm, statusFilter])

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("client_id", userProfile?.id)
        .order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return

    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId)

      if (error) throw error

      toast({
        title: "Job deleted",
        description: "The job has been deleted successfully.",
      })

      fetchJobs()
    } catch (error: any) {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "default"
      case "in_progress":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
              <Link href="/jobs/post">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search your jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_status">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <CardDescription className="text-base">{job.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                        {job.budget_min && job.budget_max && (
                          <div className="flex items-center text-green-600 font-semibold">
                            <DollarSign className="h-4 w-4 mr-1" />${job.budget_min} - ${job.budget_max}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4">
                      {job.category && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Filter className="h-4 w-4 mr-1" />
                          {job.category}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.required_skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Status: <span className="capitalize">{job.status.replace("_", " ")}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/jobs/${job.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        {job.status === "open" && (
                          <Link href={`/jobs/${job.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {jobs.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter
                      ? "Try adjusting your search criteria"
                      : "You haven't posted any jobs yet"}
                  </p>
                  <Link href="/jobs/post">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Post Your First Job</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
