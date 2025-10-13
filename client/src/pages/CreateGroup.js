import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

function CreateGroup() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberEmails: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const { name, description, memberEmails } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert comma-separated emails to array
      const memberEmailsArray = memberEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email !== '');

      const res = await axios.post('http://localhost:5000/api/groups', {
        name,
        description,
        memberEmails: memberEmailsArray
      });

      // Redirect to group detail page
      navigate(`/groups/${res.data._id}`);
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to create group');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>SettleUp</h1>
        <span style={styles.userName}>👋 {user?.name}</span>
      </div>

      <div style={styles.content}>
        <div style={styles.backLink}>
          <Link to="/dashboard" style={styles.link}>
            ← Back to Dashboard
          </Link>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Create New Group</h2>
          <p style={styles.subtitle}>
            Create a group to split expenses with friends, roommates, or travel buddies
          </p>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
          <div style={styles.inputGroup}>
  <label style={styles.label}>Group Name *</label>
  <input
    type="text"
    name="name"
    placeholder="e.g., Goa Trip 2024, Apartment 301"
    value={formData.name}
    onChange={onChange}
    required
    maxLength="50"
    style={styles.input}
  />
  <small style={styles.helpText}>
    💡 Choose a unique name (max 50 characters)
  </small>
</div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Description (Optional)</label>
              <textarea
                name="description"
                placeholder="What's this group for?"
                value={description}
                onChange={onChange}
                rows="3"
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Add Members by Email (Optional)</label>
              <input
                type="text"
                name="memberEmails"
                placeholder="email1@example.com, email2@example.com"
                value={memberEmails}
                onChange={onChange}
                style={styles.input}
              />
              <small style={styles.helpText}>
                💡 Separate multiple emails with commas. You'll be added automatically.
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
              {loading ? 'Creating Group...' : 'Create Group'}
            </button>
          </form>
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
    color: '#1cc29f',
    fontWeight: '700'
  },
  userName: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500'
  },
  content: {
    padding: '40px',
    maxWidth: '700px',
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
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    color: '#333'
  },
  subtitle: {
    margin: '0 0 30px 0',
    fontSize: '14px',
    color: '#666'
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fcc'
  },
  inputGroup: {
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
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  helpText: {
    display: 'block',
    marginTop: '6px',
    fontSize: '13px',
    color: '#666'
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px'
  }
};

export default CreateGroup;