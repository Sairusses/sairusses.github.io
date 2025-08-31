import { Briefcase } from "lucide-react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input, Button, Link, Form } from "@heroui/react";
import React from "react";

export default function LoginPage() {
  const [action, setAction] = React.useState(null);

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
              onReset={() => setAction(null)}
              onSubmit={(e: { preventDefault: () => void }) => {
                e.preventDefault();

                setAction(null);
              }}
            >
              <Input
                errorMessage="Please enter a valid username"
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder="Enter your email"
                radius="sm"
                type="text"
              />

              <Input
                errorMessage="Please enter a valid email"
                label="Password"
                labelPlacement="outside"
                name="password"
                placeholder="Enter your password"
                radius="sm"
                type="email"
              />
              <Button color="primary" fullWidth={true} type="submit">
                Sign In
              </Button>
              {action && (
                <div className="text-small text-default-500">
                  Action: <code>{action}</code>
                </div>
              )}
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
