'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Play,
  LogOut,
} from 'lucide-react';
import {
  assessmentService,
  Round2AccessResponse,
  SafeQuestion,
  AssessmentAttemptInfo,
  EvaluatedResultData,
  FinalResultResponse,
} from '@/services/api/assessmentService';
import { useSecureAssessment } from '@/hooks/useSecureAssessment';
import {
  PreExamFullscreenModal,
  FullscreenRequiredModal,
  SecurityWarningModal,
  AutoSubmitModal,
  NavigationWarningModal,
} from '@/components/assessment/SecureExamModals';

export type Round2Stage =
  | 'CHECKING_ACCESS'
  | 'INTRO'
  | 'STARTING'
  | 'IN_PROGRESS'
  | 'EVALUATED'
  | 'ERROR'
  | 'FORBIDDEN';

export default function StudentRound2Page() {
  const router = useRouter();
  const { user, student, role, logout, loading: authLoading } = useAuth();

  // Access & Config State
  const [stage, setStage] = useState<Round2Stage>('CHECKING_ACCESS');
  const [accessData, setAccessData] = useState<Round2AccessResponse | null>(null);
  const [forbiddenMessage, setForbiddenMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Assessment & Question State
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [attempt, setAttempt] = useState<AssessmentAttemptInfo | null>(null);
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finalizedQuestionIds, setFinalizedQuestionIds] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<EvaluatedResultData | null>(null);
  const [finalResult, setFinalResult] = useState<FinalResultResponse | null>(null);
  const [logoutCountdown, setLogoutCountdown] = useState<number>(20);

  // Dynamic configuration from backend
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [passPercentage, setPassPercentage] = useState<number>(75);
  const [assessmentTitle, setAssessmentTitle] = useState<string>('ROUND 2 — ENGLISH COMMUNICATION & VERBAL ABILITY');

  // Authoritative monotonic timer synchronization refs
  const [remainingMs, setRemainingMs] = useState<number>(20 * 60 * 1000);
  const expiresAtMsRef = useRef<number | null>(null);
  const serverTimeMsRef = useRef<number | null>(null);
  const perfStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef<AssessmentAttemptInfo | null>(null);
  const isAutoSubmittingRef = useRef<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);

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
    enabled: stage === 'IN_PROGRESS',
    attemptId: attempt?.attemptId || null,
    initialViolations: attempt?.securityViolationCount || 0,
    onAutoSubmit: async () => {
      const id = attemptRef.current?.attemptId || attempt?.attemptId;
      if (id) {
        await performSubmit(id);
      }
    },
  });

  const handleStartRound2Click = () => {
    setShowPreExamModal(true);
  };

  const handleConfirmStartFullscreen = async () => {
    setShowPreExamModal(false);
    await requestFullscreen();
    await handleStartRound2();
  };

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || role !== 'STUDENT')) {
      router.push('/');
    }
  }, [user, role, authLoading, router]);

  // Calculates remaining milliseconds against synchronized server time
  const calculateRemainingMs = useCallback((): number => {
    if (!expiresAtMsRef.current || !serverTimeMsRef.current || !perfStartRef.current) {
      return durationMinutes * 60 * 1000;
    }
    const elapsedSinceSync = performance.now() - perfStartRef.current;
    const currentEstimatedServerTime = serverTimeMsRef.current + elapsedSinceSync;
    return Math.max(0, expiresAtMsRef.current - currentEstimatedServerTime);
  }, [durationMinutes]);

  // Submits candidate attempt to server and evaluates
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
      try {
        const finalData = await assessmentService.getFinalResult();
        setFinalResult(finalData);
      } catch (fErr) {
        console.warn('[Round 2] Could not fetch final result:', fErr);
      }
      setStage('EVALUATED');
    } catch (err: any) {
      console.error('[Round 2] Submission error:', err);
      try {
        const fallback = await assessmentService.getAttemptResult(id);
        setScoreResult(fallback.result);
        try {
          const finalData = await assessmentService.getFinalResult();
          setFinalResult(finalData);
        } catch (fErr) {
          console.warn('[Round 2] Could not fetch final result in fallback:', fErr);
        }
        setStage('EVALUATED');
      } catch (fErr) {
        console.error('[Round 2] Fallback result error:', fErr);
        setErrorMessage('Failed to submit assessment. Please refresh or contact support.');
        setStage('ERROR');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, attempt?.attemptId]);

  // Loads questions and restores saved candidate answers
  const loadQuestionsAndAnswers = useCallback(async (targetAttempt: AssessmentAttemptInfo) => {
    const qData = await assessmentService.getAttemptQuestions(targetAttempt.attemptId);
    const questionsList: SafeQuestion[] = qData.questions || [];

    if (questionsList.length !== 15) {
      throw new Error(`Expected 15 Round 2 questions, but received ${questionsList.length}.`);
    }

    // Strip any accidental answer key
    for (const q of questionsList) {
      if (Array.isArray(q.options)) {
        q.options.forEach((opt: any) => {
          if ('isCorrect' in opt) {
            delete opt.isCorrect;
          }
        });
      }
    }

    setQuestions(questionsList);

    // Restore saved answers and finalized questions
    const restored: Record<string, string> = {};
    const finalizedSet = new Set<string>();
    if (qData.savedAnswers && qData.savedAnswers.length > 0) {
      qData.savedAnswers.forEach((ans) => {
        if (ans.selectedOptionId) {
          restored[ans.questionId] = ans.selectedOptionId;
          if (ans.isFinalized) {
            finalizedSet.add(ans.questionId);
          }
        }
      });
      setAnswers(restored);
      setFinalizedQuestionIds(finalizedSet);
    } else {
      setAnswers({});
      setFinalizedQuestionIds(new Set());
    }

    // Resume from first UNFINALIZED question (keeps current question editable on refresh)
    const firstUnfinalizedIndex = questionsList.findIndex((q) => !finalizedSet.has(q.id));
    if (firstUnfinalizedIndex !== -1) {
      setCurrentQuestionIndex(firstUnfinalizedIndex);
    } else {
      setCurrentQuestionIndex(questionsList.length - 1);
    }

    // Initialize timer
    if (targetAttempt.expiresAt) {
      expiresAtMsRef.current = new Date(targetAttempt.expiresAt).getTime();
      serverTimeMsRef.current = targetAttempt.serverTime
        ? new Date(targetAttempt.serverTime).getTime()
        : Date.now();
      perfStartRef.current = performance.now();
      const rem = calculateRemainingMs();
      setRemainingMs(rem);

      if (rem <= 0 || targetAttempt.isExpired) {
        performSubmit(targetAttempt.attemptId);
        return;
      }
    }

    setStage('IN_PROGRESS');
  }, [calculateRemainingMs, performSubmit]);

  // Verifies Round 2 eligibility and loads assessment configuration
  const verifyAccessAndLoadAttempt = useCallback(async () => {
    if (initPromiseRef.current) return initPromiseRef.current;

    const promise = (async () => {
      try {
        setStage('CHECKING_ACCESS');
        setErrorMessage(null);

        const res = await assessmentService.checkRound2Access();
        setAccessData(res);

        if (res.assessmentId) {
          setAssessmentId(res.assessmentId);
        }
        if (res.durationMinutes) {
          setDurationMinutes(res.durationMinutes);
        }
        if (res.passPercentage) {
          setPassPercentage(res.passPercentage);
        }
        if (res.title) {
          setAssessmentTitle(res.title);
        }

        // 1. If candidate already completed Round 2 -> render Score Card immediately
        if (res.result) {
          setScoreResult(res.result);
          if (res.attempt) {
            setAttempt(res.attempt);
            attemptRef.current = res.attempt;
          }
          try {
            const finalData = await assessmentService.getFinalResult();
            setFinalResult(finalData);
          } catch (fErr) {
            console.warn('[Round 2] Could not fetch final results on load:', fErr);
          }
          setStage('EVALUATED');
          return;
        }

        // 2. If candidate has an existing IN_PROGRESS attempt
        if (res.attempt && res.attempt.status === 'IN_PROGRESS') {
          const now = Date.now();
          const expiresTime = new Date(res.attempt.expiresAt).getTime();

          if (now >= expiresTime) {
            // Expired -> evaluate
            await performSubmit(res.attempt.attemptId);
            return;
          }

          setAttempt(res.attempt);
          attemptRef.current = res.attempt;
          await loadQuestionsAndAnswers(res.attempt);
          return;
        }

        // 3. Otherwise ready on Introduction page
        setStage('INTRO');
      } catch (err: any) {
        console.error('[Round 2] Access verification failed:', err);
        const status = err?.statusCode || err?.status;
        if (status === 409 || err?.code === 'ASSESSMENT_ALREADY_COMPLETED') {
          try {
            const finalData = await assessmentService.getFinalResult();
            setFinalResult(finalData);
            if (finalData?.round2) {
              setScoreResult({
                totalQuestions: finalData.round2.totalQuestions,
                correctAnswers: Math.round(finalData.round2.obtainedMarks),
                totalMarks: finalData.round2.totalQuestions,
                obtainedMarks: finalData.round2.obtainedMarks,
                percentage: finalData.round2.percentage,
                passed: finalData.round2.passed,
              });
              setStage('EVALUATED');
              return;
            }
          } catch (fErr) {
            console.warn('[Round 2] Could not fetch final result on 409:', fErr);
          }
          setForbiddenMessage(
            err?.message ||
            'Assessment Already Completed: You have already completed the recruitment assessment.',
          );
          setStage('FORBIDDEN');
        } else if (status === 403) {
          setForbiddenMessage(
            err?.message ||
            'Access Denied (403 Forbidden): Round 2 is strictly reserved for candidates who passed the Round 1 Aptitude Assessment with 80% or higher.',
          );
          setStage('FORBIDDEN');
        } else {
          setErrorMessage(err?.message || 'Unable to verify Round 2 access. Please try again.');
          setStage('ERROR');
        }
      }
    })();

    initPromiseRef.current = promise;
    return promise;
  }, [loadQuestionsAndAnswers, performSubmit]);

  useEffect(() => {
    if (!authLoading && user && role === 'STUDENT') {
      verifyAccessAndLoadAttempt();
    }
  }, [authLoading, user, role, verifyAccessAndLoadAttempt]);

  // Auto-logout countdown timer when evaluated
  useEffect(() => {
    if (stage !== 'EVALUATED') return;

    const interval = setInterval(() => {
      setLogoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          try {
            logout();
          } catch (e) {
            console.warn('Logout error', e);
          }
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, logout, router]);

  const handleFinishAndSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      router.push('/');
    }
  };

  // Authoritative countdown timer loop: runs whenever attempt is IN_PROGRESS
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
        if (attemptRef.current?.attemptId) {
          performSubmit(attemptRef.current.attemptId);
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
  }, [scoreResult, calculateRemainingMs, performSubmit, attempt?.status]);

  // Handler: Start Round 2 Assessment
  const handleStartRound2 = async () => {
    try {
      setStage('STARTING');
      setErrorMessage(null);
      setValidationError(null);

      const targetId = assessmentId || accessData?.assessmentId || 'default';
      const startRes = await assessmentService.startAssessment(targetId);

      setAttempt(startRes);
      attemptRef.current = startRes;

      if (startRes.result) {
        setScoreResult(startRes.result);
        setStage('EVALUATED');
        return;
      }

      await loadQuestionsAndAnswers(startRes);
    } catch (err: any) {
      console.error('[Round 2] Start assessment failed:', err);
      const status = err?.statusCode || err?.status;
      if (status === 403) {
        setForbiddenMessage(err?.message || 'Access Denied (403 Forbidden).');
        setStage('FORBIDDEN');
      } else {
        setErrorMessage(err?.message || 'Failed to start Round 2 assessment. Please try again.');
        setStage('ERROR');
      }
    }
  };

  // Option selection: candidate can freely select and change their answer while on the current question
  const handleSelectOption = (questionId: string, optionId: string) => {
    if (stage !== 'IN_PROGRESS' || isSubmitting || savingAnswer) return;
    if (!questions || questions.length === 0) return;

    // If already finalized/locked, cannot edit
    if (finalizedQuestionIds.has(questionId)) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ?.id || currentQ.id !== questionId) return;

    const isValidOption = currentQ.options?.some((opt) => opt.id === optionId);
    if (!isValidOption) return;

    setValidationError(null);
    // Update local state immediately without locking options
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // When Next is clicked: save and finalize the current question, then advance
  const handleNext = async () => {
    if (savingAnswer || isSubmitting) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const selectedOptionId = answers[currentQ.id];
    if (!selectedOptionId) {
      setValidationError('Please select an answer before continuing.');
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
      // 1. Save and finalize to backend
      await assessmentService.saveAnswer(activeAttemptId, currentQ.id, selectedOptionId, true);

      // 2. Mark this question as permanently finalized/locked
      setFinalizedQuestionIds((prev) => {
        const next = new Set(prev);
        next.add(currentQ.id);
        return next;
      });

      // 3. Move to the next question
      setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
    } catch (err: any) {
      console.error('[Round 2] Failed to finalize answer on Next:', err);
      setValidationError(err?.message || 'Failed to save and lock answer. Please try again.');
    } finally {
      setSavingAnswer(false);
    }
  };

  // Final submission on Question 15: finalize Q15 and submit attempt (No confirmation popup)
  const handleSubmit = async () => {
    if (isSubmitting || savingAnswer) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const selectedOptionId = answers[currentQ.id];
    if (!selectedOptionId) {
      setValidationError('Please answer this question before submitting.');
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
      // 1. Save and finalize Q15
      await assessmentService.saveAnswer(activeAttemptId, currentQ.id, selectedOptionId, true);
      setFinalizedQuestionIds((prev) => {
        const next = new Set(prev);
        next.add(currentQ.id);
        return next;
      });

      // 2. Submit assessment
      await performSubmit(activeAttemptId);
    } catch (err: any) {
      console.error('[Round 2] Submission error on Q15:', err);
      setValidationError(err?.message || 'Failed to finalize and submit assessment. Please try again.');
    } finally {
      setSavingAnswer(false);
    }
  };

  const candidateName =
    accessData?.candidateName || student?.fullName || user?.email?.split('@')[0] || 'Candidate';

  // Format countdown mm:ss
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = totalSeconds <= 60 && totalSeconds > 0;
  const isWarning = totalSeconds <= 300 && totalSeconds > 60;

  // Synchronize active Round 2 assessment header & timer with global top navbar
  useEffect(() => {
    if (stage === 'IN_PROGRESS' && questions.length > 0) {
      window.dispatchEvent(
        new CustomEvent('assessment-header-update', {
          detail: {
            isActive: true,
            roundTitle: 'ROUND 2 — ENGLISH COMMUNICATION & VERBAL ABILITY',
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

  // ============================================================================
  // 1. LOADING / CHECKING STATE
  // ============================================================================
  if (authLoading || stage === 'CHECKING_ACCESS') {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Verifying Round 2 access authorization...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. STARTING STATE
  // ============================================================================
  if (stage === 'STARTING') {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Initializing Round 2 assessment engine & loading questions...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. ACCESS RESTRICTED (403 FORBIDDEN - e.g. APTITUDE_FAILED)
  // ============================================================================
  if (stage === 'FORBIDDEN') {
    return (
      <div className="container" style={{ maxWidth: '680px', margin: '4rem auto' }}>
        <div
          className="glass-card"
          style={{
            padding: '3rem 2.5rem',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid #fecaca',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <Lock size={32} />
          </div>

          <div
            className="badge badge-neutral"
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              marginBottom: '1rem',
            }}
          >
            403 FORBIDDEN • ACCESS RESTRICTED
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: '#111827' }}>
            Round 2 Access Restricted
          </h2>

          <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: 1.6 }}>
            {forbiddenMessage ||
              'You cannot access this assessment. Only candidates who have achieved 80% or above in the Round 1 Aptitude Assessment or received Administrator approval are authorized to proceed to Round 2.'}
          </p>

          <button
            onClick={() => router.push('/student/assessment')}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Round 1 Summary</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 4. ERROR STATE
  // ============================================================================
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
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#111827' }}>
            Round 2 Could Not Be Loaded
          </h2>

          <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: 1.6 }}>
            {errorMessage || 'Unable to load Round 2 assessment session.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={() => {
                initPromiseRef.current = null;
                verifyAccessAndLoadAttempt();
              }}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>
            <button onClick={() => router.push('/student/assessment')} className="btn btn-secondary">
              Back to Round 1
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 5. SCORE CARD: COMPLETED ROUND 2 EVALUATION RESULT
  // ============================================================================
  if (stage === 'EVALUATED' && scoreResult) {
    const isRound2Passed = scoreResult.passed;
    const scoreStatusText = isRound2Passed ? 'PASSED' : 'NOT QUALIFIED';

    const r2ObtainedMarks = scoreResult.obtainedMarks;
    const r2TotalMarks = scoreResult.totalMarks || 15;
    const r2Percentage = Math.round(scoreResult.percentage);

    const r1Score = finalResult?.round1
      ? `${finalResult.round1.obtainedMarks} / ${finalResult.round1.totalQuestions}`
      : '12 / 15';
    const r1Percentage = finalResult?.round1
      ? `${Math.round(finalResult.round1.percentage)}%`
      : '80%';
    const r1Passed = finalResult?.round1 ? finalResult.round1.passed : true;

    return (
      <div className="container" style={{ maxWidth: '720px', margin: '2.5rem auto' }}>
        <div
          className="glass-card"
          style={{
            padding: '3rem 2.5rem',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Drive Badge */}
          <div
            className="badge badge-neutral"
            style={{
              padding: '0.45rem 1.25rem',
              marginBottom: '1rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #E5E7EB',
            }}
          >
            MARKETING EXECUTIVE • ROUND 2
          </div>

          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              marginBottom: '0.5rem',
              color: '#111827',
            }}
          >
            Round 2 Completed
          </h1>

          <div
            style={{
              fontSize: '0.92rem',
              color: '#6b7280',
              marginBottom: '2rem',
            }}
          >
            Candidate: <strong style={{ color: '#111827' }}>{candidateName}</strong>
          </div>

          {/* Main Score Result Display (Requirement 3) */}
          <div
            style={{
              padding: '2rem 1.5rem',
              borderRadius: '12px',
              background: isRound2Passed ? '#ecfdf5' : '#fef2f2',
              border: isRound2Passed ? '1.5px solid #86efac' : '1.5px solid #fecaca',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: isRound2Passed ? '#15803d' : '#b91c1c',
              }}
            >
              Your Score: {r2ObtainedMarks} / {r2TotalMarks}
            </div>

            <div
              style={{
                fontSize: '2.6rem',
                fontWeight: 900,
                color: isRound2Passed ? '#15803d' : '#b91c1c',
                letterSpacing: '-0.02em',
              }}
            >
              Percentage: {r2Percentage}%
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isRound2Passed ? '#15803d' : '#b91c1c',
                marginTop: '0.25rem',
              }}
            >
              {isRound2Passed ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              <span>Status: {scoreStatusText}</span>
            </div>

            {isRound2Passed && (
              <p
                style={{
                  margin: '0.75rem 0 0 0',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#15803d',
                }}
              >
                You have successfully completed the assessment process.
              </p>
            )}
          </div>

          {/* Both Rounds Breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {/* Round 1 Score Box */}
            <div
              style={{
                background: '#f9fafb',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.35rem',
                }}
              >
                Round 1 Score
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>
                {r1Score} ({r1Percentage})
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'inline-block',
                  marginTop: '0.4rem',
                }}
              >
                {r1Passed ? 'PASSED' : 'NOT QUALIFIED'}
              </span>
            </div>

            {/* Round 2 Score Box */}
            <div
              style={{
                background: '#f9fafb',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.35rem',
                }}
              >
                Round 2 Score
              </div>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: isRound2Passed ? '#15803d' : '#b91c1c',
                }}
              >
                {r2ObtainedMarks} / {r2TotalMarks} ({r2Percentage}%)
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background: isRound2Passed ? '#dcfce7' : '#fee2e2',
                  color: isRound2Passed ? '#15803d' : '#b91c1c',
                  display: 'inline-block',
                  marginTop: '0.4rem',
                }}
              >
                {scoreStatusText}
              </span>
            </div>
          </div>

          {/* Thank You & Guidance Message */}
          <div
            style={{
              padding: '1.5rem',
              background: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              marginBottom: '2rem',
              textAlign: 'center',
            }}
          >
            {isRound2Passed ? (
              <div style={{ color: '#4b5563', lineHeight: 1.7, fontSize: '0.96rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#111827' }}>
                  Thank you for participating in the Marketing Executive recruitment assessment.
                </p>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  Your assessment has been successfully completed.
                </p>
                <p style={{ margin: 0, color: '#6b7280' }}>
                  Our recruitment team will review your results and contact you regarding the next stage of the recruitment process.
                </p>
              </div>
            ) : (
              <div style={{ color: '#4b5563', lineHeight: 1.7, fontSize: '0.96rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#111827' }}>
                  Thank you for participating in the recruitment assessment.
                </p>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  Your assessment has been completed.
                </p>
                <p style={{ margin: 0, color: '#6b7280' }}>
                  Unfortunately, you did not meet the required passing criteria for Round 2. We appreciate your time and interest.
                </p>
              </div>
            )}
          </div>

          {/* Auto Logout Progress & Manual Logout Button */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
                color: '#6b7280',
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              <span>Signing you out in {logoutCountdown}s...</span>
            </div>

            <button
              onClick={handleFinishAndSignOut}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 2.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            >
              <LogOut size={16} />
              <span>Finish & Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 6. QUESTION SCREEN: 15 QUESTIONS (EXACTLY ONE QUESTION PER SCREEN)
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
        {/* Assessment Heading */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            MARKETING EXECUTIVE
          </div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0.15rem 0 0 0',
            }}
          >
            ROUND 2 — ENGLISH COMMUNICATION & VERBAL ABILITY
          </h1>
        </div>

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
              const isCurrent = idx === currentQuestionIndex;

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

        {/* Validation Error Alert */}
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
        {activeQuestion && (
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
                alignItems: 'center',
                justifyContent: 'space-between',
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
                {activeQuestion.marks || 1.0} Mark
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
              {activeQuestion.questionText}
            </h2>

            {/* Options List: Candidate can freely select and change answer while on current question */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {activeQuestion.options?.map((opt, optIdx) => {
                const isSelected = selectedOptionId === opt.id;
                const optionLetters = ['A', 'B', 'C', 'D'];
                const letter =
                  optionLetters[opt.order ? opt.order - 1 : optIdx] ||
                  optionLetters[optIdx] ||
                  '';

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={savingAnswer || isSubmitting}
                    onClick={() => handleSelectOption(activeQuestion.id, opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1.5px solid var(--accent-primary)'
                        : '1px solid #E2E8F0',
                      background: isSelected ? '#EEF2FF' : '#ffffff',
                      cursor: savingAnswer || isSubmitting ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
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
                        marginTop: '2px',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.94rem',
                        lineHeight: 1.45,
                        color: isSelected ? '#0f172a' : '#334155',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      <strong
                        style={{
                          marginRight: '0.45rem',
                          color: isSelected ? 'var(--accent-primary)' : '#475569',
                        }}
                      >
                        {letter}.
                      </strong>
                      {opt.optionText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Controls: Strictly Forward-Only, NO Previous Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
                  onClick={handleNext}
                  disabled={!isOptionSelected || savingAnswer || isSubmitting}
                  className="btn btn-primary"
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
                  onClick={handleSubmit}
                  disabled={!isOptionSelected || savingAnswer || isSubmitting}
                  className="btn btn-primary"
                  style={{
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
        )}

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
  // 7. INTRODUCTION SCREEN: QUALIFIED CANDIDATE READY FOR ROUND 2 (Light Theme)
  // ============================================================================
  const hasExistingInProgressAttempt = Boolean(
    accessData?.attempt && accessData.attempt.status === 'IN_PROGRESS',
  );

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      {/* Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          background: hasExistingInProgressAttempt ? '#eff6ff' : '#ecfdf5',
          border: hasExistingInProgressAttempt ? '1px solid #bfdbfe' : '1px solid #86efac',
          color: hasExistingInProgressAttempt ? '#1e40af' : '#15803d',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.92rem', fontWeight: 600 }}>
          {hasExistingInProgressAttempt ? <Clock size={18} /> : <CheckCircle2 size={18} />}
          <span>
            {hasExistingInProgressAttempt
              ? `Assessment in progress (${formattedTime} remaining).`
              : accessData?.isOverridden || accessData?.status === 'ADMIN_APPROVED'
              ? 'Round 2 Approved: You have been approved by the Admin to continue to Round 2.'
              : 'Round 1 Cleared: Qualified for Round 2 Professional Communication.'}
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
            padding: '0.35rem 0.9rem',
            marginBottom: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #E5E7EB',
          }}
        >
          <Sparkles size={14} color="var(--accent-primary)" />
          <span>MARKETING EXECUTIVE</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.8rem, 3.6vw, 2.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            marginBottom: '0.5rem',
            color: '#111827',
          }}
        >
          ROUND 2 — ENGLISH COMMUNICATION & VERBAL ABILITY
        </h1>

        <p style={{ fontSize: '1.05rem', color: '#4b5563' }}>
          Welcome, <strong style={{ color: '#111827' }}>{candidateName}</strong>.
          {accessData?.isOverridden || accessData?.status === 'ADMIN_APPROVED'
            ? ' You have been approved by the Admin to proceed to Round 2. Round 2 evaluates professional vocabulary, business comprehension, and verbal situational skills.'
            : ' Congratulations on clearing Round 1 with ≥ 80%. Round 2 evaluates professional vocabulary, business comprehension, and verbal situational skills.'}
        </p>
      </div>

      {/* Overview Grid (Config values dynamically loaded from backend) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
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
              margin: '0 auto 0.75rem',
            }}
          >
            <BookOpen size={22} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase' }}>
            Section 1
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827' }}>Vocabulary & Grammar</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
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
              margin: '0 auto 0.75rem',
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase' }}>
            Section 2
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827' }}>Business Scenarios</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
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
              margin: '0 auto 0.75rem',
            }}
          >
            <Award size={22} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase' }}>
            Benchmark
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827' }}>{passPercentage}% Passing Score</div>
        </div>
      </div>

      {/* Instructions & Readiness Note */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem 2rem',
          marginBottom: '2.5rem',
          border: '1px solid #E5E7EB',
          background: '#ffffff',
          borderRadius: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#111827',
          }}
        >
          <ShieldAlert size={18} color="var(--accent-primary)" />
          <span>Round 2 Instructions:</span>
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
          <li>The assessment contains 15 questions evaluating communication and vocabulary.</li>
          <li>You have {durationMinutes} minutes to complete the assessment.</li>
          <li>Total Marks: 15 (1 mark per question, 75% passing benchmark).</li>
          <li>Navigation is strictly forward-only. You cannot return to previous questions.</li>
          <li>Once you select an option, your answer is saved and locked permanently.</li>
          <li>You must answer the current question before continuing to the next question.</li>
          <li>The timer starts only after you click &quot;START ROUND 2 ASSESSMENT&quot;.</li>
          <li>If the timer expires, the assessment will be submitted automatically.</li>
          <li>The assessment is evaluated automatically upon submission.</li>
        </ul>
      </div>

      {/* Primary Action */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <button
          onClick={handleStartRound2Click}
          className="btn btn-primary"
          style={{
            padding: '1.15rem 3.5rem',
            fontSize: '1.15rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            borderRadius: '8px',
          }}
        >
          <Play size={20} />
          <span>
            {hasExistingInProgressAttempt
              ? 'CONTINUE ROUND 2 ASSESSMENT'
              : 'START ROUND 2 ASSESSMENT'}
          </span>
        </button>
      </div>

      {/* Pre-Exam Fullscreen Entrance Confirmation Modal */}
      <PreExamFullscreenModal
        isOpen={showPreExamModal}
        onEnterFullscreen={handleConfirmStartFullscreen}
        driveName="Marketing Executive Recruitment Drive"
        roundName="ROUND 2 — ENGLISH COMMUNICATION & VERBAL ABILITY"
      />
    </div>
  );
}
