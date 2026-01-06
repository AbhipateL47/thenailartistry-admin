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
import { useDeleteProduct, getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/shared/utils/toast";

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productId: string;
}

export function DeleteProductDialog({
  isOpen,
  onClose,
  productName,
  productId,
}: DeleteProductDialogProps) {
  const deleteMutation = useDeleteProduct();
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    try {
      await deleteMutation.mutateAsync(productId);
      toast.success('Product deleted successfully');
      onClose();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !deleteMutation.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{productName}"? This action cannot be undone.
            {error && (
              <div className="mt-2 p-2 text-sm text-destructive bg-destructive/10 rounded">
                {error}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

