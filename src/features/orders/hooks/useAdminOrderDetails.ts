import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface OrderItem {
  _id?: string;
  productId: string;
  variantSku?: string;
  title: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

export interface ShippingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  phone?: string;
}

export interface PaymentInfo {
  provider?: string;
  providerPaymentId?: string;
  method?: string;
  amount?: number;
  status?: string;
  rawResponse?: any;
}

export interface AdminOrderDetails {
  _id: string;
  orderNumber: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  guestEmail?: string;
  guestPhone?: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  subTotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  grandTotal: number;
  status: 'PLACED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  payment?: PaymentInfo;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  cancelledAt?: string;
  refundStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  shippedAt?: string;
  deliveredAt?: string;
  tracking?: {
    courier?: string;
    trackingId?: string;
    trackingUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailsResponse {
  success: boolean;
  data: AdminOrderDetails;
}

const fetchOrderDetails = async (orderId: string): Promise<AdminOrderDetails> => {
  const response = await apiClient.get<OrderDetailsResponse>(`/v1/admin/orders/${orderId}`);
  if (!response.data.success) {
    throw new Error('Failed to fetch order details');
  }
  return response.data.data;
};

export const useAdminOrderDetails = (orderId: string) => {
  return useQuery({
    queryKey: ['adminOrderDetails', orderId],
    queryFn: () => fetchOrderDetails(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

