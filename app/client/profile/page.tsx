"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { updateUserProfile } from "@/lib/firestore"
import { uploadFile } from "@/lib/storage"
import { saveClientFile, getClientFiles, deleteClientFile, type ClientFile } from "@/lib/client-firestore"
import { Save, Upload, Download, Trash2, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function ClientProfile() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<ClientFile[]>([])

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    phone: "",
    overview: "",
  })

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        companyName: (userProfile as any).companyName || "",
        phone: (userProfile as any).phone || "",
        overview: userProfile.overview || "",
      })
      loadFiles()
    }
  }, [userProfile])

  const loadFiles = async () => {
    if (!userProfile) return

    try {
      const filesData = await getClientFiles(userProfile.uid)
      setFiles(filesData)
    } catch (error) {
      console.error("Error loading files:", error)
    }
  }

  const handleSave = async () => {
    if (!userProfile) return

    setSaving(true)
    try {
      await updateUserProfile(userProfile.uid, {
        name: formData.name,
        companyName: formData.companyName,
        phone: formData.phone,
        overview: formData.overview,
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

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const path = `client-files/${userProfile.uid}/${file.name}`
      const url = await uploadFile(file, path)

      await saveClientFile(userProfile.uid, {
        fileName: file.name,
        downloadURL: url,
        fileType: file.type,
        size: file.size,
      })

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      })

      loadFiles()
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

  const handleDeleteFile = async (fileId: string) => {
    if (!userProfile) return

    try {
      await deleteClientFile(userProfile.uid, fileId)
      toast({
        title: "File deleted",
        description: "The file has been removed successfully.",
      })
      loadFiles()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter your company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={userProfile.email} disabled className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Company Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="overview">Tell freelancers about your company</Label>
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                placeholder="Describe your company, industry, and what you're looking for in freelancers..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Management */}
        <Card>
          <CardHeader>
            <CardTitle>Documents & Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Upload company documents, contracts, or other files</p>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" disabled={uploading} asChild>
                  <span>{uploading ? "Uploading..." : "Choose File"}</span>
                </Button>
              </Label>
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Uploaded Files</h4>
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">{file.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                          {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(file.downloadURL, "_blank")}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteFile(file.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <Button onClick={handleSave} disabled={saving} className="fab-button">
        <Save className="h-6 w-6" />
      </Button>
    </div>
  )
}
