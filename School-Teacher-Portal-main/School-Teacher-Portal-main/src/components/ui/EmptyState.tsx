import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      backgroundColor: 'var(--bg-color)',
      borderRadius: 'var(--radius-lg)',
      border: '2px dashed var(--border-color)'
    }}>
      {icon && (
        <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p style={{ color: 'var(--text-secondary)', marginBottom: action ? '1.5rem' : 0, maxWidth: '400px' }}>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
