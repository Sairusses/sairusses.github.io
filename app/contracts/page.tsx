"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, DollarSign, User, Building, MessageSquare, Eye } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Contract } from "@/lib/types"

export default function ContractsPage() {
  const { userProfile } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (userProfile) {
      fetchContracts()
    }
  }, [userProfile])

  const fetchContracts = async () => {
    try {
      let query = supabase
        .from("contracts")
        .select(`
          *,
          job:jobs(*),
          client:users!contracts_client_id_fkey(*),
          employee:users!contracts_employee_id_fkey(*)
        `)
        .order("created_at", { ascending: false })

      if (userProfile?.role === "employee") {
        query = query.eq("employee_id", userProfile.id)
      } else {
        query = query.eq("client_id", userProfile.id)
      }

      const { data, error } = await query

      if (error) throw error
      setContracts(data || [])
    } catch (error) {
      console.error("Error fetching contracts:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "🟢"
      case "completed":
        return "✅"
      case "cancelled":
        return "❌"
      default:
        return "⏳"
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {userProfile?.role === "employee" ? "My Contracts" : "Issued Contracts"}
            </h1>
            <p className="text-gray-600">
              {userProfile?.role === "employee"
                ? "Track your active and completed work contracts"
                : "Manage contracts with your hired freelancers"}
            </p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Contracts</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {contracts.map((contract) => (
                <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{contract.job?.title}</CardTitle>
                        <CardDescription className="text-base mb-4">
                          {userProfile?.role === "employee"
                            ? `Contract with ${contract.client?.full_name}`
                            : `Contract with ${contract.employee?.full_name}`}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(contract.status)} className="mb-2">
                          {getStatusIcon(contract.status)} {contract.status}
                        </Badge>
                        <div className="flex items-center text-green-600 font-semibold text-lg">
                          <DollarSign className="h-5 w-5 mr-1" />
                          {contract.agreed_rate}/hr
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Contract Details */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Contract Timeline
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Started:</span>
                              <span>{new Date(contract.start_date).toLocaleDateString()}</span>
                            </div>
                            {contract.end_date && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Ended:</span>
                                <span>{new Date(contract.end_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span>
                                {contract.end_date
                                  ? `${Math.ceil(
                                      (new Date(contract.end_date).getTime() -
                                        new Date(contract.start_date).getTime()) /
                                        (1000 * 60 * 60 * 24),
                                    )} days`
                                  : "Ongoing"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Other Party Info */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center">
                          {userProfile?.role === "employee" ? (
                            <>
                              <Building className="h-4 w-4 mr-2" />
                              Client Information
                            </>
                          ) : (
                            <>
                              <User className="h-4 w-4 mr-2" />
                              Employee Information
                            </>
                          )}
                        </h4>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={
                                userProfile?.role === "employee"
                                  ? contract.client?.avatar_url || "/placeholder.svg"
                                  : contract.employee?.avatar_url || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback>
                              {userProfile?.role === "employee"
                                ? contract.client?.full_name?.charAt(0) || "C"
                                : contract.employee?.full_name?.charAt(0) || "E"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {userProfile?.role === "employee"
                                ? contract.client?.full_name
                                : contract.employee?.full_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {userProfile?.role === "employee"
                                ? contract.client?.company_name || "Individual Client"
                                : `${contract.employee?.skills?.slice(0, 2).join(", ") || "Freelancer"}`}
                            </p>
                            {userProfile?.role === "employee" && contract.client?.location && (
                              <p className="text-xs text-gray-500">{contract.client.location}</p>
                            )}
                            {userProfile?.role === "client" && contract.employee?.location && (
                              <p className="text-xs text-gray-500">{contract.employee.location}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Job Description */}
                    {contract.job?.description && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Project Description</h4>
                        <p className="text-gray-700 text-sm line-clamp-3">{contract.job.description}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Link href={`/jobs/${contract.job_id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Job
                        </Button>
                      </Link>
                      <Link href={`/chat?contract=${contract.id}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message {userProfile?.role === "employee" ? "Client" : "Employee"}
                        </Button>
                      </Link>
                      {userProfile?.role === "employee" && (
                        <Link href={`/profile?user=${contract.client_id}`}>
                          <Button variant="outline" size="sm">
                            View Client Profile
                          </Button>
                        </Link>
                      )}
                      {userProfile?.role === "client" && (
                        <Link href={`/profile?user=${contract.employee_id}`}>
                          <Button variant="outline" size="sm">
                            View Employee Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {["active", "completed", "cancelled"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-6">
                {contracts
                  .filter((c) => c.status === status)
                  .map((contract) => (
                    <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{contract.job?.title}</CardTitle>
                            <CardDescription className="text-base mb-4">
                              {userProfile?.role === "employee"
                                ? `Contract with ${contract.client?.full_name}`
                                : `Contract with ${contract.employee?.full_name}`}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusColor(contract.status)} className="mb-2">
                              {getStatusIcon(contract.status)} {contract.status}
                            </Badge>
                            <div className="flex items-center text-green-600 font-semibold text-lg">
                              <DollarSign className="h-5 w-5 mr-1" />
                              {contract.agreed_rate}/hr
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* Contract Details */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Contract Timeline
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Started:</span>
                                  <span>{new Date(contract.start_date).toLocaleDateString()}</span>
                                </div>
                                {contract.end_date && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Ended:</span>
                                    <span>{new Date(contract.end_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Duration:</span>
                                  <span>
                                    {contract.end_date
                                      ? `${Math.ceil(
                                          (new Date(contract.end_date).getTime() -
                                            new Date(contract.start_date).getTime()) /
                                            (1000 * 60 * 60 * 24),
                                        )} days`
                                      : "Ongoing"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Other Party Info */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center">
                              {userProfile?.role === "employee" ? (
                                <>
                                  <Building className="h-4 w-4 mr-2" />
                                  Client Information
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 mr-2" />
                                  Employee Information
                                </>
                              )}
                            </h4>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage
                                  src={
                                    userProfile?.role === "employee"
                                      ? contract.client?.avatar_url || "/placeholder.svg"
                                      : contract.employee?.avatar_url || "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback>
                                  {userProfile?.role === "employee"
                                    ? contract.client?.full_name?.charAt(0) || "C"
                                    : contract.employee?.full_name?.charAt(0) || "E"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {userProfile?.role === "employee"
                                    ? contract.client?.full_name
                                    : contract.employee?.full_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {userProfile?.role === "employee"
                                    ? contract.client?.company_name || "Individual Client"
                                    : `${contract.employee?.skills?.slice(0, 2).join(", ") || "Freelancer"}`}
                                </p>
                                {userProfile?.role === "employee" && contract.client?.location && (
                                  <p className="text-xs text-gray-500">{contract.client.location}</p>
                                )}
                                {userProfile?.role === "client" && contract.employee?.location && (
                                  <p className="text-xs text-gray-500">{contract.employee.location}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Job Description */}
                        {contract.job?.description && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-2">Project Description</h4>
                            <p className="text-gray-700 text-sm line-clamp-3">{contract.job.description}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t">
                          <Link href={`/jobs/${contract.job_id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Job
                            </Button>
                          </Link>
                          <Link href={`/chat?contract=${contract.id}`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message {userProfile?.role === "employee" ? "Client" : "Employee"}
                            </Button>
                          </Link>
                          {userProfile?.role === "employee" && (
                            <Link href={`/profile?user=${contract.client_id}`}>
                              <Button variant="outline" size="sm">
                                View Client Profile
                              </Button>
                            </Link>
                          )}
                          {userProfile?.role === "client" && (
                            <Link href={`/profile?user=${contract.employee_id}`}>
                              <Button variant="outline" size="sm">
                                View Employee Profile
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>

          {contracts.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
              <p className="text-gray-600 mb-4">
                {userProfile?.role === "employee"
                  ? "Apply to jobs and get hired to see your contracts here"
                  : "Post jobs and hire freelancers to see your contracts here"}
              </p>
              <Link href={userProfile?.role === "employee" ? "/employee/jobs" : "/jobs/post"} className="inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  {userProfile?.role === "employee" ? "Browse Jobs" : "Post a Job"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
