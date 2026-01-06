import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: 'customer' | 'admin' | 'manager';
  addresses?: any[];
  wishlistCount?: number;
  isEmailVerified?: boolean;
  createdAt?: string;
}

interface AuthMeResponse {
  success: boolean;
  data: {
    user: AdminUser;
  };
}

const fetchAuthMe = async (): Promise<AdminUser> => {
  const response = await apiClient.get<AuthMeResponse>('/v1/admin/auth/me');
  if (!response.data.success) {
    throw new Error('Failed to fetch user');
  }
  return response.data.data.user;
};

export const useAdminAuth = () => {
  return useQuery({
    queryKey: ['adminAuth'],
    queryFn: fetchAuthMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

