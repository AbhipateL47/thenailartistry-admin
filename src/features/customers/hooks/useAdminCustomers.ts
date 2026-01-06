import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface AdminCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: 'customer' | 'admin' | 'manager';
  isEmailVerified: boolean;
  addresses?: Array<{
    label?: string;
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    isDefault?: boolean;
  }>;
  wishlist?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface CustomersResponse {
  success: boolean;
  data: AdminCustomer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface CustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isEmailVerified?: boolean;
  deleted?: 'true' | 'only';
}

const fetchCustomers = async (params: CustomersParams = {}, signal?: AbortSignal): Promise<CustomersResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.order) queryParams.append('order', params.order);
  if (params.isEmailVerified !== undefined) queryParams.append('isEmailVerified', params.isEmailVerified.toString());
  if (params.deleted) queryParams.append('deleted', params.deleted);

  const response = await apiClient.get<CustomersResponse>(`/v1/admin/customers?${queryParams.toString()}`, { signal });
  if (!response.data.success) {
    throw new Error('Failed to fetch customers');
  }
  return response.data;
};

export const useAdminCustomers = (params: CustomersParams = {}, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'customers', params],
    queryFn: ({ signal }) => fetchCustomers(params, signal),
    placeholderData: (previousData) => previousData,
  });
};

