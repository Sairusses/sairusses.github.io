"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Briefcase, Users, Shield, Zap, AlertTriangle } from "lucide-react"

export default function HomePage() {
  const { user, userProfile, loading, firebaseError } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !firebaseError && user && userProfile) {
      if (userProfile.role === "client") {
        router.push("/client")
      } else if (userProfile.role === "freelancer") {
        router.push("/freelancer")
      }
    }
  }, [user, userProfile, loading, firebaseError, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show Firebase configuration error
  if (firebaseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">ManPower</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Alert className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuration Required:</strong> Firebase environment variables are missing. Please add your
              Firebase configuration to continue.
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Setup Instructions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">1. Create a Firebase Project</h3>
                <p className="text-gray-600 mb-2">
                  Go to the{" "}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Firebase Console
                  </a>{" "}
                  and create a new project.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">2. Enable Authentication</h3>
                <p className="text-gray-600 mb-2">
                  In your Firebase project, go to Authentication → Sign-in method and enable Email/Password
                  authentication.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">3. Enable Firestore</h3>
                <p className="text-gray-600 mb-2">Go to Firestore Database and create a database in production mode.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">4. Get Your Configuration</h3>
                <p className="text-gray-600 mb-2">
                  Go to Project Settings → General → Your apps and copy the Firebase config.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">5. Add Environment Variables</h3>
                <p className="text-gray-600 mb-2">Add these environment variables to your Vercel project:</p>
                <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                  <div>NEXT_PUBLIC_FIREBASE_API_KEY</div>
                  <div>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</div>
                  <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID</div>
                  <div>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</div>
                  <div>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</div>
                  <div>NEXT_PUBLIC_FIREBASE_APP_ID</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (user && userProfile) {
    return null // Will redirect based on role
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">ManPower</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect. Create. <span className="text-blue-600">Collaborate.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The premier platform connecting clients and freelancers in the labor marketplace. Find the perfect match for
            your project or discover your next opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Join as Freelancer
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Hire Talent
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose ManPower?</h2>
            <p className="text-xl text-gray-600">Built for modern professionals who value quality and efficiency</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Briefcase className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quality Projects</h3>
              <p className="text-gray-600">Access to high-quality projects from verified clients</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Skilled Talent</h3>
              <p className="text-gray-600">Connect with verified freelancers with proven expertise</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">Safe and secure transactions with built-in protection</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Matching</h3>
              <p className="text-gray-600">AI-powered matching to find the perfect collaboration</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of professionals already using ManPower</p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">ManPower</h3>
            <p className="text-gray-400">© 2024 ManPower. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
