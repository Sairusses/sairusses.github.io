"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, MessageSquare, CheckCircle, Clock, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Proposal } from "@/lib/types"

export default function EmployeeProposalsPage() {
  const { userProfile } = useAuth()
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
      const { data, error } = await supabase
        .from("proposals")
        .select(`
          *,
          job:jobs(*)
        `)
        .eq("employee_id", userProfile?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProposals(data || [])
    } catch (error) {
      console.error("Error fetching proposals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChatWithClient = async (proposal: Proposal) => {
    try {
      // Check if a contract exists for this proposal
      const { data: existingContract } = await supabase
        .from("contracts")
        .select("id")
        .eq("proposal_id", proposal.id)
        .maybeSingle()

      if (existingContract) {
        // Navigate to contract chat
        router.push(`/chat?contract=${existingContract.id}`)
      } else {
        // Navigate to proposal chat
        router.push(`/chat?proposal=${proposal.id}`)
      }
    } catch (error) {
      console.error("Error navigating to chat:", error)
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
    <ProtectedRoute requiredRole="employee">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Proposals</h1>
            <p className="text-gray-600">Track the status of your submitted proposals</p>
          </div>

          <div className="space-y-6">
            {proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{proposal.job?.title}</CardTitle>
                      <CardDescription>Submitted {new Date(proposal.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                    <Badge variant={getStatusColor(proposal.status)} className="flex items-center gap-1">
                      {getStatusIcon(proposal.status)}
                      {proposal.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {proposal.proposed_rate && (
                        <div>
                          <span className="font-medium">Proposed Rate:</span> ${proposal.proposed_rate}/hr
                        </div>
                      )}
                      {proposal.estimated_duration && (
                        <div>
                          <span className="font-medium">Duration:</span> {proposal.estimated_duration}
                        </div>
                      )}
                    </div>

                    {proposal.cover_letter && (
                      <div>
                        <h4 className="font-medium mb-2">Your Cover Letter</h4>
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

                      <Button variant="outline" size="sm" onClick={() => handleChatWithClient(proposal)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat with Client
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {proposals.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
                <p className="text-gray-600 mb-4">Start applying to jobs to see your proposals here</p>
                <Link href="/employee/jobs">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Browse Jobs</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
