'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Clock,
  Award,
  CheckCircle2,
  FileQuestion,
  Play,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  assessmentService,
  AssessmentAttemptInfo,
  ActiveAttemptResponse,
  CurrentAssessmentResponse,
  SafeQuestion,
  EvaluatedResultData,
} from '@/services/api/assessmentService';
import { useSecureAssessment } from '@/hooks/useSecureAssessment';
import {
  PreExamFullscreenModal,
  FullscreenRequiredModal,
  SecurityWarningModal,
  AutoSubmitModal,
  NavigationWarningModal,
} from '@/components/assessment/SecureExamModals';

export type AssessmentStage =
  | 'INITIALIZING'
  | 'DETAILS'
  | 'STARTING'
  | 'IN_PROGRESS'
  | 'ALREADY_COMPLETED'
  | 'ERROR';

export default function StudentAssessmentPage() {
  const router = useRouter();
  const { user, student, assessment, role, loading: authLoading } = useAuth();

  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [finalizedQuestionIds, setFinalizedQuestionIds] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Server-authoritative assessment attempt & result state
  const [currentAssessment, setCurrentAssessment] = useState<CurrentAssessmentResponse | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttemptInfo | null>(null);
  const [scoreResult, setScoreResult] = useState<EvaluatedResultData | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(15 * 60 * 1000);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [round2Approved, setRound2Approved] = useState<boolean>(false);
  const [checkingRound2, setCheckingRound2] = useState<boolean>(false);

  // Explicit lifecycle states: landing on DETAILS after OTP verification
  const [stage, setStage] = useState<AssessmentStage>('INITIALIZING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState<boolean>(true);

  // Legacy/computed helpers
  const loadingSession = stage === 'INITIALIZING';
  const loadingQuestions = stage === 'STARTING';
  const assessmentReady = stage === 'IN_PROGRESS';
  const error = stage === 'ERROR' ? errorMessage : null;

  // Monotonic & authoritative clock synchronization refs
  const expiresAtMsRef = useRef<number | null>(null);
  const serverTimeMsRef = useRef<number | null>(null);
  const perfStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSubmittingRef = useRef<boolean>(false);

  // Strict Mode resilient deduplication ref
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const attemptRef = useRef<AssessmentAttemptInfo | null>(null);

  // Secure Exam Anti-Cheating Mode State & Controller
  const [showPreExamModal, setShowPreExamModal] = useState(false);

  const {
    isFullscreen,
    violationCount,
    maxViolations,
    showFullscreenRequiredModal,
    showSecurityWarningModal,
    showAutoSubmitModal,
    showNavigationWarningModal,
    warningDetails,
    requestFullscreen,
    dismissSecurityWarning,
    stayInAssessment,
    leaveAssessment,
  } = useSecureAssessment({
    enabled: stage === 'IN_PROGRESS' && assessmentStarted,
    attemptId: attempt?.attemptId || null,
    initialViolations: attempt?.securityViolationCount || 0,
    onAutoSubmit: async () => {
      await performSubmit();
    },
  });

  const handleStartAssessmentClick = () => {
    setShowPreExamModal(true);
  };

  const handleConfirmStartFullscreen = async () => {
    setShowPreExamModal(false);
    await requestFullscreen();
    await handleStartOrContinueAssessment();
  };

  // Authentication & session validation
  useEffect(() => {
    if (!authLoading && (!user || role !== 'STUDENT')) {
      router.push('/');
    }
  }, [user, role, authLoading, router]);

  // Calculates remaining milliseconds using monotonic clock against server time
  const calculateRemainingMs = useCallback((): number => {
    if (!expiresAtMsRef.current || !serverTimeMsRef.current || !perfStartRef.current) {
      return 15 * 60 * 1000;
    }
    const elapsedSinceSync = performance.now() - perfStartRef.current;
    const currentEstimatedServerTime = serverTimeMsRef.current + elapsedSinceSync;
    return Math.max(0, expiresAtMsRef.current - currentEstimatedServerTime);
  }, []);

  const checkRound2Status = useCallback(async () => {
    try {
      setCheckingRound2(true);
      const res = await assessmentService.checkRound2Access();
      if (res.allowed) {
        setRound2Approved(true);
      }
    } catch {
      setRound2Approved(false);
    } finally {
      setCheckingRound2(false);
    }
  }, []);

  // Server-side submit / auto-submit trigger
  const performSubmit = useCallback(async (targetAttemptId?: string) => {
    if (isAutoSubmittingRef.current || isSubmitting) return;
    isAutoSubmittingRef.current = true;
    setIsSubmitting(true);
    setValidationError(null);

    const id = targetAttemptId || attemptRef.current?.attemptId || attempt?.attemptId;
    if (!id) {
      setIsSubmitting(false);
      isAutoSubmittingRef.current = false;
      return;
    }

    try {
      const res = await assessmentService.submitAttempt(id);
      setScoreResult(res.result);
      if (attemptRef.current) {
        attemptRef.current = { ...attemptRef.current, status: res.status, result: res.result };
        setAttempt(attemptRef.current);
      }
      if (!res.result.passed) {
        checkRound2Status();
      }
    } catch (err: any) {
      console.error('[Assessment] Submission error:', err);
      try {
        const fallback = await assessmentService.getAttemptResult(id);
        setScoreResult(fallback.result);
        if (!fallback.result.passed) {
          checkRound2Status();
        }
      } catch (fErr) {
        console.error('[Assessment] Fallback result error:', fErr);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, attempt?.attemptId, checkRound2Status]);

  // Assessment Details Initialization Flow:
  // Fetches assessment metadata and candidate eligibility WITHOUT starting an attempt or timer.
  const runInitialization = useCallback(async () => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    const promise = (async () => {
      let currentStep = 'INITIALIZING';
      try {
        currentStep = 'Fetching assessment details and candidate eligibility';
        console.log('[Assessment] Initializing candidate assessment session');

        const currentData = await assessmentService.getCurrentAssessment();
        setCurrentAssessment(currentData);

        const isOverriddenForR2 = Boolean(
          currentData.isOverridden ||
          currentData.round2Eligible ||
          currentData.round2ApprovalStatus === 'APPROVED' ||
          currentData.currentStatus === 'ADMIN_APPROVED'
        );
        if (isOverriddenForR2) {
          setRound2Approved(true);
        }

        // 1. Completed candidate protection
        if (currentData.alreadyCompleted) {
          if (currentData.activeAttempt?.result) {
            setScoreResult(currentData.activeAttempt.result);
            if (currentData.activeAttempt) {
              setAttempt(currentData.activeAttempt);
              attemptRef.current = currentData.activeAttempt;
            }
          }
          if (isOverriddenForR2) {
            setRound2Approved(true);
          } else if (currentData.activeAttempt?.result && !currentData.activeAttempt.result.passed) {
            checkRound2Status();
          }
          setStage('ALREADY_COMPLETED');
          return;
        }

        // Candidate already passed Round 1 or Admin approved for Round 2
        if (
          currentData.currentStatus === 'APTITUDE_PASSED' ||
          currentData.currentStatus === 'ADMIN_APPROVED' ||
          isOverriddenForR2
        ) {
          if (currentData.activeAttempt?.result) {
            setScoreResult(currentData.activeAttempt.result);
            setAttempt(currentData.activeAttempt);
            attemptRef.current = currentData.activeAttempt;
          }
          if (isOverriddenForR2) {
            setRound2Approved(true);
          }
          setStage('ALREADY_COMPLETED');
          return;
        }

        // 2. Existing active attempt detection (does NOT create attempt or restart timer)
        if (currentData.hasActiveAttempt && currentData.activeAttempt?.status === 'IN_PROGRESS') {
          const now = Date.now();
          const expiresAt = new Date(currentData.activeAttempt.expiresAt).getTime();

          if (now >= expiresAt) {
            // Attempt expired while away
            setAttempt(currentData.activeAttempt);
            attemptRef.current = currentData.activeAttempt;
            await performSubmit(currentData.activeAttempt.attemptId);
            return;
          }

          setAttempt(currentData.activeAttempt);
          attemptRef.current = currentData.activeAttempt;

          expiresAtMsRef.current = expiresAt;
          serverTimeMsRef.current = currentData.activeAttempt.serverTime
            ? new Date(currentData.activeAttempt.serverTime).getTime()
            : Date.now();
          perfStartRef.current = performance.now();
          const rem = calculateRemainingMs();
          setRemainingMs(rem);

          setStage('DETAILS');
          return;
        }

        // 3. Evaluated result check
        if (currentData.activeAttempt?.result) {
          setScoreResult(currentData.activeAttempt.result);
          setAttempt(currentData.activeAttempt);
          attemptRef.current = currentData.activeAttempt;
          setStage('ALREADY_COMPLETED');
          return;
        }

        // 4. Eligible new candidate -> land on Assessment Details Page
        setStage('DETAILS');
      } catch (err: any) {
        console.error('[Assessment] INITIALIZATION FAILED');
        console.error(`Step: ${currentStep}`);
        const status = err?.statusCode || err?.status || 0;

        let userMsg = 'Unable to load the assessment details. Please try again.';
        let allowRetry = true;

        if (status === 409 || err?.code === 'ASSESSMENT_ALREADY_COMPLETED') {
          userMsg = 'This email address has already completed the recruitment assessment.';
          setStage('ALREADY_COMPLETED');
          return;
        } else if (status === 401) {
          userMsg = 'Your student session has expired. Please verify your OTP again.';
          allowRetry = false;
        } else if (status === 403) {
          userMsg = 'You are not eligible for this assessment.';
          allowRetry = false;
        } else if (err?.message) {
          userMsg = err.message;
        }

        setStage('ERROR');
        setErrorMessage(userMsg);
        setCanRetry(allowRetry);
      }
    })();

    initPromiseRef.current = promise;
    return promise;
  }, [calculateRemainingMs, performSubmit]);

  // Run initialization once when user session is active
  useEffect(() => {
    if (!authLoading && user && role === 'STUDENT') {
      runInitialization();
    }
  }, [authLoading, user?.id, role, runInitialization]);

  // Master countdown timer interval: runs whenever assessment attempt status is IN_PROGRESS
  useEffect(() => {
    const isAttemptInProgress = (attemptRef.current?.status === 'IN_PROGRESS' || attempt?.status === 'IN_PROGRESS') && scoreResult === null;
    if (!isAttemptInProgress) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      const rem = calculateRemainingMs();
      setRemainingMs(rem);

      if (rem <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        const activeAttemptId = attemptRef.current?.attemptId || attempt?.attemptId;
        if (activeAttemptId) {
          performSubmit(activeAttemptId);
        }
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stage, scoreResult, calculateRemainingMs, performSubmit, attempt?.attemptId]);

  // Start or continue candidate assessment on explicit Start button click
  const handleStartOrContinueAssessment = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setValidationError(null);
    setStartError(null);

    try {
      let activeAttempt = attemptRef.current || attempt;

      // If no IN_PROGRESS attempt exists yet, call backend to start attempt
      if (!activeAttempt || activeAttempt.status !== 'IN_PROGRESS') {
        const targetAssessmentId = currentAssessment?.assessmentId || assessment?.id || 'default';
        const res = await assessmentService.startAssessment(targetAssessmentId);

        if (!res?.attemptId || !res?.startedAt || !res?.expiresAt) {
          throw new Error('Invalid assessment attempt returned by server.');
        }

        activeAttempt = res;
        setAttempt(res);
        attemptRef.current = res;
      }

      // Initialize server-synchronized monotonic clock
      expiresAtMsRef.current = new Date(activeAttempt.expiresAt).getTime();
      serverTimeMsRef.current = activeAttempt.serverTime
        ? new Date(activeAttempt.serverTime).getTime()
        : Date.now();
      perfStartRef.current = performance.now();
      isAutoSubmittingRef.current = false;

      const rem = calculateRemainingMs();
      setRemainingMs(rem);

      if (rem <= 0 || activeAttempt.isExpired) {
        await performSubmit(activeAttempt.attemptId);
        return;
      }

      // Load 15 questions
      const qData = await assessmentService.getAttemptQuestions(activeAttempt.attemptId);
      let questionsList: SafeQuestion[] = [];
      if (Array.isArray(qData)) {
        questionsList = qData;
      } else if (Array.isArray((qData as any)?.questions)) {
        questionsList = (qData as any).questions;
      } else if (Array.isArray((qData as any)?.data)) {
        questionsList = (qData as any).data;
      } else if (Array.isArray((qData as any)?.data?.questions)) {
        questionsList = (qData as any).data.questions;
      }

      if (questionsList.length !== 15) {
        throw new Error('Unable to load the complete 15 questions. Please try again.');
      }

      // Sanitize questions
      for (const q of questionsList) {
        if (!q.id || !q.questionText || !Array.isArray(q.options) || q.options.length === 0) {
          throw new Error('Invalid question format received from server.');
        }
        for (const opt of q.options) {
          if ('isCorrect' in opt) {
            delete (opt as any).isCorrect;
          }
        }
      }

      setQuestions(questionsList);

      // Restore saved answers
      const savedAnswers = (qData as any)?.savedAnswers;
      const restoredMap: Record<string, string> = {};
      const finalizedSet = new Set<string>();

      if (Array.isArray(savedAnswers) && savedAnswers.length > 0) {
        savedAnswers.forEach((ans: any) => {
          if (ans.questionId && ans.selectedOptionId) {
            restoredMap[ans.questionId] = ans.selectedOptionId;
            if (ans.isFinalized || ans.textAnswer === 'FINALIZED') {
              finalizedSet.add(ans.questionId);
            }
          }
        });
        setAnswers(restoredMap);
      } else {
        setAnswers({});
      }

      // Resume from the first question that is NOT yet finalized
      const firstUnfinalizedIndex = questionsList.findIndex((q) => !finalizedSet.has(q.id));
      if (firstUnfinalizedIndex !== -1) {
        setCurrentQuestionIndex(firstUnfinalizedIndex);
        // All previous questions are permanently locked
        for (let i = 0; i < firstUnfinalizedIndex; i++) {
          finalizedSet.add(questionsList[i].id);
        }
      } else {
        // All answered/finalized, land on the last question
        setCurrentQuestionIndex(questionsList.length - 1);
        for (let i = 0; i < questionsList.length - 1; i++) {
          finalizedSet.add(questionsList[i].id);
        }
      }

      setFinalizedQuestionIds(finalizedSet);

      setAssessmentStarted(true);
      setStage('IN_PROGRESS');
    } catch (err: any) {
      console.error('[Assessment] Failed to start assessment:', err);
      setStartError(err?.message || 'Unable to start the assessment. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  // Option selection: fully editable on current question. Can change option at any time until NEXT is clicked.
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (loadingSession || loadingQuestions || isSubmitting || savingAnswer) return;
    if (!questions || questions.length === 0) return;

    // Reject editing if this question was already finalized in a previous step
    if (finalizedQuestionIds.has(questionId)) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ?.id || currentQ.id !== questionId) return;

    const isValidOption = currentQ.options?.some((opt) => opt.id === optionId);
    if (!isValidOption) return;

    setValidationError(null);
    // Instant local selection change: candidate can freely change between options
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // Navigation handlers: strictly forward-only. Saves & permanently locks current answer on NEXT.
  const handleNext = async () => {
    if (savingAnswer || isSubmitting) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const selectedOptionId = answers[currentQ.id];
    if (!selectedOptionId) {
      setValidationError('Please select an answer to continue.');
      return;
    }

    const activeAttemptId = attemptRef.current?.attemptId || attempt?.attemptId;
    if (!activeAttemptId) {
      setValidationError('Assessment attempt session not found. Please refresh the page.');
      return;
    }

    setSavingAnswer(true);
    setValidationError(null);

    try {
      // 1. Save and permanently finalize the selected answer on the server
      await assessmentService.saveAnswer(activeAttemptId, currentQ.id.trim(), selectedOptionId.trim(), true);

      // 2. Lock the current question permanently in state
      setFinalizedQuestionIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(currentQ.id);
        return nextSet;
      });

      // 3. Move forward to the next question
      setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
    } catch (err: any) {
      console.error('[Assessment] Failed to finalize answer on Next:', err);
      setValidationError(err?.message || 'Unable to save your answer. Please try again.');
    } finally {
      setSavingAnswer(false);
    }
  };

  // Final submission handler on Question 15: saves & finalizes Q15 then submits entire assessment
  const handleSubmit = async () => {
    if (isSubmitting || savingAnswer) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const selectedOptionId = answers[currentQ.id];
    if (!selectedOptionId) {
      setValidationError('Please select an answer before submitting.');
      return;
    }
    setValidationError(null);

    // Verify all 15 questions have answers
    const unansweredQuestions: number[] = [];
    questions.forEach((q, idx) => {
      if (!answers[q.id]) {
        unansweredQuestions.push(idx + 1);
      }
    });

    if (unansweredQuestions.length > 0) {
      const listStr = unansweredQuestions.map((qNum) => `Question ${qNum}`).join(', ');
      setValidationError(
        `You have unanswered questions. Please complete all 15 questions before submitting. Unanswered: ${listStr}`,
      );
      return;
    }

    const activeAttemptId = attemptRef.current?.attemptId || attempt?.attemptId;
    if (!activeAttemptId) {
      setValidationError('Assessment attempt session not found. Please refresh the page.');
      return;
    }

    setSavingAnswer(true);
    setIsSubmitting(true);

    try {
      // 1. Finalize Q15 on backend
      await assessmentService.saveAnswer(activeAttemptId, currentQ.id.trim(), selectedOptionId.trim(), true);

      setFinalizedQuestionIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(currentQ.id);
        return nextSet;
      });

      // 2. Submit entire assessment immediately without confirmation modal
      await performSubmit(activeAttemptId);
    } catch (err: any) {
      console.error('[Assessment] Failed to submit assessment:', err);
      setValidationError(err?.message || 'Unable to submit your assessment. Please try again.');
      setIsSubmitting(false);
    } finally {
      setSavingAnswer(false);
    }
  };

  // Explicit single retry handler (Requirement 12 & 22)
  const handleRetry = () => {
    initPromiseRef.current = null;
    setStage('INITIALIZING');
    setErrorMessage(null);
    setCanRetry(true);
    runInitialization();
  };

  const candidateName = student?.fullName || user?.email?.split('@')[0] || 'Candidate';
  const position = currentAssessment?.position || 'Marketing Executive';
  const durationMinutes = currentAssessment?.durationMinutes || attempt?.durationMinutes || assessment?.durationMinutes || 15;
  const totalQuestionsCount = currentAssessment?.questionCount || questions.length || 15;
  const passPercentage = currentAssessment?.passPercentage || 80;
  const totalMarks = currentAssessment?.totalMarks || 15;

  // Format remaining time into mm:ss
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = totalSeconds <= 60 && totalSeconds > 0;
  const isWarning = totalSeconds <= 300 && totalSeconds > 60;

  // Synchronize active assessment header & timer with global top navbar
  useEffect(() => {
    if (stage === 'IN_PROGRESS' && questions.length > 0) {
      window.dispatchEvent(
        new CustomEvent('assessment-header-update', {
          detail: {
            isActive: true,
            roundTitle: 'ROUND 1 • Aptitude Assessment',
            timeRemaining: formattedTime,
            isUrgent,
            isWarning,
            isSecureMode: true,
            violationCount,
          },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('assessment-header-update', {
          detail: {
            isActive: false,
            roundTitle: '',
            timeRemaining: '',
            isUrgent: false,
            isWarning: false,
            isSecureMode: false,
            violationCount: 0,
          },
        })
      );
    }

    return () => {
      window.dispatchEvent(
        new CustomEvent('assessment-header-update', {
          detail: {
            isActive: false,
            roundTitle: '',
            timeRemaining: '',
            isUrgent: false,
            isWarning: false,
            isSecureMode: false,
            violationCount: 0,
          },
        })
      );
    };
  }, [stage, questions.length, formattedTime, isUrgent, isWarning, violationCount]);

  // Not authenticated as student (Requirement 10)
  if (!authLoading && (!user || role !== 'STUDENT')) {
    return (
      <div className="container" style={{ maxWidth: '540px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '2.5rem', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
            Your session has expired. Please verify again.
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Please register or verify your candidate email to access the Round 1 Aptitude Assessment.
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Go to Candidate Verification
          </button>
        </div>
      </div>
    );
  }

  // Error state (Requirements 2, 6, 7, 10, 12, 22)
  if (stage === 'ERROR') {
    return (
      <div className="container" style={{ maxWidth: '640px', margin: '4rem auto' }}>
        <div
          className="glass-card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid #fecaca',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
            Assessment Could Not Be Loaded
          </h2>

          <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: 1.6 }}>
            {errorMessage || "We couldn't load your assessment session."}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {canRetry && (
              <button
                onClick={handleRetry}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            )}
            <button onClick={() => router.push('/')} className="btn btn-secondary">
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial session loading state
  if (authLoading || stage === 'INITIALIZING') {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#4f46e5' }} />
          <p style={{ color: '#4b5563', fontSize: '1rem' }}>
            Loading candidate assessment session...
          </p>
        </div>
      </div>
    );
  }

  // Already completed candidate protection
  if (stage === 'ALREADY_COMPLETED' && !scoreResult) {
    return (
      <div className="container" style={{ maxWidth: '640px', margin: '4rem auto' }}>
        <div
          className="glass-card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <div
            className="badge badge-neutral"
            style={{
              padding: '0.35rem 0.9rem',
              marginBottom: '1rem',
              display: 'inline-flex',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #e5e7eb',
            }}
          >
            <span>{(currentAssessment?.position || 'Marketing Executive').toUpperCase()} • ROUND 1</span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
            ASSESSMENT ALREADY COMPLETED
          </h2>

          <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: 1.6, fontSize: '1.05rem' }}>
            This email address has already completed the recruitment assessment.
          </p>

          <button onClick={() => router.push('/')} className="btn btn-secondary">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // SCREEN: SCORE CARD (AFTER FINAL SUBMISSION OR TIME EXPIRY)
  // ============================================================================
  if (scoreResult) {
    const isPassed = scoreResult.passed; // percentage >= 80%
    const isApprovedForRound2 =
      !isPassed &&
      (round2Approved ||
        currentAssessment?.isOverridden ||
        currentAssessment?.round2ApprovalStatus === 'APPROVED' ||
        currentAssessment?.round2Eligible ||
        currentAssessment?.currentStatus === 'ADMIN_APPROVED');

    return (
      <div className="container" style={{ maxWidth: '680px', margin: '2.5rem auto' }}>
        <div
          className="glass-card"
          style={{
            padding: '3rem 2.5rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div
            className="badge badge-neutral"
            style={{
              padding: '0.4rem 1.1rem',
              marginBottom: '1rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              backgroundColor: isApprovedForRound2 ? '#eff6ff' : '#eef2ff',
              color: isApprovedForRound2 ? '#1d4ed8' : '#4338ca',
              border: isApprovedForRound2 ? '1px solid #bfdbfe' : '1px solid #c7d2fe',
              fontWeight: 700,
            }}
          >
            {(currentAssessment?.position || 'Marketing Executive').toUpperCase()} • ROUND 1
          </div>

          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '0.5rem',
              letterSpacing: '-0.025em',
            }}
          >
            Round 1 Completed
          </h1>

          <div style={{ fontSize: '0.92rem', color: '#6b7280', marginBottom: '2rem' }}>
            Candidate: <strong style={{ color: '#111827' }}>{candidateName}</strong>
          </div>

          {/* Score Display Card (Preserves actual candidate Round 1 score) */}
          <div
            style={{
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '2rem 1.5rem',
              marginBottom: '2rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#6b7280',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.4rem',
                }}
              >
                Your Score
              </div>
              <div
                style={{
                  fontSize: '2.6rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#111827',
                  letterSpacing: '-0.02em',
                }}
              >
                {scoreResult.obtainedMarks} / {scoreResult.totalMarks}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {scoreResult.correctAnswers} of {scoreResult.totalQuestions} questions correct
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #E5E7EB' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#6b7280',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.4rem',
                }}
              >
                Percentage
              </div>
              <div
                style={{
                  fontSize: '2.6rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: isPassed ? '#15803d' : isApprovedForRound2 ? '#2563eb' : '#b91c1c',
                  letterSpacing: '-0.02em',
                }}
              >
                {scoreResult.percentage}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                Qualifying benchmark: 80%
              </div>
            </div>
          </div>

          {/* Qualification Status Banner */}
          {isPassed ? (
            <div
              style={{
                padding: '1.75rem',
                borderRadius: '12px',
                background: '#ecfdf5',
                border: '1.5px solid #86efac',
                marginBottom: '2.25rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: '#15803d',
                  marginBottom: '0.65rem',
                }}
              >
                <CheckCircle2 size={24} />
                <span>Status: PASSED</span>
              </div>
              <p style={{ fontSize: '0.98rem', color: '#166534', lineHeight: 1.6, margin: 0 }}>
                <strong>Congratulations!</strong> You have successfully cleared Round 1 with {scoreResult.percentage}%. You are eligible to proceed to Round 2.
              </p>
            </div>
          ) : isApprovedForRound2 ? (
            /* Admin Override Information Card (Requirements 1, 2, 8) */
            <div
              style={{
                padding: '1.75rem',
                borderRadius: '12px',
                background: '#eff6ff',
                border: '1.5px solid #93c5fd',
                marginBottom: '2.25rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: '#1d4ed8',
                  marginBottom: '0.65rem',
                }}
              >
                <CheckCircle2 size={24} />
                <span>Status: ROUND 2 APPROVED</span>
              </div>
              <p style={{ fontSize: '0.98rem', color: '#1e40af', lineHeight: 1.6, margin: 0 }}>
                Your Round 1 score did not meet the automatic qualifying benchmark, but you have been approved by the Admin to continue to Round 2.
              </p>
            </div>
          ) : (
            /* Failed without Admin Override (Requirement 9) */
            <div
              style={{
                padding: '1.75rem',
                borderRadius: '12px',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                marginBottom: '2.25rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: '#b91c1c',
                  marginBottom: '0.65rem',
                }}
              >
                <AlertTriangle size={24} />
                <span>Status: NOT QUALIFIED</span>
              </div>
              <p style={{ fontSize: '0.98rem', color: '#991b1b', lineHeight: 1.6, margin: 0 }}>
                Thank you for participating. You have not met the minimum qualifying score (80%) for this round. You cannot proceed to the next round.
              </p>
            </div>
          )}

          {/* Action Button */}
          {isPassed || isApprovedForRound2 ? (
            <button
              onClick={() => router.push('/student/round-2')}
              className="btn btn-primary"
              style={{
                padding: '1.1rem 3rem',
                fontSize: '1.1rem',
                fontWeight: 800,
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                borderRadius: '10px',
                border: 'none',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
              }}
            >
              <span>CONTINUE TO ROUND 2</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: '10px',
                  background: '#f9fafb',
                  border: '1px solid #E5E7EB',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                }}
              >
                Candidate Record Finalized • Assessment Process Concluded
              </div>
              <button
                onClick={checkRound2Status}
                disabled={checkingRound2}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                }}
              >
                <RefreshCw size={14} className={checkingRound2 ? 'animate-spin' : ''} />
                <span>{checkingRound2 ? 'Checking status...' : 'Check for Admin Approval / Refresh'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // SCREEN 4: DISTRACTION-FREE ASSESSMENT (EXACTLY ONE QUESTION PER SCREEN)
  // ============================================================================
  if (stage === 'IN_PROGRESS' && questions.length > 0) {
    const activeQuestion = questions[currentQuestionIndex];
    const selectedOptionId = answers[activeQuestion?.id];
    const isOptionSelected = Boolean(selectedOptionId);
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
      <div
        className="container"
        style={{
          maxWidth: '1240px',
          width: '95%',
          margin: '0 auto',
          paddingTop: '0.25rem',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Compact Progress Indicator & Visual Navigator */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: '#475569',
              marginBottom: '0.35rem',
            }}
          >
            <span style={{ fontWeight: 600 }}>
              Question <strong style={{ color: '#0f172a', fontSize: '0.98rem' }}>{currentQuestionIndex + 1}</strong> of{' '}
              {questions.length}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
              {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Completed
            </span>
          </div>

          <div
            style={{
              height: '6px',
              background: '#E2E8F0',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '0.6rem',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                background: 'var(--accent-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Compact Informational Question Progress Strip (Non-clickable, visual progress indicator only) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(15, 1fr)',
              gap: '0.35rem',
            }}
          >
            {questions.map((q, idx) => {
              const isFinalized = finalizedQuestionIds.has(q.id);
              const isSelected = Boolean(answers[q.id]);
              const isCurrent = currentQuestionIndex === idx;
              return (
                <div
                  key={q.id}
                  title={`Question ${idx + 1}${isFinalized ? ' (Locked & Completed)' : isCurrent ? ' (Current)' : isSelected ? ' (Answer Selected)' : ' (Upcoming)'}`}
                  style={{
                    height: '28px',
                    borderRadius: '5px',
                    border: isCurrent
                      ? '2px solid var(--accent-primary)'
                      : isFinalized
                        ? '1px solid #86efac'
                        : isSelected
                          ? '1px solid #93c5fd'
                          : '1px solid #E2E8F0',
                    background: isCurrent
                      ? 'var(--accent-primary)'
                      : isFinalized
                        ? '#dcfce7'
                        : isSelected
                          ? '#eff6ff'
                          : '#ffffff',
                    color: isCurrent
                      ? '#ffffff'
                      : isFinalized
                        ? '#15803d'
                        : isSelected
                          ? '#1d4ed8'
                          : '#94a3b8',
                    fontWeight: isCurrent || isFinalized || isSelected ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'default',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div
            style={{
              padding: '0.75rem 1.15rem',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Wide Landscape Question Card */}
        <div
          className="glass-card"
          style={{
            padding: '1.5rem 1.85rem',
            marginBottom: '1rem',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <span
              className="badge badge-neutral"
              style={{
                background: '#f1f5f9',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.25rem 0.65rem',
                borderRadius: '4px',
              }}
            >
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span
              style={{
                fontSize: '0.82rem',
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              {activeQuestion?.marks || 1.0} Mark
            </span>
          </div>

          <h2
            style={{
              fontSize: '1.18rem',
              fontWeight: 600,
              lineHeight: 1.5,
              marginBottom: '1.25rem',
              color: '#0f172a',
            }}
          >
            {activeQuestion?.questionText}
          </h2>

          {/* Options: Candidate can freely select and change answer while on current question */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {activeQuestion?.options?.map((option) => {
              if (!option?.id || !activeQuestion?.id) return null;
              const isSelected = selectedOptionId === option.id;
              return (
                <button
                  type="button"
                  key={option.id}
                  disabled={savingAnswer || isSubmitting}
                  onClick={() => handleSelectOption(activeQuestion.id, option.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '8px',
                    background: isSelected ? '#EEF2FF' : '#ffffff',
                    border: isSelected
                      ? '1.5px solid var(--accent-primary)'
                      : '1px solid #E2E8F0',
                    cursor: savingAnswer || isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isSelected
                        ? '5px solid var(--accent-primary)'
                        : '2px solid #94a3b8',
                      background: isSelected ? '#ffffff' : 'transparent',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.94rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#0f172a' : '#334155',
                      lineHeight: 1.45,
                    }}
                  >
                    {option.optionText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls: Strictly Forward-Only, NO Previous Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              {isOptionSelected ? (
                <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Answer selected</span>
              ) : (
                <span>Select an answer to continue</span>
              )}
            </div>

            {/* Questions 1–14 show [ NEXT ]. Question 15 shows [ SUBMIT ASSESSMENT ] */}
            {!isLastQuestion ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!isOptionSelected || savingAnswer || isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1.6rem',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  opacity: !isOptionSelected || savingAnswer || isSubmitting ? 0.5 : 1,
                  cursor: !isOptionSelected || savingAnswer || isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {savingAnswer ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!isOptionSelected || savingAnswer || isSubmitting}
                style={{
                  background: 'var(--accent-primary)',
                  borderColor: 'var(--accent-primary)',
                  padding: '0.65rem 1.85rem',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  opacity: !isOptionSelected || savingAnswer || isSubmitting ? 0.5 : 1,
                  cursor: !isOptionSelected || savingAnswer || isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : savingAnswer ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving Answer...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Assessment</span>
                    <CheckCircle2 size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* In-App Security Environment Modals */}
        <FullscreenRequiredModal
          isOpen={showFullscreenRequiredModal}
          onReturnToFullscreen={requestFullscreen}
          violationCount={violationCount}
          maxViolations={maxViolations}
        />
        <SecurityWarningModal
          isOpen={showSecurityWarningModal}
          onContinue={dismissSecurityWarning}
          violationCount={violationCount}
          maxViolations={maxViolations}
          customTitle={warningDetails?.title}
          customMessage={warningDetails?.message}
        />
        <AutoSubmitModal isOpen={showAutoSubmitModal} />
        <NavigationWarningModal
          isOpen={showNavigationWarningModal}
          onStay={stayInAssessment}
          onLeave={leaveAssessment}
        />
      </div>
    );
  }

  // ============================================================================
  // SCREEN 3: ASSESSMENT DETAILS / INTRODUCTION SCREEN (Landing After OTP Verification)
  // ============================================================================
  const hasActiveAttempt = attempt && attempt.status === 'IN_PROGRESS';

  return (
    <div className="container" style={{ maxWidth: '840px', margin: '1.5rem auto' }}>
      {/* Candidate Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          background: hasActiveAttempt ? '#eff6ff' : '#ecfdf5',
          border: hasActiveAttempt ? '1px solid #bfdbfe' : '1px solid #86efac',
          color: hasActiveAttempt ? '#1e40af' : '#15803d',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.92rem',
            fontWeight: 600,
          }}
        >
          {hasActiveAttempt ? <Clock size={18} /> : <CheckCircle2 size={18} />}
          <span>
            {hasActiveAttempt
              ? `Assessment in progress (${formattedTime} remaining).`
              : 'Your email has been verified. Review assessment details before beginning.'}
          </span>
        </div>
        <span className="badge badge-neutral" style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#374151', border: '1px solid #E5E7EB' }}>
          Candidate: {candidateName}
        </span>
      </div>

      {/* Hero Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          className="badge badge-neutral"
          style={{
            padding: '0.4rem 1rem',
            marginBottom: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #E5E7EB',
          }}
        >
          <span>MARKETING EXECUTIVE</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.6rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '0.5rem',
            color: '#111827',
          }}
        >
          ROUND 1 — APTITUDE ASSESSMENT
        </h1>

        <p style={{ fontSize: '1.05rem', color: '#4b5563' }}>
          Speed and accuracy assessment covering quantitative reasoning and logical deduction.
        </p>
      </div>

      {/* Specifications Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <Clock size={22} />
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Duration
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>15 Minutes</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Strict server countdown
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <FileQuestion size={22} />
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Questions
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>15</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Numerical & logical aptitude
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d',
            }}
          >
            <Award size={22} />
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Passing Score
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>80%</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            12 / 15 to pass
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fdf4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Question Type
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>Multiple Choice</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Single correct option
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <Award size={22} />
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Total Marks
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827' }}>15</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            1 mark per question
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#111827',
          }}
        >
          <ShieldAlert size={18} color="var(--accent-primary)" />
          <span>Instructions:</span>
        </h3>

        <ul
          style={{
            paddingLeft: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            fontSize: '0.92rem',
            color: '#4b5563',
            lineHeight: 1.6,
          }}
        >
          <li>Complete all 15 questions.</li>
          <li>Each question carries 1 mark.</li>
          <li>You can change the answer only for the current question.</li>
          <li>Clicking Next locks the current question.</li>
          <li>Previous questions cannot be revisited or changed.</li>
          <li>Timer starts only after clicking START ASSESSMENT.</li>
          <li>Timer expiry automatically submits the assessment.</li>
          <li>Submission locks the assessment.</li>
        </ul>
      </div>

      {/* Start API Error Banner */}
      {startError && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '0.92rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>{startError}</span>
        </div>
      )}

      {/* Start / Resume Assessment CTA */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <button
          onClick={handleStartAssessmentClick}
          disabled={isStarting}
          className="btn btn-primary"
          style={{
            padding: '1.1rem 3.5rem',
            fontSize: '1.15rem',
            fontWeight: 800,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 6px 30px rgba(99, 102, 241, 0.4)',
            gap: '0.75rem',
            cursor: isStarting ? 'not-allowed' : 'pointer',
          }}
        >
          {isStarting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>STARTING ASSESSMENT...</span>
            </>
          ) : hasActiveAttempt ? (
            <>
              <Play size={20} />
              <span>CONTINUE ASSESSMENT</span>
            </>
          ) : (
            <>
              <Play size={20} />
              <span>START ASSESSMENT</span>
            </>
          )}
        </button>
      </div>

      {/* Pre-Exam Fullscreen Entrance Confirmation Modal */}
      <PreExamFullscreenModal
        isOpen={showPreExamModal}
        onEnterFullscreen={handleConfirmStartFullscreen}
        driveName={currentAssessment?.driveName || 'Marketing Executive Drive'}
        roundName="Round 1 • Aptitude Assessment"
      />
    </div>
  );
}
