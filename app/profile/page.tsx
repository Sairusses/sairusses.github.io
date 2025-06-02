"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Plus, Save } from "lucide-react"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"

export default function ProfilePage() {
  const { userProfile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const supabase = getSupabaseClient()
  const [resumeUrl, setResumeUrl] = useState<string>(userProfile?.resume_url || "")

  useEffect(() => {
    if (userProfile?.skills) {
      setSkills(userProfile.skills)
    }
    if (userProfile?.resume_url) {
      setResumeUrl(userProfile.resume_url)
    }
  }, [userProfile])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userProfile) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const updateData: any = {
        full_name: formData.get("fullName") as string,
        phone: formData.get("phone") as string,
        location: formData.get("location") as string,
        bio: formData.get("bio") as string,
      }

      if (userProfile.role === "employee") {
        updateData.skills = skills
        updateData.hourly_rate = Number.parseFloat(formData.get("hourlyRate") as string) || null
        updateData.resume_url = resumeUrl
      } else {
        updateData.company_name = formData.get("companyName") as string
        updateData.website = formData.get("website") as string
      }

      const { error } = await supabase.from("users").update(updateData).eq("id", userProfile.id)

      if (error) throw error

      await refreshProfile()

      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details to help others learn more about you</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userProfile?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-lg">{userProfile?.full_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button type="button" variant="outline" size="sm">
                      Change Photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" name="fullName" defaultValue={userProfile?.full_name || ""} required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={userProfile?.email || ""} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" defaultValue={userProfile?.phone || ""} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="City, Country"
                      defaultValue={userProfile?.location || ""}
                    />
                  </div>
                </div>

                {userProfile?.role === "employee" ? (
                  <>
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                      <Input
                        id="hourlyRate"
                        name="hourlyRate"
                        type="number"
                        step="0.01"
                        placeholder="50.00"
                        defaultValue={userProfile?.hourly_rate || ""}
                      />
                    </div>

                    <div>
                      <Label>Skills</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                        />
                        <Button type="button" onClick={addSkill} variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Resume</Label>
                      <p className="text-sm text-gray-500 mb-3">Upload your resume to showcase your experience</p>
                      <FileUpload
                        uploadType="resume"
                        acceptedTypes={[".pdf", ".doc", ".docx"]}
                        maxFileSize={5}
                        maxFiles={1}
                        onFileUploaded={(url, name) => setResumeUrl(url)}
                        existingFiles={
                          resumeUrl
                            ? [
                                {
                                  id: "current-resume",
                                  file_name: "Current Resume",
                                  file_url: resumeUrl,
                                  file_type: "application/pdf",
                                },
                              ]
                            : []
                        }
                        className="mb-4"
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" name="companyName" defaultValue={userProfile?.company_name || ""} />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        placeholder="https://example.com"
                        defaultValue={userProfile?.website || ""}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell others about yourself..."
                    rows={4}
                    defaultValue={userProfile?.bio || ""}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? "Saving..." : "Save Changes"}
                    <Save className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
