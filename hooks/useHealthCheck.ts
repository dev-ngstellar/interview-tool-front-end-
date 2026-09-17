'use client';

import { useState, useEffect, useCallback } from 'react';
import { HealthService } from '@/services/api/healthService';
import { HealthStatus, ApiError } from '@/types/api';

export type HealthCheckState = {
  status: 'idle' | 'checking' | 'healthy' | 'unhealthy';
  data: HealthStatus | null;
  error: string | null;
  latencyMs: number | null;
  lastCheckedAt: Date | null;
};

export function useHealthCheck(autoCheck = true) {
  const [state, setState] = useState<HealthCheckState>({
    status: 'idle',
    data: null,
    error: null,
    latencyMs: null,
    lastCheckedAt: null,
  });

  const checkHealth = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'checking', error: null }));
    const startTime = performance.now();

    try {
      const result = await HealthService.getHealth();
      const latencyMs = Math.round(performance.now() - startTime);

      if (result && result.status === 'ok') {
        setState({
          status: 'healthy',
          data: result,
          error: null,
          latencyMs,
          lastCheckedAt: new Date(),
        });
      } else {
        setState({
          status: 'unhealthy',
          data: result,
          error: `Unexpected backend response status: ${result?.status}`,
          latencyMs,
          lastCheckedAt: new Date(),
        });
      }
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const apiErr = err as ApiError;
      setState({
        status: 'unhealthy',
        data: null,
        error:
          apiErr?.message ||
          'Failed to reach backend API. Ensure backend server is running on port 4000.',
        latencyMs,
        lastCheckedAt: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    if (autoCheck) {
      checkHealth();
    }
  }, [autoCheck, checkHealth]);

  return { ...state, refetch: checkHealth };
}
