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
import { useToast } from "@/hooks/use-toast"
import {
  getClientJobs,
  getJobProposals,
  updateProposalStatus,
  createContract,
  updateJob,
  type ClientJob,
  type JobProposal,
} from "@/lib/client-firestore"
import { Briefcase, Eye, Edit, X, Plus, DollarSign, Clock, User, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function MyJobsPage() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<ClientJob[]>([])
  const [selectedJob, setSelectedJob] = useState<ClientJob | null>(null)
  const [proposals, setProposals] = useState<JobProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalsLoading, setProposalsLoading] = useState(false)

  useEffect(() => {
    if (userProfile) {
      loadJobs()
    }
  }, [userProfile])

  const loadJobs = async () => {
    if (!userProfile) return

    try {
      const jobsData = await getClientJobs(userProfile.uid)
      setJobs(jobsData)
    } catch (error) {
      console.error("Error loading jobs:", error)
      toast({
        title: "Error",
        description: "Failed to load jobs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProposals = async (jobId: string) => {
    setProposalsLoading(true)
    try {
      const proposalsData = await getJobProposals(jobId)
      setProposals(proposalsData)
    } catch (error) {
      console.error("Error loading proposals:", error)
      toast({
        title: "Error",
        description: "Failed to load proposals. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProposalsLoading(false)
    }
  }

  const handleAcceptProposal = async (proposal: JobProposal) => {
    if (!selectedJob || !userProfile) return

    try {
      // Update proposal status
      await updateProposalStatus(selectedJob.id!, proposal.id!, "accepted")

      // Create contract
      await createContract({
        jobId: selectedJob.id!,
        freelancerId: proposal.freelancerId,
        clientId: userProfile.uid,
        jobTitle: selectedJob.title,
        freelancerName: proposal.freelancerName,
        status: "ongoing",
        amount: proposal.bidAmount,
      })

      // Update job status
      await updateJob(selectedJob.id!, { status: "in-progress" })

      toast({
        title: "Proposal Accepted",
        description: `Contract created with ${proposal.freelancerName}`,
      })

      // Reload data
      loadJobs()
      loadProposals(selectedJob.id!)
    } catch (error) {
      console.error("Error accepting proposal:", error)
      toast({
        title: "Error",
        description: "Failed to accept proposal. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRejectProposal = async (proposal: JobProposal) => {
    if (!selectedJob) return

    try {
      await updateProposalStatus(selectedJob.id!, proposal.id!, "rejected")

      toast({
        title: "Proposal Rejected",
        description: "The freelancer has been notified.",
      })

      loadProposals(selectedJob.id!)
    } catch (error) {
      console.error("Error rejecting proposal:", error)
      toast({
        title: "Error",
        description: "Failed to reject proposal. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCloseJob = async (job: ClientJob) => {
    try {
      await updateJob(job.id!, { status: "closed" })

      toast({
        title: "Job Closed",
        description: "The job is no longer accepting proposals.",
      })

      loadJobs()
    } catch (error) {
      console.error("Error closing job:", error)
      toast({
        title: "Error",
        description: "Failed to close job. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "closed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProposalStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-gray-600">Manage your job postings and proposals</p>
        </div>
        <Link href="/client/jobs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
            <p className="text-gray-600 mb-4">Start by posting your first job to find talented freelancers.</p>
            <Link href="/client/jobs/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Post Your First Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />${job.budget.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedJob(job)
                          loadProposals(job.id!)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Proposals
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Proposals for "{job.title}"</DialogTitle>
                        <DialogDescription>Review and manage proposals from freelancers</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {proposalsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : proposals.length === 0 ? (
                          <div className="text-center py-8">
                            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
                            <p className="text-gray-600">Freelancers will submit proposals for this job.</p>
                          </div>
                        ) : (
                          proposals.map((proposal) => (
                            <Card key={proposal.id} className="border">
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-base">{proposal.freelancerName}</CardTitle>
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
                                  <Badge className={getProposalStatusColor(proposal.status)}>
                                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-medium text-sm mb-1">Cover Letter</h4>
                                    <p className="text-sm text-gray-600">{proposal.coverLetter}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm mb-1">Proposal</h4>
                                    <p className="text-sm text-gray-600">{proposal.proposalText}</p>
                                  </div>
                                  {proposal.status === "pending" && (
                                    <div className="flex gap-2 pt-2">
                                      <Button size="sm" onClick={() => handleAcceptProposal(proposal)}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Accept
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRejectProposal(proposal)}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Link href={`/client/jobs/${job.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Job
                    </Button>
                  </Link>

                  {job.status === "open" && (
                    <Button variant="outline" size="sm" onClick={() => handleCloseJob(job)}>
                      <X className="h-4 w-4 mr-2" />
                      Close Job
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <Link href="/client/jobs/new">
        <Button className="fab-button">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  )
}
