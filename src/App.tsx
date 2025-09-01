import { Route, Routes } from "react-router-dom";
import { ToastProvider } from "@heroui/toast";

import { AuthProvider } from "@/components/auth-provider.tsx";
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/auth/login.tsx";
import { SignupPage } from "@/pages/auth/signup.tsx";
import ClientDashboard from "@/pages/client/client-dashboard.tsx";
import EmployeeDashboard from "@/pages/employee/employee-dashboard.tsx";
import PostJob from "@/pages/client/post-job.tsx";

function App() {
  return (
    <AuthProvider>
      <ToastProvider />
      <Routes>
        {/* Landing Page */}
        <Route element={<IndexPage />} path="/" />
        {/* Authentication Pages*/}
        <Route element={<LoginPage />} path="/auth/login" />
        <Route element={<SignupPage />} path="/auth/signup" />
        {/* Client Pages */}
        <Route element={<ClientDashboard />} path="/client/dashboard" />
        <Route element={<PostJob />} path="/client/post-job" />
        {/*  Employee Pages */}
        <Route element={<EmployeeDashboard />} path="/employee/dashboard" />
      </Routes>
    </AuthProvider>
  );
}

export default App;
