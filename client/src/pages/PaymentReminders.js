import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import UserDropdown from '../components/UserDropdown';
import NotificationBell from '../components/NotificationBell';
import Toast from '../components/Toast';
import config from '../config';

function PaymentReminders() {
  const { user, logout } = useContext(AuthContext);
  const [reminders, setReminders] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);

  const [formData, setFormData] = useState({
    groupId: '',
    to: '',
    amount: '',
    reminderType: 'one_time',
    description: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchReminders();
    fetchGroups();
  }, [activeTab]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_URL}/api/payment-reminders?type=${activeTab}`);
      setReminders(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch reminders error:', error);
      showToast('Failed to fetch reminders', 'error');
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/groups`);
      setGroups(res.data);
    } catch (error) {
      console.error('Fetch groups error:', error);
    }
  };

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setFormData({ ...formData, groupId });

    const selectedGroup = groups.find(g => g._id === groupId);
    if (selectedGroup) {
      setGroupMembers(selectedGroup.members);
    } else {
      setGroupMembers([]);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();

    if (!formData.groupId || !formData.to || !formData.amount) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      await axios.post(`${config.API_URL}/api/payment-reminders`, formData);
      showToast('Payment reminder created successfully!');
      setFormData({
        groupId: '',
        to: '',
        amount: '',
        reminderType: 'one_time',
        description: '',
        dueDate: ''
      });
      setShowCreateForm(false);
      fetchReminders();
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to create reminder', 'error');
    }
  };

  const handleAcknowledge = async (reminderId) => {
    try {
      await axios.put(`${config.API_URL}/api/payment-reminders/${reminderId}/acknowledge`);
      showToast('Reminder acknowledged');
      fetchReminders();
    } catch (error) {
      showToast('Failed to acknowledge reminder', 'error');
    }
  };

  const handleSnooze = async (reminderId) => {
    try {
      await axios.put(`${config.API_URL}/api/payment-reminders/${reminderId}/snooze`);
      showToast('Reminder snoozed for 1 day');
      fetchReminders();
    } catch (error) {
      showToast('Failed to snooze reminder', 'error');
    }
  };

  const handleDeactivate = async (reminderId) => {
    try {
      await axios.put(`${config.API_URL}/api/payment-reminders/${reminderId}/deactivate`);
      showToast('Reminder deactivated');
      fetchReminders();
    } catch (error) {
      showToast('Failed to deactivate reminder', 'error');
    }
  };

  const handleDelete = async (reminderId) => {
    if (!window.confirm('Delete this reminder?')) return;

    try {
      await axios.delete(`${config.API_URL}/api/payment-reminders/${reminderId}`);
      showToast('Reminder deleted');
      fetchReminders();
    } catch (error) {
      showToast('Failed to delete reminder', 'error');
    }
  };

  const getReminderIcon = (type) => {
    const icons = {
      one_time: '📌',
      daily: '📅',
      weekly: '📊'
    };
    return icons[type] || '⏰';
  };

  const getStatusBadge = (reminder) => {
    if (!reminder.isActive) {
      return { text: 'Inactive', color: '#6c757d' };
    }
    if (reminder.acknowledged) {
      return { text: 'Acknowledged', color: '#28a745' };
    }
    return { text: 'Pending', color: '#dc3545' };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading reminders...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/" style={styles.title}>SettleUp</Link>
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

        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>Payment Reminders</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={styles.createBtn}
          >
            {showCreateForm ? '✕ Cancel' : '+ New Reminder'}
          </button>
        </div>

        {showCreateForm && (
          <div style={styles.createForm}>
            <h3 style={styles.formTitle}>Create Payment Reminder</h3>
            <form onSubmit={handleCreateReminder}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Group *</label>
                  <select
                    name="groupId"
                    value={formData.groupId}
                    onChange={handleGroupChange}
                    style={styles.input}
                    required
                  >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Remind (User) *</label>
                  <select
                    name="to"
                    value={formData.to}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  >
                    <option value="">Select a group member</option>
                    {groupMembers.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Amount (₹) *</label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0.01"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Reminder Type</label>
                  <select
                    name="reminderType"
                    value={formData.reminderType}
                    onChange={handleInputChange}
                    style={styles.input}
                  >
                    <option value="one_time">One Time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  placeholder="e.g., Payment for dinner at restaurant"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Due Date (Optional)</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>

              <button type="submit" style={styles.submitBtn}>
                Create Reminder
              </button>
            </form>
          </div>
        )}

        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('received')}
            style={{ ...styles.tab, ...(activeTab === 'received' ? styles.tabActive : {}) }}
          >
            Reminders for You ({reminders.filter(r => r.to?._id === user?._id).length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            style={{ ...styles.tab, ...(activeTab === 'sent' ? styles.tabActive : {}) }}
          >
            Reminders Sent ({reminders.filter(r => r.from?._id === user?._id).length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{ ...styles.tab, ...(activeTab === 'pending' ? styles.tabActive : {}) }}
          >
            Pending ({reminders.filter(r => !r.acknowledged).length})
          </button>
        </div>

        <div style={styles.section}>
          {reminders.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No payment reminders {activeTab === 'sent' ? 'sent' : 'received'}</p>
            </div>
          ) : (
            <div style={styles.remindersList}>
              {reminders.map(reminder => {
                // FIXED: Add null checks for deleted users/groups
                const toUser = reminder.to?.name || 'Unknown User';
                const fromUser = reminder.from?.name || 'Unknown User';
                const groupName = reminder.group?.name || 'Deleted Group';
                
                const status = getStatusBadge(reminder);
                const isSent = activeTab === 'sent';

                return (
                  <div key={reminder._id} style={styles.reminderCard}>
                    <div style={styles.reminderHeader}>
                      <div style={styles.reminderInfo}>
                        <span style={styles.icon}>{getReminderIcon(reminder.reminderType)}</span>
                        <div>
                          <div style={styles.reminderAmount}>
                            ₹{reminder.amount.toFixed(2)}
                          </div>
                          <div style={styles.reminderMeta}>
                            {isSent ? (
                              <span>Reminder to {toUser}</span>
                            ) : (
                              <span>From {fromUser}</span>
                            )}
                            {' '} • {groupName}
                          </div>
                          {reminder.description && (
                            <div style={styles.reminderDesc}>
                              {reminder.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={styles.reminderRight}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: status.color
                          }}
                        >
                          {status.text}
                        </span>
                      </div>
                    </div>

                    <div style={styles.reminderFooter}>
                      <div style={styles.reminderDetails}>
                        <span style={styles.detail}>
                          Type: {reminder.reminderType.replace('_', ' ').toUpperCase()}
                        </span>
                        <span style={styles.detail}>
                          Created: {new Date(reminder.createdAt).toLocaleDateString()}
                        </span>
                        {reminder.dueDate && (
                          <span style={styles.detail}>
                            Due: {new Date(reminder.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div style={styles.actions}>
                        {!isSent && !reminder.acknowledged && reminder.isActive && (
                          <>
                            <button
                              onClick={() => handleAcknowledge(reminder._id)}
                              style={styles.actionBtn}
                            >
                              ✓ Acknowledge
                            </button>
                            <button
                              onClick={() => handleSnooze(reminder._id)}
                              style={styles.actionBtn}
                            >
                              ⏰ Snooze
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeactivate(reminder._id)}
                          style={styles.actionBtnSecondary}
                        >
                          Deactivate
                        </button>
                        {isSent && (
                          <button
                            onClick={() => handleDelete(reminder._id)}
                            style={styles.deleteBtn}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
    fontWeight: '700',
    textDecoration: 'none'
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
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '32px',
    color: '#333'
  },
  createBtn: {
    padding: '12px 24px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  createForm: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px'
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
  remindersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  reminderCard: {
    padding: '16px',
    border: '1px solid #eee',
    borderRadius: '8px',
    backgroundColor: '#fafafa'
  },
  reminderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e9ecef'
  },
  reminderInfo: {
    display: 'flex',
    gap: '12px',
    flex: 1
  },
  icon: {
    fontSize: '28px'
  },
  reminderAmount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#333'
  },
  reminderMeta: {
    fontSize: '14px',
    color: '#666'
  },
  reminderDesc: {
    fontSize: '13px',
    color: '#999',
    marginTop: '4px'
  },
  reminderRight: {
    display: 'flex',
    alignItems: 'center'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600'
  },
  reminderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px'
  },
  reminderDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#666'
  },
  detail: {
    display: 'inline-block'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    padding: '8px 14px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  actionBtnSecondary: {
    padding: '8px 14px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  deleteBtn: {
    padding: '8px 14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
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

if (window.innerWidth <= 768) {
  styles.formRow = {
    ...styles.formRow,
    gridTemplateColumns: '1fr'
  };
  styles.reminderFooter = {
    ...styles.reminderFooter,
    flexDirection: 'column',
    alignItems: 'flex-start'
  };
}

export default PaymentReminders;