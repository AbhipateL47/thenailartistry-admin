import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/layouts/Sidebar";
import { Header } from "@/layouts/Header";
import { useAdminAuth } from "@/features/auth/hooks/useAdminAuth";
import { SidebarSkeleton } from "@/shared/components/skeletons/SidebarSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { data: user, isLoading } = useAdminAuth();

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <aside className="hidden lg:block w-64 bg-white border-r border-border">
          <SidebarSkeleton />
        </aside>
        <div className="flex-1 lg:ml-64">
          <div className="h-[65px] border-b border-border" />
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      // Desktop: toggle between collapsed and expanded (sidebar always stays open)
      setIsSidebarCollapsed(!isSidebarCollapsed);
    } else {
      // Mobile: open sidebar
      setIsMobileSidebarOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        isDesktopOpen={isDesktopSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        user={user}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isDesktopSidebarOpen ? (isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : 'lg:ml-0'}`}>
        <Header onMenuClick={handleMenuClick} isSidebarOpen={isDesktopSidebarOpen} isCollapsed={isSidebarCollapsed} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto pt-[65px]">
          <div className="p-6 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
