import { apiClient } from './apiClient';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
}

export interface CandidateDetails {
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  collegeName?: string;
  course?: string;
  department?: string;
  graduationYear?: number;
}

export interface StudentProfile {
  id: string;
  studentId?: string;
  fullName: string;
  email: string;
  phone: string;
  collegeName?: string;
  course?: string;
  department?: string;
  graduationYear?: number;
}

export interface CandidateApplication {
  id: string;
  currentStatus: string;
  statusLabel: string;
  driveName: string;
}

export interface CandidateAssessmentInfo {
  id: string | null;
  title: string;
  roundName: string;
  durationMinutes: number;
  passPercentage: number;
  questionCount: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface StudentVerifyResponse {
  accessToken: string;
  user: User;
  student: StudentProfile;
  application: CandidateApplication | null;
  assessment: CandidateAssessmentInfo;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  email: string;
  expiresInSeconds: number;
}

export const authService = {
  /**
   * Requests 6-digit OTP for candidate registration details.
   */
  async requestStudentOtp(details: CandidateDetails): Promise<RequestOtpResponse> {
    return apiClient.post<RequestOtpResponse>('/auth/student/request-otp', details);
  },

  /**
   * Verifies candidate 6-digit OTP and establishes authenticated session.
   */
  async verifyStudentOtp(email: string, otp: string): Promise<StudentVerifyResponse> {
    const res = await apiClient.post<StudentVerifyResponse>('/auth/student/verify-otp', {
      email,
      otp,
    });

    if (res.accessToken) {
      localStorage.setItem('auth_token', res.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      if (res.student) {
        localStorage.setItem('auth_student', JSON.stringify(res.student));
      }
      if (res.application) {
        localStorage.setItem('auth_application', JSON.stringify(res.application));
      }
      if (res.assessment) {
        localStorage.setItem('auth_assessment', JSON.stringify(res.assessment));
      }
    }
    return res;
  },

  /**
   * Admin Login (isolated credentials)
   */
  async loginAdmin(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/admin/login', { email, password });
    if (res.accessToken) {
      localStorage.setItem('auth_token', res.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    }
    return res;
  },

  /**
   * Get current authenticated user session
   */
  async getMe(): Promise<User> {
    const user = await apiClient.get<User>('/auth/me');
    localStorage.setItem('auth_user', JSON.stringify(user));
    return user;
  },

  /**
   * Terminate active session
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_student');
      localStorage.removeItem('auth_application');
      localStorage.removeItem('auth_assessment');
      localStorage.removeItem('candidate_draft_email');
    }
  },

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getStudentProfile(): StudentProfile | null {
    if (typeof window === 'undefined') return null;
    const sStr = localStorage.getItem('auth_student');
    if (!sStr) return null;
    try {
      return JSON.parse(sStr);
    } catch {
      return null;
    }
  },

  getCandidateApplication(): CandidateApplication | null {
    if (typeof window === 'undefined') return null;
    const aStr = localStorage.getItem('auth_application');
    if (!aStr) return null;
    try {
      return JSON.parse(aStr);
    } catch {
      return null;
    }
  },

  getCandidateAssessment(): CandidateAssessmentInfo | null {
    if (typeof window === 'undefined') return null;
    const asStr = localStorage.getItem('auth_assessment');
    if (!asStr) return null;
    try {
      return JSON.parse(asStr);
    } catch {
      return null;
    }
  },

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },
};
