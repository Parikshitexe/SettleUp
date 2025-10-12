import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'info':
        return '#17a2b8';
      default:
        return '#28a745';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      default:
        return '✓';
    }
  };

  return (
    <div style={{
      ...styles.toast,
      backgroundColor: getBackgroundColor()
    }}>
      <span style={styles.icon}>{getIcon()}</span>
      <span style={styles.message}>{message}</span>
      <button onClick={onClose} style={styles.closeBtn}>✕</button>
    </div>
  );
}

const styles = {
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '8px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out',
    minWidth: '300px',
    maxWidth: '500px'
  },
  icon: {
    fontSize: '20px',
    fontWeight: '700'
  },
  message: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '500'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1
  }
};

export default Toast;