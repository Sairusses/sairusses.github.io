import { Briefcase } from "lucide-react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input, Button, Link, Form, addToast } from "@heroui/react";
import React, { useState } from "react";

import { supabase } from "@/lib/supabase.ts";

export default function LoginPage() {
  const [formData, setFormData] = useState({
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
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        addToast({
          title: "Error logging in",
          description: error.message,
          color: "danger",
        });
      }
      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const fullName = user?.user_metadata?.fullName || "User";

        addToast({
          title: "Logged in successfully",
          description: `Welcome back to ManPower, ${fullName}!`,
          color: "success",
        });
      }
    } catch (error: any) {
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Briefcase className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your ManPower account
          </p>
        </div>
        {/* Login Form */}
        <Card className="p-5">
          <CardHeader className="flex flex-col">
            <div className="text-3xl font-bold text-center">Sign In</div>
            <div className="text-gray-500 text-center">
              Enter your credentials to access your account
            </div>
          </CardHeader>
          <CardBody>
            <Form
              className="w-full flex flex-col gap-4 items-center"
              onSubmit={onSubmit}
            >
              <Input
                errorMessage="Please enter a valid username"
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder="Enter your email"
                radius="sm"
                type="email"
                onChange={onChange}
              />

              <Input
                errorMessage="Please enter a valid email"
                label="Password"
                labelPlacement="outside"
                name="password"
                placeholder="Enter your password"
                radius="sm"
                type="password"
                onChange={onChange}
              />
              <Button color="primary" fullWidth={true} type="submit" onChange={onChange}>
                Sign In
              </Button>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&#39;t have an account?{" "}
                <Link
                  className="text-blue-600 hover:text-blue-500 font-bold"
                  href="/auth/signup"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
