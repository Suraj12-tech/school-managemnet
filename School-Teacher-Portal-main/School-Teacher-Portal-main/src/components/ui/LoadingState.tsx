

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', padding: '1rem' }}>
      <div className="skeleton-pulse" style={{ height: '40px', width: '30%', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.05)' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="card skeleton-pulse" style={{ height: '200px', backgroundColor: 'rgba(0,0,0,0.03)' }}></div>
        ))}
      </div>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>{message}</div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .skeleton-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
