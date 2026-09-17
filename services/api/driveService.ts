import { apiClient } from './apiClient';

export interface RecruitmentDrive {
  id: string;
  name: string;
  description?: string;
  position: string;
  collegeEligibility?: string;
  registrationStart: string;
  registrationEnd: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED' | 'ARCHIVED';
  applicationCount?: number;
  isAvailable?: boolean;
  hasApplied?: boolean;
  applicationId?: string | null;
  applicationStatus?: string | null;
  appliedAt?: string | null;
  registrationPhase?: 'UPCOMING' | 'ACTIVE' | 'EXPIRED';
  assessments?: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    durationMinutes: number;
    passPercentage?: number;
    isActive?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDrivePayload {
  name: string;
  description?: string;
  position: string;
  collegeEligibility?: string;
  registrationStart: string;
  registrationEnd: string;
  status?: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
}

export interface UpdateDrivePayload {
  name?: string;
  description?: string;
  position?: string;
  collegeEligibility?: string;
  registrationStart?: string;
  registrationEnd?: string;
  status?: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED';
}

export interface DriveListResponse {
  data: RecruitmentDrive[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

export const driveService = {
  // --- Admin Methods ---
  async listAdminDrives(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<DriveListResponse>(`/admin/drives${qs}`);
  },

  async getAdminDrive(id: string) {
    return apiClient.get<{ data: RecruitmentDrive; message: string }>(`/admin/drives/${id}`);
  },

  async createDrive(payload: CreateDrivePayload) {
    return apiClient.post<{ data: RecruitmentDrive; message: string }>('/admin/drives', payload);
  },

  async updateDrive(id: string, payload: UpdateDrivePayload) {
    return apiClient.patch<{ data: RecruitmentDrive; message: string }>(`/admin/drives/${id}`, payload);
  },

  async updateDriveStatus(id: string, status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED') {
    return apiClient.patch<{ data: RecruitmentDrive; message: string }>(`/admin/drives/${id}/status`, { status });
  },

  // --- Student Methods ---
  async listAvailableDrives() {
    return apiClient.get<{ data: RecruitmentDrive[]; message: string }>('/drives');
  },

  async getAvailableDrive(id: string) {
    return apiClient.get<{ data: RecruitmentDrive; message: string }>(`/drives/${id}`);
  },

  async applyToDrive(driveId: string) {
    return apiClient.post<{
      data: {
        id: string;
        applicationId: string;
        drive: { id: string; name: string; position: string };
        currentStatus: string;
        appliedAt: string;
      };
      message: string;
    }>(`/drives/${driveId}/apply`);
  },
};
