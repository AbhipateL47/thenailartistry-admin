import { useState, useRef, useEffect } from "react";
import { Menu, Search, MoreVertical, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/client";
import { createPortal } from "react-dom";

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen?: boolean;
  isCollapsed?: boolean;
}

export function Header({ onMenuClick, isSidebarOpen = true, isCollapsed = false }: HeaderProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [notificationsPosition, setNotificationsPosition] = useState({ top: 0, right: 0 });
  
  // Mock notifications data - replace with real data later
  const notifications = [
    { id: 1, message: "New order received", time: "2 minutes ago", type: "order" },
    { id: 2, message: "Payment processed 1", time: "1 hour ago", type: "payment" },
    { id: 2, message: "Payment processed 2", time: "1 hour ago", type: "payment" },
    { id: 2, message: "Payment processed 3", time: "1 hour ago", type: "payment" },
    { id: 2, message: "Payment processed 4", time: "1 hour ago", type: "payment" },
    { id: 2, message: "Payment processed 5", time: "1 hour ago", type: "payment" },
    { id: 2, message: "Payment processed 6", time: "1 hour ago", type: "payment" },
    { id: 2, message: "Payment processed 7", time: "1 hour ago", type: "payment" },
    { id: 2, message: "Payment processed", time: "1 hour ago", type: "payment" },
    { id: 3, message: "Product stock low", time: "3 hours ago", type: "stock" },
  ];
  const hasManyNotifications = notifications.length > 5;

  // Calculate popup positions
  useEffect(() => {
    if (isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8, // 8px = mt-2 (0.5rem)
        right: window.innerWidth - rect.right,
      });
    }
    if (isNotificationsOpen && notificationsButtonRef.current) {
      const rect = notificationsButtonRef.current.getBoundingClientRect();
      setNotificationsPosition({
        top: rect.bottom + 8, // 8px = mt-2 (0.5rem)
        right: window.innerWidth - rect.right,
      });
    }
  }, [isMenuOpen, isNotificationsOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node) &&
          notificationsButtonRef.current && !notificationsButtonRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isMenuOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isNotificationsOpen]);

  // Close notifications popup with ESC key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isNotificationsOpen) {
        setIsNotificationsOpen(false);
      }
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isNotificationsOpen || isMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isNotificationsOpen, isMenuOpen]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await apiClient.post('/v1/admin/auth/logout');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate to login anyway on error
      navigate('/login');
    }
  };

  const handleSettings = () => {
    setIsMenuOpen(false);
    navigate('/settings');
  };

  const handleShowAllNotifications = () => {
    setIsNotificationsOpen(false);
    navigate('/notifications');
  };

  return (
    <>
      <header className={`fixed top-0 right-0 left-0 h-[65px] z-40 bg-white border-b border-border transition-all duration-300 ${isSidebarOpen ? (isCollapsed ? 'lg:left-16' : 'lg:left-64') : 'lg:left-0'}`}>
        <div className="flex items-center justify-between h-full px-3 md:px-4 lg:px-6 max-w-full">
          {/* Left: Menu button + Search bar */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Search bar (hidden on mobile, visible on desktop) */}
            <div className="hidden md:flex flex-1 max-w-md min-w-0">
              <div className="relative w-full min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Notifications Bell */}
            <div className="relative">
              <Button
                ref={notificationsButtonRef}
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
                )}
              </Button>
            </div>
            
            {/* Three-dot menu */}
            <div className="relative">
              <Button
                ref={menuButtonRef}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Popup - Portal */}
      {isNotificationsOpen && createPortal(
        <div 
          ref={notificationsRef}
          className="fixed bg-white border border-border rounded-md shadow-lg z-[100] flex flex-col max-h-[280px]"
          style={{
            top: `${notificationsPosition.top}px`,
            right: `${notificationsPosition.right}px`,
            width: `calc(100vw - 2rem)`,
            maxWidth: '20rem', // max-w-80
          }}
        >
          <div className="p-4 border-b border-border flex-shrink-0">
            <h3 className="font-semibold text-sm">Notifications</h3>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {hasManyNotifications && (
            <div className="p-3 border-t border-border flex-shrink-0">
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleShowAllNotifications}
              >
                Show All
              </Button>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Menu Dropdown - Portal */}
      {isMenuOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed bg-white border border-border rounded-md shadow-lg z-[100]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            width: '12rem', // w-48
          }}
        >
          <div className="py-1">
            <button
              onClick={handleSettings}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted text-destructive transition-colors"
            >
              Logout
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
