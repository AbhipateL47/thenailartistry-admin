import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface Sale {
  _id: string;
  heading: string;
  description: string;
  couponCode?: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  imageAlt?: string;
  order: number;
  isActive: boolean;
  validFrom: string;
  validTill?: string;
  placement?: 'homeHero' | 'homeMid' | 'productPage';
  ctaType?: 'link' | 'coupon';
  couponId?: string | { _id: string; code: string; type: string; value: number };
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface SalesResponse {
  success: boolean;
  data: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface SaleResponse {
  success: boolean;
  data: Sale;
  message?: string;
}

interface SalesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | string;
  deleted?: 'true' | 'only' | 'false';
}

interface CreateSaleDto {
  heading: string;
  description: string;
  couponCode?: string;
  ctaText?: string;
  ctaLink?: string;
  image: string;
  imageAlt?: string;
  order?: number;
  isActive?: boolean;
  validFrom?: string;
  validTill?: string;
}

interface UpdateSaleDto extends Partial<CreateSaleDto> {}

const fetchSales = async (params: SalesParams = {}, signal?: AbortSignal): Promise<SalesResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
  if (params.deleted) queryParams.append('deleted', params.deleted);

  const response = await apiClient.get<SalesResponse>(`/v1/admin/sales?${queryParams.toString()}`, { signal });
  if (!response.data.success) {
    throw new Error('Failed to fetch sales');
  }
  return response.data;
};

const fetchSaleById = async (id: string, signal?: AbortSignal): Promise<Sale> => {
  const response = await apiClient.get<SaleResponse>(`/v1/admin/sales/${id}`, { signal });
  if (!response.data.success) {
    throw new Error('Failed to fetch sale');
  }
  return response.data.data;
};

export const useAdminSales = (params: SalesParams = {}, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'sales', params],
    queryFn: ({ signal }) => fetchSales(params, signal),
    placeholderData: (previousData) => previousData,
  });
};

export const useAdminSale = (id: string, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'sales', id],
    queryFn: ({ signal }) => fetchSaleById(id, signal),
    enabled: !!id,
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSaleDto): Promise<Sale> => {
      const response = await apiClient.post<SaleResponse>('/v1/admin/sales', data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create sale');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales'] });
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSaleDto }): Promise<Sale> => {
      const response = await apiClient.put<SaleResponse>(`/v1/admin/sales/${id}`, data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update sale');
      }
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales', variables.id] });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await apiClient.delete<SaleResponse>(`/v1/admin/sales/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete sale');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales'] });
    },
  });
};

export const useRestoreSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Sale> => {
      const response = await apiClient.post<SaleResponse>(`/v1/admin/sales/${id}/restore`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to restore sale');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales'] });
    },
  });
};
