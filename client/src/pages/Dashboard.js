import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>SettleUp Dashboard</h1>
        <div style={styles.userSection}>
          <span style={styles.userName}>👋 {user?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.welcomeCard}>
          <h2>Welcome to SettleUp! 🎉</h2>
          <p style={styles.welcomeText}>
            Your authentication is working perfectly! You're now logged in as <strong>{user?.email}</strong>
          </p>
          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>What's Next?</h3>
            <ul style={styles.list}>
              <li>✅ Day 2 Complete - Authentication System Working!</li>
              <li>⏳ Day 3 - We'll build Groups feature</li>
              <li>⏳ Day 4 - We'll add Expenses functionality</li>
              <li>⏳ Week 2 - Advanced features and balance calculations</li>
            </ul>
          </div>
          <p style={styles.motivationText}>
            🚀 You're making great progress! Keep going!
          </p>
        </div>
      </div>
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
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#1cc29f'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  userName: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '8px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  content: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  welcomeCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  welcomeText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px'
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  infoTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
    color: '#333'
  },
  list: {
    margin: 0,
    paddingLeft: '20px'
  },
  motivationText: {
    fontSize: '16px',
    color: '#1cc29f',
    fontWeight: '600',
    margin: 0
  }
};

export default Dashboard;