"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Eye, MessageSquare, CheckCircle, Clock, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Proposal } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ClientProposalsPage() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (userProfile) {
      fetchProposals()
    }
  }, [userProfile])

  const fetchProposals = async () => {
    try {
      // Get proposals for client's jobs
      const { data: clientJobs } = await supabase.from("jobs").select("id").eq("client_id", userProfile?.id)

      if (clientJobs && clientJobs.length > 0) {
        const { data, error } = await supabase
          .from("proposals")
          .select(`
            *,
            job:jobs(*),
            employee:users(*)
          `)
          .in(
            "job_id",
            clientJobs.map((job) => job.id),
          )
          .order("created_at", { ascending: false })

        if (error) throw error
        setProposals(data || [])
      } else {
        setProposals([])
      }
    } catch (error) {
      console.error("Error fetching proposals:", error)
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
            job_id: proposal.job_id,
            client_id: userProfile?.id,
            employee_id: proposal.employee_id,
            proposal_id: proposalId,
            agreed_rate: proposal.proposed_rate || 0,
            start_date: new Date().toISOString(),
          })

          if (contractError) throw contractError

          // Update job status
          await supabase.from("jobs").update({ status: "in_progress" }).eq("id", proposal.job_id)
        }
      }

      toast({
        title: `Proposal ${action}ed`,
        description: `The proposal has been ${action}ed successfully.`,
      })

      fetchProposals()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleChatWithEmployee = async (proposal: Proposal) => {
    try {
      // Check if a contract already exists for this proposal
      const { data: existingContract } = await supabase
        .from("contracts")
        .select("id")
        .eq("proposal_id", proposal.id)
        .maybeSingle()

      if (existingContract) {
        // Navigate to existing contract chat
        router.push(`/chat?contract=${existingContract.id}`)
      } else {
        // Create a temporary conversation identifier for pre-contract chat
        router.push(`/chat?proposal=${proposal.id}`)
      }
    } catch (error) {
      console.error("Error navigating to chat:", error)
      toast({
        title: "Error",
        description: "Failed to open chat",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <X className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "accepted":
        return "default"
      case "rejected":
        return "secondary"
      default:
        return "outline"
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Received Proposals</h1>
            <p className="text-gray-600">Review and manage proposals from freelancers</p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Proposals</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {proposals.map((proposal) => (
                <Card key={proposal.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{proposal.job?.title}</CardTitle>
                        <CardDescription>Proposal from {proposal.employee?.full_name}</CardDescription>
                      </div>
                      <Badge variant={getStatusColor(proposal.status)} className="flex items-center gap-1">
                        {getStatusIcon(proposal.status)}
                        {proposal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={proposal.employee?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{proposal.employee?.full_name?.charAt(0) || "F"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{proposal.employee?.full_name}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {proposal.proposed_rate && <span>${proposal.proposed_rate}/hr</span>}
                            {proposal.estimated_duration && <span>{proposal.estimated_duration}</span>}
                          </div>
                        </div>
                      </div>

                      {proposal.cover_letter && (
                        <div>
                          <h4 className="font-medium mb-2">Cover Letter</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{proposal.cover_letter}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Link href={`/jobs/${proposal.job_id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Job
                          </Button>
                        </Link>

                        <Button variant="outline" size="sm" onClick={() => handleChatWithEmployee(proposal)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat with Employee
                        </Button>

                        {proposal.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleProposalAction(proposal.id, "accept")}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Accept Proposal
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProposalAction(proposal.id, "reject")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {["pending", "accepted", "rejected"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-6">
                {proposals
                  .filter((p) => p.status === status)
                  .map((proposal) => (
                    <Card key={proposal.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{proposal.job?.title}</CardTitle>
                            <CardDescription>Proposal from {proposal.employee?.full_name}</CardDescription>
                          </div>
                          <Badge variant={getStatusColor(proposal.status)} className="flex items-center gap-1">
                            {getStatusIcon(proposal.status)}
                            {proposal.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={proposal.employee?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{proposal.employee?.full_name?.charAt(0) || "F"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{proposal.employee?.full_name}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {proposal.proposed_rate && <span>${proposal.proposed_rate}/hr</span>}
                                {proposal.estimated_duration && <span>{proposal.estimated_duration}</span>}
                              </div>
                            </div>
                          </div>

                          {proposal.cover_letter && (
                            <div>
                              <h4 className="font-medium mb-2">Cover Letter</h4>
                              <p className="text-gray-700 whitespace-pre-wrap">{proposal.cover_letter}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-4 border-t">
                            <Link href={`/jobs/${proposal.job_id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Job
                              </Button>
                            </Link>

                            <Button variant="outline" size="sm" onClick={() => handleChatWithEmployee(proposal)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Chat with Employee
                            </Button>

                            {proposal.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleProposalAction(proposal.id, "accept")}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Accept Proposal
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleProposalAction(proposal.id, "reject")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>

          {proposals.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
              <p className="text-gray-600 mb-4">Post jobs to start receiving proposals from freelancers</p>
              <Link href="/jobs/post">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Post a Job</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
