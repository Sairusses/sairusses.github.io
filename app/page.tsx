import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Users, MessageSquare, Shield, Search, Zap } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect. Create.
              <span className="text-blue-600"> Collaborate.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              ManPower bridges the gap between skilled professionals and clients who need their expertise. Whether
              you're looking to hire or get hired, we make it simple and secure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started as Client
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Find Work as Freelancer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose ManPower?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide everything you need to succeed in the modern gig economy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Smart Matching</CardTitle>
                <CardDescription>
                  Our algorithm connects you with the perfect opportunities or talent based on skills and requirements.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Real-time Communication</CardTitle>
                <CardDescription>
                  Built-in messaging system keeps you connected with your clients or freelancers throughout the project.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Secure Payments</CardTitle>
                <CardDescription>
                  Protected transactions and milestone-based payments ensure everyone gets paid fairly and on time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Verified Profiles</CardTitle>
                <CardDescription>
                  All users go through our verification process to ensure quality and trustworthiness.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Fast Hiring</CardTitle>
                <CardDescription>
                  Post a job and start receiving proposals within hours. Get your project started quickly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Track progress, manage deadlines, and collaborate effectively with built-in project tools.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals and clients who trust ManPower for their projects
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
              Create Your Account Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
