import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/features/auth/hooks/useAdminAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { data: user, isLoading } = useAdminAuth();

  // Don't redirect while loading
  if (isLoading) {
    return <>{children}</>;
  }

  // If already logged in, redirect to dashboard
  if (user && (user.role === 'admin' || user.role === 'manager')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

