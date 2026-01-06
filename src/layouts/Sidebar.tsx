import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Settings, X, Menu, Tags, User, Ticket, FileText } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useState } from "react";
import { AdminUser } from "@/features/auth/hooks/useAdminAuth";

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Orders", icon: ShoppingBag, path: "/orders", badge: 12 },
  { label: "Attributes", icon: Tags, path: "/product-attributes" },
  { label: "Coupons", icon: Ticket, path: "/coupons" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Audit Logs", icon: FileText, path: "/audit-logs" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isDesktopOpen?: boolean;
  isCollapsed?: boolean;
  user?: AdminUser | null;
}

export function Sidebar({ isMobileOpen, onMobileClose, isDesktopOpen = true, isCollapsed = false, user }: SidebarProps) {
  const location = useLocation();
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "A";
    if (user.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "A";
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "Admin";
    return user.name || user.email?.split("@")[0] || "Admin";
  };

  // Get user role display
  const getUserRole = () => {
    if (!user) return "Administrator";
    if (user.role === "admin") return "Administrator";
    if (user.role === "manager") return "Manager";
    return "User";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-white border-r border-border transition-all duration-300 ease-in-out",
          isDesktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16 lg:w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Header */}
          <div className={cn(
            "flex items-center justify-between h-[65px] border-b border-border",
            isCollapsed ? "px-4 justify-center" : "px-6"
          )}>
            <div className="flex items-center justify-center flex-1">
              <img 
                src="/logo.png" 
                alt="The Nail Artistry" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1 rounded-md hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className={cn(
            "flex-1 overflow-y-auto space-y-1",
            isCollapsed ? "p-2" : "p-4"
          )}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    // Close mobile sidebar when navigating
                    if (window.innerWidth < 1024) {
                      onMobileClose();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-md text-sm font-medium transition-colors relative",
                    "hover:bg-muted",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                    isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="flex-1">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-white">
                      {item.badge}
                    </span>
                  )}
                  {isCollapsed && isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Footer */}
          {!isCollapsed && user && (
            <div className="p-4 border-t border-border">
              <Link
                to="/settings"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onMobileClose();
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={getUserDisplayName()}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {getUserDisplayName()}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {getUserRole()}
                  </div>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

