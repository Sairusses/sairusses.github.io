"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, DollarSign, Star, Eye, Download } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { User } from "@/lib/types"

export default function FindEmployeesPage() {
  const { userProfile } = useAuth()
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [skillFilter, setSkillFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [rateFilter, setRateFilter] = useState("")
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchEmployees()
  }, [searchTerm, skillFilter, locationFilter, rateFilter])

  const fetchEmployees = async () => {
    try {
      let query = supabase.from("users").select("*").eq("role", "employee").order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
      }

      if (locationFilter) {
        query = query.ilike("location", `%${locationFilter}%`)
      }

      const { data, error } = await query

      if (error) throw error

      let filteredData = data || []

      // Filter by skills (client-side since it's an array)
      if (skillFilter) {
        filteredData = filteredData.filter((employee) =>
          employee.skills?.some((skill: string) => skill.toLowerCase().includes(skillFilter.toLowerCase())),
        )
      }

      // Filter by hourly rate (client-side)
      if (rateFilter) {
        const [min, max] = rateFilter.split("-").map(Number)
        filteredData = filteredData.filter((employee) => {
          if (!employee.hourly_rate) return false
          if (max) {
            return employee.hourly_rate >= min && employee.hourly_rate <= max
          } else {
            return employee.hourly_rate >= min
          }
        })
      }

      setEmployees(filteredData)
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadResume = (resumeUrl: string, employeeName: string) => {
    const link = document.createElement("a")
    link.href = resumeUrl
    link.download = `${employeeName}_Resume.pdf`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Talented Employees</h1>
            <p className="text-gray-600">Browse profiles of skilled freelancers ready to work on your projects</p>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Input
                placeholder="Filter by skill..."
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full md:w-48"
              />

              <Input
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full md:w-48"
              />

              <Select value={rateFilter} onValueChange={setRateFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Hourly Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rates</SelectItem>
                  <SelectItem value="0-25">$0 - $25/hr</SelectItem>
                  <SelectItem value="25-50">$25 - $50/hr</SelectItem>
                  <SelectItem value="50-100">$50 - $100/hr</SelectItem>
                  <SelectItem value="100">$100+/hr</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid gap-6">
              {employees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={employee.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="text-lg">{employee.full_name?.charAt(0) || "E"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl mb-1">{employee.full_name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              {employee.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {employee.location}
                                </div>
                              )}
                              {employee.hourly_rate && (
                                <div className="flex items-center text-green-600 font-semibold">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {employee.hourly_rate}/hr
                                </div>
                              )}
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                4.8 (12 reviews)
                              </div>
                            </div>
                          </div>
                        </div>
                        {employee.bio && (
                          <CardDescription className="text-base mb-4 line-clamp-2">{employee.bio}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {employee.skills && employee.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {employee.skills.slice(0, 8).map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                          {employee.skills.length > 8 && (
                            <Badge variant="outline">+{employee.skills.length - 8} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Link href={`/profile?user=${employee.id}`}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Profile
                        </Button>
                      </Link>
                      {employee.resume_url && (
                        <Button
                          variant="outline"
                          onClick={() => downloadResume(employee.resume_url!, employee.full_name || "Employee")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Resume
                        </Button>
                      )}
                      <div className="text-sm text-gray-500">
                        Member since {new Date(employee.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {employees.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                  <p className="text-gray-600">
                    {searchTerm || skillFilter || locationFilter || rateFilter
                      ? "Try adjusting your search criteria"
                      : "No employees are currently available"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
