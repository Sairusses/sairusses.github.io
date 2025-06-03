"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, MapPin, Clock, DollarSign, Eye } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Job } from "@/lib/types"

export default function EmployeeJobsPage() {
  const { userProfile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [budgetFilter, setBudgetFilter] = useState("")
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchJobs()
  }, [searchTerm, categoryFilter, budgetFilter])

  const fetchJobs = async () => {
    try {
      let query = supabase
          .from("jobs")
          .select(`
          *,
          client:users(*)
        `)
          .eq("status", "open")
          .order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (categoryFilter) {
        query = query.eq("category", categoryFilter)
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

  const categories = [
    "Web Development",
    "Mobile Development",
    "Design",
    "Writing",
    "Marketing",
    "Data Science",
    "Other",
  ]

  return (
      <ProtectedRoute requiredRole="employee">
        <div className="min-h-screen bg-gray-50">
          <Navbar />

          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Jobs</h1>
              <p className="text-gray-600">Find the perfect opportunity for your skills</p>

              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mt-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Budget Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Budget</SelectItem>
                    <SelectItem value="0-500">$0 - $500</SelectItem>
                    <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                    <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                    <SelectItem value="5000+">$5,000+</SelectItem>
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
                            <div className="text-right">
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
                            {job.timeline && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {job.timeline}
                                </div>
                            )}
                            {job.client?.location && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {job.client.location}
                                </div>
                            )}
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
                              Posted by {job.client?.full_name} • {new Date(job.created_at).toLocaleDateString()}
                            </div>
                            <Link href={`/jobs?view=detail&id=${job.id}`}>
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Eye className="h-4 w-4 mr-2" />
                                View & Apply
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                  ))}

                  {jobs.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-600">
                          {searchTerm || categoryFilter || budgetFilter
                              ? "Try adjusting your search criteria"
                              : "No jobs are currently available"}
                        </p>
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
  )
}
