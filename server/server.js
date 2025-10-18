const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const { processPaymentReminders } = require('./utils/paymentReminderCron');

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
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/balances', require('./routes/balances'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/user', require('./routes/user'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payment-reminders', require('./routes/paymentReminders'));
app.use('/api/budgets', require('./routes/budgets'));

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
      console.log('✅ Settlement routes: /api/settlements');
      console.log('✅ User routes: /api/user');
      console.log('✅ Friends routes: /api/friends');
      console.log('✅ Notifications routes: /api/notifications');
      console.log('✅ Payment Reminders routes: /api/payment-reminders');
      console.log('✅ Budget routes: /api/budgets');
      
      // NEW: Setup cron job for payment reminders
      cron.schedule('0 * * * *', () => {
        console.log('⏰ Running payment reminder processor...');
        processPaymentReminders();
      });
      console.log('⏰ Payment reminder cron job started (runs every hour)');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();