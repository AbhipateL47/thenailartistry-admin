import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { AxiosError } from 'axios';

interface UpdateOrderStatusData {
  status: 'SHIPPED' | 'DELIVERED';
}

interface UpdateOrderStatusResponse {
  success: boolean;
  message?: string;
  data: {
    orderId: string;
    orderNumber: string;
    status: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
}

interface UpdateTrackingData {
  courier: string;
  trackingId: string;
  trackingUrl?: string;
}

interface UpdateTrackingResponse {
  success: boolean;
  message?: string;
  data: {
    orderId: string;
    orderNumber: string;
    tracking: {
      courier: string;
      trackingId: string;
      trackingUrl?: string;
    };
  };
}

// Helper to extract error message
export const getOrderStatusErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'Failed to update order status';
  }
  return 'Failed to update order status';
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: UpdateOrderStatusData }): Promise<UpdateOrderStatusResponse['data']> => {
      const response = await apiClient.put<UpdateOrderStatusResponse>(`/v1/admin/orders/${orderId}/status`, data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update order status');
      }
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate order details and orders list
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
};

export const useUpdateOrderTracking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: UpdateTrackingData }): Promise<UpdateTrackingResponse['data']> => {
      const response = await apiClient.put<UpdateTrackingResponse>(`/v1/admin/orders/${orderId}/tracking`, data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update tracking information');
      }
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate order details and orders list
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
};
