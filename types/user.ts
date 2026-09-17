export type UserRole = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  studentId?: string;
  userId: string;
  fullName: string;
  college?: string;
  degree?: string;
  graduationYear?: number;
  phone: string;
  resumeUrl?: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  designation: string;
}
