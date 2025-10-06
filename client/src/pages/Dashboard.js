import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/groups');
      setGroups(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch groups error:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading groups...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>SettleUp</h1>
        <div style={styles.userSection}>
          <span style={styles.userName}>👋 {user?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitle}>Your Groups</h2>
          <Link to="/groups/create" style={styles.createBtn}>
            + Create Group
          </Link>
        </div>

        {groups.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No groups yet</h3>
            <p style={styles.emptyText}>
              Create your first group to start splitting expenses with friends!
            </p>
            <Link to="/groups/create" style={styles.createBtnLarge}>
              Create Your First Group
            </Link>
          </div>
        ) : (
          <div style={styles.groupsGrid}>
            {groups.map(group => (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                style={styles.groupCard}
              >
                <div style={styles.groupHeader}>
                  <h3 style={styles.groupName}>{group.name}</h3>
                  {group.createdBy._id === user?.id && (
                    <span style={styles.adminBadge}>ADMIN</span>
                  )}
                </div>
                {group.description && (
                  <p style={styles.groupDescription}>{group.description}</p>
                )}
                <div style={styles.groupFooter}>
                  <span style={styles.memberCount}>
                    👥 {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </span>
                  <span style={styles.createdDate}>
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
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
    color: '#1cc29f',
    fontWeight: '700'
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
    fontWeight: '500',
    transition: 'background-color 0.3s'
  },
  content: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '28px',
    color: '#333'
  },
  createBtn: {
    padding: '12px 24px',
    backgroundColor: '#1cc29f',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'background-color 0.3s'
  },
  emptyState: {
    backgroundColor: 'white',
    padding: '60px 40px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptyText: {
    color: '#666',
    fontSize: '16px',
    marginBottom: '30px'
  },
  createBtnLarge: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#1cc29f',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600'
  },
  groupsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  groupCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    display: 'block'
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  groupName: {
    margin: 0,
    fontSize: '20px',
    color: '#333',
    fontWeight: '600'
  },
  adminBadge: {
    fontSize: '10px',
    backgroundColor: '#1cc29f',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: '600'
  },
  groupDescription: {
    color: '#666',
    fontSize: '14px',
    margin: '0 0 16px 0',
    lineHeight: '1.5'
  },
  groupFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #eee',
    fontSize: '14px'
  },
  memberCount: {
    color: '#666',
    fontWeight: '500'
  },
  createdDate: {
    color: '#999',
    fontSize: '12px'
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

export default Dashboard;