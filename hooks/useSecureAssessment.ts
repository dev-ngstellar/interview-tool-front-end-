'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { assessmentService } from '@/services/api/assessmentService';

export interface UseSecureAssessmentOptions {
  enabled: boolean;
  attemptId: string | null;
  initialViolations?: number;
  onAutoSubmit: (reason: string) => Promise<void> | void;
}

export interface SecureAssessmentState {
  isFullscreen: boolean;
  violationCount: number;
  maxViolations: number;
  // Modal states
  showFullscreenRequiredModal: boolean;
  showSecurityWarningModal: boolean;
  showAutoSubmitModal: boolean;
  showNavigationWarningModal: boolean;
  warningDetails: {
    title: string;
    message: string;
    type: 'FULLSCREEN_EXIT' | 'TAB_SWITCH' | 'WINDOW_BLUR' | 'NAVIGATION_ATTEMPT' | 'GENERAL';
    violationNumber: number;
  } | null;
  // Actions
  requestFullscreen: () => Promise<boolean>;
  dismissSecurityWarning: () => void;
  stayInAssessment: () => void;
  leaveAssessment: () => void;
}

export function useSecureAssessment({
  enabled,
  attemptId,
  initialViolations = 0,
  onAutoSubmit,
}: UseSecureAssessmentOptions): SecureAssessmentState {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(initialViolations);
  const maxViolations = 3;

  // Modals
  const [showFullscreenRequiredModal, setShowFullscreenRequiredModal] = useState(false);
  const [showSecurityWarningModal, setShowSecurityWarningModal] = useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
  const [showNavigationWarningModal, setShowNavigationWarningModal] = useState(false);
  const [warningDetails, setWarningDetails] = useState<{
    title: string;
    message: string;
    type: 'FULLSCREEN_EXIT' | 'TAB_SWITCH' | 'WINDOW_BLUR' | 'NAVIGATION_ATTEMPT' | 'GENERAL';
    violationNumber: number;
  } | null>(null);

  // Sync refs
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const attemptIdRef = useRef(attemptId);
  attemptIdRef.current = attemptId;

  const violationCountRef = useRef(violationCount);
  violationCountRef.current = violationCount;

  const onAutoSubmitRef = useRef(onAutoSubmit);
  onAutoSubmitRef.current = onAutoSubmit;

  const isAutoSubmittingRef = useRef(false);
  const lastBlurTimeRef = useRef<number>(0);
  const lastVisibilityEventTimeRef = useRef<number>(0);
  const lastLoggedEventRef = useRef<{ type: string; timestamp: number } | null>(null);

  // Sync initial violations from server on attempt restore
  useEffect(() => {
    if (initialViolations > 0) {
      setViolationCount((prev) => Math.max(prev, initialViolations));
    }
  }, [initialViolations]);

  // Request browser fullscreen
  const requestFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      }
      setIsFullscreen(true);
      setShowFullscreenRequiredModal(false);
      return true;
    } catch (err) {
      console.warn('[SecureExam] Fullscreen request was declined or blocked by browser policy:', err);
      return false;
    }
  }, []);

  // Safe server logging helper with deduplication
  const logEventToServer = useCallback(
    async (
      eventType:
        | 'FULLSCREEN_EXIT'
        | 'TAB_SWITCH'
        | 'WINDOW_BLUR'
        | 'NAVIGATION_ATTEMPT'
        | 'COPY_ATTEMPT'
        | 'PASTE_ATTEMPT'
        | 'CONTEXT_MENU_ATTEMPT'
        | 'SHORTCUT_ATTEMPT',
      metadata?: any,
    ) => {
      const activeId = attemptIdRef.current;
      if (!enabledRef.current || !activeId) return;

      const now = Date.now();
      // Deduplicate identical event types within 1.5 seconds to prevent browser double-firing
      if (
        lastLoggedEventRef.current &&
        lastLoggedEventRef.current.type === eventType &&
        now - lastLoggedEventRef.current.timestamp < 1500
      ) {
        return;
      }
      lastLoggedEventRef.current = { type: eventType, timestamp: now };

      try {
        const res = await assessmentService.logSecurityEvent(activeId, eventType, metadata);
        if (typeof res.violationCount === 'number') {
          setViolationCount(res.violationCount);
          violationCountRef.current = res.violationCount;
        }

        if (res.shouldAutoSubmit || (res.violationCount && res.violationCount >= maxViolations)) {
          if (!isAutoSubmittingRef.current) {
            isAutoSubmittingRef.current = true;
            setShowAutoSubmitModal(true);
            setShowFullscreenRequiredModal(false);
            setShowSecurityWarningModal(false);
            setShowNavigationWarningModal(false);
            setTimeout(() => {
              onAutoSubmitRef.current('MULTIPLE_VIOLATIONS');
            }, 1800);
          }
        }
      } catch (err) {
        console.error(`[SecureExam] Failed to log security event ${eventType}:`, err);
      }
    },
    [],
  );

  // Dismiss regular warning
  const dismissSecurityWarning = useCallback(() => {
    setShowSecurityWarningModal(false);
    setWarningDetails(null);
  }, []);

  // Navigation prompt handlers
  const stayInAssessment = useCallback(() => {
    setShowNavigationWarningModal(false);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
    }
  }, []);

  const leaveAssessment = useCallback(() => {
    setShowNavigationWarningModal(false);
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', () => {});
      window.history.back();
    }
  }, []);

  // 1. Fullscreen Monitoring
  useEffect(() => {
    if (!enabled) {
      setShowFullscreenRequiredModal(false);
      return;
    }

    const checkFullscreenState = () => {
      const activeElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      const isFs = Boolean(activeElement);
      setIsFullscreen(isFs);

      if (!isFs && enabledRef.current && !isAutoSubmittingRef.current) {
        // Candidate exited fullscreen while assessment is IN_PROGRESS
        setShowFullscreenRequiredModal(true);
        const nextCount = violationCountRef.current + 1;
        setWarningDetails({
          title: 'Assessment Fullscreen Required',
          message:
            nextCount >= maxViolations
              ? 'Assessment submitted: secure examination environment was exited multiple times.'
              : 'Please return to fullscreen mode to continue your assessment. The server countdown timer continues running.',
          type: 'FULLSCREEN_EXIT',
          violationNumber: nextCount,
        });
        logEventToServer('FULLSCREEN_EXIT', {
          screenW: typeof window !== 'undefined' ? window.innerWidth : null,
          screenH: typeof window !== 'undefined' ? window.innerHeight : null,
        });
      } else if (isFs) {
        setShowFullscreenRequiredModal(false);
      }
    };

    document.addEventListener('fullscreenchange', checkFullscreenState);
    document.addEventListener('webkitfullscreenchange', checkFullscreenState);
    document.addEventListener('mozfullscreenchange', checkFullscreenState);
    document.addEventListener('MSFullscreenChange', checkFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreenState);
      document.removeEventListener('webkitfullscreenchange', checkFullscreenState);
      document.removeEventListener('mozfullscreenchange', checkFullscreenState);
      document.removeEventListener('MSFullscreenChange', checkFullscreenState);
    };
  }, [enabled, logEventToServer]);

  // 2. Tab Switching (Page Visibility API) & Window Blur
  useEffect(() => {
    if (!enabled) {
      setShowSecurityWarningModal(false);
      return;
    }

    const handleVisibilityChange = () => {
      if (!enabledRef.current || isAutoSubmittingRef.current) return;
      lastVisibilityEventTimeRef.current = Date.now();

      if (document.hidden) {
        // User switched tab or minimized browser
        const nextCount = violationCountRef.current + 1;
        logEventToServer('TAB_SWITCH', { visibilityState: document.visibilityState });
        setWarningDetails({
          title: 'Assessment Security Warning',
          message:
            nextCount >= 2
              ? 'Warning: You left the assessment window again. A 3rd violation will automatically submit your assessment.'
              : 'You left the assessment window. Please remain on the assessment page until the assessment is completed.',
          type: 'TAB_SWITCH',
          violationNumber: nextCount,
        });
      } else {
        // Candidate returned back to the assessment tab
        setShowSecurityWarningModal(true);
      }
    };

    const handleWindowBlur = () => {
      if (!enabledRef.current || isAutoSubmittingRef.current) return;
      const now = Date.now();
      lastBlurTimeRef.current = now;

      // If document.hidden already triggered or will trigger tab switch, avoid duplicate strike within 400ms
      if (now - lastVisibilityEventTimeRef.current < 400) return;

      setTimeout(() => {
        if (!enabledRef.current || isAutoSubmittingRef.current) return;
        // Check if tab switch handled it
        if (Date.now() - lastVisibilityEventTimeRef.current < 600) return;

        const nextCount = violationCountRef.current + 1;
        logEventToServer('WINDOW_BLUR', { focusLostAt: new Date().toISOString() });
        setWarningDetails({
          title: 'Assessment Window Focus Lost',
          message:
            nextCount >= 2
              ? 'Strong Warning: The assessment window lost focus. Repeated focus loss will result in automatic submission.'
              : 'The assessment window lost focus. Please stay focused on the assessment screen.',
          type: 'WINDOW_BLUR',
          violationNumber: nextCount,
        });
      }, 250);
    };

    const handleWindowFocus = () => {
      if (!enabledRef.current || isAutoSubmittingRef.current) return;
      // When focus returns, if a warning was recorded, display modal
      if (warningDetails || violationCountRef.current > 0) {
        setShowSecurityWarningModal(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enabled, logEventToServer, warningDetails]);

  // 3. Keyboard Shortcuts, Context Menu, Copy/Paste & Drag Prevention
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : '';
      const keyCode = e.keyCode || e.which;

      // F12 (Developer Tools)
      if (e.key === 'F12' || keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        logEventToServer('SHORTCUT_ATTEMPT', { shortcut: 'F12' });
        return;
      }

      // Ctrl/Cmd + Shift + I / J / C (Dev tools inspect/console)
      if (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        logEventToServer('SHORTCUT_ATTEMPT', { shortcut: `Ctrl+Shift+${key.toUpperCase()}` });
        return;
      }

      // Ctrl/Cmd + C (Copy), V (Paste), X (Cut), A (Select All), P (Print), S (Save), U (View Source), F (Find)
      if (
        isCtrlOrMeta &&
        ['c', 'v', 'x', 'a', 'p', 's', 'u', 'f'].includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();

        if (key === 'c') logEventToServer('COPY_ATTEMPT');
        else if (key === 'v') logEventToServer('PASTE_ATTEMPT');
        else logEventToServer('SHORTCUT_ATTEMPT', { shortcut: `Ctrl+${key.toUpperCase()}` });
        return;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!enabledRef.current) return;
      e.preventDefault();
      logEventToServer('CONTEXT_MENU_ATTEMPT');
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (!enabledRef.current) return;
      e.preventDefault();
      logEventToServer('COPY_ATTEMPT');
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (!enabledRef.current) return;
      e.preventDefault();
      logEventToServer('PASTE_ATTEMPT');
    };

    const handleDragStart = (e: DragEvent) => {
      if (!enabledRef.current) return;
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('copy', handleCopy, { capture: true });
    document.addEventListener('paste', handlePaste, { capture: true });
    document.addEventListener('dragstart', handleDragStart, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('copy', handleCopy, { capture: true });
      document.removeEventListener('paste', handlePaste, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
    };
  }, [enabled, logEventToServer]);

  // 4. Navigation & BeforeUnload Protection
  useEffect(() => {
    if (!enabled) {
      setShowNavigationWarningModal(false);
      return;
    }

    // Set initial history trap state
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!enabledRef.current || isAutoSubmittingRef.current) return;
      e.preventDefault();
      e.returnValue = 'Assessment in Progress. Leaving this page will interrupt your assessment.';
      return e.returnValue;
    };

    const handlePopState = (e: PopStateEvent) => {
      if (!enabledRef.current || isAutoSubmittingRef.current) return;
      // Re-push state to trap back button
      window.history.pushState(null, '', window.location.href);
      setShowNavigationWarningModal(true);
      logEventToServer('NAVIGATION_ATTEMPT');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, logEventToServer]);

  return {
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
  };
}
