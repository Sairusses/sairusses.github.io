import { useParams, useRouter } from "next/navigation"


export async function generateStaticParams() {

}

export default function JobRedirect() {
  const params = useParams()
  const router = useRouter()

    if (params.id) {
      router.replace(`/jobs/detail?id=${params.id}`)
    }

  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
  )
}
