/**
 * Debt Simplification Algorithm
 * Minimizes the number of transactions needed to settle all debts
 * Uses a greedy approach with creditors and debtors
 */

class DebtSimplifier {
    /**
     * @param {Array} balances - Array of balance objects with userId, name, netBalance
     * @returns {Array} - Simplified transactions
     */
    static simplify(balances) {
      // Filter out people with 0 balance
      const nonZeroBalances = balances.filter(b => Math.abs(b.netBalance) > 0.01);
  
      if (nonZeroBalances.length === 0) {
        return [];
      }
  
      // Separate creditors (people who are owed) and debtors (people who owe)
      const creditors = nonZeroBalances
        .filter(b => b.netBalance > 0.01)
        .map(b => ({ ...b, remaining: b.netBalance }))
        .sort((a, b) => b.remaining - a.remaining); // Sort descending
  
      const debtors = nonZeroBalances
        .filter(b => b.netBalance < -0.01)
        .map(b => ({ ...b, remaining: Math.abs(b.netBalance) }))
        .sort((a, b) => b.remaining - a.remaining); // Sort descending
  
      const transactions = [];
  
      // Greedy algorithm: Match largest creditor with largest debtor
      let i = 0;
      let j = 0;
  
      while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];
  
        // Amount to settle = minimum of what's owed and what's being paid
        const amount = Math.min(creditor.remaining, debtor.remaining);
  
        if (amount > 0.01) {
          transactions.push({
            from: {
              userId: debtor.userId,
              name: debtor.name
            },
            to: {
              userId: creditor.userId,
              name: creditor.name
            },
            amount: parseFloat(amount.toFixed(2))
          });
  
          creditor.remaining -= amount;
          debtor.remaining -= amount;
        }
  
        // Move to next creditor if current one is fully paid
        if (creditor.remaining < 0.01) {
          i++;
        }
  
        // Move to next debtor if current one has fully paid
        if (debtor.remaining < 0.01) {
          j++;
        }
      }
  
      return transactions;
    }
  
    /**
     * Calculate how many transactions are saved by simplification
     * @param {Array} originalTransactions 
     * @param {Array} simplifiedTransactions 
     * @returns {Object} - Stats about simplification
     */
    static getSimplificationStats(originalTransactions, simplifiedTransactions) {
      const originalCount = originalTransactions.length;
      const simplifiedCount = simplifiedTransactions.length;
      const saved = originalCount - simplifiedCount;
      const percentage = originalCount > 0 
        ? Math.round((saved / originalCount) * 100) 
        : 0;
  
      return {
        originalCount,
        simplifiedCount,
        transactionsSaved: saved,
        percentageSaved: percentage
      };
    }
  
    /**
     * Generate all possible direct transactions (without simplification)
     * This is what users would do manually
     * @param {Array} balances 
     * @returns {Array} - All direct transactions
     */
    static generateDirectTransactions(balances) {
      const transactions = [];
  
      // For each creditor, create direct transaction from each debtor
      balances.forEach(creditor => {
        if (creditor.netBalance > 0.01) {
          balances.forEach(debtor => {
            if (debtor.netBalance < -0.01) {
              // Calculate what this debtor owes this creditor
              // This is a simplified version - in reality it would be more complex
              const amount = Math.min(
                creditor.netBalance,
                Math.abs(debtor.netBalance)
              );
  
              if (amount > 0.01) {
                transactions.push({
                  from: {
                    userId: debtor.userId,
                    name: debtor.name
                  },
                  to: {
                    userId: creditor.userId,
                    name: creditor.name
                  },
                  amount: parseFloat(amount.toFixed(2))
                });
              }
            }
          });
        }
      });
  
      return transactions;
    }
  }
  
  module.exports = DebtSimplifier;