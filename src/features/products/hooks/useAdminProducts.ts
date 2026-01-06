import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface ProductVariant {
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  attributes?: Record<string, any>;
  images?: string[];
}

export interface AdminProduct {
  _id: string;
  productCode: string;
  title: string;
  slug: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryIds?: string[];
  tags?: string[];
  variants: ProductVariant[];
  primaryImage?: string;
  gallery?: string[];
  ratingAvg?: number;
  ratingCount?: number;
  isFeatured: boolean;
  isOnSale: boolean;
  salePercent?: number;
  status?: 'active' | 'inactive';
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  success: boolean;
  data: AdminProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  isFeatured?: boolean;
  isOnSale?: boolean;
  includeDeleted?: 'true' | 'only'; // 'true' = include both, 'only' = only deleted
}

const fetchProducts = async (params: ProductsParams = {}, signal?: AbortSignal): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);
  if (params.isFeatured !== undefined) queryParams.append('isFeatured', params.isFeatured.toString());
  if (params.isOnSale !== undefined) queryParams.append('isOnSale', params.isOnSale.toString());
  if (params.includeDeleted) queryParams.append('includeDeleted', params.includeDeleted);

  const response = await apiClient.get<ProductsResponse>(`/v1/admin/products?${queryParams.toString()}`, { signal });
  if (!response.data.success) {
    throw new Error('Failed to fetch products');
  }
  return response.data;
};

export const useAdminProducts = (params: ProductsParams = {}, signal?: AbortSignal) => {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: ({ signal }) => fetchProducts(params, signal),
    placeholderData: (previousData) => previousData,
  });
};

