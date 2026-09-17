import { apiClient } from './apiClient';

export interface SafeOption {
  id: string;
  optionText: string;
  order: number;
}

export interface SafeQuestion {
  id: string;
  questionText: string;
  marks: number;
  order: number;
  options: SafeOption[];
}

export interface EvaluatedResultData {
  totalQuestions: number;
  correctAnswers: number;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  passed: boolean;
}

export interface AssessmentAttemptInfo {
  attemptId: string;
  startedAt: string;
  expiresAt: string;
  durationMinutes: number;
  serverTime: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'EVALUATED';
  isExpired?: boolean;
  result?: EvaluatedResultData | null;
  securityViolationCount?: number;
}

export interface ActiveAttemptResponse {
  hasActiveAttempt: boolean;
  attempt?: AssessmentAttemptInfo;
  serverTime: string;
}

export interface AttemptQuestionsResponse {
  attemptId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'EVALUATED';
  startedAt: string;
  expiresAt?: string;
  durationMinutes: number;
  serverTime: string;
  questions: SafeQuestion[];
  savedAnswers: { questionId: string; selectedOptionId: string | null; isFinalized?: boolean }[];
  isExpired: boolean;
  result: EvaluatedResultData | null;
  securityViolationCount?: number;
}

export interface SecurityEventResponse {
  success: boolean;
  eventType: string;
  violationCount: number;
  maxViolations: number;
  shouldAutoSubmit: boolean;
  autoSubmitted?: boolean;
  result?: EvaluatedResultData | null;
  message: string;
}

export interface SubmitAttemptResponse {
  attemptId: string;
  status: 'SUBMITTED' | 'EXPIRED' | 'EVALUATED';
  submittedAt: string;
  isExpired: boolean;
  result: EvaluatedResultData;
  message: string;
}

export interface Round2AccessResponse {
  allowed: boolean;
  available?: boolean;
  status: string;
  candidateName: string;
  message: string;
  assessmentId?: string;
  durationMinutes?: number;
  passPercentage?: number;
  title?: string;
  type?: string;
  questionCount?: number;
  attempt?: AssessmentAttemptInfo;
  result?: EvaluatedResultData | null;
  round1Status?: string;
  round1Score?: number | null;
  round1Percentage?: number | null;
  round2Eligible?: boolean;
  round2ApprovalStatus?: string;
  round2Status?: string;
  isOverridden?: boolean;
}

export interface FinalResultResponse {
  candidateName: string;
  email: string;
  driveName: string;
  position: string;
  round1: {
    totalQuestions: number;
    obtainedMarks: number;
    percentage: number;
    passed: boolean;
  } | null;
  round2: {
    totalQuestions: number;
    obtainedMarks: number;
    percentage: number;
    passed: boolean;
  } | null;
  finalStatus: string;
  isQualified: boolean;
  completed: boolean;
  completedAt?: string;
  isOverridden?: boolean;
}

export interface CurrentAssessmentResponse {
  assessmentId: string;
  title: string;
  type: string;
  position: string;
  driveName: string;
  durationMinutes: number;
  questionCount: number;
  passPercentage: number;
  totalMarks: number;
  eligible: boolean;
  alreadyCompleted: boolean;
  hasActiveAttempt: boolean;
  activeAttempt: AssessmentAttemptInfo | null;
  currentStatus: string;
  message?: string;
  round1Status?: string;
  round1Score?: number | null;
  round1Percentage?: number | null;
  round2Eligible?: boolean;
  round2ApprovalStatus?: string;
  round2Status?: string;
  isOverridden?: boolean;
}

export const assessmentService = {
  /**
   * Retrieves current assessment details and candidate eligibility without starting an attempt.
   */
  async getCurrentAssessment(): Promise<CurrentAssessmentResponse> {
    return apiClient.get<CurrentAssessmentResponse>('/assessments/current');
  },

  /**
   * Starts or retrieves the active assessment attempt from server.
   * Server calculates expiresAt = startedAt + 15 mins.
   */
  async startAssessment(assessmentId: string): Promise<AssessmentAttemptInfo> {
    const id = assessmentId || 'default';
    return apiClient.post<AssessmentAttemptInfo>(`/assessments/${id}/start`);
  },

  /**
   * Checks for an ongoing active attempt to restore timer state on reload/resume.
   */
  async getActiveAttempt(assessmentId: string): Promise<ActiveAttemptResponse> {
    const id = assessmentId || 'default';
    return apiClient.get<ActiveAttemptResponse>(`/assessments/${id}/active-attempt`);
  },

  /**
   * Retrieves 15 safe questions and saved candidate answers for the active attempt.
   */
  async getAttemptQuestions(attemptId: string): Promise<AttemptQuestionsResponse> {
    try {
      return await apiClient.get<AttemptQuestionsResponse>(`/assessments/attempts/${attemptId}/questions`);
    } catch (err: any) {
      if (err?.statusCode === 404) {
        return await apiClient.get<AttemptQuestionsResponse>(`/assessments/${attemptId}/questions`);
      }
      throw err;
    }
  },

  /**
   * Persists selected answer to backend database, optionally marking it finalized.
   */
  async saveAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionId: string,
    isFinalized: boolean = true,
  ): Promise<{ success: boolean; questionId: string; selectedOptionId: string; isFinalized?: boolean }> {
    return apiClient.post(`/assessments/attempts/${attemptId}/answers`, {
      questionId,
      selectedOptionId,
      isFinalized,
    });
  },

  /**
   * Submits or locks the assessment attempt on server and receives calculated score.
   */
  async submitAttempt(attemptId: string): Promise<SubmitAttemptResponse> {
    return apiClient.post<SubmitAttemptResponse>(`/assessments/attempts/${attemptId}/submit`);
  },

  /**
   * Retrieves saved evaluated result for an attempt (for score card persistence).
   */
  async getAttemptResult(attemptId: string): Promise<SubmitAttemptResponse> {
    return apiClient.get<SubmitAttemptResponse>(`/assessments/attempts/${attemptId}/result`);
  },

  /**
   * Logs an anti-cheating security violation or environment event for the active attempt.
   */
  async logSecurityEvent(
    attemptId: string,
    eventType: string,
    metadata?: any,
  ): Promise<SecurityEventResponse> {
    return apiClient.post<SecurityEventResponse>(
      `/assessments/attempts/${attemptId}/security-event`,
      { eventType, metadata },
    );
  },

  /**
   * Checks Round 2 access eligibility (returns 403 if candidate has APTITUDE_FAILED).
   */
  async checkRound2Access(): Promise<Round2AccessResponse> {
    return apiClient.get<Round2AccessResponse>('/assessments/round-2');
  },

  /**
   * Retrieves final evaluation result across all rounds for candidate.
   */
  async getFinalResult(): Promise<FinalResultResponse> {
    try {
      return await apiClient.get<FinalResultResponse>('/student/final-result');
    } catch {
      return await apiClient.get<FinalResultResponse>('/assessments/final-result');
    }
  },
};
