"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { AppBar } from "@/components/ui/app-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { updateUserProfile } from "@/lib/firestore"
import { uploadFile } from "@/lib/storage"
import { Save, Upload, X, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

const COMMON_SKILLS = [
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "TypeScript",
  "HTML/CSS",
  "UI/UX Design",
  "Graphic Design",
  "Content Writing",
  "Digital Marketing",
  "Data Analysis",
  "Project Management",
  "WordPress",
  "Shopify",
  "SEO",
  "Social Media",
  "Video Editing",
  "Photography",
  "Translation",
  "Accounting",
]

export default function FreelancerProfile() {
  const { userProfile, loading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    overview: "",
    skills: [] as string[],
    resumeUrl: "",
  })

  const [newSkill, setNewSkill] = useState("")

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== "freelancer")) {
      router.push("/")
    }
  }, [userProfile, loading, router])

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        overview: userProfile.overview || "",
        skills: userProfile.skills || [],
        resumeUrl: userProfile.resumeUrl || "",
      })
    }
  }, [userProfile])

  const handleSave = async () => {
    if (!userProfile) return

    setSaving(true)
    try {
      await updateUserProfile(userProfile.uid, {
        name: formData.name,
        overview: formData.overview,
        skills: formData.skills,
        resumeUrl: formData.resumeUrl,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const path = `resumes/${userProfile.uid}/${file.name}`
      const url = await uploadFile(file, path)
      setFormData({ ...formData, resumeUrl: url })

      toast({
        title: "File uploaded",
        description: "Your resume has been uploaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
      })
    }
    setNewSkill("")
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== "freelancer") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar title="Profile" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userProfile.email} disabled className="bg-gray-50" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="overview">Tell clients about yourself</Label>
                <Textarea
                  id="overview"
                  value={formData.overview}
                  onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                  placeholder="Describe your experience, skills, and what makes you unique..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="ml-2 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkill(newSkill)
                    }
                  }}
                />
                <Button onClick={() => addSkill(newSkill)} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Popular skills:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COMMON_SKILLS.filter((skill) => !formData.skills.includes(skill))
                    .slice(0, 10)
                    .map((skill) => (
                      <Button key={skill} variant="ghost" size="sm" onClick={() => addSkill(skill)} className="text-xs">
                        + {skill}
                      </Button>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.resumeUrl ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Resume uploaded</p>
                    <p className="text-sm text-gray-600">Click to view or download</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(formData.resumeUrl, "_blank")}>
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setFormData({ ...formData, resumeUrl: "" })}>
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Upload your resume (PDF, DOC, DOCX)</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <Label htmlFor="resume-upload">
                    <Button variant="outline" disabled={uploading} asChild>
                      <span>{uploading ? "Uploading..." : "Choose File"}</span>
                    </Button>
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Action Button */}
      <Button onClick={handleSave} disabled={saving} className="fab-button">
        <Save className="h-6 w-6" />
      </Button>
    </div>
  )
}
