import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';
type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  position?: NotificationPosition;
  defaultDuration?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  position = 'top-right',
  defaultDuration = 5000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? defaultDuration,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only the most recent notifications
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove if not persistent
    if (!notification.persistent && newNotification.duration! > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, ...updates } : n)
    );
  };

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    updateNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer position={position} notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  position: NotificationPosition;
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  position,
  notifications,
  onRemove
}) => {
  const getPositionClasses = () => {
    const base = 'fixed z-50 flex flex-col gap-3 p-4 pointer-events-none';
    switch (position) {
      case 'top-right':
        return `${base} top-0 right-0`;
      case 'top-left':
        return `${base} top-0 left-0`;
      case 'bottom-right':
        return `${base} bottom-0 right-0`;
      case 'bottom-left':
        return `${base} bottom-0 left-0`;
      case 'top-center':
        return `${base} top-0 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${base} bottom-0 left-1/2 transform -translate-x-1/2`;
      default:
        return `${base} top-0 right-0`;
    }
  };

  if (notifications.length === 0) return null;

  return createPortal(
    <div className={getPositionClasses()}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>,
    document.body
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <Check className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationClasses = () => {
    const base = `
      pointer-events-auto transform transition-all duration-300 ease-out
      min-w-[320px] max-w-[400px] rounded-xl border shadow-lg backdrop-blur-sm
      ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `;

    switch (notification.type) {
      case 'success':
        return `${base} notification-success`;
      case 'error':
        return `${base} notification-error`;
      case 'warning':
        return `${base} notification-warning`;
      case 'info':
        return `${base} notification-info`;
      default:
        return `${base} bg-card border-border`;
    }
  };

  const getPriorityIndicator = () => {
    if (notification.priority === 'critical') {
      return (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      );
    }
    if (notification.priority === 'high') {
      return (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
      );
    }
    return null;
  };

  return (
    <div className={getNotificationClasses()}>
      {getPriorityIndicator()}
      
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold leading-5">
            {notification.title}
          </h4>
          
          {notification.message && (
            <p className="mt-1 text-sm opacity-90 leading-5">
              {notification.message}
            </p>
          )}
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    if (!notification.persistent) {
                      handleRemove();
                    }
                  }}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                    ${action.style === 'primary' 
                      ? 'bg-white/20 hover:bg-white/30 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {!notification.persistent && (
          <button
            onClick={handleRemove}
            className="flex-shrink-0 p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {!notification.persistent && notification.duration! > 0 && (
        <div className="h-1 bg-white/20 overflow-hidden">
          <div 
            className="h-full bg-white/40 transition-all ease-linear"
            style={{
              animation: `shrink ${notification.duration}ms linear`,
              transformOrigin: 'left'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Utility hooks for common notification patterns
export const useMedicalNotifications = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message?: string) =>
      addNotification({ type: 'success', title, message }),
    
    error: (title: string, message?: string) =>
      addNotification({ type: 'error', title, message, persistent: true }),
    
    warning: (title: string, message?: string) =>
      addNotification({ type: 'warning', title, message }),
    
    info: (title: string, message?: string) =>
      addNotification({ type: 'info', title, message }),
    
    emergencyAlert: (title: string, message?: string, actions?: any[]) =>
      addNotification({
        type: 'error',
        title,
        message,
        priority: 'critical',
        persistent: true,
        actions
      }),
    
    patientUpdate: (patientName: string, status: string) =>
      addNotification({
        type: 'info',
        title: 'Patient Update',
        message: `${patientName}: ${status}`,
        duration: 8000
      }),
    
    diagnosisComplete: (patientName: string, confidence: number) =>
      addNotification({
        type: 'success',
        title: 'Diagnosis Complete',
        message: `Analysis completed for ${patientName} with ${confidence}% confidence`,
        duration: 10000
      }),
    
    systemAlert: (message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') =>
      addNotification({
        type: severity === 'critical' || severity === 'high' ? 'error' : 
              severity === 'medium' ? 'warning' : 'info',
        title: 'System Alert',
        message,
        priority: severity,
        persistent: severity === 'critical'
      })
  };
};

// CSS for the shrink animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
`;
document.head.appendChild(style);
