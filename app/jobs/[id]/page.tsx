"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function JobRedirect() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    if (params.id) {
      router.replace(`/jobs/detail?id=${params.id}`)
    }
  }, [params.id, router])

  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
  )
}
