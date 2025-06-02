import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Navbar from "@/components/navbar"
import JobDetailClient from "./job-detail-client"

export async function generateStaticParams() {
  const supabase = createServerComponentClient({ cookies })

  const { data: jobs } = await supabase.from("jobs").select("id").order("created_at", { ascending: false }).limit(20) // Limit to recent jobs for build time optimization

  return (
      jobs?.map((job: { id: any }) => ({
        id: job.id,
      })) || []
  )
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  const { data: job, error } = await supabase
      .from("jobs")
      .select(`
      *,
      client:users(*)
    `)
      .eq("id", params.id)
      .single()

  if (error || !job) {
    notFound()
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            }
        >
          <JobDetailClient initialJob={job} />
        </Suspense>
      </div>
  )
}
