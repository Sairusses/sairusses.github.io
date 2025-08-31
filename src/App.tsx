import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import LoginPage from "@/pages/auth/login.tsx";
import { SignupPage } from "@/pages/auth/signup.tsx";
import ClientDashboard from "@/pages/client/dashboard.tsx";

function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route element={<IndexPage />} path="/" />
      {/* Authentication Pages*/}
      <Route element={<LoginPage />} path="/auth/login" />
      <Route element={<SignupPage />} path="/auth/signup" />
      {/* Client Pages */}
      <Route element={<ClientDashboard />} path="/auth/signup" />
    </Routes>
  );
}

export default App;
