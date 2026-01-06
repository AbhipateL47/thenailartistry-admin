import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/shared/utils/toast";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resourceName: string;
  entityLabel: string;
  entityCount?: number;
  onConfirm: () => Promise<void>;
  isBulk?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  resourceName,
  entityLabel,
  entityCount = 1,
  onConfirm,
  isBulk = false,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);
    try {
      await onConfirm();
      toast.success(
        isBulk
          ? `Deleted ${entityCount} ${resourceName}(s) successfully`
          : `${resourceName} deleted successfully`
      );
      onClose();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError("");
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? `Delete ${entityCount} ${resourceName}(s)?` : `Delete ${resourceName}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk
              ? `Are you sure you want to delete ${entityCount} ${resourceName}(s)? This action cannot be undone.`
              : `Are you sure you want to delete "${entityLabel}"? This action cannot be undone.`}
            {error && (
              <div className="mt-2 p-2 text-sm text-destructive bg-destructive/10 rounded">
                {error}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

