'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  authService,
  User,
  StudentProfile,
  CandidateApplication,
  CandidateAssessmentInfo,
  CandidateDetails,
  RequestOtpResponse,
  StudentVerifyResponse,
} from '@/services/api/authService';

interface AuthContextType {
  user: User | null;
  student: StudentProfile | null;
  application: CandidateApplication | null;
  assessment: CandidateAssessmentInfo | null;
  token: string | null;
  role: 'ADMIN' | 'STUDENT' | null;
  loading: boolean;
  requestOtp: (details: CandidateDetails) => Promise<RequestOtpResponse>;
  verifyOtp: (email: string, otp: string) => Promise<StudentVerifyResponse>;
  loginAdmin: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [application, setApplication] = useState<CandidateApplication | null>(null);
  const [assessment, setAssessment] = useState<CandidateAssessmentInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authService.getAccessToken();
      const storedUser = authService.getCurrentUser();
      const storedStudent = authService.getStudentProfile();
      const storedApp = authService.getCandidateApplication();
      const storedAssessment = authService.getCandidateAssessment();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setStudent(storedStudent);
        setApplication(storedApp);
        setAssessment(storedAssessment);
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
        } catch {
          // Token expired or invalid
          authService.logout();
          setToken(null);
          setUser(null);
          setStudent(null);
          setApplication(null);
          setAssessment(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const requestOtp = async (details: CandidateDetails): Promise<RequestOtpResponse> => {
    return authService.requestStudentOtp(details);
  };

  const verifyOtp = async (email: string, otp: string): Promise<StudentVerifyResponse> => {
    const res = await authService.verifyStudentOtp(email, otp);
    setToken(res.accessToken);
    setUser(res.user);
    setStudent(res.student);
    setApplication(res.application);
    setAssessment(res.assessment);
    return res;
  };

  const loginAdmin = async (email: string, pass: string) => {
    const res = await authService.loginAdmin(email, pass);
    setToken(res.accessToken);
    setUser(res.user);
    setStudent(null);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    setStudent(null);
    setApplication(null);
    setAssessment(null);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        application,
        assessment,
        token,
        role: user?.role || null,
        loading,
        requestOtp,
        verifyOtp,
        loginAdmin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
