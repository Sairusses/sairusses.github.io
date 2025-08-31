import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import {
  Briefcase,
  Users,
  MessageSquare,
  Shield,
  Search,
  Zap,
} from "lucide-react";
import { Navbar, NavbarContent, NavbarItem, Link, Button } from "@heroui/react";

import Footer from "@/components/footer";
export default function indexPage() {
  return (
    <>
      <div className="flex flex-col items-center justify-center w-full">
        {/* Navigation Bar */}
        <Navbar isBordered maxWidth="full" shouldHideOnScroll={true}>
          <NavbarContent className="hidden sm:flex gap-4" justify="start">
            <NavbarItem>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </NavbarItem>
            <NavbarItem>
              <p className="font-bold text-inherit text-2xl">ManPower</p>
            </NavbarItem>
          </NavbarContent>
          <NavbarContent justify="end">
            <NavbarItem className="hidden lg:flex">
              <Link href="/auth/login">
                <Button variant="light">Sign In</Button>
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-white py-20 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Connect. Create.
                <span className="text-blue-600"> Collaborate.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                ManPower bridges the gap between skilled professionals and
                clients who need their expertise. Whether you&#39;re looking to
                hire or get hired, we make it simple and secure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    Get Started as Client
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                    size="lg"
                    variant="ghost"
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose ManPower?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We provide everything you need to succeed in the modern gig
                economy
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Smart Matching
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Our algorithm connects you with the perfect opportunities or
                  talent based on skills and requirements.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Real-time Communication
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Built-in messaging system keeps you connected with your
                  clients or freelancers throughout the project.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Secure Payments
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Protected transactions and milestone-based payments ensure
                  everyone gets paid fairly and on time.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Verified Profiles
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  All users go through our verification process to ensure
                  quality and trustworthiness.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Fast Hiring
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Post a job and start receiving proposals within hours. Get
                  your project started quickly.
                </CardFooter>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardBody className="text-3xl font-bold text-center">
                  Project Management
                </CardBody>
                <CardFooter className="text-gray-500 text-center pb-8">
                  Track progress, manage deadlines, and collaborate effectively
                  with built-in project tools.
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="bg-blue-600 py-20 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals and clients who trust ManPower for
              their projects
            </p>
            <Link href="/auth/signup">
              <Button
                className="bg-white text-blue-600 hover:bg-gray-50"
                size="lg"
              >
                Create Your Account Today
              </Button>
            </Link>
          </div>
        </section>
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
