"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getFreelancerContracts, type Contract } from "@/lib/freelancer-firestore"
import { Briefcase, Calendar, DollarSign, MessageSquare, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function ContractsPage() {
  const { userProfile } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile) {
      loadContracts()
    }
  }, [userProfile])

  const loadContracts = async () => {
    if (!userProfile) return

    try {
      const contractsData = await getFreelancerContracts(userProfile.uid)
      setContracts(contractsData)
    } catch (error) {
      console.error("Error loading contracts:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Contracts</h1>
        <p className="text-gray-600">Manage your ongoing and completed projects</p>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
            <p className="text-gray-600 mb-4">Once you get hired for projects, your contracts will appear here.</p>
            <Button asChild>
              <Link href="/freelancer/jobs">Find Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{contract.jobTitle}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span>Client: {contract.clientName}</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />${contract.amount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Started {formatDistanceToNow(contract.startDate, { addSuffix: true })}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(contract.status)}>
                    {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/freelancer/messages?chat=${contract.freelancerId}_${contract.clientId}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Client
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
