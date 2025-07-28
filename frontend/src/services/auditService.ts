import { apiService } from './apiService';

export const auditService = {
  getAuditLogs: async (query: any) => {
    try {
      const response = await apiService.get('/audit', { params: query });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  },
};