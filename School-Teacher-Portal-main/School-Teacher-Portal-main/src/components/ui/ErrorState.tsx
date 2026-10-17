import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface ErrorStateProps {
  message?: string;
  action?: ReactNode;
}

export function ErrorState({ message = 'An unexpected error occurred.', action }: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.05)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    }}>
      <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>Error Loading Data</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: action ? '1.5rem' : 0 }}>{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
