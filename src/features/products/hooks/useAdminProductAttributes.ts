import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from '@/shared/utils/toast';

export interface ProductAttribute {
  _id: string;
  name: string;
  slug: string;
  values: string[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductAttributeDto {
  name: string;
  slug?: string;
  values: string[];
  isActive?: boolean;
  order?: number;
}

export interface UpdateProductAttributeDto {
  name?: string;
  slug?: string;
  values?: string[];
  isActive?: boolean;
  order?: number;
}

interface ProductAttributesResponse {
  success: boolean;
  data: ProductAttribute[];
}

interface ProductAttributeResponse {
  success: boolean;
  data: ProductAttribute;
}

export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An error occurred';
};

// Get all product attributes
export const useAdminProductAttributes = (isActive?: boolean, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'productAttributes', isActive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (isActive !== undefined) {
        params.append('isActive', String(isActive));
      }
      const response = await apiClient.get<ProductAttributesResponse>(
        `/v1/admin/product-attributes${params.toString() ? `?${params.toString()}` : ''}`, { signal }
      );
      return response.data.data;
    },
  });
};

// Get single product attribute
export const useAdminProductAttribute = (id: string, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'productAttributes', id],
    queryFn: async () => {
      const response = await apiClient.get<ProductAttributeResponse>(
        `/v1/admin/product-attributes/${id}`, { signal }
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

// Create product attribute
export const useCreateProductAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductAttributeDto) => {
      const response = await apiClient.post<ProductAttributeResponse>(
        '/v1/admin/product-attributes',
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productAttributes'] });
      toast.success('Product attribute created successfully');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// Update product attribute
export const useUpdateProductAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductAttributeDto }) => {
      const response = await apiClient.put<ProductAttributeResponse>(
        `/v1/admin/product-attributes/${id}`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productAttributes'] });
      toast.success('Product attribute updated successfully');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// Delete product attribute
export const useDeleteProductAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/v1/admin/product-attributes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'productAttributes'] });
      toast.success('Product attribute deleted successfully');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
};

