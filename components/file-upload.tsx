"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Upload, X, File, FileText, Download, ImageIcon } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface FileUploadProps {
  onFileUploaded?: (fileUrl: string, fileName: string) => void
  onFilesUploaded?: (files: Array<{ url: string; name: string; type: string; size: number }>) => void
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  maxFiles?: number
  uploadType: "job_attachment" | "proposal_attachment" | "resume" | "profile_picture" | "message_attachment"
  jobId?: string
  proposalId?: string
  contractId?: string
  existingFiles?: Array<{ id: string; file_name: string; file_url: string; file_type: string; file_size?: number }>
  className?: string
  disabled?: boolean
}

export function FileUpload({
  onFileUploaded,
  onFilesUploaded,
  acceptedTypes = ["*"],
  maxFileSize = 10,
  maxFiles = 5,
  uploadType,
  jobId,
  proposalId,
  contractId,
  existingFiles = [],
  className = "",
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [files, setFiles] =
    useState<Array<{ id: string; file_name: string; file_url: string; file_type: string; file_size?: number }>>(
      existingFiles,
    )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.includes("pdf") || fileType.includes("document")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    // Check file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes("*")) {
      const isValidType = acceptedTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", "/"))
        }
        return file.type === type || file.name.toLowerCase().endsWith(type.replace(".", ""))
      })

      if (!isValidType) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(", ")}`
      }
    }

    return null
  }

  const uploadFile = async (file: File) => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "You must be logged in to upload files",
        variant: "destructive",
      })
      return null
    }

    const validation = validateFile(file)
    if (validation) {
      toast({
        title: "Invalid file",
        description: validation,
        variant: "destructive",
      })
      return null
    }

    try {
      // Create unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${uploadType}/${userProfile.id}/${fileName}`

      // Upload to Supabase Storage using the correct bucket name
      const { data: uploadData, error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("uploads").getPublicUrl(filePath)

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from("file_uploads")
        .insert({
          user_id: userProfile.id,
          job_id: jobId || null,
          proposal_id: proposalId || null,
          contract_id: contractId || null,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          upload_type: uploadType,
        })
        .select()
        .single()

      if (dbError) throw dbError

      return {
        id: fileRecord.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please check if the storage bucket exists.",
        variant: "destructive",
      })
      return null
    }
  }

  const handleFileSelect = async (selectedFiles: FileList) => {
    if (disabled) return

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    const uploadedFiles: Array<{
      id: string
      file_name: string
      file_url: string
      file_type: string
      file_size: number
    }> = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      const result = await uploadFile(file)
      if (result) {
        uploadedFiles.push(result)
      }
    }

    if (uploadedFiles.length > 0) {
      const newFiles = [...files, ...uploadedFiles]
      setFiles(newFiles)

      if (uploadedFiles.length === 1 && onFileUploaded) {
        onFileUploaded(uploadedFiles[0].file_url, uploadedFiles[0].file_name)
      }

      if (onFilesUploaded) {
        onFilesUploaded(
          uploadedFiles.map((f) => ({
            url: f.file_url,
            name: f.file_name,
            type: f.file_type,
            size: f.file_size,
          })),
        )
      }

      toast({
        title: "Upload successful",
        description: `${uploadedFiles.length} file(s) uploaded successfully`,
      })
    }

    setUploading(false)
    setUploadProgress(0)
  }

  const removeFile = async (fileId: string) => {
    try {
      const { error } = await supabase.from("file_uploads").delete().eq("id", fileId)

      if (error) throw error

      setFiles(files.filter((f) => f.id !== fileId))

      toast({
        title: "File removed",
        description: "File has been deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      })
    }
  }

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-blue-400 cursor-pointer"
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-1">
          {disabled ? "Upload disabled" : "Click to upload or drag and drop"}
        </p>
        <p className="text-xs text-gray-500">
          {acceptedTypes.includes("*") ? "Any file type" : acceptedTypes.join(", ")} • Max {maxFileSize}MB • Up to{" "}
          {maxFiles} files
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedTypes.includes("*") ? undefined : acceptedTypes.join(",")}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => downloadFile(file.file_url, file.file_name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  {!disabled && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
