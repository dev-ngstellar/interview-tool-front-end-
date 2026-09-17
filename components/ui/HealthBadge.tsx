'use client';

import { useHealthCheck } from '@/hooks/useHealthCheck';
import { Activity, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function HealthBadge() {
  const { status, data, error, latencyMs, refetch } = useHealthCheck(true);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              status === 'healthy'
                ? 'var(--status-success-bg)'
                : status === 'checking'
                ? 'rgba(99, 102, 241, 0.15)'
                : 'var(--status-error-bg)',
            color:
              status === 'healthy'
                ? 'var(--status-success)'
                : status === 'checking'
                ? 'var(--accent-primary)'
                : 'var(--status-error)',
          }}
        >
          {status === 'healthy' && <CheckCircle2 size={18} />}
          {status === 'checking' && (
            <Activity
              size={18}
              style={{ animation: 'spin 1.5s linear infinite' }}
            />
          )}
          {status === 'unhealthy' && <AlertCircle size={18} />}
          {status === 'idle' && <Activity size={18} />}
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <span>Backend Integration (GET /api/health):</span>
            {status === 'healthy' && (
              <span className="badge badge-success">
                <span className="pulse-dot" />
                Connected ({data?.status})
              </span>
            )}
            {status === 'checking' && (
              <span className="badge badge-warning">Checking...</span>
            )}
            {status === 'unhealthy' && (
              <span className="badge badge-error">Offline / Disconnected</span>
            )}
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginTop: '0.2rem',
            }}
          >
            {status === 'healthy' && latencyMs !== null && (
              <span>Latency: {latencyMs}ms | Target: http://localhost:4000/api/health</span>
            )}
            {status === 'unhealthy' && error && <span>Error: {error}</span>}
            {status === 'checking' && <span>Verifying REST API handshake...</span>}
          </div>
        </div>
      </div>

      <button
        onClick={() => refetch()}
        disabled={status === 'checking'}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          cursor: status === 'checking' ? 'not-allowed' : 'pointer',
        }}
      >
        <RefreshCw
          size={14}
          style={{
            animation: status === 'checking' ? 'spin 1s linear infinite' : 'none',
          }}
        />
        <span>Verify Connection</span>
      </button>
    </div>
  );
}
