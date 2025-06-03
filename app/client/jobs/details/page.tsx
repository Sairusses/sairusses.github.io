"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, DollarSign, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Job, Proposal } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ClientJobDetailsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [job, setJob] = useState<Job | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()
  const jobId = searchParams.get("id")

  useEffect(() => {
    if (jobId && userProfile) {
      fetchJobDetails()
    }
  }, [jobId, userProfile])

  const fetchJobDetails = async () => {
    if (!jobId) {
      router.push("/client/jobs")
      return
    }

    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select(`
          *,
          client:users(*)
        `)
        .eq("id", jobId)
        .eq("client_id", userProfile?.id) // Ensure client can only view their own jobs
        .single()

      if (jobError) throw jobError

      // Fetch proposals for this job
      const { data: proposalsData } = await supabase
        .from("proposals")
        .select(`
          *,
          employee:users(*)
        `)
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })

      setJob(jobData)
      setProposals(proposalsData || [])
    } catch (error) {
      console.error("Error fetching job details:", error)
      toast({
        title: "Error",
        description: "Failed to load job details or you don't have permission to view this job",
        variant: "destructive",
      })
      router.push("/client/jobs")
    } finally {
      setLoading(false)
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
      <ProtectedRoute requiredRole="client">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!job) {
    return (
      <ProtectedRoute requiredRole="client">
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-4xl mx-auto py-8 px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
            <Link href="/client/jobs">
              <Button>Back to My Jobs</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/client/jobs" className="flex items-center text-blue-600 hover:text-blue-500 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Jobs
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

            {/* Proposals */}
            {proposals.length > 0 && (
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

            {proposals.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">No proposals received yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
