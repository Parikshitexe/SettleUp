require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendTest = async () => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: 'Test Email',
      text: 'This is a test email.'
    });
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
};

sendTest();
