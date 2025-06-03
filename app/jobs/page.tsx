"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  User,
  Send,
  ArrowLeft,
  Building,
  Star,
  Globe,
  Plus,
  X,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Job, Proposal } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"

type ViewMode = "list" | "detail" | "post" | "edit"

export default function JobsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const { toast } = useToast()

  // View state management
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  // Data state
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [proposalFiles, setProposalFiles] = useState<Array<{ url: string; name: string; type: string; size: number }>>(
      [],
  )
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string; type: string; size: number }>>(
      [],
  )

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [budgetFilter, setBudgetFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const supabase = getSupabaseClient()

  const categories = [
    "Web Development",
    "Mobile Development",
    "Design",
    "Writing",
    "Marketing",
    "Data Science",
    "Other",
  ]

  // Initialize view based on URL parameters
  useEffect(() => {
    const view = searchParams.get("view") as ViewMode
    const jobId = searchParams.get("id")

    if (view && ["list", "detail", "post", "edit"].includes(view)) {
      setViewMode(view)
    }

    if (jobId) {
      setSelectedJobId(jobId)
      if (view === "detail" || view === "edit") {
        fetchJobDetails(jobId)
      }
    }

    if (view !== "detail" && view !== "edit") {
      fetchJobs()
    }
  }, [searchParams])

  // Update URL when view changes
  const updateURL = (newView: ViewMode, jobId?: string) => {
    const params = new URLSearchParams()
    params.set("view", newView)
    if (jobId) {
      params.set("id", jobId)
    }
    router.push(`/jobs?${params.toString()}`, { scroll: false })
  }

  const fetchJobs = async () => {
    try {
      let query = supabase
          .from("jobs")
          .select(`
          *,
          client:users(*)
        `)
          .order("created_at", { ascending: false })

      // Apply filters based on user role
      if (userProfile?.role === "client") {
        query = query.eq("client_id", userProfile.id)
      } else {
        query = query.eq("status", "open")
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (categoryFilter && categoryFilter !== "all") {
        query = query.eq("category", categoryFilter)
      }

      if (statusFilter && statusFilter !== "all_status") {
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

  const fetchJobDetails = async (jobId: string) => {
    try {
      setLoading(true)

      const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select(`
          *,
          client:users(*)
        `)
          .eq("id", jobId)
          .single()

      if (jobError) throw jobError

      // Fetch proposals if user is the client
      if (userProfile?.role === "client" && jobData.client_id === userProfile.id) {
        const { data: proposalsData } = await supabase
            .from("proposals")
            .select(`
            *,
            employee:users(*)
          `)
            .eq("job_id", jobId)
            .order("created_at", { ascending: false })

        setProposals(proposalsData || [])
      }

      setSelectedJob(jobData)

      // Set skills for edit mode
      if (jobData.required_skills) {
        setSkills(jobData.required_skills)
      }
    } catch (error) {
      console.error("Error fetching job details:", error)
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Refetch jobs when filters change
  useEffect(() => {
    if (viewMode === "list") {
      fetchJobs()
    }
  }, [searchTerm, categoryFilter, budgetFilter, statusFilter, viewMode])

  // Navigation functions
  const goToList = () => {
    setViewMode("list")
    setSelectedJob(null)
    setSelectedJobId(null)
    updateURL("list")
  }

  const goToDetail = (jobId: string) => {
    setSelectedJobId(jobId)
    setViewMode("detail")
    updateURL("detail", jobId)
    fetchJobDetails(jobId)
  }

  const goToPost = () => {
    setViewMode("post")
    setSkills([])
    setUploadedFiles([])
    updateURL("post")
  }

  const goToEdit = (jobId: string) => {
    setSelectedJobId(jobId)
    setViewMode("edit")
    updateURL("edit", jobId)
    fetchJobDetails(jobId)
  }

  // Skill management
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  // Form handlers
  const handlePostJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userProfile) return

    setSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      const { data, error } = await supabase
          .from("jobs")
          .insert({
            client_id: userProfile.id,
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            category: formData.get("category") as string,
            budget_min: Number.parseFloat(formData.get("budgetMin") as string) || null,
            budget_max: Number.parseFloat(formData.get("budgetMax") as string) || null,
            timeline: formData.get("timeline") as string,
            required_skills: skills,
          })
          .select()
          .single()

      if (error) throw error

      toast({
        title: "Job posted successfully!",
        description: "Your job is now live and accepting proposals.",
      })

      goToDetail(data.id)
    } catch (error: any) {
      toast({
        title: "Error posting job",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedJob) return

    setSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      const { error } = await supabase
          .from("jobs")
          .update({
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            category: formData.get("category") as string,
            budget_min: Number.parseFloat(formData.get("budgetMin") as string) || null,
            budget_max: Number.parseFloat(formData.get("budgetMax") as string) || null,
            timeline: formData.get("timeline") as string,
            required_skills: skills,
          })
          .eq("id", selectedJob.id)

      if (error) throw error

      toast({
        title: "Job updated successfully!",
        description: "Your job has been updated.",
      })

      goToDetail(selectedJob.id)
    } catch (error: any) {
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
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

      goToList()
    } catch (error: any) {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSubmitProposal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userProfile || userProfile.role !== "employee" || !selectedJobId) return

    setSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      const { error } = await supabase.from("proposals").insert({
        job_id: selectedJobId,
        employee_id: userProfile.id,
        cover_letter: formData.get("coverLetter") as string,
        proposed_rate: Number.parseFloat(formData.get("proposedRate") as string),
        estimated_duration: formData.get("estimatedDuration") as string,
        attachments: proposalFiles,
      })

      if (error) throw error

      toast({
        title: "Proposal submitted!",
        description: "Your proposal has been sent to the client.",
      })

      setShowProposalForm(false)
      fetchJobDetails(selectedJobId)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleProposalAction = async (proposalId: string, action: "accept" | "reject") => {
    try {
      const { error } = await supabase
          .from("proposals")
          .update({ status: action === "accept" ? "accepted" : "rejected" })
          .eq("id", proposalId)

      if (error) throw error

      if (action === "accept") {
        const proposal = proposals.find((p) => p.id === proposalId)
        if (proposal && selectedJob) {
          const { error: contractError } = await supabase.from("contracts").insert({
            job_id: selectedJob.id,
            client_id: selectedJob.client_id,
            employee_id: proposal.employee_id,
            proposal_id: proposalId,
            agreed_rate: proposal.proposed_rate || 0,
          })

          if (contractError) throw contractError

          await supabase.from("jobs").update({ status: "in_progress" }).eq("id", selectedJob.id)
        }
      }

      toast({
        title: `Proposal ${action}ed`,
        description: `The proposal has been ${action}ed successfully.`,
      })

      if (selectedJobId) {
        fetchJobDetails(selectedJobId)
      }
    } catch (error: any) {
      toast({
        title: "Error",
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

  // Render different views
  const renderJobList = () => (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {userProfile?.role === "client" ? "My Jobs" : "Browse Jobs"}
            </h1>
            {userProfile?.role === "client" && (
                <Button onClick={goToPost} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
            )}
          </div>

          {userProfile?.role === "employee" && (
              <p className="text-gray-600 mb-6">Find the perfect opportunity for your skills</p>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                  placeholder={userProfile?.role === "client" ? "Search your jobs..." : "Search jobs..."}
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

            {userProfile?.role === "client" ? (
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
            ) : (
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
            )}
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
                          {userProfile?.role === "client" && <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>}
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
                          {userProfile?.role === "client" ? (
                              <>
                                Status: <span className="capitalize">{job.status.replace("_", " ")}</span>
                              </>
                          ) : (
                              <>
                                Posted by {job.client?.full_name} • {new Date(job.created_at).toLocaleDateString()}
                              </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => goToDetail(job.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {userProfile?.role === "employee" ? "View & Apply" : "View"}
                          </Button>
                          {userProfile?.role === "client" && userProfile.id === job.client_id && (
                              <>
                                {job.status === "open" && (
                                    <Button variant="outline" size="sm" onClick={() => goToEdit(job.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteJob(job.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                          )}
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
                      {searchTerm || categoryFilter || budgetFilter || statusFilter
                          ? "Try adjusting your search criteria"
                          : userProfile?.role === "client"
                              ? "You haven't posted any jobs yet"
                              : "No jobs are currently available"}
                    </p>
                    {userProfile?.role === "client" && (
                        <Button onClick={goToPost} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Post Your First Job
                        </Button>
                    )}
                  </div>
              )}
            </div>
        )}
      </div>
  )

  const renderJobDetail = () => {
    if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
      )
    }

    if (!selectedJob) {
      return (
          <div className="max-w-4xl mx-auto py-8 px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
            <Button onClick={goToList}>Back to Jobs</Button>
          </div>
      )
    }

    const isOwner = userProfile?.id === selectedJob.client_id
    const canPropose = userProfile?.role === "employee" && !isOwner

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button onClick={goToList} className="flex items-center text-blue-600 hover:text-blue-500 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </button>
          </div>

          <div className="grid gap-8">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{selectedJob.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {selectedJob.category && <Badge variant="outline">{selectedJob.category}</Badge>}
                      {selectedJob.timeline && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {selectedJob.timeline}
                          </div>
                      )}
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Posted {new Date(selectedJob.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {selectedJob.budget_min && selectedJob.budget_max && (
                      <div className="text-right">
                        <div className="flex items-center text-green-600 font-semibold text-xl">
                          <DollarSign className="h-5 w-5 mr-1" />${selectedJob.budget_min} - ${selectedJob.budget_max}
                        </div>
                      </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.required_skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                        ))}
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  About the Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedJob.client?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-lg">{selectedJob.client?.full_name?.charAt(0) || "C"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{selectedJob.client?.full_name}</h3>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 mr-1" />
                        <span className="text-sm text-gray-600">4.9 (23 reviews)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {selectedJob.client?.company_name && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Company:</span>
                            <p className="text-sm">{selectedJob.client.company_name}</p>
                          </div>
                      )}
                      {selectedJob.client?.location && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Location:</span>
                            <div className="flex items-center text-sm">
                              <MapPin className="h-3 w-3 mr-1" />
                              {selectedJob.client.location}
                            </div>
                          </div>
                      )}
                      {selectedJob.client?.website && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Website:</span>
                            <div className="flex items-center text-sm">
                              <Globe className="h-3 w-3 mr-1" />
                              <a
                                  href={selectedJob.client.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-500"
                              >
                                {selectedJob.client.website}
                              </a>
                            </div>
                          </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">Member since:</span>
                        <p className="text-sm">{new Date(selectedJob.client?.created_at || "").toLocaleDateString()}</p>
                      </div>
                    </div>

                    {selectedJob.client?.bio && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">About:</span>
                          <p className="text-sm text-gray-700 mt-1">{selectedJob.client.bio}</p>
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>✅ Payment verified</span>
                        <span>✅ Identity verified</span>
                        <span>📊 15 jobs posted</span>
                        <span>💰 $25k+ spent on platform</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proposal Form */}
            {canPropose && (
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Your Proposal</CardTitle>
                    <CardDescription>Show the client why you're the perfect fit for this project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!showProposalForm ? (
                        <Button
                            onClick={() => setShowProposalForm(true)}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Submit Proposal
                        </Button>
                    ) : (
                        <form onSubmit={handleSubmitProposal} className="space-y-4">
                          <div>
                            <Label htmlFor="coverLetter">Cover Letter</Label>
                            <Textarea
                                id="coverLetter"
                                name="coverLetter"
                                placeholder="Explain why you're perfect for this job..."
                                rows={4}
                                required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="proposedRate">Hourly Rate ($)</Label>
                              <Input
                                  id="proposedRate"
                                  name="proposedRate"
                                  type="number"
                                  step="0.01"
                                  placeholder="50.00"
                                  required
                              />
                            </div>
                            <div>
                              <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                              <Input id="estimatedDuration" name="estimatedDuration" placeholder="2 weeks" required />
                            </div>
                          </div>
                          <div>
                            <Label>Attachments (Optional)</Label>
                            <p className="text-sm text-gray-500 mb-3">
                              Upload your portfolio, credentials, or relevant work samples
                            </p>
                            <FileUpload
                                uploadType="proposal_attachment"
                                acceptedTypes={["image/*", ".pdf", ".doc", ".docx"]}
                                maxFileSize={10}
                                maxFiles={3}
                                onFilesUploaded={setProposalFiles}
                                className="mb-4"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                              {submitting ? "Submitting..." : "Submit Proposal"}
                              <Send className="h-4 w-4 ml-2" />
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowProposalForm(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                    )}
                  </CardContent>
                </Card>
            )}

            {/* Proposals (for job owner) */}
            {isOwner && proposals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Proposals ({proposals.length})</CardTitle>
                    <CardDescription>Review proposals from freelancers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {proposals.map((proposal) => (
                          <div key={proposal.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={proposal.employee?.avatar_url || "/placeholder.svg"} />
                                  <AvatarFallback>{proposal.employee?.full_name?.charAt(0) || "F"}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{proposal.employee?.full_name}</p>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {proposal.proposed_rate && <span>${proposal.proposed_rate}/hr</span>}
                                    {proposal.estimated_duration && <span>{proposal.estimated_duration}</span>}
                                  </div>
                                </div>
                              </div>
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
                            </div>

                            {proposal.cover_letter && (
                                <div className="mb-4">
                                  <p className="text-gray-700 whitespace-pre-wrap">{proposal.cover_letter}</p>
                                </div>
                            )}

                            {proposal.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                      size="sm"
                                      onClick={() => handleProposalAction(proposal.id, "accept")}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleProposalAction(proposal.id, "reject")}
                                  >
                                    Reject
                                  </Button>
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
            )}
          </div>
        </div>
    )
  }

  const renderJobForm = (isEdit = false) => (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button onClick={goToList} className="flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEdit ? "Edit Job" : "Post a New Job"}</h1>
          <p className="text-gray-600">
            {isEdit ? "Update your job details" : "Describe your project and find the perfect freelancer"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Provide clear information about your project requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isEdit ? handleEditJob : handlePostJob} className="space-y-6">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Build a responsive website for my business"
                    defaultValue={isEdit ? selectedJob?.title : ""}
                    required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={isEdit ? selectedJob?.category : ""} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your project in detail. Include what you need, your goals, and any specific requirements..."
                    rows={6}
                    defaultValue={isEdit ? selectedJob?.description : ""}
                    required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetMin">Budget Min ($)</Label>
                  <Input
                      id="budgetMin"
                      name="budgetMin"
                      type="number"
                      step="0.01"
                      placeholder="500"
                      defaultValue={isEdit ? selectedJob?.budget_min || "" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="budgetMax">Budget Max ($)</Label>
                  <Input
                      id="budgetMax"
                      name="budgetMax"
                      type="number"
                      step="0.01"
                      placeholder="2000"
                      defaultValue={isEdit ? selectedJob?.budget_max || "" : ""}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="timeline">Timeline</Label>
                <Input
                    id="timeline"
                    name="timeline"
                    placeholder="e.g., 2-3 weeks, 1 month, ASAP"
                    defaultValue={isEdit ? selectedJob?.timeline || "" : ""}
                />
              </div>

              <div>
                <Label>Required Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                  ))}
                </div>
              </div>

              {!isEdit && (
                  <div>
                    <Label>Project Files (Optional)</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload any relevant documents, specifications, or reference materials
                    </p>
                    <FileUpload
                        uploadType="job_attachment"
                        acceptedTypes={["image/*", ".pdf", ".doc", ".docx", ".txt"]}
                        maxFileSize={10}
                        maxFiles={5}
                        onFilesUploaded={setUploadedFiles}
                        className="mb-4"
                    />
                  </div>
              )}

              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? (isEdit ? "Updating..." : "Posting...") : isEdit ? "Update Job" : "Post Job"}
                </Button>
                <Button type="button" variant="outline" onClick={goToList}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  )

  // Main render logic
  if (userProfile?.role === "client" && (viewMode === "post" || viewMode === "edit")) {
    return (
        <ProtectedRoute requiredRole="client">
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            {renderJobForm(viewMode === "edit")}
          </div>
        </ProtectedRoute>
    )
  }

  if (userProfile?.role === "employee" && (viewMode === "post" || viewMode === "edit")) {
    // Redirect employees away from post/edit views
    goToList()
    return null
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {viewMode === "list" && renderJobList()}
        {viewMode === "detail" && renderJobDetail()}
      </div>
  )
}
