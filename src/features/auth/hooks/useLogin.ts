import { useMutation } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: any;
  };
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'Login failed';
  }
  return 'Login failed';
};

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginData): Promise<LoginResponse> => {
      const response = await apiClient.post<LoginResponse>('/v1/admin/auth/login', data);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate auth query to refetch user
      queryClient.invalidateQueries({ queryKey: ['admin', 'auth'] });
      // Navigate to dashboard
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login error:', getErrorMessage(error));
    },
  });
};

export { getErrorMessage };

