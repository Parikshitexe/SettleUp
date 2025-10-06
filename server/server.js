const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.json({ msg: 'SettleUp API is running! 🚀' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses')); // ADD THIS
app.use('/api/balances', require('./routes/balances')); // ADD THIS

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('✅ Auth routes: /api/auth');
      console.log('✅ Group routes: /api/groups');
      console.log('✅ Expense routes: /api/expenses');
      console.log('✅ Balance routes: /api/balances');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();