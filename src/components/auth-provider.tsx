import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "@/lib/supabase.ts";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const publicRoutes = ["", "/", "/auth/login", "/auth/signup"];

  const clientRoutes = ["/client"];
  const employeeRoutes = ["/employee"];

  useEffect(() => {
    const finishLoading = () => {
      // Ensure spinner displays at least 500ms
      setTimeout(() => setLoading(false), 500);
    };

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // No session → only allow public routes
        if (!publicRoutes.includes(location.pathname)) {
          navigate("/");
        }
        finishLoading();

        return;
      }

      const role = user?.user_metadata?.role;

      if (
        role === "client" &&
        employeeRoutes.some((r) => location.pathname.startsWith(r))
      ) {
        navigate("/client/dashboard");
        finishLoading();

        return;
      }

      if (
        role === "employee" &&
        clientRoutes.some((r) => location.pathname.startsWith(r))
      ) {
        navigate("/employee/dashboard");
        finishLoading();

        return;
      }

      if (publicRoutes.includes(location.pathname)) {
        if (role === "client") {
          navigate("/client/dashboard");
        } else if (role === "employee") {
          navigate("/employee/dashboard");
        }
      }

      finishLoading();
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          if (!publicRoutes.includes(location.pathname)) {
            navigate("/");
          }
        } else {
          const role = session.user?.user_metadata?.role;

          // 🚨 Enforce role-based access also on auth changes
          if (
            role === "client" &&
            employeeRoutes.some((r) => location.pathname.startsWith(r))
          ) {
            navigate("/client/dashboard");

            return;
          }

          if (
            role === "employee" &&
            clientRoutes.some((r) => location.pathname.startsWith(r))
          ) {
            navigate("/employee/dashboard");

            return;
          }

          // If logged in and on a public route, go to dashboard
          if (publicRoutes.includes(location.pathname)) {
            if (role === "client") {
              navigate("/client/dashboard");
            } else if (role === "employee") {
              navigate("/employee/dashboard");
            }
          }
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
