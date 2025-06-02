"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"

export default function PostJobPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string; type: string; size: number }>>(
    [],
  )
  const supabase = getSupabaseClient()

  const categories = [
    "Web Development",
    "Mobile Development",
    "Design",
    "Writing",
    "Marketing",
    "Data Science",
    "Other",
  ]

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
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          client_id: userProfile.id,
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          category: formData.get("category") as string,
          budget_min: Number.parseFloat(formData.get("budgetMin") as string) || null,
          budget_max: Number.parseFloat(formData.get("budgetMax") as string) || null,
          timeline: formData.get("timeline") as string,
          required_skills: skills,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Job posted successfully!",
        description: "Your job is now live and accepting proposals.",
      })

      router.push(`/jobs/${data.id}`)
    } catch (error: any) {
      toast({
        title: "Error posting job",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="client">
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
            <p className="text-gray-600">Describe your project and find the perfect freelancer</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Provide clear information about your project requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Build a responsive website for my business"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your project in detail. Include what you need, your goals, and any specific requirements..."
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetMin">Budget Min ($)</Label>
                    <Input id="budgetMin" name="budgetMin" type="number" step="0.01" placeholder="500" />
                  </div>
                  <div>
                    <Label htmlFor="budgetMax">Budget Max ($)</Label>
                    <Input id="budgetMax" name="budgetMax" type="number" step="0.01" placeholder="2000" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input id="timeline" name="timeline" placeholder="e.g., 2-3 weeks, 1 month, ASAP" />
                </div>

                <div>
                  <Label>Required Skills</Label>
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
                        <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Project Files (Optional)</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload any relevant documents, specifications, or reference materials
                  </p>
                  <FileUpload
                    uploadType="job_attachment"
                    acceptedTypes={["image/*", ".pdf", ".doc", ".docx", ".txt"]}
                    maxFileSize={10}
                    maxFiles={5}
                    onFilesUploaded={setUploadedFiles}
                    className="mb-4"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? "Posting..." : "Post Job"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
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
