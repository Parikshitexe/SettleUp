import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ExpenseAnalytics from '../components/ExpenseAnalytics';
import Toast from '../components/Toast';


function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('expenses');
  const [toast, setToast] = useState(null);
  

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    paidBy: '',
    splitType: 'equal',
    category: 'Other',
    date: new Date().toISOString().split('T')[0]
  });

  const [customSplits, setCustomSplits] = useState([]);

  // Settlement state
  const [settlements, setSettlements] = useState([]);
  const [showRecordSettlement, setShowRecordSettlement] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    paidBy: '',
    paidTo: '',
    amount: '',
    note: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
const [filterCategory, setFilterCategory] = useState('All');
const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'description'


  

  const fetchGroup = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/${id}`);
      setGroup(res.data);
      setExpenseForm(prev => ({ ...prev, paidBy: user?.id || user?._id }));
      setLoading(false);
    } catch (error) {
      console.error('Fetch group error:', error);
      setError('Failed to load group');
      setLoading(false);
    }
  }, [id, user]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/expenses/group/${id}`);
      setExpenses(res.data);
    } catch (error) {
      console.error('Fetch expenses error:', error);
    }
  }, [id]);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/balances/group/${id}`);
      setBalances(res.data);
    } catch (error) {
      console.error('Fetch balances error:', error);
    }
  }, [id]);

  const fetchSettlements = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/settlements/group/${id}`);
      setSettlements(res.data);
    } catch (error) {
      console.error('Fetch settlements error:', error);
    }
  }, [id]);

  
  useEffect(() => {
    fetchGroup();
    fetchExpenses();
    fetchBalances();
    fetchSettlements();
  }, [id, fetchGroup, fetchExpenses, fetchBalances, fetchSettlements]);

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      showToast('No expenses to export!');
      return;
    }
  
    // Prepare CSV data
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Paid By', 'Split Type'];
    
    const rows = expenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.description,
      expense.category,
      expense.amount.toFixed(2),
      expense.paidBy.name,
      expense.splitType
    ]);
  
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
  
    // Add summary
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    csvContent += '\n';
    csvContent += `Total Expenses,${expenses.length}\n`;
    csvContent += `Total Amount,${totalAmount.toFixed(2)}\n`;
    csvContent += `Group Name,"${group.name}"\n`;
    csvContent += `Exported On,${new Date().toLocaleDateString()}\n`;
  
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}_expenses.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`http://localhost:5000/api/groups/${id}/members`, {
        memberEmails: [memberEmail.trim()]
      });
      setGroup(res.data);
      setMemberEmail('');
      setShowAddMember(false);
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const res = await axios.delete(`http://localhost:5000/api/groups/${id}/members/${memberId}`);
      setGroup(res.data);
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to remove member');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/groups/${id}`);
      navigate('/dashboard');
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to delete group');
    }
  };

  const handleExpenseChange = (e) => {
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  };

  const handleSplitTypeChange = (e) => {
    const newSplitType = e.target.value;
    setExpenseForm({ ...expenseForm, splitType: newSplitType });
    
    if ((newSplitType === 'unequal' || newSplitType === 'percentage') && group) {
      const amount = parseFloat(expenseForm.amount) || 0;
      const equalAmount = amount / group.members.length;
      
      setCustomSplits(
        group.members.map(member => ({
          userId: member._id,
          name: member.name,
          amount: newSplitType === 'unequal' ? equalAmount.toFixed(2) : '',
          percentage: newSplitType === 'percentage' ? (100 / group.members.length).toFixed(2) : ''
        }))
      );
    }
  };

  const handleCustomSplitChange = (userId, field, value) => {
    setCustomSplits(prev =>
      prev.map(split =>
        split.userId === userId ? { ...split, [field]: value } : split
      )
    );
  };

  const calculateRemainingAmount = () => {
    const total = parseFloat(expenseForm.amount) || 0;
    const allocated = customSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
    return (total - allocated).toFixed(2);
  };

  const calculateRemainingPercentage = () => {
    const allocated = customSplits.reduce((sum, split) => sum + (parseFloat(split.percentage) || 0), 0);
    return (100 - allocated).toFixed(2);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const expenseData = {
        groupId: id,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        paidBy: expenseForm.paidBy,
        splitType: expenseForm.splitType,
        category: expenseForm.category,
        date: expenseForm.date
      };

      if (expenseForm.splitType === 'unequal') {
        expenseData.splitDetails = customSplits.map(split => ({
          userId: split.userId,
          amount: parseFloat(split.amount)
        }));
      } else if (expenseForm.splitType === 'percentage') {
        expenseData.splitDetails = customSplits.map(split => ({
          userId: split.userId,
          percentage: parseFloat(split.percentage)
        }));
      }

      await axios.post('http://localhost:5000/api/expenses', expenseData);

      setExpenseForm({
        description: '',
        amount: '',
        paidBy: user?.id || user?._id,
        splitType: 'equal',
        category: 'Other',
        date: new Date().toISOString().split('T')[0]
      });
      setCustomSplits([]);
      setShowAddExpense(false);

      await fetchExpenses();
      await fetchBalances();
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/expenses/${expenseId}`);
      await fetchExpenses();
      await fetchBalances();
      showToast('Expense deleted successfully!');
    } catch (error) {
      console.error('Delete expense error:', error);
      showToast(error.response?.data?.msg || 'Failed to delete expense');
    }
  };

  const handleSettlementChange = (e) => {
    setSettlementForm({ ...settlementForm, [e.target.name]: e.target.value });
  };

  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    setError('');

    if (!settlementForm.paidBy || !settlementForm.paidTo) {
      setError('Please select both payer and receiver');
      return;
    }

    if (settlementForm.paidBy === settlementForm.paidTo) {
      setError('Cannot settle with yourself');
      return;
    }

    if (!settlementForm.amount || parseFloat(settlementForm.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/settlements', {
        groupId: id,
        paidBy: settlementForm.paidBy,
        paidTo: settlementForm.paidTo,
        amount: parseFloat(settlementForm.amount),
        note: settlementForm.note || '',
        date: new Date().toISOString()
      });

      setSettlementForm({
        paidBy: '',
        paidTo: '',
        amount: '',
        note: ''
      });
      setShowRecordSettlement(false);

      await fetchSettlements();
      await fetchBalances();
      
      showToast('Settlement recorded successfully!');
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to record settlement');
    }
  };

  const handleDeleteSettlement = async (settlementId) => {
    if (!window.confirm('Are you sure you want to delete this settlement?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/settlements/${settlementId}`);
      await fetchSettlements();
      await fetchBalances();
    } catch (error) {
      showToast(error.response?.data?.msg || 'Failed to delete settlement');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <h2>Group not found</h2>
          <Link to="/dashboard" style={styles.link}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isAdmin = 
    group.createdBy._id?.toString() === user?.id?.toString() || 
    group.createdBy._id?.toString() === user?._id?.toString() ||
    group.createdBy.id?.toString() === user?.id?.toString() ||
    group.createdBy.id?.toString() === user?._id?.toString();

  const myBalance = balances?.balances?.find(
    b => b.userId.toString() === (user?.id || user?._id).toString()
  );

  // Filter and search expenses
const getFilteredExpenses = () => {
  let filtered = [...expenses];

  // Search by description or paid by name
  if (searchTerm) {
    filtered = filtered.filter(expense =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.paidBy.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Filter by category
  if (filterCategory !== 'All') {
    filtered = filtered.filter(expense => expense.category === filterCategory);
  }

  // Sort
  if (sortBy === 'date') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy === 'amount') {
    filtered.sort((a, b) => b.amount - a.amount);
  } else if (sortBy === 'description') {
    filtered.sort((a, b) => a.description.localeCompare(b.description));
  }

  return filtered;
};

const filteredExpenses = getFilteredExpenses();

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

        {/* Group Header */}
        <div style={styles.groupHeader}>
          <div>
            <h2 style={styles.groupName}>{group.name}</h2>
            {group.description && (
              <p style={styles.groupDescription}>{group.description}</p>
            )}
          </div>
          {isAdmin && (
            <button onClick={handleDeleteGroup} style={styles.deleteBtn}>
              Delete Group
            </button>
          )}
        </div>

        {/* Balance Summary */}
        {myBalance && (
          <div style={styles.balanceCard}>
            <h3 style={styles.balanceTitle}>Your Balance</h3>
            <div style={styles.balanceAmount}>
              {myBalance.netBalance === 0 ? (
                <span style={styles.settled}>✓ All Settled Up!</span>
              ) : myBalance.netBalance > 0 ? (
                <span style={styles.owed}>
                  You are owed ₹{Math.abs(myBalance.netBalance).toFixed(2)}
                </span>
              ) : (
                <span style={styles.owes}>
                  You owe ₹{Math.abs(myBalance.netBalance).toFixed(2)}
                </span>
              )}
            </div>
            <div style={styles.balanceDetails}>
              <div>Total paid: ₹{myBalance.totalPaid.toFixed(2)}</div>
              <div>Your share: ₹{myBalance.totalOwed.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Settlement Summary */}
        {balances && balances.simplifiedTransactions && balances.simplifiedTransactions.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Settlement Summary</h3>
            
            {balances.simplificationStats && balances.simplificationStats.transactionsSaved > 0 && (
              <div style={styles.simplificationBanner}>
                <div style={styles.bannerIcon}>🎉</div>
                <div style={styles.bannerContent}>
                  <div style={styles.bannerTitle}>Smart Settlement Detected!</div>
                  <div style={styles.bannerText}>
                    Our algorithm reduced <strong>{balances.simplificationStats.originalCount} transactions</strong> to just{' '}
                    <strong>{balances.simplificationStats.simplifiedCount} transactions</strong>!
                    <br />
                    <span style={styles.bannerHighlight}>
                      Save {balances.simplificationStats.percentageSaved}% effort!
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.transactionsContainer}>
              <div style={styles.transactionsHeader}>
                <h4 style={styles.transactionsTitle}>✨ Optimized Settlements</h4>
                <span style={styles.transactionsBadge}>
                  {balances.simplifiedTransactions.length} transaction{balances.simplifiedTransactions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={styles.transactionsList}>
                {balances.simplifiedTransactions.map((transaction, index) => (
                  <div key={index} style={styles.transactionCard}>
                    <span style={styles.transactionFrom}>{transaction.from.name}</span>
                    <span style={styles.transactionArrow}>→</span>
                    <span style={styles.transactionTo}>{transaction.to.name}</span>
                    <span style={styles.transactionAmount}>
                      ₹{transaction.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Record Settlement */}
        {balances && balances.simplifiedTransactions && balances.simplifiedTransactions.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Record Settlement</h3>
              <button 
                onClick={() => setShowRecordSettlement(!showRecordSettlement)} 
                style={styles.addBtn}
              >
                {showRecordSettlement ? 'Cancel' : '💰 Settle Up'}
              </button>
            </div>

            {showRecordSettlement && (
              <div style={styles.addForm}>
                {error && <div style={styles.errorBox}>{error}</div>}
                <form onSubmit={handleRecordSettlement}>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Who Paid? *</label>
                      <select
                        name="paidBy"
                        value={settlementForm.paidBy}
                        onChange={handleSettlementChange}
                        required
                        style={styles.input}
                      >
                        <option value="">Select person</option>
                        {group.members.map(member => (
                          <option key={member._id} value={member._id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Paid To? *</label>
                      <select
                        name="paidTo"
                        value={settlementForm.paidTo}
                        onChange={handleSettlementChange}
                        required
                        style={styles.input}
                      >
                        <option value="">Select person</option>
                        {group.members.map(member => (
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
                        value={settlementForm.amount}
                        onChange={handleSettlementChange}
                        required
                        min="0.01"
                        step="0.01"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Note (Optional)</label>
                      <input
                        type="text"
                        name="note"
                        placeholder="e.g., Paid via UPI"
                        value={settlementForm.note}
                        onChange={handleSettlementChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <button type="submit" style={styles.submitBtn}>
                    Record Settlement
                  </button>
                </form>
              </div>
            )}

            {balances.simplifiedTransactions.length > 0 && !showRecordSettlement && (
              <div style={styles.quickSettlements}>
                <p style={styles.quickSettleLabel}>💡 Quick Settle:</p>
                {balances.simplifiedTransactions.map((transaction, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSettlementForm({
                        paidBy: transaction.from.userId.toString(),
                        paidTo: transaction.to.userId.toString(),
                        amount: transaction.amount.toFixed(2),
                        note: 'Quick settlement'
                      });
                      setShowRecordSettlement(true);
                    }}
                    style={styles.quickSettleBtn}
                  >
                    💰 {transaction.from.name} pays {transaction.to.name} ₹{transaction.amount.toFixed(2)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settlement History */}
        {settlements.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Settlement History ({settlements.length})</h3>
            <div style={styles.settlementsList}>
              {settlements.map(settlement => (
                <div key={settlement._id} style={styles.settlementCard}>
                  <div style={styles.settlementHeader}>
                    <div>
                      <div style={styles.settlementTransaction}>
                        <span style={styles.settlementPaidBy}>{settlement.paidBy.name}</span>
                        <span style={styles.settlementArrow}>→</span>
                        <span style={styles.settlementPaidTo}>{settlement.paidTo.name}</span>
                      </div>
                      <div style={styles.settlementMeta}>
                        <span style={styles.settlementDate}>
                          {new Date(settlement.date).toLocaleDateString()}
                        </span>
                        {settlement.note && (
                          <span style={styles.settlementNote}>"{settlement.note}"</span>
                        )}
                      </div>
                    </div>
                    <div style={styles.settlementRight}>
                      <div style={styles.settlementAmount}>₹{settlement.amount.toFixed(2)}</div>
                      {(settlement.createdBy._id === (user?.id || user?._id) || isAdmin) && (
                        <button
                          onClick={() => handleDeleteSettlement(settlement._id)}
                          style={styles.deleteSettlementBtn}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPENSES AND ANALYTICS WITH TABS */}
        <div style={styles.section}>
          {/* Tab Navigation */}
          <div style={styles.tabContainer}>
            <button
              onClick={() => setActiveTab('expenses')}
              style={{
                ...styles.tab,
                ...(activeTab === 'expenses' ? styles.tabActive : {})
              }}
            >
              📝 Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                ...styles.tab,
                ...(activeTab === 'analytics' ? styles.tabActive : {})
              }}
            >
              📊 Analytics
            </button>
          </div>

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Expenses ({expenses.length})</h3>
                <div style={styles.headerActions}>
                  <button
                  onClick={handleExportCSV}
                  style={styles.exportBtn}
                  disabled={expenses.length === 0}
                  > 📥 Export CSV </button>
                <button 
                  onClick={() => setShowAddExpense(!showAddExpense)} 
                  style={styles.addBtn}
                >
                  {showAddExpense ? 'Cancel' : '+ Add Expense'}
                </button>
              </div>
              </div>

              {/* Add Expense Form */}
              {showAddExpense && (
                <div style={styles.addForm}>
                  {error && <div style={styles.errorBox}>{error}</div>}
                  <form onSubmit={handleAddExpense}>
                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Description *</label>
                        <input
                          type="text"
                          name="description"
                          placeholder="e.g., Dinner at restaurant"
                          value={expenseForm.description}
                          onChange={handleExpenseChange}
                          required
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Amount (₹) *</label>
                        <input
                          type="number"
                          name="amount"
                          placeholder="0.00"
                          value={expenseForm.amount}
                          onChange={handleExpenseChange}
                          required
                          min="0.01"
                          step="0.01"
                          style={styles.input}
                        />
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Paid By *</label>
                        <select
                          name="paidBy"
                          value={expenseForm.paidBy}
                          onChange={handleExpenseChange}
                          required
                          style={styles.input}
                        >
                          {group.members.map(member => (
                            <option key={member._id} value={member._id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Category</label>
                        <select
                          name="category"
                          value={expenseForm.category}
                          onChange={handleExpenseChange}
                          style={styles.input}
                        >
                          <option value="Food">Food</option>
                          <option value="Transport">Transport</option>
                          <option value="Accommodation">Accommodation</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.formRow}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Date</label>
                        <input
                          type="date"
                          name="date"
                          value={expenseForm.date}
                          onChange={handleExpenseChange}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Split Type *</label>
                        <select
                          value={expenseForm.splitType}
                          onChange={handleSplitTypeChange}
                          style={styles.input}
                        >
                          <option value="equal">Equal Split</option>
                          <option value="unequal">Unequal (Custom Amounts)</option>
                          <option value="percentage">Percentage Split</option>
                        </select>
                      </div>
                    </div>

                    {expenseForm.splitType === 'equal' && expenseForm.amount && (
                      <div style={styles.splitInfo}>
                        💡 Split equally: ₹{(parseFloat(expenseForm.amount) / group.members.length).toFixed(2)} per person
                      </div>
                    )}

                    {expenseForm.splitType === 'unequal' && customSplits.length > 0 && (
                      <div style={styles.customSplitSection}>
                        <div style={styles.splitHeader}>
                          <label style={styles.label}>Custom Amounts</label>
                          <div style={styles.remainingAmount}>
                            Remaining: ₹{calculateRemainingAmount()}
                          </div>
                        </div>
                        {customSplits.map(split => (
                          <div key={split.userId} style={styles.splitRow}>
                            <span style={styles.splitName}>{split.name}</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={split.amount}
                              onChange={(e) => handleCustomSplitChange(split.userId, 'amount', e.target.value)}
                              min="0"
                              step="0.01"
                              style={styles.splitInput}
                            />
                          </div>
                        ))}
                        <small style={styles.helpText}>
                          ⚠️ Total must equal ₹{expenseForm.amount || '0.00'}
                        </small>
                      </div>
                    )}

                    {expenseForm.splitType === 'percentage' && customSplits.length > 0 && (
                      <div style={styles.customSplitSection}>
                        <div style={styles.splitHeader}>
                          <label style={styles.label}>Split by Percentage</label>
                          <div style={styles.remainingAmount}>
                            Remaining: {calculateRemainingPercentage()}%
                          </div>
                        </div>
                        {customSplits.map(split => (
                          <div key={split.userId} style={styles.splitRow}>
                            <span style={styles.splitName}>{split.name}</span>
                            <div style={styles.percentageInput}>
                              <input
                                type="number"
                                placeholder="0"
                                value={split.percentage}
                                onChange={(e) => handleCustomSplitChange(split.userId, 'percentage', e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                                style={styles.splitInput}
                              />
                              <span style={styles.percentSymbol}>%</span>
                              {expenseForm.amount && (
                                <span style={styles.amountPreview}>
                                  = ₹{((parseFloat(expenseForm.amount) * parseFloat(split.percentage || 0)) / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        <small style={styles.helpText}>
                          ⚠️ Total must equal 100%
                        </small>
                      </div>
                    )}

                    <button type="submit" style={styles.submitBtn}>
                      Add Expense
                    </button>
                  </form>
                </div>
              )}

              {/* Search and Filter */}
<div style={styles.searchFilterContainer}>
  <div style={styles.searchBox}>
    <input
      type="text"
      placeholder="🔍 Search expenses..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={styles.searchInput}
    />
    {searchTerm && (
      <button
        onClick={() => setSearchTerm('')}
        style={styles.clearSearchBtn}
      >
        ✕
      </button>
    )}
  </div>

  <div style={styles.filterRow}>
    <select
      value={filterCategory}
      onChange={(e) => setFilterCategory(e.target.value)}
      style={styles.filterSelect}
    >
      <option value="All">All Categories</option>
      <option value="Food">Food</option>
      <option value="Transport">Transport</option>
      <option value="Accommodation">Accommodation</option>
      <option value="Entertainment">Entertainment</option>
      <option value="Shopping">Shopping</option>
      <option value="Other">Other</option>
    </select>

    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      style={styles.filterSelect}
    >
      <option value="date">Sort by Date</option>
      <option value="amount">Sort by Amount</option>
      <option value="description">Sort by Name</option>
    </select>

    {(searchTerm || filterCategory !== 'All') && (
      <button
        onClick={() => {
          setSearchTerm('');
          setFilterCategory('All');
        }}
        style={styles.clearFiltersBtn}
      >
        Clear Filters
      </button>
    )}
  </div>

  <div style={styles.resultsInfo}>
    Showing {filteredExpenses.length} of {expenses.length} expenses
  </div>
</div>

              {/* Expenses List */}
              {expenses.length === 0 ? (
  <div style={styles.emptyState}>
    <p>No expenses yet. Add your first expense to get started!</p>
  </div>
) : filteredExpenses.length === 0 ? (
  <div style={styles.emptyState}>
    <p>No expenses match your filters. Try adjusting your search.</p>
  </div>
) : (
  <div style={styles.expensesList}>
    {filteredExpenses.map(expense => (
      <div key={expense._id} style={styles.expenseCard}>
        {/* Header */}
        <div style={styles.expenseHeader}>
          <div>
            <h4 style={styles.expenseDescription}>{expense.description}</h4>
            <div style={styles.expenseMeta}>
              <span style={styles.expenseCategory}>{expense.category}</span>
              <span style={styles.expenseDate}>
                {new Date(expense.date).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div style={styles.expenseRight}>
            <div style={styles.expenseAmount}>₹{expense.amount.toFixed(2)}</div>
            <div style={styles.expensePaidBy}>
              Paid by {expense.paidBy?.name || "Unknown"}
            </div>
          </div>
        </div>

        {/* Split Details */}
        <div style={styles.expenseSplit}>
          <div style={styles.splitLabel}>
            {expense.splitType === "equal" && "Split equally:"}
            {expense.splitType === "unequal" && "Custom split:"}
            {expense.splitType === "percentage" && "Percentage split:"}
          </div>

          <div style={styles.splitDetails}>
            {expense.splitDetails?.map((split) => (
              <span key={split.userId._id} style={styles.splitItem}>
                {split.userId.name}: ₹{split.amount.toFixed(2)}
              </span>
            ))}
          </div>
        </div>

        {/* Delete Button (Only for Creator/Admin) */}
        {(() => {
          const expenseCreatorId = expense.createdBy?._id || expense.createdBy?.id;
          const currentUserId = user?.id || user?._id;
          const canDelete =
            expenseCreatorId?.toString() === currentUserId?.toString() || isAdmin;

          return (
            canDelete && (
              <button
                onClick={() => handleDeleteExpense(expense._id)}
                style={styles.deleteExpenseBtn}
              >
                Delete
              </button>
            )
          );
        })()}
      </div>
    ))}
  </div>
)}

</>
          )}



      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <ExpenseAnalytics expenses={expenses} groupMembers={group.members} />
      )}
    </div>

    {/* Members Section */}
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>
          👥 Members ({group.members.length})
        </h3>
        {group.members.some(m => 
          (m._id || m.id)?.toString() === (user?.id || user?._id)?.toString()
        ) && (
          <button 
            onClick={() => {
              setShowAddMember(!showAddMember);
              setError('');
            }} 
            style={styles.addBtn}
          >
            {showAddMember ? '✕ Cancel' : '+ Add Member'}
          </button>
        )}
      </div>

      {showAddMember && (
        <div style={styles.addMemberForm}>
          <h4 style={styles.addMemberTitle}>Add New Member</h4>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleAddMember} style={styles.addMemberFormInner}>
            <div style={styles.addMemberInputGroup}>
              <input
                type="email"
                placeholder="Enter member's email address"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
                style={styles.addMemberInput}
                autoFocus
              />
              <button type="submit" style={styles.addMemberSubmitBtn}>
                Add Member
              </button>
            </div>
            <small style={styles.helpText}>
              💡 The person must have a SettleUp account with this email
            </small>
          </form>
        </div>
      )}

      <div style={styles.membersList}>
        {group.members.map(member => {
          const memberId = (member._id || member.id)?.toString();
          const creatorId = (group.createdBy._id || group.createdBy.id)?.toString();
          const currentUserId = (user?.id || user?._id)?.toString();

          const isCreator = memberId === creatorId;
          const isCurrentUser = memberId === currentUserId;
          const canRemove = isAdmin && !isCreator;

          return (
            <div key={member._id} style={styles.memberCard}>
              <div style={styles.memberInfo}>
                <div style={styles.memberAvatar}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={styles.memberName}>
                    {member.name}
                    {isCreator && (
                      <span style={styles.adminBadge}>ADMIN</span>
                    )}
                    {isCurrentUser && (
                      <span style={styles.youBadge}>YOU</span>
                    )}
                  </div>
                  <div style={styles.memberEmail}>{member.email}</div>
                </div>
              </div>
              {canRemove && (
                <button
                  onClick={() => handleRemoveMember(member._id)}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
    {/* Toast Notification */}
    {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
  </div>
</div>    
  );
  
}

const styles = {

  '@media (max-width: 768px)': {
  formRow: {
    gridTemplateColumns: '1fr',
  },
  statsGrid: {
    gridTemplateColumns: '1fr',
  }
},

  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  exportBtn: {
    padding: '8px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s'
  },
  searchFilterContainer: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  searchBox: {
    position: 'relative',
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 16px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.3s'
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#999',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  filterSelect: {
    flex: 1,
    minWidth: '150px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  clearFiltersBtn: {
    padding: '10px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  resultsInfo: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic'
  },
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
  groupHeader: {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
  },
  groupName: {
  margin: '0 0 10px 0',
  fontSize: '32px',
  color: '#333'
  },
  groupDescription: {
  margin: 0,
  fontSize: '16px',
  color: '#666'
  },
  deleteBtn: {
  padding: '10px 20px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
  },
  balanceCard: {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '20px',
  textAlign: 'center'
  },
  balanceTitle: {
  margin: '0 0 16px 0',
  fontSize: '18px',
  color: '#666',
  fontWeight: '500'
  },
  balanceAmount: {
  fontSize: '32px',
  fontWeight: '700',
  marginBottom: '16px'
  },
  settled: {
  color: '#28a745'
  },
  owed: {
  color: '#28a745'
  },
  owes: {
  color: '#dc3545'
  },
  balanceDetails: {
  display: 'flex',
  justifyContent: 'center',
  gap: '40px',
  fontSize: '14px',
  color: '#666'
  },
  section: {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  marginBottom: '20px'
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
  color: '#333'
  },
  addBtn: {
  padding: '8px 16px',
  backgroundColor: '#1cc29f',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
  },
  simplificationBanner: {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  padding: '20px',
  backgroundColor: '#e8f5e9',
  border: '2px solid #4caf50',
  borderRadius: '8px',
  marginBottom: '24px'
  },
  bannerIcon: {
  fontSize: '32px'
  },
  bannerContent: {
  flex: 1
  },
  bannerTitle: {
  fontSize: '18px',
  fontWeight: '700',
  color: '#2e7d32',
  marginBottom: '8px'
  },
  bannerText: {
  fontSize: '14px',
  color: '#1b5e20',
  lineHeight: '1.6'
  },
  bannerHighlight: {
  display: 'inline-block',
  marginTop: '8px',
  padding: '4px 8px',
  backgroundColor: '#4caf50',
  color: 'white',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: '600'
  },
  transactionsContainer: {
  marginBottom: '20px'
  },
  transactionsHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
  },
  transactionsTitle: {
  margin: 0,
  fontSize: '16px',
  color: '#333',
  fontWeight: '600'
  },
  transactionsBadge: {
  padding: '6px 12px',
  backgroundColor: '#1cc29f',
  color: 'white',
  borderRadius: '12px',
  fontSize: '13px',
  fontWeight: '600'
  },
  transactionsList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
  },
  transactionCard: {
  display: 'flex',
  alignItems: 'center',
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  gap: '12px'
  },
  transactionFrom: {
  fontWeight: '600',
  color: '#333',
  flex: 1
  },
  transactionArrow: {
  color: '#1cc29f',
  fontSize: '20px',
  fontWeight: '700'
  },
  transactionTo: {
  fontWeight: '600',
  color: '#333',
  flex: 1
  },
  transactionAmount: {
  fontWeight: '700',
  color: '#1cc29f',
  fontSize: '18px'
  },
  addForm: {
  marginBottom: '24px',
  padding: '24px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px'
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
  helpText: {
  marginTop: '4px',
  fontSize: '12px',
  color: '#666'
  },
  submitBtn: {
  width: '100%',
  padding: '12px',
  backgroundColor: '#1cc29f',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  marginTop: '8px'
  },
  errorBox: {
  padding: '10px',
  backgroundColor: '#fee',
  color: '#c33',
  borderRadius: '4px',
  marginBottom: '16px',
  fontSize: '14px',
  border: '1px solid #fcc'
  },
  splitInfo: {
  padding: '12px',
  backgroundColor: '#e8f5e9',
  borderRadius: '4px',
  fontSize: '14px',
  color: '#2e7d32',
  marginBottom: '16px',
  textAlign: 'center'
  },
  customSplitSection: {
  marginBottom: '20px',
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  border: '1px solid #dee2e6'
  },
  splitHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
  },
  remainingAmount: {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1cc29f',
  padding: '6px 12px',
  backgroundColor: 'white',
  borderRadius: '4px',
  border: '1px solid #1cc29f'
  },
  splitRow: {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '12px',
  gap: '12px'
  },
  splitName: {
  flex: '0 0 150px',
  fontWeight: '500',
  color: '#333'
  },
  splitInput: {
  flex: 1,
  padding: '8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px'
  },
  percentageInput: {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
  },
  percentSymbol: {
  fontWeight: '600',
  color: '#666'
  },
  amountPreview: {
  fontSize: '13px',
  color: '#666',
  fontStyle: 'italic'
  },
  quickSettlements: {
  marginTop: '20px'
  },
  quickSettleLabel: {
  fontSize: '14px',
  color: '#666',
  marginBottom: '12px',
  fontWeight: '500'
  },
  quickSettleBtn: {
  display: 'block',
  width: '100%',
  padding: '14px',
  backgroundColor: '#fff',
  border: '2px solid #1cc29f',
  borderRadius: '6px',
  color: '#1cc29f',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '10px',
  fontSize: '15px',
  transition: 'all 0.3s'
  },
  settlementsList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
  },
  settlementCard: {
  padding: '20px',
  border: '1px solid #e8f5e9',
  borderRadius: '8px',
  backgroundColor: '#f1f8f4'
  },
  settlementHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
  },
  settlementTransaction: {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '8px'
  },
  settlementPaidBy: {
  fontWeight: '600',
  color: '#333',
  fontSize: '16px'
  },
  settlementArrow: {
  color: '#28a745',
  fontSize: '20px',
  fontWeight: '700'
  },
  settlementPaidTo: {
  fontWeight: '600',
  color: '#333',
  fontSize: '16px'
  },
  settlementMeta: {
  display: 'flex',
  gap: '12px',
  fontSize: '13px'
  },
  settlementDate: {
  color: '#666'
  },
  settlementNote: {
  color: '#1cc29f',
  fontStyle: 'italic'
  },
  settlementRight: {
  textAlign: 'right'
  },
  settlementAmount: {
  fontSize: '24px',
  fontWeight: '700',
  color: '#28a745',
  marginBottom: '8px'
  },
  deleteSettlementBtn: {
  padding: '6px 14px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500'
  },
  // NEW STYLES FOR TABS
  tabContainer: {
  display: 'flex',
  gap: '8px',
  marginBottom: '24px',
  borderBottom: '2px solid #e9ecef',
  paddingBottom: '0'
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
  emptyState: {
  padding: '40px',
  textAlign: 'center',
  color: '#666'
  },
  expensesList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
  },
  expenseCard: {
  padding: '20px',
  border: '1px solid #eee',
  borderRadius: '8px',
  backgroundColor: '#fafafa'
  },
  expenseHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px'
  },
  expenseDescription: {
  margin: '0 0 8px 0',
  fontSize: '18px',
  fontWeight: '600',
  color: '#333'
  },
  expenseMeta: {
  display: 'flex',
  gap: '12px',
  fontSize: '13px'
  },
  expenseCategory: {
  padding: '4px 10px',
  backgroundColor: '#1cc29f',
  color: 'white',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: '500'
  },
  expenseDate: {
  color: '#666'
  },
  expenseRight: {
  textAlign: 'right'
  },
  expenseAmount: {
  fontSize: '24px',
  fontWeight: '700',
  color: '#333',
  marginBottom: '4px'
  },
  expensePaidBy: {
  fontSize: '13px',
  color: '#666'
  },
  expenseSplit: {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #ddd'
  },
  splitLabel: {
  fontSize: '13px',
  color: '#666',
  marginBottom: '8px',
  fontWeight: '500'
  },
  splitDetails: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px'
  },
  splitItem: {
  fontSize: '13px',
  padding: '6px 12px',
  backgroundColor: 'white',
  borderRadius: '4px',
  border: '1px solid #ddd'
  },
  deleteExpenseBtn: {
  marginTop: '12px',
  padding: '6px 14px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500'
  },
  addMemberForm: {
  marginBottom: '24px',
  padding: '24px',
  backgroundColor: '#f0f8ff',
  borderRadius: '8px',
  border: '2px dashed #1cc29f'
  },
  addMemberTitle: {
  margin: '0 0 16px 0',
  fontSize: '16px',
  color: '#333',
  fontWeight: '600'
  },
  addMemberFormInner: {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
  },
  addMemberInputGroup: {
  display: 'flex',
  gap: '12px'
  },
  addMemberInput: {
  flex: 1,
  padding: '12px 16px',
  border: '2px solid #1cc29f',
  borderRadius: '6px',
  fontSize: '15px',
  outline: 'none'
  },
  addMemberSubmitBtn: {
  padding: '12px 24px',
  backgroundColor: '#1cc29f',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: '600',
  whiteSpace: 'nowrap'
  },
  membersList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
  },
  memberCard: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  border: '1px solid #eee',
  borderRadius: '6px',
  backgroundColor: '#fafafa'
  },
  memberInfo: {
  flex: 1,
  display: 'flex',
  alignItems: 'center'
  },
  memberAvatar: {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: '#1cc29f',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  fontWeight: '700',
  marginRight: '16px'
  },
  memberName: {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333',
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
  },
  memberEmail: {
  fontSize: '14px',
  color: '#666'
  },
  adminBadge: {
  fontSize: '11px',
  backgroundColor: '#1cc29f',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontWeight: '600'
  },
  youBadge: {
  fontSize: '11px',
  backgroundColor: '#6c757d',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontWeight: '600'
  },
  removeBtn: {
  padding: '6px 14px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500'
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

// Make styles responsive
if (window.innerWidth <= 768) {
  styles.formRow = {
    ...styles.formRow,
    gridTemplateColumns: '1fr'
  };
  styles.content = {
    ...styles.content,
    padding: '20px'
  };
  styles.groupHeader = {
    ...styles.groupHeader,
    flexDirection: 'column',
    gap: '16px'
  };
}

  export default GroupDetail;