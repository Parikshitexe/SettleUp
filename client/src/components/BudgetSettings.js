import { useState, useEffect, useCallback } from 'react'; // Add useCallback
import axios from 'axios';
import config from '../config';

function BudgetSettings({ type = 'group', groupId = null }) {
  const [budget, setBudget] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  // Wrap fetchBudget in useCallback
  const fetchBudget = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = type === 'group' 
        ? `${config.API_URL}/api/budgets/group/${groupId}`
        : `${config.API_URL}/api/budgets/personal`;
      
      const res = await axios.get(endpoint);
      setBudget(res.data);
      if (res.data.hasBudget) {
        setNewLimit(res.data.limit.toString());
      }
      setError('');
      setLoading(false);
    } catch (err) {
      console.error('Fetch budget error:', err);
      setError('Failed to load budget');
      setLoading(false);
    }
  }, [type, groupId]); // Add dependencies here

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]); // Now fetchBudget is listed as dependency

  const handleSetBudget = async () => {
    if (!newLimit || parseFloat(newLimit) <= 0) {
      setError('Please enter a valid budget limit');
      return;
    }

    try {
      const endpoint = type === 'group'
        ? `${config.API_URL}/api/budgets/group/${groupId}`
        : `${config.API_URL}/api/budgets/personal`;

      await axios.put(endpoint, {
        limit: parseFloat(newLimit)
      });

      setError('');
      setEditing(false);
      await fetchBudget();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to set budget');
    }
  };

  const handleDeleteBudget = async () => {
    if (!window.confirm('Delete this budget?')) return;
  
    try {
      const endpoint = type === 'group'
        ? `${config.API_URL}/api/budgets/group/${groupId}`
        : `${config.API_URL}/api/budgets/personal`;
  
      await axios.delete(endpoint);
      setError('');
      await fetchBudget();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete budget');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading budget...</div>;
  }

  return (
    <div style={styles.container}>
      {error && <div style={styles.errorBox}>{error}</div>}

      {budget?.hasBudget ? (
        <div style={styles.budgetCard}>
          <div style={styles.budgetInfo}>
            <div style={styles.infoPair}>
              <span style={styles.label}>Budget Limit:</span>
              <span style={styles.value}>₹{budget.limit.toFixed(2)}</span>
            </div>
            <div style={styles.infoPair}>
              <span style={styles.label}>Spent:</span>
              <span style={styles.value}>₹{budget.spent.toFixed(2)}</span>
            </div>
            <div style={styles.infoPair}>
              <span style={styles.label}>Remaining:</span>
              <span style={styles.value}>₹{budget.remaining.toFixed(2)}</span>
            </div>
          </div>

          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${Math.min(budget.percentageUsed, 100)}%`,
                  backgroundColor: budget.exceeded ? '#dc3545' : '#1cc29f'
                }}
              />
            </div>
            <div style={styles.percentage}>
              {budget.percentageUsed.toFixed(1)}% used
            </div>
          </div>

          {budget.exceeded && (
            <div style={styles.exceedWarning}>
              ⚠️ Budget Exceeded!
            </div>
          )}

          {!editing && (
            <div style={styles.buttons}>
              <button 
                onClick={() => {
                  setEditing(true);
                  setError('');
                }}
                style={styles.btn}
              >
                Edit Budget
              </button>
              <button 
                onClick={handleDeleteBudget}
                style={{...styles.btn, backgroundColor: '#dc3545'}}
              >
                Delete Budget
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.noBudget}>
          <p>No budget set for {type === 'group' ? 'this group' : 'this month'}</p>
          <p style={styles.subText}>Set a budget to track spending</p>
          {!editing && (
            <button 
              onClick={() => {
                setEditing(true);
                setError('');
              }}
              style={{
                ...styles.btn,
                marginTop: '16px',
                maxWidth: '200px',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'block'
              }}
            >
              Set Budget
            </button>
          )}
        </div>
      )}

      {editing && (
        <div style={styles.editForm}>
          <h4 style={styles.formTitle}>Set Budget Limit</h4>
          <input
            type="number"
            value={newLimit}
            onChange={(e) => {
              setNewLimit(e.target.value);
              setError('');
            }}
            placeholder="Enter budget limit (₹)"
            style={styles.input}
            min="0.01"
            step="0.01"
          />
          <div style={styles.formButtons}>
            <button onClick={handleSetBudget} style={styles.btn}>
              Save Budget
            </button>
            <button 
              onClick={() => {
                setEditing(false);
                setError('');
                setNewLimit('');
              }}
              style={{...styles.btn, backgroundColor: '#6c757d'}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0'
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#666'
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '14px',
    border: '1px solid #fcc'
  },
  budgetCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  budgetInfo: {
    marginBottom: '16px'
  },
  infoPair: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '15px'
  },
  label: {
    fontWeight: '500',
    color: '#666'
  },
  value: {
    fontWeight: '700',
    color: '#333'
  },
  progressContainer: {
    marginBottom: '16px'
  },
  progressBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s'
  },
  percentage: {
    fontSize: '13px',
    color: '#666',
    textAlign: 'right'
  },
  exceedWarning: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid #fcc',
    textAlign: 'center'
  },
  noBudget: {
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px dashed #dee2e6',
    color: '#666'
  },
  subText: {
    fontSize: '13px',
    color: '#999',
    margin: '8px 0 0 0'
  },
  buttons: {
    display: 'flex',
    gap: '8px'
  },
  btn: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#1cc29f',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'opacity 0.2s'
  },
  editForm: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f0f8ff',
    borderRadius: '6px',
    border: '1px solid #b3d9ff'
  },
  formTitle: {
    margin: '0 0 12px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box'
  },
  formButtons: {
    display: 'flex',
    gap: '8px'
  }
};

export default BudgetSettings;