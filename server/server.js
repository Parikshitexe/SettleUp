require('dotenv').config();

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

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true
};

app.use(cors(corsOptions));

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

const helmet = require('helmet');
app.use(helmet());

const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

startServer();