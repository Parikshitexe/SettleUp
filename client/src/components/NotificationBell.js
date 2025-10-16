import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications?limit=10');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await axios.put(`http://localhost:5000/api/notifications/${notification._id}/read`);
        
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Mark read error:', error);
      }
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('http://localhost:5000/api/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev => {
        const deleted = notifications.find(n => n._id === notificationId);
        return deleted && !deleted.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      friend_request: '👤',
      friend_accepted: '🤝',
      expense_added: '💰',
      settlement_recorded: '✓',
      payment_reminder: '⏰',
      group_created: '👥',
      member_added: '➕'
    };
    return icons[type] || '🔔';
  };

  return (
    <div style={styles.container} ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.bellButton}
        aria-label="Notifications"
      >
        <span style={styles.bell}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <h3 style={styles.title}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={styles.markAllBtn}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div style={styles.notificationsList}>
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    ...styles.notificationItem,
                    ...(notification.read ? {} : styles.notificationItemUnread)
                  }}
                >
                  <span style={styles.icon}>
                    {getNotificationIcon(notification.type)}
                  </span>
                  
                  <div style={styles.content}>
                    <div style={styles.notificationTitle}>
                      {notification.title}
                    </div>
                    <div style={styles.notificationMessage}>
                      {notification.message}
                    </div>
                    <div style={styles.notificationTime}>
                      {new Date(notification.createdAt).toLocaleDateString()} 
                      {' '} 
                      {new Date(notification.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteNotification(e, notification._id)}
                    style={styles.deleteBtn}
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block'
  },
  bellButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    transition: 'transform 0.2s'
  },
  bell: {
    display: 'block'
  },
  badge: {
    position: 'absolute',
    top: '0',
    right: '0',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700'
  },
  dropdown: {
    position: 'absolute',
    top: '110%',
    right: '0',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    width: '400px',
    maxHeight: '500px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideDown 0.2s ease-out'
  },
  dropdownHeader: {
    padding: '16px',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  markAllBtn: {
    background: 'none',
    border: 'none',
    color: '#1cc29f',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  notificationsList: {
    overflowY: 'auto',
    flex: 1
  },
  notificationItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    alignItems: 'flex-start'
  },
  notificationItemUnread: {
    backgroundColor: '#f0f8ff'
  },
  icon: {
    fontSize: '20px',
    marginTop: '2px',
    flexShrink: 0
  },
  content: {
    flex: 1
  },
  notificationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  notificationMessage: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '6px',
    lineHeight: '1.4'
  },
  notificationTime: {
    fontSize: '11px',
    color: '#999'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
    transition: 'color 0.2s'
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default NotificationBell;