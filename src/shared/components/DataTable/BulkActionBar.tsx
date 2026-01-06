import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Star, Tag, Power, PackageX } from "lucide-react";
import { DataTableBulkAction } from "./types";
import { toast } from "@/shared/utils/toast";

interface BulkActionBarProps<T = any> {
  selectedCount: number;
  selectedRows: T[];
  actions: DataTableBulkAction<T>[];
  onActionComplete?: () => void;
}

export function BulkActionBar<T = any>({
  selectedCount,
  selectedRows,
  actions,
  onActionComplete,
}: BulkActionBarProps<T>) {
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleActionClick = async (action: DataTableBulkAction<T>) => {
    const minRequired = action.minSelected || 2;
    if (selectedCount < minRequired) {
      toast.error(`Select at least ${minRequired} item(s)`);
      return;
    }

    setExecutingAction(action.label);
    setError(null);

    try {
      await action.onClick(selectedRows);
      // On success: clear selection and close bar
      // Note: Toast messages are handled by the action's onClick handler
      onActionComplete?.();
    } catch (err: any) {
      // On failure: keep bar open and show error
      setError(err?.message || `Failed to ${action.label.toLowerCase()}`);
      // Only show error toast if action handler didn't already show one
      if (!err?.toastShown) {
        toast.error(err?.message || `Failed to ${action.label.toLowerCase()}`);
      }
    } finally {
      setExecutingAction(null);
    }
  };

  const isActionDisabled = (action: DataTableBulkAction<T>) => {
    const minRequired = action.minSelected || 2;
    return selectedCount < minRequired || executingAction !== null;
  };

  return (
    <div className="border-t border-border bg-muted/30 relative">
      <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </span>
          {actions.length > 0 && (() => {
            const minRequired = Math.min(...actions.map(a => a.minSelected || 2));
            if (selectedCount < minRequired) {
              return (
                <span className="text-xs text-muted-foreground">
                  (Select at least {minRequired} item(s) to perform bulk actions)
                </span>
              );
            }
            return null;
          })()}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            const isExecuting = executingAction === action.label;
            const minRequired = action.minSelected || 2;
            const isDisabled = isActionDisabled(action);

            return (
              <Button
                key={idx}
                variant={action.variant || "outline"}
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={isDisabled}
                className="gap-2"
                title={selectedCount < minRequired ? `Select at least ${minRequired} item(s)` : action.label}
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  Icon && <Icon className="h-4 w-4" />
                )}
                {action.label}
              </Button>
            );
          })}
        </div>

        {error && (
          <div className="text-sm text-destructive mt-2 w-full">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

