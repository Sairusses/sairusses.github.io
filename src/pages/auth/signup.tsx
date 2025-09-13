import {
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  Form,
  Input,
  Button,
  Link,
  addToast,
} from "@heroui/react";
import { Briefcase, User, Building } from "lucide-react";
import React, { useState } from "react";

import { supabase } from "@/lib/supabase.ts";

export function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  function onChange(event: any) {
    setFormData((prevFormData: any) => {
      return {
        ...prevFormData,
        [event.target.name]: event.target.value,
      };
    });
  }
  // On Submit function for employee form
  async function signUpAsEmployee(e: React.FormEvent) {
    e.preventDefault();

    if (formData.fullName == "" || formData.fullName.trim() === "") {
      addToast({
        title: "Error signing up",
        description: "Please enter your full name",
        color: "danger",
      });

      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            fullName: formData.fullName,
            role: "employee",
          },
        },
      });

      if (data) {
        await supabase.from("users").insert({
          id: data.user?.id,
          email: formData.email,
          full_name: formData.fullName,
          role: "employee",
        });
      }

      if (error) {
        addToast({
          title: "Error signing up",
          description: error.message,
          color: "danger",
        });
      }
      if (!error) {
        addToast({
          title: "Signed up successfully",
          description: `Welcome to ManPower ${formData.fullName}`,
          color: "success",
        });
      }
    } catch (error: any) {
      throw error;
    }
  }

  // On Submit function for client form
  async function signUpAsClient(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.fullName || formData.fullName.trim() === "") {
      addToast({
        title: "Error signing up",
        description: "Please enter your full name",
        color: "danger",
      });

      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            fullName: formData.fullName,
            role: "client",
          },
        },
      });

      if (data) {
        await supabase.from("users").insert({
          id: data.user?.id,
          email: formData.email,
          full_name: formData.fullName,
          role: "client",
        });
      }

      if (error) {
        addToast({
          title: "Error signing uo",
          description: error.message,
          color: "danger",
        });
      }
      if (!error) {
        addToast({
          title: "Signed up successfully",
          description: `Welcome to ManPower ${formData.fullName}`,
          color: "success",
        });
      }
    } catch (error: any) {
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-1 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Briefcase className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Join ManPower
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account and start your journey
          </p>
        </div>
        {/* Login Form */}
        <Card className="p-5">
          <CardHeader className="flex flex-col">
            <div className="text-3xl font-bold text-center">Sign Up</div>
            <div className="text-gray-500 text-center">
              Choose your account type and fill in your details
            </div>
          </CardHeader>
          <CardBody className="w-full">
            <Tabs aria-label="role" fullWidth={true} radius="sm">
              <Tab
                key="employee"
                title={
                  <div className="flex items-center space-x-2">
                    <User />
                    <span>Employee</span>
                  </div>
                }
              >
                <Form
                  className="flex flex-col gap-4 w-full"
                  onSubmit={signUpAsEmployee}
                >
                  <Input
                    errorMessage="Please enter a valid full name"
                    label="Full Name"
                    labelPlacement="outside"
                    name="fullName"
                    placeholder="Enter your full name"
                    radius="sm"
                    type="text"
                    onChange={onChange}
                  />

                  <Input
                    errorMessage="Please enter a valid email"
                    label="Email"
                    labelPlacement="outside"
                    name="email"
                    placeholder="Enter your email"
                    radius="sm"
                    type="email"
                    onChange={onChange}
                  />

                  <Input
                    errorMessage="Please enter a valid password"
                    label="Password"
                    labelPlacement="outside"
                    name="password"
                    placeholder="Enter your password"
                    radius="sm"
                    type="password"
                    onChange={onChange}
                  />
                  <Button
                    color="primary"
                    fullWidth={true}
                    type="submit"
                    onChange={onChange}
                  >
                    Sign Up as Employee
                  </Button>
                </Form>
              </Tab>
              <Tab
                key="client"
                title={
                  <div className="flex items-center space-x-2">
                    <Building />
                    <span>Client</span>
                  </div>
                }
              >
                <Form
                  className="flex flex-col gap-4 w-full"
                  onSubmit={signUpAsClient}
                >
                  <Input
                    errorMessage="Please enter a valid full name"
                    fullWidth={true}
                    label="Full Name"
                    labelPlacement="outside"
                    name="fullName"
                    placeholder="Enter your full name"
                    radius="sm"
                    type="text"
                    onChange={onChange}
                  />

                  <Input
                    errorMessage="Please enter a valid email"
                    label="Email"
                    labelPlacement="outside"
                    name="email"
                    placeholder="Enter your email"
                    radius="sm"
                    type="email"
                    onChange={onChange}
                  />

                  <Input
                    errorMessage="Please enter a valid password"
                    label="Password"
                    labelPlacement="outside"
                    name="password"
                    placeholder="Enter your password"
                    radius="sm"
                    type="password"
                    onChange={onChange}
                  />
                  <Button
                    color="primary"
                    fullWidth={true}
                    type="submit"
                    onChange={onChange}
                  >
                    Sign Up as Client
                  </Button>
                </Form>
              </Tab>
            </Tabs>

            <div className="mt-0 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  className="text-blue-600 hover:text-blue-500 font-bold"
                  href="/auth/login"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
