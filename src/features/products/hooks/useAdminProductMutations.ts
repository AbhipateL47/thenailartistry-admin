import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { AdminProduct } from '@/features/products/hooks/useAdminProducts';
import { AxiosError } from 'axios';

interface CreateProductData {
  title: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryIds?: string[];
  tags?: string[];
  variants?: Array<{
    sku?: string;
    price: number;
    mrp?: number;
    stock?: number;
    attributes?: Record<string, any>;
    images?: string[];
  }>;
  primaryImage?: string;
  gallery?: string[];
  isFeatured?: boolean;
  isOnSale?: boolean;
  salePercent?: number;
}

interface UpdateProductData extends CreateProductData {}

interface UpdateProductStatusData {
  isFeatured?: boolean;
  isOnSale?: boolean;
  salePercent?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Helper to extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  return 'An error occurred';
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData): Promise<AdminProduct> => {
      const response = await apiClient.post<ApiResponse<AdminProduct>>('/v1/admin/products', data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create product');
      }
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate products list queries
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: UpdateProductData }): Promise<AdminProduct> => {
      const response = await apiClient.put<ApiResponse<AdminProduct>>(`/v1/admin/products/${productId}`, data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update product');
      }
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate products list queries
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      const response = await apiClient.delete<ApiResponse<void>>(`/v1/admin/products/${productId}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete product');
      }
    },
    onSuccess: () => {
      // Invalidate products list queries
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
};

export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: UpdateProductStatusData }): Promise<AdminProduct> => {
      const response = await apiClient.patch<ApiResponse<AdminProduct>>(`/v1/admin/products/${productId}/status`, data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update product status');
      }
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate products list queries
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
};

// Export error helper
export { getErrorMessage };

// Hook to get product by productCode
export const useAdminProductByCode = (productCode: string) => {
  return useQuery({
    queryKey: ['adminProductByCode', productCode],
    queryFn: async (): Promise<AdminProduct> => {
      const response = await apiClient.get<ApiResponse<AdminProduct>>(`/v1/admin/products/code/${productCode}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch product');
      }
      return response.data.data;
    },
    enabled: !!productCode && /^[A-Z0-9]{5}$/.test(productCode),
    staleTime: 30 * 1000,
  });
};

// Hook to update product by productCode
export const useUpdateProductByCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productCode, data }: { productCode: string; data: UpdateProductData }): Promise<AdminProduct> => {
      const response = await apiClient.put<ApiResponse<AdminProduct>>(`/v1/admin/products/code/${productCode}`, data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update product');
      }
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate products list queries and product detail queries
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminProductByCode'] });
    },
  });
};

