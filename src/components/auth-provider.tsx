import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "@/lib/supabase.ts";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Public routes (accessible when logged out)
  const publicRoutes = ["/", "/auth/login", "/auth/signup"];

  useEffect(() => {
    const finishLoading = () => {
      // ensure spinner displays at least 500ms
      setTimeout(() => setLoading(false), 500);
    };

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!publicRoutes.includes(location.pathname)) {
          navigate("/");
        }
        finishLoading();
        return;
      }

      const role = session.user?.user_metadata?.role;

      if (role === "client") {
        navigate("/client/dashboard");
      } else if (role === "employee") {
        navigate("/employee/dashboard");
      }

      finishLoading();
    };

    checkSession();

    // Listen for login/logout changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          if (!publicRoutes.includes(location.pathname)) {
            navigate("/");
          }
        } else {
          const role = session.user?.user_metadata?.role;

          if (role === "client") {
            navigate("/client/dashboard");
          } else if (role === "employee") {
            navigate("/employee/dashboard");
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
      <div className="flex items-center justify-center h-screen">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-22 w-22 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
