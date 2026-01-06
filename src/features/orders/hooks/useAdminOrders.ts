import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface AdminOrder {
  _id: string;
  orderNumber: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  guestEmail?: string;
  grandTotal: number;
  status: 'PLACED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  payment?: {
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  success: boolean;
  data: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface OrdersParams {
  page?: number;
  limit?: number;
  status?: 'PLACED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  deleted?: 'true' | 'only';
}

const fetchOrders = async (params: OrdersParams = {}, signal?: AbortSignal): Promise<OrdersResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.order) queryParams.append('order', params.order);
  if (params.deleted) queryParams.append('deleted', params.deleted);

  const response = await apiClient.get<OrdersResponse>(`/v1/admin/orders?${queryParams.toString()}`, { signal });
  if (!response.data.success) {
    throw new Error('Failed to fetch orders');
  }
  return response.data;
};

export const useAdminOrders = (params: OrdersParams = {}, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: ({ signal }) => fetchOrders(params, signal),
    placeholderData: (previousData) => previousData,
  });
};

