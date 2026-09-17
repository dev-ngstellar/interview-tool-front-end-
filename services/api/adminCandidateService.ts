import { ApiClient } from './apiClient';

export interface AssessmentSummaryInfo {
  status: string;
  score: number | null;
  total: number | null;
  percentage: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AdminApprovalRecord {
  id: string;
  adminUserId: string;
  adminEmail: string;
  reason: string;
  remarks?: string | null;
  approvedAt: string;
}

export interface AdminCandidate {
  applicationId: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  college?: string;
  course?: string;
  department?: string;
  graduationYear?: number | null;
  registrationDate: string;
  overallStatus: string;
  round1: AssessmentSummaryInfo;
  round2: AssessmentSummaryInfo;
  isOverridden: boolean;
  adminApproval: AdminApprovalRecord | null;
}

export interface PipelineBreakdown {
  registered: number;
  inProgress: number;
  passed: number;
  failed: number;
  eligible?: number;
}

export interface DashboardStatsData {
  totalCandidates: number;
  round1Completed: number;
  round1Passed: number;
  round1Failed: number;
  round2InProgress: number;
  qualified: number;
  pipeline: {
    round1: PipelineBreakdown;
    round2: PipelineBreakdown;
  };
  zeroQualified: boolean;
  adminReviewCandidates: AdminCandidate[];
  recentCandidates: AdminCandidate[];
  securityMetrics?: {
    totalEvents: number;
    candidatesWithEvents: number;
  };
}

export interface CandidateListQuery {
  search?: string;
  round1Status?: string;
  round2Status?: string;
  overallStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CandidateListResponse {
  data: AdminCandidate[];
  pagination: PaginationMeta;
  message?: string;
}

export interface DetailedAttempt {
  id: string;
  type: 'APTITUDE' | 'COMMUNICATION';
  title: string;
  status: string;
  startedAt?: string;
  submittedAt?: string;
  expiresAt?: string;
  result?: {
    totalQuestions: number;
    correctAnswers: number;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    passed: boolean;
    evaluatedAt: string;
  } | null;
}

export interface CandidateDetailsData extends AdminCandidate {
  drive: {
    id: string;
    name: string;
    position: string;
  };
  securityActivity?: {
    totalEvents: number;
    violationsCount: number;
    securityStatus: string;
    breakdown: Record<string, number>;
    events: Array<{
      id: string;
      attemptId: string;
      eventType: string;
      violationNumber: number;
      createdAt: string;
      metadata?: any;
    }>;
  };
  detailedAttempts: DetailedAttempt[];
  approvalsHistory: Array<{
    id: string;
    adminEmail: string;
    previousStatus: string;
    newStatus: string;
    reason: string;
    remarks?: string;
    approvedAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
}

class AdminCandidateService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  /**
   * Retrieves dashboard statistics and live pipeline KPIs.
   */
  async getDashboardStats(): Promise<DashboardStatsData> {
    const res = await this.client.get<{ data: DashboardStatsData }>('/admin/candidates/dashboard-stats');
    return res.data;
  }

  /**
   * Retrieves paginated candidates with searching, filtering, and sorting.
   */
  async listCandidates(query: CandidateListQuery = {}): Promise<CandidateListResponse> {
    const params = new URLSearchParams();
    if (query.search) params.append('search', query.search);
    if (query.round1Status && query.round1Status !== 'ALL') params.append('round1Status', query.round1Status);
    if (query.round2Status && query.round2Status !== 'ALL') params.append('round2Status', query.round2Status);
    if (query.overallStatus && query.overallStatus !== 'ALL') params.append('overallStatus', query.overallStatus);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));

    const endpoint = `/admin/candidates${params.toString() ? `?${params.toString()}` : ''}`;
    return this.client.get<CandidateListResponse>(endpoint);
  }

  /**
   * Retrieves comprehensive candidate details for drawer/modal.
   */
  async getCandidateDetails(applicationId: string): Promise<CandidateDetailsData> {
    const res = await this.client.get<{ data: CandidateDetailsData }>(`/admin/candidates/${applicationId}`);
    return res.data;
  }

  /**
   * Manually overrides a Round 1 failed candidate, approving them for Round 2.
   */
  async overrideRound2(applicationId: string, reason: string, remarks?: string) {
    const res = await this.client.post<{ data: any; message: string }>(
      `/admin/candidates/${applicationId}/override-round-2`,
      { reason, remarks }
    );
    return res;
  }

  /**
   * Bulk overrides multiple Round 1 failed candidates for Round 2.
   */
  async bulkOverrideRound2(applicationIds: string[], reason: string, remarks?: string) {
    const res = await this.client.post<{ data: any; message: string }>(
      '/admin/candidates/bulk-override-round-2',
      { applicationIds, reason, remarks }
    );
    return res;
  }
}

export const adminCandidateService = new AdminCandidateService();
