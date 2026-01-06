import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/features/auth/hooks/useAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: user, isLoading, isError } = useAdminAuth();

  // Show loading skeleton while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or not admin/manager
  if (isError || !user || (user.role !== 'admin' && user.role !== 'manager')) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

