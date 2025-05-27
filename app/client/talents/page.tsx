"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { searchFreelancers, type FreelancerProfile } from "@/lib/client-firestore"
import { Search, Star, MessageSquare, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function SearchTalentsPage() {
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([])
  const [filteredFreelancers, setFilteredFreelancers] = useState<FreelancerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadFreelancers()
  }, [])

  useEffect(() => {
    filterFreelancers()
  }, [freelancers, searchQuery])

  const loadFreelancers = async () => {
    try {
      const freelancersData = await searchFreelancers()
      setFreelancers(freelancersData)
    } catch (error) {
      console.error("Error loading freelancers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterFreelancers = () => {
    let filtered = freelancers

    if (searchQuery) {
      filtered = freelancers.filter(
        (freelancer) =>
          freelancer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          freelancer.overview?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          freelancer.skills?.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredFreelancers(filtered)
  }

  const FreelancerCard = ({ freelancer }: { freelancer: FreelancerProfile }) => {
    const topSkills = freelancer.skills?.slice(0, 3) || []
    const recentJob = freelancer.employment_history?.[0]

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{freelancer.username}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                  <span>Freelancer</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>New</span>
                  </span>
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4 line-clamp-3">{freelancer.overview || "No overview available"}</p>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {topSkills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
            {freelancer.skills && freelancer.skills.length > 3 && (
              <Badge variant="outline">+{freelancer.skills.length - 3} more</Badge>
            )}
          </div>

          {/* Recent Experience */}
          {recentJob && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Recent Experience</h4>
              <p className="text-sm text-gray-600">
                {recentJob.position} at {recentJob.company}
              </p>
              <p className="text-xs text-gray-500">
                {recentJob.company ? "Current" : formatDistanceToNow(recentJob.startDate, { addSuffix: true })}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Link href={`/client/talents/${freelancer.uid}`}>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </Link>
            <Link href={`/client/messages?freelancer=${freelancer.uid}`}>
              <Button size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </Link>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Talents</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search freelancers by name, skills, or experience..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-gray-600">
          {filteredFreelancers.length} freelancer{filteredFreelancers.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {filteredFreelancers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No freelancers found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFreelancers.map((freelancer) => (
            <FreelancerCard key={freelancer.uid} freelancer={freelancer} />
          ))}
        </div>
      )}
    </div>
  )
}
