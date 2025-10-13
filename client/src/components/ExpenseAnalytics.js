import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  'Food': '#FF6384',
  'Transport': '#36A2EB',
  'Accommodation': '#FFCE56',
  'Entertainment': '#4BC0C0',
  'Shopping': '#9966FF',
  'Other': '#C9CBCF'
};

function ExpenseAnalytics({ expenses, groupMembers }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>📊 Add expenses to see analytics</p>
      </div>
    );
  }

  // Calculate category-wise totals
  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {});

  // Prepare data for pie chart
  const chartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  })).sort((a, b) => b.value - a.value);

  // Calculate total spending
  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Find top category
  const topCategory = chartData[0];

  // Calculate per-person spending
  const perPersonSpending = totalSpending / (groupMembers?.length || 1);

  // Custom label for pie chart
  const renderLabel = (entry) => {
    const percentage = ((entry.value / totalSpending) * 100).toFixed(1);
    return `${entry.name} (${percentage}%)`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.statsGrid}>
        {/* Total Spending */}
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>Total Spending</div>
            <div style={styles.statValue}>₹{totalSpending.toFixed(2)}</div>
          </div>
        </div>

        {/* Number of Expenses */}
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📝</div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>Total Expenses</div>
            <div style={styles.statValue}>{expenses.length}</div>
          </div>
        </div>

        {/* Average per Person */}
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👤</div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>Avg per Person</div>
            <div style={styles.statValue}>₹{perPersonSpending.toFixed(2)}</div>
          </div>
        </div>

        {/* Top Category */}
        {topCategory && (
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🏆</div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Top Category</div>
              <div style={styles.statValue}>{topCategory.name}</div>
              <div style={styles.statSubtext}>₹{topCategory.value.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Pie Chart */}
      <div style={styles.chartSection}>
        <h4 style={styles.chartTitle}>Spending by Category</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Other']} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown Table */}
      <div style={styles.tableSection}>
        <h4 style={styles.tableTitle}>Category Breakdown</h4>
        <div style={styles.table}>
          {chartData.map((item, index) => {
            const percentage = ((item.value / totalSpending) * 100).toFixed(1);
            return (
              <div key={index} style={styles.tableRow}>
                <div style={styles.categoryInfo}>
                  <div 
                    style={{
                      ...styles.categoryDot,
                      backgroundColor: COLORS[item.name] || COLORS['Other']
                    }}
                  />
                  <span style={styles.categoryName}>{item.name}</span>
                </div>
                <div style={styles.categoryStats}>
                  <span style={styles.categoryAmount}>₹{item.value.toFixed(2)}</span>
                  <span style={styles.categoryPercentage}>{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',

  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#666',
    fontSize: '16px'
  },
  statsGrid: {
    display: 'flex',
    //flexDirection: 'column',
    //alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    whiteSpace: 'normal',
    wordWrap: 'break-word',

  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  statIcon: {
    fontSize: '32px'
  },
  statContent: {
    flex: 1
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333'
  },
  statSubtext: {
    fontSize: '12px',
    color: '#999',
    marginTop: '2px'
  },
  chartSection: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  chartTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  tableSection: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  tableTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  tableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  categoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  categoryDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  categoryName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#333'
  },
  categoryStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  categoryAmount: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  categoryPercentage: {
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#e9ecef',
    padding: '4px 8px',
    borderRadius: '4px'
  }
};

export default ExpenseAnalytics;