"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getJobs, submitProposal, type Job } from "@/lib/freelancer-firestore"
import { Search, MapPin, Clock, DollarSign, Send, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function FindJobsPage() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false)
  const [proposalText, setProposalText] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [submittingProposal, setSubmittingProposal] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchQuery])

  const loadJobs = async () => {
    try {
      const jobsData = await getJobs()
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

  const filterJobs = () => {
    let filtered = jobs

    if (searchQuery) {
      filtered = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredJobs(filtered)
  }

  const getBestMatches = () => {
    if (!userProfile?.skills) return filteredJobs

    return filteredJobs.sort((a, b) => {
      const aMatches = a.skills.filter((skill) => userProfile.skills!.includes(skill)).length
      const bMatches = b.skills.filter((skill) => userProfile.skills!.includes(skill)).length
      return bMatches - aMatches
    })
  }

  const getRecentJobs = () => {
    return filteredJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  const handleSubmitProposal = async () => {
    if (!selectedJob || !userProfile) return

    setSubmittingProposal(true)
    try {
      await submitProposal({
        jobId: selectedJob.id!,
        freelancerId: userProfile.uid,
        jobTitle: selectedJob.title,
        clientId: selectedJob.clientId,
        proposalText,
        coverLetter,
        bidAmount: Number.parseFloat(bidAmount),
        status: "pending",
      })

      toast({
        title: "Proposal Submitted",
        description: "Your proposal has been sent to the client.",
      })

      setProposalDialogOpen(false)
      setProposalText("")
      setCoverLetter("")
      setBidAmount("")
      setSelectedJob(null)
    } catch (error) {
      console.error("Error submitting proposal:", error)
      toast({
        title: "Error",
        description: "Failed to submit proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingProposal(false)
    }
  }

  const JobCard = ({ job }: { job: Job }) => {
    const skillMatches = userProfile?.skills
      ? job.skills.filter((skill) => userProfile.skills!.includes(skill)).length
      : 0

    return (
      <Card className="hover:shadow-md transition-shadow">
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
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
              </CardDescription>
            </div>
            {skillMatches > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {skillMatches} skill match{skillMatches > 1 ? "es" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.map((skill) => (
              <Badge
                key={skill}
                variant={userProfile?.skills?.includes(skill) ? "default" : "outline"}
                className={userProfile?.skills?.includes(skill) ? "bg-blue-100 text-blue-800" : ""}
              >
                {skill}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{job.title}</DialogTitle>
                  <DialogDescription>
                    Posted by {job.clientName} • ${job.budget.toLocaleString()} • {job.experienceLevel} level
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{job.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {job.deadline && (
                    <div>
                      <h4 className="font-medium mb-2">Deadline</h4>
                      <p className="text-gray-600">{job.deadline.toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              onClick={() => {
                setSelectedJob(job)
                setProposalDialogOpen(true)
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Proposal
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Find Jobs</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search jobs by title, description, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="best-matches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="best-matches">Best Matches</TabsTrigger>
          <TabsTrigger value="recent">Recently Posted</TabsTrigger>
        </TabsList>

        <TabsContent value="best-matches" className="space-y-4">
          {getBestMatches().length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matching jobs found</h3>
                <p className="text-gray-600">Try adjusting your search or check back later for new opportunities.</p>
              </CardContent>
            </Card>
          ) : (
            getBestMatches().map((job) => <JobCard key={job.id} job={job} />)
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {getRecentJobs().length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent jobs</h3>
                <p className="text-gray-600">Check back later for new job postings.</p>
              </CardContent>
            </Card>
          ) : (
            getRecentJobs().map((job) => <JobCard key={job.id} job={job} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Proposal Dialog */}
      <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Proposal</DialogTitle>
            <DialogDescription>Submit your proposal for "{selectedJob?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cover-letter">Cover Letter</Label>
              <Textarea
                id="cover-letter"
                placeholder="Introduce yourself and explain why you're the right fit for this job..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="proposal-text">Proposal Details</Label>
              <Textarea
                id="proposal-text"
                placeholder="Describe your approach, timeline, and deliverables..."
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="bid-amount">Your Bid Amount ($)</Label>
              <Input
                id="bid-amount"
                type="number"
                placeholder="Enter your bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProposalDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitProposal}
                disabled={submittingProposal || !proposalText || !coverLetter || !bidAmount}
              >
                {submittingProposal ? "Submitting..." : "Submit Proposal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
