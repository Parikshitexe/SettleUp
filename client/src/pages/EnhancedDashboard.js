import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import UserDropdown from '../components/UserDropdown';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';

function EnhancedDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalExpenses: 0,
    totalSettlements: 0,
    groupCount: 0,
    friendsCount: 0,
    owedByFriends: 0,
    oweToFriends: 0
  });
  
  const [friendBalances, setFriendBalances] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch groups
      const groupsRes = await axios.get('http://localhost:5000/api/groups');
      const groupsData = groupsRes.data;
      setGroups(groupsData);

      // Fetch all expenses and settlements across all groups
      const allExpenses = [];
      const allSettlements = [];

      for (const group of groupsData) {
        try {
          const expRes = await axios.get(`http://localhost:5000/api/expenses/group/${group._id}`);
          allExpenses.push(...expRes.data);
        } catch (err) {
          console.error(`Failed to fetch expenses for group ${group._id}`);
        }

        try {
          const settRes = await axios.get(`http://localhost:5000/api/settlements/group/${group._id}`);
          allSettlements.push(...settRes.data);
        } catch (err) {
          console.error(`Failed to fetch settlements for group ${group._id}`);
        }
      }

      // Fetch friends and balances
      let friendsData = [];
      let friendBalancesData = [];

      try {
        const friendsRes = await axios.get('http://localhost:5000/api/friends');
        friendsData = friendsRes.data;
      } catch (err) {
        console.error('Failed to fetch friends');
      }

      try {
        const balancesRes = await axios.get('http://localhost:5000/api/friends/balances');
        friendBalancesData = balancesRes.data;
      } catch (err) {
        console.error('Failed to fetch friend balances');
      }

      setFriendBalances(friendBalancesData);

      // Calculate stats
      const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalSettlements = allSettlements.reduce((sum, sett) => sum + sett.amount, 0);
      
      let totalBalance = 0;
      let owedByFriends = 0;
      let oweToFriends = 0;

      friendBalancesData.forEach(balance => {
        if (balance.balance > 0) {
          owedByFriends += balance.balance;
        } else {
          oweToFriends += Math.abs(balance.balance);
        }
        totalBalance += balance.balance;
      });

      setStats({
        totalBalance: parseFloat(totalBalance.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalSettlements: parseFloat(totalSettlements.toFixed(2)),
        groupCount: groupsData.length,
        friendsCount: friendsData.length,
        owedByFriends: parseFloat(owedByFriends.toFixed(2)),
        oweToFriends: parseFloat(oweToFriends.toFixed(2))
      });

      // Create activity feed
      const activities = [];

      allExpenses.forEach(exp => {
        activities.push({
          type: 'expense',
          icon: '💰',
          title: exp.description,
          description: `${exp.paidBy.name} paid ₹${exp.amount.toFixed(2)}`,
          date: new Date(exp.date),
          group: exp.groupId
        });
      });

      allSettlements.forEach(sett => {
        activities.push({
          type: 'settlement',
          icon: '✓',
          title: 'Settlement',
          description: `${sett.paidBy.name} paid ${sett.paidTo.name} ₹${sett.amount.toFixed(2)}`,
          date: new Date(sett.date),
          group: sett.groupId
        });
      });

      activities.sort((a, b) => b.date - a.date);
      setRecentActivity(activities.slice(0, 8));

      setLoading(false);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      setLoading(false);
    }
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return '#28a745';
    if (balance < 0) return '#dc3545';
    return '#6c757d';
  };

  const getBalanceText = (balance) => {
    if (balance > 0) return `You are owed ₹${balance.toFixed(2)}`;
    if (balance < 0) return `You owe ₹${Math.abs(balance).toFixed(2)}`;
    return 'Settled up';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>SettleUp</h1>
        <div style={styles.headerRight}>
          <NotificationBell />
          <UserDropdown user={user} onLogout={logout} />
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h2 style={styles.greeting}>Welcome back, {user?.name}!</h2>
          <p style={styles.subtitle}>Here's your expense summary at a glance</p>
        </div>

        {/* Main Stats Grid */}
        <div style={styles.statsGrid}>
          {/* Total Balance Card */}
          <div style={styles.mainStatCard}>
            <div style={styles.statLabel}>Your Overall Balance</div>
            <div 
              style={{
                ...styles.mainStatValue,
                color: getBalanceColor(stats.totalBalance)
              }}
            >
              ₹{Math.abs(stats.totalBalance).toFixed(2)}
            </div>
            <div style={styles.mainStatSubtext}>
              {getBalanceText(stats.totalBalance)}
            </div>
            <div style={styles.balanceBreakdown}>
              <div style={styles.breakdownItem}>
                <span style={styles.breakdownLabel}>You're owed:</span>
                <span style={styles.breakdownValue}>₹{stats.owedByFriends.toFixed(2)}</span>
              </div>
              <div style={styles.breakdownItem}>
                <span style={styles.breakdownLabel}>You owe:</span>
                <span style={styles.breakdownValue}>₹{stats.oweToFriends.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={styles.quickStatsGroup}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💵</div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Total Expenses</div>
                <div style={styles.statValue}>₹{stats.totalExpenses.toFixed(2)}</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>✓</div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Settled</div>
                <div style={styles.statValue}>₹{stats.totalSettlements.toFixed(2)}</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Groups</div>
                <div style={styles.statValue}>{stats.groupCount}</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>🤝</div>
              <div style={styles.statContent}>
                <div style={styles.statLabel}>Friends</div>
                <div style={styles.statValue}>{stats.friendsCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <Link to="/groups/create" style={styles.actionBtn}>
            + Create Group
          </Link>
          <Link to="/friends" style={styles.actionBtn}>
            👥 Manage Friends
          </Link>
          <Link to="/reminders" style={styles.actionBtn}>
            ⏰ Payment Reminders
          </Link>
        </div>

        {/* Friends with Balances Section */}
        {friendBalances.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Friends with Outstanding Balances</h3>
              <Link to="/friends" style={styles.viewAllLink}>View All →</Link>
            </div>

            <div style={styles.friendBalancesGrid}>
              {friendBalances.slice(0, 6).map((friend, idx) => (
                <div key={idx} style={styles.friendBalanceCard}>
                  <div style={styles.friendName}>{friend.name}</div>
                  <div 
                    style={{
                      ...styles.balanceAmount,
                      color: getBalanceColor(friend.balance)
                    }}
                  >
                    ₹{Math.abs(friend.balance).toFixed(2)}
                  </div>
                  <div style={styles.balanceStatus}>
                    {friend.balance > 0 ? 'They owe you' : friend.balance < 0 ? 'You owe them' : 'Settled'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups Section */}
        {groups.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Your Groups</h3>
              
            </div>

            <div style={styles.groupsGrid}>
              {groups.slice(0, 6).map(group => (
                <Link key={group._id} to={`/groups/${group._id}`} style={styles.groupCardLink}>
                  <div style={styles.groupCardDash}>
                    <h4 style={styles.groupCardTitle}>{group.name}</h4>
                    <p style={styles.groupCardMembers}>
                      👥 {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </p>
                    {group.description && (
                      <p style={styles.groupCardDesc}>{group.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        {recentActivity.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Recent Activity</h3>
            <div style={styles.activityList}>
              {recentActivity.map((activity, idx) => (
                <div key={idx} style={styles.activityItem}>
                  <div style={styles.activityIcon}>{activity.icon}</div>
                  <div style={styles.activityContent}>
                    <div style={styles.activityTitle}>{activity.title}</div>
                    <div style={styles.activityDesc}>{activity.description}</div>
                  </div>
                  <div style={styles.activityDate}>
                    {activity.date.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {groups.length === 0 && friendBalances.length === 0 && (
          <div style={styles.emptyState}>
            <h3>Get Started!</h3>
            <p>Create your first group or add friends to start splitting expenses</p>
            <Link to="/groups/create" style={styles.emptyActionBtn}>
              Create First Group
            </Link>
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
    maxWidth: '1400px',
    margin: '0 auto'
  },
  welcomeSection: {
    marginBottom: '32px'
  },
  greeting: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: '700',
    color: '#333'
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    color: '#666'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '32px'
  },
  mainStatCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderLeft: '6px solid #1cc29f'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
    marginBottom: '12px'
  },
  mainStatValue: {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '12px'
  },
  mainStatSubtext: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '600',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee'
  },
  balanceBreakdown: {
    display: 'flex',
    gap: '20px'
  },
  breakdownItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  breakdownLabel: {
    fontSize: '13px',
    color: '#999',
    marginBottom: '6px'
  },
  breakdownValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#333'
  },
  quickStatsGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIcon: {
    fontSize: '32px'
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333'
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap'
  },
  actionBtn: {
    padding: '12px 24px',
    backgroundColor: '#1cc29f',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  section: {
    backgroundColor: 'white',
    padding: '28px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#333'
  },
  viewAllLink: {
    color: '#1cc29f',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600'
  },
  friendBalancesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px'
  },
  friendBalanceCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    textAlign: 'center'
  },
  friendName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px'
  },
  balanceAmount: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  balanceStatus: {
    fontSize: '13px',
    color: '#666'
  },
  groupsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  groupCardLink: {
    textDecoration: 'none'
  },
  groupCardDash: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  groupCardTitle: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  groupCardMembers: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#666'
  },
  groupCardDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#999',
    lineHeight: '1.4'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    borderLeft: '3px solid #1cc29f'
  },
  activityIcon: {
    fontSize: '24px'
  },
  activityContent: {
    flex: 1
  },
  activityTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  activityDesc: {
    fontSize: '13px',
    color: '#666'
  },
  activityDate: {
    fontSize: '12px',
    color: '#999'
  },
  emptyState: {
    backgroundColor: 'white',
    padding: '60px 40px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptyActionBtn: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '12px 32px',
    backgroundColor: '#1cc29f',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600'
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

if (window.innerWidth <= 1024) {
  styles.statsGrid = {
    ...styles.statsGrid,
    gridTemplateColumns: '1fr'
  };
  styles.quickStatsGroup = {
    ...styles.quickStatsGroup,
    gridTemplateColumns: 'repeat(2, 1fr)'
  };
}

if (window.innerWidth <= 768) {
  styles.content = {
    ...styles.content,
    padding: '20px'
  };
  styles.quickStatsGroup = {
    ...styles.quickStatsGroup,
    gridTemplateColumns: '1fr'
  };
  styles.actionButtons = {
    ...styles.actionButtons,
    flexDirection: 'column'
  };
}

export default EnhancedDashboard;