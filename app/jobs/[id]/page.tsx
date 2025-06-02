"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Clock, DollarSign, User, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Job, Proposal } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"

export async function generateStaticParams() {
  const supabase = getSupabaseClient()

  const { data: jobs, error } = await supabase.from("jobs").select("id")

  if (error || !jobs) {
    console.error("Failed to fetch jobs for static params:", error)
    return []
  }

  return jobs.map((job) => ({
    id: job.id.toString(),
  }))
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [job, setJob] = useState<Job | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const supabase = getSupabaseClient()
  const [proposalFiles, setProposalFiles] = useState<Array<{ url: string; name: string; type: string; size: number }>>(
    [],
  )

  useEffect(() => {
    if (params.id) {
      fetchJobDetails()
    }
  }, [params.id])

  const fetchJobDetails = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select(`
          *,
          client:users(*)
        `)
        .eq("id", params.id)
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
          .eq("job_id", params.id)
          .order("created_at", { ascending: false })

        setProposals(proposalsData || [])
      }

      setJob(jobData)
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

  const handleSubmitProposal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userProfile || userProfile.role !== "employee") return

    setSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      const { error } = await supabase.from("proposals").insert({
        job_id: params.id,
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

      // If accepting, create a contract
      if (action === "accept") {
        const proposal = proposals.find((p) => p.id === proposalId)
        if (proposal) {
          const { error: contractError } = await supabase.from("contracts").insert({
            job_id: job?.id,
            client_id: job?.client_id,
            employee_id: proposal.employee_id,
            proposal_id: proposalId,
            agreed_rate: proposal.proposed_rate || 0,
          })

          if (contractError) throw contractError

          // Update job status
          await supabase.from("jobs").update({ status: "in_progress" }).eq("id", job?.id)
        }
      }

      toast({
        title: `Proposal ${action}ed`,
        description: `The proposal has been ${action}ed successfully.`,
      })

      fetchJobDetails()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
          <Link href="/jobs">
            <Button>Back to Jobs</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = userProfile?.id === job.client_id
  const canPropose = userProfile?.role === "employee" && !isOwner

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/jobs" className="flex items-center text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
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

              {/* Client Info */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">About the Client</h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={job.client?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{job.client?.full_name?.charAt(0) || "C"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{job.client?.full_name}</p>
                    {job.client?.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.client.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canPropose && (
                <div className="border-t pt-6 mt-6">
                  {!showProposalForm ? (
                    <Button
                      onClick={() => setShowProposalForm(true)}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Submit Proposal
                    </Button>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Submit Your Proposal</CardTitle>
                        <CardDescription>Tell the client why you're the right person for this job</CardDescription>
                      </CardHeader>
                      <CardContent>
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
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
    </div>
  )
}
