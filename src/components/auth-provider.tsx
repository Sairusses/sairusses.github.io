import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "@/lib/supabase.ts";

export function AuthProvider({ children }: { children: React.ReactNode }) {


  return <>{children}</>;
}
