import { apiClient } from './apiClient';
import { HealthStatus } from '@/types/api';

export class HealthService {
  /**
   * Checks the health of the backend API service.
   * Calls GET /api/health
   */
  public static async getHealth(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>('/health', { timeoutMs: 5000 });
  }
}
