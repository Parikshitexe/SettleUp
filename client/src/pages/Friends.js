import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import UserDropdown from '../components/UserDropdown';
import Toast from '../components/Toast';

function Friends() {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('all');
  const [friends, setFriends] = useState([]);
  const [friendBalances, setFriendBalances] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [friendsRes, balancesRes, requestsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/friends'),
        axios.get('http://localhost:5000/api/friends/balances'),
        axios.get('http://localhost:5000/api/friends/requests')
      ]);

      setFriends(friendsRes.data);
      setFriendBalances(balancesRes.data);
      setRequests(requestsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch friends error:', error);
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) {
      showToast('Please enter at least 2 characters', 'error');
      return;
    }

    setSearching(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/user/search?query=${searchQuery}`);
      setSearchResults(res.data);
      if (res.data.length === 0) {
        showToast('No users found', 'info');
      }
    } catch (error) {
      showToast(error.response?.data?.msg || 'Search failed', 'error');
    }
    setSearching(false);
  };

  const handleSendRequest = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/friends/request/${userId}`);
      showToast('Friend request sent!');
      await fetchData();
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to send request', 'error');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.put(`http://localhost:5000/api/friends/request/${requestId}/accept`);
      showToast('Friend request accepted!');
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.put(`http://localhost:5000/api/friends/request/${requestId}/reject`);
      showToast('Friend request rejected');
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to reject request', 'error');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await axios.delete(`http://localhost:5000/api/friends/request/${requestId}`);
      showToast('Friend request cancelled');
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to cancel request', 'error');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/friends/${friendId}`);
      showToast('Friend removed');
      await fetchData();
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to remove friend', 'error');
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

  const renderFriendCard = (friend, showBalance = false) => {
    const balance = showBalance ? friendBalances.find(b => b.userId.toString() === friend._id.toString()) : null;

    return (
      <div key={friend._id} style={styles.friendCard}>
        <div style={styles.friendInfo}>
          {friend.profilePicture ? (
            <img src={friend.profilePicture} alt={friend.name} style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>{getInitials(friend.name)}</div>
          )}
          <div style={styles.friendDetails}>
            <div style={styles.friendName}>{friend.name}</div>
            <div style={styles.friendEmail}>{friend.email}</div>
          </div>
        </div>

        <div style={styles.friendActions}>
          {balance && (
            <div style={styles.balanceTag}>
              {balance.balance > 0 ? (
                <span style={styles.balanceOwed}>Owes you ₹{Math.abs(balance.balance).toFixed(2)}</span>
              ) : balance.balance < 0 ? (
                <span style={styles.balanceOwes}>You owe ₹{Math.abs(balance.balance).toFixed(2)}</span>
              ) : (
                <span style={styles.balanceSettled}>Settled up</span>
              )}
            </div>
          )}
          <button
            onClick={() => handleRemoveFriend(friend._id)}
            style={styles.removeBtn}
          >
            Remove
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading friends...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/" style={styles.title}>SettleUp</Link>
        <UserDropdown user={user} onLogout={logout} />
      </div>

      <div style={styles.content}>
        <div style={styles.backLink}>
          <Link to="/dashboard" style={styles.link}>
            ← Back to Dashboard
          </Link>
        </div>

        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>Friends</h2>
        </div>

        {/* Search Section */}
        <div style={styles.searchSection}>
          <h3 style={styles.sectionTitle}>Add New Friends</h3>
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button
              type="submit"
              disabled={searching}
              style={styles.searchBtn}
            >
              {searching ? 'Searching...' : '🔍 Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div style={styles.searchResults}>
              {searchResults.map(result => {
                const isFriend = friends.some(f => f._id === result._id);
                const hasPendingRequest = 
                  requests.sent.some(r => r.to._id === result._id) ||
                  requests.received.some(r => r.from._id === result._id);

                return (
                  <div key={result._id} style={styles.searchResultCard}>
                    <div style={styles.friendInfo}>
                      {result.profilePicture ? (
                        <img src={result.profilePicture} alt={result.name} style={styles.avatarSmall} />
                      ) : (
                        <div style={styles.avatarPlaceholderSmall}>{getInitials(result.name)}</div>
                      )}
                      <div>
                        <div style={styles.resultName}>{result.name}</div>
                        <div style={styles.resultEmail}>{result.email}</div>
                      </div>
                    </div>
                    <div>
                      {isFriend ? (
                        <span style={styles.alreadyFriendBadge}>Already Friends</span>
                      ) : hasPendingRequest ? (
                        <span style={styles.pendingBadge}>Request Pending</span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(result._id)}
                          style={styles.addBtn}
                        >
                          + Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('all')}
            style={{ ...styles.tab, ...(activeTab === 'all' ? styles.tabActive : {}) }}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            style={{ ...styles.tab, ...(activeTab === 'balances' ? styles.tabActive : {}) }}
          >
            With Balances ({friendBalances.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{ ...styles.tab, ...(activeTab === 'requests' ? styles.tabActive : {}) }}
          >
            Requests ({requests.received.length})
          </button>
        </div>

        {/* All Friends Tab */}
        {activeTab === 'all' && (
          <div style={styles.section}>
            {friends.length === 0 ? (
              <div style={styles.emptyState}>
                <p>You don't have any friends yet.</p>
                <p>Search for users above to send friend requests!</p>
              </div>
            ) : (
              <div style={styles.friendsList}>
                {friends.map(friend => renderFriendCard(friend, false))}
              </div>
            )}
          </div>
        )}

        {/* Balances Tab */}
        {activeTab === 'balances' && (
          <div style={styles.section}>
            {friendBalances.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No outstanding balances with friends.</p>
                <p>Add expenses in shared groups to see balances here.</p>
              </div>
            ) : (
              <div style={styles.friendsList}>
                {friendBalances.map(balance => {
                  return (
                    <div key={balance.userId} style={styles.friendCard}>
                      <div style={styles.friendInfo}>
                        {balance.profilePicture ? (
                          <img src={balance.profilePicture} alt={balance.name} style={styles.avatar} />
                        ) : (
                          <div style={styles.avatarPlaceholder}>{getInitials(balance.name)}</div>
                        )}
                        <div style={styles.friendDetails}>
                          <div style={styles.friendName}>{balance.name}</div>
                          <div style={styles.friendEmail}>{balance.email}</div>
                        </div>
                      </div>

                      <div style={styles.friendActions}>
                        <div style={styles.balanceTag}>
                          {balance.balance > 0 ? (
                            <span style={styles.balanceOwed}>Owes you ₹{Math.abs(balance.balance).toFixed(2)}</span>
                          ) : balance.balance < 0 ? (
                            <span style={styles.balanceOwes}>You owe ₹{Math.abs(balance.balance).toFixed(2)}</span>
                          ) : (
                            <span style={styles.balanceSettled}>Settled up</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div style={styles.section}>
            {requests.received.length === 0 && requests.sent.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No pending friend requests.</p>
              </div>
            ) : (
              <>
                {requests.received.length > 0 && (
                  <div style={styles.requestsSection}>
                    <h4 style={styles.requestsTitle}>Received ({requests.received.length})</h4>
                    <div style={styles.requestsList}>
                      {requests.received.map(request => (
                        <div key={request._id} style={styles.requestCard}>
                          <div style={styles.friendInfo}>
                            {request.from.profilePicture ? (
                              <img src={request.from.profilePicture} alt={request.from.name} style={styles.avatar} />
                            ) : (
                              <div style={styles.avatarPlaceholder}>{getInitials(request.from.name)}</div>
                            )}
                            <div style={styles.friendDetails}>
                              <div style={styles.friendName}>{request.from.name}</div>
                              <div style={styles.friendEmail}>{request.from.email}</div>
                              <div style={styles.requestTime}>
                                {new Date(request.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div style={styles.requestActions}>
                            <button
                              onClick={() => handleAcceptRequest(request._id)}
                              style={styles.acceptBtn}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request._id)}
                              style={styles.rejectBtn}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {requests.sent.length > 0 && (
                  <div style={styles.requestsSection}>
                    <h4 style={styles.requestsTitle}>Sent ({requests.sent.length})</h4>
                    <div style={styles.requestsList}>
                      {requests.sent.map(request => (
                        <div key={request._id} style={styles.requestCard}>
                          <div style={styles.friendInfo}>
                            {request.to.profilePicture ? (
                              <img src={request.to.profilePicture} alt={request.to.name} style={styles.avatar} />
                            ) : (
                              <div style={styles.avatarPlaceholder}>{getInitials(request.to.name)}</div>
                            )}
                            <div style={styles.friendDetails}>
                              <div style={styles.friendName}>{request.to.name}</div>
                              <div style={styles.friendEmail}>{request.to.email}</div>
                              <div style={styles.requestTime}>
                                Sent {new Date(request.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelRequest(request._id)}
                            style={styles.cancelBtn}
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
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
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#1cc29f',
    fontWeight: '700',
    textDecoration: 'none'
  },
  content: {
    padding: '40px',
    maxWidth: '1000px',
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
  pageHeader: {
    marginBottom: '30px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '32px',
    color: '#333'
  },
  searchSection: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  searchInput: {
    flex: 1,
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  searchBtn: {
    padding: '12px 24px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  searchResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #eee'
  },
  searchResultCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  resultName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333'
  },
  resultEmail: {
    fontSize: '13px',
    color: '#666'
  },
  alreadyFriendBadge: {
    padding: '6px 12px',
    backgroundColor: '#e9ecef',
    color: '#666',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500'
  },
  pendingBadge: {
    padding: '6px 12px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500'
  },
  addBtn: {
    padding: '8px 16px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid #e9ecef',
    marginBottom: '24px'
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
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
  section: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  friendsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  friendCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid #eee',
    borderRadius: '8px',
    backgroundColor: '#fafafa'
  },
  friendInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#1cc29f',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700'
  },
  avatarSmall: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarPlaceholderSmall: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1cc29f',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700'
  },
  friendDetails: {
    flex: 1
  },
  friendName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  friendEmail: {
    fontSize: '14px',
    color: '#666'
  },
  friendActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  balanceTag: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600'
  },
  balanceOwed: {
    color: '#28a745'
  },
  balanceOwes: {
    color: '#dc3545'
  },
  balanceSettled: {
    color: '#6c757d'
  },
  removeBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  requestsSection: {
    marginBottom: '24px'
  },
  requestsTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  requestCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    border: '2px solid #1cc29f',
    borderRadius: '8px',
    backgroundColor: '#f0fff4'
  },
  requestTime: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  requestActions: {
    display: 'flex',
    gap: '8px'
  },
  acceptBtn: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  rejectBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
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

export default Friends;