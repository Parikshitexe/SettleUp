import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import UserDropdown from '../components/UserDropdown';
import NotificationBell from '../components/NotificationBell';
import BudgetSettings from '../components/BudgetSettings';
import Toast from '../components/Toast';

function Profile() {
  const { user, updateProfile, changePassword, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    
    if (!profileForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (profileForm.phone && !/^[6-9]\d{9}$/.test(profileForm.phone)) {
      newErrors.phone = 'Invalid phone number (10 digits starting with 6-9)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfile()) return;
    
    setLoading(true);
    const result = await updateProfile(profileForm);
    setLoading(false);

    if (result.success) {
      showToast('Profile updated successfully!');
    } else {
      showToast(result.error, 'error');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setLoading(true);
    const result = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
    setLoading(false);

    if (result.success) {
      showToast('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      showToast(result.error, 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>SettleUp</h1>
        <div style={styles.headerRight}>
          <NotificationBell />
          <UserDropdown user={user} onLogout={logout} />
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.backLink}>
          <Link to="/dashboard" style={styles.link}>
            ← Back to Dashboard
          </Link>
        </div>

        <div style={styles.profileLayout}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.avatarSection}>
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {getInitials(user?.name)}
                </div>
              )}
              <h3 style={styles.userName}>{user?.name}</h3>
              <p style={styles.userEmail}>{user?.email}</p>
            </div>

            <div style={styles.statsCard}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Member Since</span>
                <span style={styles.statValue}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            {/* Tabs */}
            <div style={styles.tabs}>
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'profile' ? styles.tabActive : {})
                }}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('security')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'security' ? styles.tabActive : {})
                }}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('budget')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'budget' ? styles.tabActive : {})
                }}
              >
                Budget
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Edit Profile</h3>
                <form onSubmit={handleProfileSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      style={{
                        ...styles.input,
                        ...(errors.name ? styles.inputError : {})
                      }}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <span style={styles.errorText}>{errors.name}</span>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      style={{
                        ...styles.input,
                        ...(errors.email ? styles.inputError : {})
                      }}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <span style={styles.errorText}>{errors.email}</span>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone (Optional)</label>
                    <input
                      type="text"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      style={{
                        ...styles.input,
                        ...(errors.phone ? styles.inputError : {})
                      }}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                    />
                    {errors.phone && (
                      <span style={styles.errorText}>{errors.phone}</span>
                    )}
                    <small style={styles.helpText}>
                      Format: 10 digits starting with 6-9
                    </small>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      ...styles.submitBtn,
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Change Password</h3>
                <form onSubmit={handlePasswordSubmit}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Current Password *</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      style={{
                        ...styles.input,
                        ...(errors.currentPassword ? styles.inputError : {})
                      }}
                      placeholder="Enter current password"
                    />
                    {errors.currentPassword && (
                      <span style={styles.errorText}>{errors.currentPassword}</span>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password *</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      style={{
                        ...styles.input,
                        ...(errors.newPassword ? styles.inputError : {})
                      }}
                      placeholder="Enter new password"
                    />
                    {errors.newPassword && (
                      <span style={styles.errorText}>{errors.newPassword}</span>
                    )}
                    <small style={styles.helpText}>
                      Minimum 6 characters
                    </small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm New Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      style={{
                        ...styles.input,
                        ...(errors.confirmPassword ? styles.inputError : {})
                      }}
                      placeholder="Confirm new password"
                    />
                    {errors.confirmPassword && (
                      <span style={styles.errorText}>{errors.confirmPassword}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      ...styles.submitBtn,
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Budget Tab */}
            {activeTab === 'budget' && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Personal Monthly Budget</h3>
                <p style={styles.subtitle}>Set a monthly spending limit for yourself across all groups</p>
                <BudgetSettings type="personal" />
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#1cc29f',
    fontWeight: '700'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  content: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  backLink: {
    marginBottom: '20px'
  },
  link: {
    color: '#1cc29f',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500'
  },
  profileLayout: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '24px'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  avatarSection: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '16px'
  },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#1cc29f',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: '700',
    margin: '0 auto 16px'
  },
  userName: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#333'
  },
  userEmail: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
    wordBreak: 'break-all'
  },
  statsCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500'
  },
  statValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid #e9ecef',
    backgroundColor: 'white',
    padding: '16px 24px 0',
    borderRadius: '8px 8px 0 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.3s',
    marginBottom: '-2px'
  },
  tabActive: {
    color: '#1cc29f',
    borderBottomColor: '#1cc29f',
    fontWeight: '600'
  },
  card: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '0 0 8px 8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#333'
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#666'
  },
  formGroup: {
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s',
    outline: 'none'
  },
  inputError: {
    borderColor: '#dc3545'
  },
  errorText: {
    display: 'block',
    marginTop: '6px',
    fontSize: '13px',
    color: '#dc3545'
  },
  helpText: {
    display: 'block',
    marginTop: '6px',
    fontSize: '13px',
    color: '#666'
  },
  submitBtn: {
    padding: '14px 32px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #1cc29f',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

if (window.innerWidth <= 768) {
  styles.profileLayout = {
    ...styles.profileLayout,
    gridTemplateColumns: '1fr'
  };
  styles.content = {
    ...styles.content,
    padding: '20px'
  };
}

export default Profile;