import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface Coupon {
  _id: string;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  maxDiscountAmount?: number | null;
  minCartValue: number;
  maxTotalUses?: number | null;
  maxUsesPerUser: number;
  usedCount: number;
  validFrom: string;
  validTill: string;
  isActive: boolean;
  stackable: boolean;
  tags: string[];
  appliesTo: 'ALL' | 'PRODUCTS' | 'CATEGORIES';
  productIds?: string[];
  categoryIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface CouponsResponse {
  success: boolean;
  data: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface CouponResponse {
  success: boolean;
  data: Coupon;
  message?: string;
}

interface CouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | string;
  expired?: 'true' | 'false';
  deleted?: 'true' | 'only' | 'false';
}

interface CreateCouponDto {
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  maxDiscountAmount?: number | null;
  minCartValue?: number;
  maxTotalUses?: number | null;
  maxUsesPerUser?: number;
  validFrom?: string;
  validTill: string;
  isActive?: boolean;
  stackable?: boolean;
  tags?: string[];
  appliesTo?: 'ALL' | 'PRODUCTS' | 'CATEGORIES';
  productIds?: string[];
  categoryIds?: string[];
}

interface UpdateCouponDto extends Partial<CreateCouponDto> {}

const fetchCoupons = async (params: CouponsParams = {}, signal?: AbortSignal): Promise<CouponsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
  if (params.expired) queryParams.append('expired', params.expired);
  if (params.deleted) queryParams.append('deleted', params.deleted);

  const response = await apiClient.get<CouponsResponse>(`/v1/admin/coupons?${queryParams.toString()}`, { signal });
  if (!response.data.success) {
    throw new Error('Failed to fetch coupons');
  }
  return response.data;
};

const fetchCouponById = async (id: string, signal?: AbortSignal): Promise<Coupon> => {
  const response = await apiClient.get<CouponResponse>(`/v1/admin/coupons/${id}`, { signal });
  if (!response.data.success) {
    throw new Error('Failed to fetch coupon');
  }
  return response.data.data;
};

export const useAdminCoupons = (params: CouponsParams = {}, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'coupons', params],
    queryFn: ({ signal }) => fetchCoupons(params, signal),
    placeholderData: (previousData) => previousData,
  });
};

export const useAdminCoupon = (id: string, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'coupons', id],
    queryFn: ({ signal }) => fetchCouponById(id, signal),
    enabled: !!id,
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCouponDto): Promise<Coupon> => {
      const response = await apiClient.post<CouponResponse>('/v1/admin/coupons', data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create coupon');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCouponDto }): Promise<Coupon> => {
      const response = await apiClient.put<CouponResponse>(`/v1/admin/coupons/${id}`, data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update coupon');
      }
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons', variables.id] });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await apiClient.delete<CouponResponse>(`/v1/admin/coupons/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete coupon');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
};

export const useRestoreCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Coupon> => {
      const response = await apiClient.post<CouponResponse>(`/v1/admin/coupons/${id}/restore`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to restore coupon');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
};

