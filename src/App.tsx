import { Route, Routes } from "react-router-dom";
import { ToastProvider } from "@heroui/toast";

import { AuthProvider } from "@/components/auth-provider.tsx";
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/auth/login.tsx";
import { SignupPage } from "@/pages/auth/signup.tsx";
import ClientDashboard from "@/pages/client/client-dashboard.tsx";
import EmployeeDashboard from "@/pages/employee/employee-dashboard.tsx";
import PostJob from "@/pages/client/jobs/post-job.tsx";
import ClientJobsListPage from "@/pages/client/jobs/jobs-list.tsx";
import ClientJobDetailsPage from "@/pages/client/jobs/client-jobs-details.tsx";
import EditJobPage from "@/pages/client/jobs/edit-jobs.tsx";
import EmployeeJobsPage from "@/pages/employee/jobs/jobs-list.tsx";
import EmployeeJobDetailsPage from "@/pages/employee/jobs/employee-jobs-details.tsx";
import ClientProfile from "@/pages/client/client-profile.tsx";
import EmployeeProfile from "@/pages/employee/employee-profile.tsx";
import EmployeeProposalsPage from "@/pages/employee/proposals/employee-proposals-list.tsx";
import EmployeeProposalDetailsPage from "@/pages/employee/proposals/employee-proposals-details.tsx";
import ClientProposalsList from "@/pages/client/proposals/client-proposals-list.tsx";
import ClientProposalDetails from "@/pages/client/proposals/client-proposal-details.tsx";
import MessagesPage from "@/pages/messages/messages.tsx";
import EmployeeContractsPage from "@/pages/employee/contracts/employee-contracts.tsx";
import EmployeeContractDetailsPage from "@/pages/employee/contracts/employee-contract-details.tsx";

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
        <Route element={<ClientProfile />} path="/client/profile" />
        <Route element={<PostJob />} path="/client/post-job" />
        <Route element={<ClientJobsListPage />} path="/client/jobs" />
        <Route element={<ClientJobDetailsPage />} path="/client/jobs/details" />
        <Route element={<EditJobPage />} path="/client/jobs/edit/:id" />
        <Route element={<ClientProposalsList />} path="/client/proposals/" />
        {/* eslint-disable-next-line */}
        <Route element={<ClientProposalDetails />} path="/client/proposals/details" />

        {/*  Employee Pages */}
        <Route element={<EmployeeDashboard />} path="/employee/dashboard" />
        <Route element={<EmployeeProfile />} path="/employee/profile" />
        <Route element={<EmployeeJobsPage />} path="/employee/jobs" />
        {/* eslint-disable-next-line */}
        <Route element={<EmployeeJobDetailsPage />} path="/employee/jobs/details" />
        <Route element={<EmployeeProposalsPage />} path="/employee/proposals" />
        {/* eslint-disable-next-line */}
        <Route element={<EmployeeProposalDetailsPage />} path="/employee/proposals/details" />
        <Route element={<EmployeeContractsPage />} path="/employee/contracts" />
        {/* eslint-disable-next-line */}
        <Route element={<EmployeeContractDetailsPage />} path="/employee/contracts/details" />

        {/* Messages Page */}
        <Route element={<MessagesPage />} path="/messages" />
      </Routes>
    </AuthProvider>
  );
}

export default App;
