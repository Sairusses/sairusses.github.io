"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getFreelancerProposals, type Proposal } from "@/lib/freelancer-firestore"
import { FileText, Clock, DollarSign, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function ProposalsPage() {
  const { userProfile } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile) {
      loadProposals()
    }
  }, [userProfile])

  const loadProposals = async () => {
    if (!userProfile) return

    try {
      const proposalsData = await getFreelancerProposals(userProfile.uid)
      setProposals(proposalsData)
    } catch (error) {
      console.error("Error loading proposals:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "viewed":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "viewed":
        return <Eye className="h-4 w-4" />
      case "accepted":
        return <FileText className="h-4 w-4" />
      case "rejected":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Proposals</h1>
        <p className="text-gray-600">Track the status of your submitted proposals</p>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
            <p className="text-gray-600 mb-4">Start applying to jobs to see your proposals here.</p>
            <Button asChild>
              <a href="/freelancer/jobs">Find Jobs</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{proposal.jobTitle}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />${proposal.bidAmount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(proposal.createdAt, { addSuffix: true })}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(proposal.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(proposal.status)}
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-2">{proposal.coverLetter}</p>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{proposal.jobTitle}</DialogTitle>
                      <DialogDescription>
                        Proposal submitted {formatDistanceToNow(proposal.createdAt, { addSuffix: true })} • Bid: $
                        {proposal.bidAmount.toLocaleString()}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cover Letter</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{proposal.coverLetter}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Proposal Details</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{proposal.proposalText}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
