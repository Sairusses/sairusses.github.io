import { Route, Routes } from "react-router-dom";
import { ToastProvider } from "@heroui/toast";

import { AuthProvider } from "@/components/auth-provider.tsx";
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/auth/login.tsx";
import { SignupPage } from "@/pages/auth/signup.tsx";
import ClientDashboard from "@/pages/client/dashboard.tsx";
import EmployeeDashboard from "@/pages/employee/dashboard.tsx";

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
        {/*  Employee Pages */}
        <Route element={<EmployeeDashboard />} path="/employee/dashboard" />
      </Routes>
    </AuthProvider>
  );
}

export default App;
