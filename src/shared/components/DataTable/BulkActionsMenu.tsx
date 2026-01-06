import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, Loader2 } from "lucide-react";
import { DataTableBulkAction } from "./types";

interface BulkActionsMenuProps<T = any> {
  selectedCount: number;
  selectedRows: T[];
  actions: DataTableBulkAction<T>[];
}

export function BulkActionsMenu<T = any>({
  selectedCount,
  selectedRows,
  actions,
}: BulkActionsMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (selectedCount === 0 || actions.length === 0) {
    return null;
  }

  const enabledActions = actions.filter((action) => {
    const minSelected = action.minSelected || 1;
    if (selectedCount < minSelected) return false;
    
    if (typeof action.disabled === "function") {
      return !action.disabled(selectedRows);
    }
    return !action.disabled;
  });

  if (enabledActions.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <MoreVertical className="h-4 w-4" />
        <span className="hidden sm:inline">
          {selectedCount} selected
        </span>
      </Button>

      {/* Slide-down panel */}
      <div
        className={`absolute top-full left-0 mt-2 bg-white border border-border rounded-md shadow-lg z-50 min-w-[200px] transition-all duration-200 ease-in-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="p-2 space-y-1">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            const minSelected = action.minSelected || 1;
            const isDisabled =
              selectedCount < minSelected ||
              (typeof action.disabled === "function"
                ? action.disabled(selectedRows)
                : action.disabled === true);

            return (
              <button
                key={idx}
                onClick={() => {
                  if (!isDisabled) {
                    action.onClick(selectedRows);
                    setIsOpen(false);
                  }
                }}
                disabled={isDisabled}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                  isDisabled
                    ? "text-muted-foreground cursor-not-allowed opacity-50"
                    : "hover:bg-muted cursor-pointer"
                } ${
                  action.variant === "destructive"
                    ? "text-destructive hover:bg-destructive/10"
                    : ""
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

