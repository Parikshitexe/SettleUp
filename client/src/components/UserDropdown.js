import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function UserDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
    navigate('/login');
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.avatarButton}
        aria-label="User menu"
      >
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.name}
            style={styles.avatarImage}
          />
        ) : (
          <div style={styles.avatarPlaceholder}>
            {getInitials(user?.name)}
          </div>
        )}
        <span style={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <div style={styles.dropdownName}>{user?.name}</div>
            <div style={styles.dropdownEmail}>{user?.email}</div>
          </div>

          <div style={styles.divider}></div>

          <Link
            to="/profile"
            style={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            <span style={styles.itemIcon}>👤</span>
            <span>My Profile</span>
          </Link>

          <Link
            to="/friends"
            style={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            <span style={styles.itemIcon}>👥</span>
            <span>Friends</span>
          </Link>

          <Link
  to="/reminders"
  style={styles.dropdownItem}
  onClick={() => setIsOpen(false)}
>
  <span style={styles.itemIcon}>⏰</span>
  <span>Payment Reminders</span>
</Link>

          <div style={styles.divider}></div>

          <button
            onClick={handleLogout}
            style={{ ...styles.dropdownItem, ...styles.logoutItem }}
          >
            <span style={styles.itemIcon}>🚪</span>
            <span>Logout</span>
          </button>
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
  avatarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '2px solid #e9ecef',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    outline: 'none'
  },
  avatarImage: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#1cc29f',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700'
  },
  chevron: {
    fontSize: '10px',
    color: '#666',
    transition: 'transform 0.3s'
  },
  dropdown: {
    position: 'absolute',
    top: '110%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '220px',
    zIndex: 1000,
    animation: 'slideDown 0.2s ease-out'
  },
  dropdownHeader: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0'
  },
  dropdownName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  dropdownEmail: {
    fontSize: '13px',
    color: '#666',
    wordBreak: 'break-all'
  },
  divider: {
    height: '1px',
    backgroundColor: '#f0f0f0',
    margin: '8px 0'
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    width: '100%',
    textAlign: 'left',
    textDecoration: 'none',
    color: '#333',
    fontSize: '14px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderRadius: '4px'
  },
  itemIcon: {
    fontSize: '18px',
    width: '20px',
    textAlign: 'center'
  },
  logoutItem: {
    color: '#dc3545',
    marginTop: '4px'
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
  
  button[aria-label="User menu"]:hover {
    border-color: #1cc29f;
    background-color: #f8f9fa;
  }
  
  .dropdown-item:hover {
    background-color: #f8f9fa !important;
  }
`;
document.head.appendChild(styleSheet);

export default UserDropdown;