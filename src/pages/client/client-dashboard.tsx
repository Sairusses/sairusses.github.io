import { useEffect, useState } from "react";
import { addToast, Button, Link } from "@heroui/react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { Briefcase, FileText, Plus, Users } from "lucide-react";

import ClientNavbar from "@/pages/client/client-navbar.tsx";
import { supabase } from "@/lib/supabase.ts";

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        addToast({
          title: "Error fetching user",
          description: error.message,
          color: "danger",
        });
      }
      setUser(data.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Display User Full Name */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.fullName ?? "User"}
          </h1>
          <p className="text-gray-600">Manage your jobs and review proposals</p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Jobs Stats */}
          <Card radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between px-10 pt-5">
              <div className="text-md font-medium">Total Jobs</div>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardBody className="items-start pl-10 py-0">
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-gray-600 pb-5">
                Jobs posted on platform
              </div>
            </CardBody>
          </Card>
          {/* Active Jobs Stats */}
          <Card radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between px-10 pt-5">
              <div className="text-md font-medium">Active Jobs</div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardBody className="items-start pl-10 py-0">
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm text-gray-600 pb-5">
                Currently accepting proposals
              </div>
            </CardBody>
          </Card>
          {/* Jobs Stats */}
          <Card radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between px-10 pt-5">
              <div className="text-md font-medium">Pending Proposals</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardBody className="items-start pl-10 py-0">
              <div className="text-2xl font-bold">1</div>
              <div className="text-sm text-gray-600 pb-5">
                Awaiting your review
              </div>
            </CardBody>
          </Card>
        </div>
        {/* Interactive Functions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <Card className="px-4 py-3" radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <div className="text-2xl font-bold">Recent Jobs</div>
                <div className="text-sm text-gray-600">
                  Your latest job postings
                </div>
              </div>
              <Link href="/client/post-job">
                <Button color="primary" radius="sm" startContent={<Plus />}>
                  Post Job
                </Button>
              </Link>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="pb-4">No jobs posted yet</p>
                <Link href="/client/post-job">
                  <Button color="primary" radius="sm">
                    Post Your First Job
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
          {/* Recent Proposals */}
          <Card className="px-4 py-3" radius="sm" shadow="sm">
            <CardHeader className="flex flex-col items-start justify-between">
              <div className="text-2xl font-bold">Recent Proposals</div>
              <div className="text-sm text-gray-600">
                Latest proposals from employees
              </div>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No proposals yet</p>
                <p className="text-sm">Post a job to start receiving proposals</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
