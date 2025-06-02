import Link from "next/link"
import { Briefcase } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">ManPower</span>
            </div>
            <p className="text-gray-600 max-w-md">
              Connecting talented professionals with clients who need their expertise. Build your career or find the
              perfect freelancer for your project.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">For Clients</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/jobs/post" className="text-gray-600 hover:text-blue-600">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/browse-talent" className="text-gray-600 hover:text-blue-600">
                  Browse Talent
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-blue-600">
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">For Freelancers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/jobs" className="text-gray-600 hover:text-blue-600">
                  Find Work
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-600 hover:text-blue-600">
                  Build Profile
                </Link>
              </li>
              <li>
                <Link href="/success-stories" className="text-gray-600 hover:text-blue-600">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">© 2025 ManPower. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-600 hover:text-blue-600 text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-blue-600 text-sm">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
