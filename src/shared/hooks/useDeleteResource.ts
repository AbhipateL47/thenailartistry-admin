import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { getErrorMessage } from "@/features/products/hooks/useAdminProductMutations";
import { toast } from "@/shared/utils/toast";

interface DeleteResourceOptions {
  resource: string; // e.g., "products", "orders", "coupons"
  invalidateKeys: (string | string[])[]; // React Query keys to invalidate (array format: ['admin', 'products'])
  singleEndpoint?: (id: string) => string; // Custom endpoint for single delete
  bulkEndpoint?: string; // Custom endpoint for bulk delete
  idField?: string; // Field name for IDs in bulk request (default: `${resource}Ids`)
}

export function useDeleteResource({
  resource,
  invalidateKeys,
  singleEndpoint,
  bulkEndpoint,
  idField,
}: DeleteResourceOptions) {
  const queryClient = useQueryClient();

  const singleDelete = useMutation({
    mutationFn: async (id: string) => {
      const endpoint = singleEndpoint
        ? singleEndpoint(id)
        : `/v1/admin/${resource}/${id}`;
      const response = await apiClient.delete(endpoint);
      return response.data;
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const endpoint = bulkEndpoint || `/v1/admin/${resource}/bulk/delete`;
      // Handle different field names
      let fieldName = idField;
      if (!fieldName) {
        // Default mapping
        const fieldMap: Record<string, string> = {
          products: "productIds",
          orders: "orderIds",
          coupons: "couponIds",
          "audit-logs": "auditLogIds",
          customers: "customerIds",
        };
        fieldName = fieldMap[resource] || `${resource.slice(0, -1)}Ids`;
      }
      const response = await apiClient.post(endpoint, {
        [fieldName]: ids,
      });
      return response.data;
    },
    onSuccess: (_, ids) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    onError: (error: any) => {
      // Error toast is handled by caller
      throw error;
    },
  });

  return {
    singleDelete: singleDelete.mutateAsync,
    bulkDelete: bulkDelete.mutateAsync,
    isDeleting: singleDelete.isPending || bulkDelete.isPending,
  };
}

