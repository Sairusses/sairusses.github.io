"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Clock, DollarSign, User, Send, ArrowLeft, Building, Star, Globe } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Job } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"

export default function EmployeeJobDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const supabase = getSupabaseClient()
  const jobId = searchParams.get("id")
  const [proposalFiles, setProposalFiles] = useState<Array<{ url: string; name: string; type: string; size: number }>>(
    [],
  )

  useEffect(() => {
    if (jobId && userProfile) {
      fetchJobDetails()
      checkIfApplied()
    }
  }, [jobId, userProfile])

  const fetchJobDetails = async () => {
    if (!jobId) {
      router.push("/employee/jobs")
      return
    }

    try {
      // Fetch job details with enhanced client information
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select(`
          *,
          client:users(*)
        `)
        .eq("id", jobId)
        .eq("status", "open") // Only show open jobs to employees
        .single()

      if (jobError) throw jobError

      setJob(jobData)
    } catch (error) {
      console.error("Error fetching job details:", error)
      toast({
        title: "Error",
        description: "Failed to load job details or job is no longer available",
        variant: "destructive",
      })
      router.push("/employee/jobs")
    } finally {
      setLoading(false)
    }
  }

  const checkIfApplied = async () => {
    if (!jobId || !userProfile) return

    try {
      const { data } = await supabase
        .from("proposals")
        .select("id")
        .eq("job_id", jobId)
        .eq("employee_id", userProfile.id)
        .single()

      setHasApplied(!!data)
    } catch (error) {
      // No proposal found, which is fine
      setHasApplied(false)
    }
  }

  const handleSubmitProposal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userProfile || userProfile.role !== "employee") return

    setSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      const { error } = await supabase.from("proposals").insert({
        job_id: jobId,
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
      setHasApplied(true)
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

  if (loading) {
    return (
      <ProtectedRoute requiredRole="employee">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!job) {
    return (
      <ProtectedRoute requiredRole="employee">
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-4xl mx-auto py-8 px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
            <Link href="/employee/jobs">
              <Button>Back to Browse Jobs</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="employee">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/employee/jobs" className="flex items-center text-blue-600 hover:text-blue-500 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse Jobs
            </Link>
          </div>

          <div className="grid gap-8">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {job.category && <Badge variant="outline">{job.category}</Badge>}
                      {job.timeline && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.timeline}
                        </div>
                      )}
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {job.budget_min && job.budget_max && (
                    <div className="text-right">
                      <div className="flex items-center text-green-600 font-semibold text-xl">
                        <DollarSign className="h-5 w-5 mr-1" />${job.budget_min} - ${job.budget_max}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>

                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Client Information Card */}
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
                    <AvatarImage src={job.client?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-lg">{job.client?.full_name?.charAt(0) || "C"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{job.client?.full_name}</h3>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 mr-1" />
                        <span className="text-sm text-gray-600">4.9 (23 reviews)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {job.client?.company_name && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Company:</span>
                          <p className="text-sm">{job.client.company_name}</p>
                        </div>
                      )}
                      {job.client?.location && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Location:</span>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.client.location}
                          </div>
                        </div>
                      )}
                      {job.client?.website && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Website:</span>
                          <div className="flex items-center text-sm">
                            <Globe className="h-3 w-3 mr-1" />
                            <a
                              href={job.client.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-500"
                            >
                              {job.client.website}
                            </a>
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">Member since:</span>
                        <p className="text-sm">{new Date(job.client?.created_at || "").toLocaleDateString()}</p>
                      </div>
                    </div>

                    {job.client?.bio && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">About:</span>
                        <p className="text-sm text-gray-700 mt-1">{job.client.bio}</p>
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
            {!hasApplied && (
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
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
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

            {hasApplied && (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-green-600 mb-2">✅</div>
                  <p className="text-gray-600">You have already submitted a proposal for this job.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
