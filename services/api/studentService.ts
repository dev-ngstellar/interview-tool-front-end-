import { apiClient } from './apiClient';

export interface StudentProfile {
  id: string;
  studentId?: string;
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  collegeName?: string;
  course?: string;
  department?: string;
  graduationYear?: number;
  hasResume: boolean;
  resumeUrl: string | null;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  studentId?: string;
  phone: string;
  collegeName?: string;
  course?: string;
  department?: string;
  graduationYear?: number;
}

export interface StudentApplication {
  id: string;
  recruitmentDrive: {
    id: string;
    name: string;
    description?: string;
    position: string;
    status: string;
    collegeEligibility?: string;
    registrationStart?: string;
    registrationEnd?: string;
  };
  currentStatus: string;
  appliedAt: string;
  updatedAt?: string;
}

export const studentService = {
  async getProfile() {
    return apiClient.get<{ data: StudentProfile; message: string }>('/student/profile');
  },

  async updateProfile(payload: UpdateProfilePayload) {
    return apiClient.patch<{ data: StudentProfile; message: string }>('/student/profile', payload);
  },

  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<{
      success: boolean;
      message: string;
      file: { key: string; url: string; originalName: string; sizeBytes: number };
    }>('/student/profile/resume', formData);
  },

  getResumeDownloadUrl() {
    return `${apiClient.getBaseUrl()}/student/profile/resume`;
  },

  async getApplications() {
    return apiClient.get<{ data: StudentApplication[]; message: string }>('/student/applications');
  },

  async getApplicationById(id: string) {
    return apiClient.get<{ data: StudentApplication; message: string }>(`/student/applications/${id}`);
  },
};
