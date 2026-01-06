import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface AuditLog {
  _id: string;
  actorId: string;
  actorRole: string;
  operation: string; // CREATE, UPDATE, DELETE, RESTORE
  action: string; // Specific action name (BULK_TOGGLE_FEATURED, RESTORE_PRODUCT, etc.)
  collectionName: string;
  documentId: string | string[];
  before: any;
  after: any;
  ip: string;
  createdAt: string;
  deletedAt?: string | null;
}

interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AuditLogsParams {
  page?: number;
  limit?: number;
  actorRole?: string;
  action?: string;
  collectionName?: string;
  startDate?: string;
  endDate?: string;
  deleted?: 'true' | 'only' | 'false';
}

const fetchAuditLogs = async (params: AuditLogsParams = {}): Promise<AuditLogsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.actorRole) queryParams.append('actorRole', params.actorRole);
  if (params.action) queryParams.append('action', params.action);
  if (params.collectionName) queryParams.append('collectionName', params.collectionName);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.deleted) queryParams.append('deleted', params.deleted);

  try {
    const response = await apiClient.get<{ success: boolean; data: AuditLog[]; pagination: any }>(`/v1/admin/audit-logs?${queryParams.toString()}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch audit logs');
    }
    return {
      success: response.data.success,
      data: response.data.data || [],
      pagination: response.data.pagination || {
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        pages: 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

export const useAdminAuditLogs = (params: AuditLogsParams = {}) => {
  return useQuery({
    queryKey: ['adminAuditLogs', params.page, params.limit, params.actorRole, params.action, params.collectionName, params.startDate, params.endDate, params.deleted],
    queryFn: () => fetchAuditLogs(params),
    staleTime: 30 * 1000,
  });
};

