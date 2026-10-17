import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextProps {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: NotificationType) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map(n => (
          <div key={n.id} className="animate-fade-in" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--surface-color)',
            borderLeft: `4px solid ${n.type === 'success' ? 'var(--success)' : n.type === 'error' ? 'var(--danger)' : 'var(--primary-color)'}`,
            boxShadow: 'var(--shadow-lg)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            minWidth: '300px'
          }}>
            {n.type === 'success' && <CheckCircle size={20} color="var(--success)" />}
            {n.type === 'error' && <AlertCircle size={20} color="var(--danger)" />}
            {n.type === 'info' && <Info size={20} color="var(--primary-color)" />}
            <span style={{ flex: 1, fontWeight: 500, fontSize: '0.95rem' }}>{n.message}</span>
            <button onClick={() => removeNotification(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}
